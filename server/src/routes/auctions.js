/**
 * /api/auctions — live bidding.
 *   GET  /api/auctions            list (closes expired auctions first)
 *   GET  /api/auctions/:id        single auction
 *   POST /api/auctions            farmer only — open an auction on own produce
 *   POST /api/auctions/:id/bid    consumer only — atomic, race-safe bid update
 */
const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  HttpError,
  ok,
  asyncHandler,
  requireFields,
  asNumber,
  asId,
  asDate,
} = require('../lib/http');

const router = express.Router();

const SELECT_AUCTION = `
  SELECT a.*,
         p.name  AS produce_name,
         p.image_url,
         p.category,
         f.name  AS farmer_name,
         b.name  AS highest_bidder_name
  FROM auctions a
  JOIN produce p ON p.id = a.produce_id
  JOIN users   f ON f.id = a.farmer_id
  LEFT JOIN users b ON b.id = a.highest_bidder_id`;

/** Close any auctions whose ends_at has passed (lazy expiry sweep). */
async function closeExpired() {
  await query(
    'UPDATE auctions SET is_closed = TRUE WHERE is_closed = FALSE AND ends_at <= now()'
  );
}

/* --------------------------------- list ---------------------------------- */

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await closeExpired();
    const params = [];
    let sql = SELECT_AUCTION;
    if (req.query.open === 'true') sql += ' WHERE a.is_closed = FALSE';
    if (req.query.farmer_id) {
      params.push(asId(req.query.farmer_id, 'farmer_id'));
      sql += params.length ? ' AND' : ' WHERE';
      sql += ` a.farmer_id = $${params.length}`;
    }
    sql += ' ORDER BY a.is_closed ASC, a.ends_at ASC';
    const { rows } = await query(sql, params);
    return ok(res, rows);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await closeExpired();
    const id = asId(req.params.id, 'id');
    const { rows } = await query(`${SELECT_AUCTION} WHERE a.id = $1`, [id]);
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'Auction not found');
    return ok(res, rows[0]);
  })
);

/* --------------------------------- create -------------------------------- */

router.post(
  '/',
  authenticate,
  requireRole('farmer'),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['produce_id', 'base_rate', 'ends_at']);

    const produceId = asId(b.produce_id, 'produce_id');
    const baseRate = asNumber(b.base_rate, 'base_rate', { min: 0 });
    const quantity = b.quantity === undefined ? 1 : asNumber(b.quantity, 'quantity', { min: 0.0001 });
    const endsAt = asDate(b.ends_at, 'ends_at');
    if (endsAt.getTime() <= Date.now()) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'ends_at must be in the future');
    }

    const { rows: produce } = await query('SELECT * FROM produce WHERE id = $1', [produceId]);
    if (!produce.length) throw new HttpError(404, 'NOT_FOUND', 'Produce not found');
    if (produce[0].farmer_id !== req.user.id) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only auction your own produce');
    }

    const { rows } = await query(
      `INSERT INTO auctions (farmer_id, produce_id, base_rate, unit, quantity, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        produceId,
        baseRate,
        b.unit || produce[0].unit || 'kg',
        quantity,
        endsAt,
      ]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  })
);

/* ----------------------------------- bid --------------------------------- */

router.post(
  '/:id/bid',
  authenticate,
  requireRole('consumer'),
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const amount = asNumber((req.body || {}).amount, 'amount', { min: 0 });

    const { rows: found } = await query('SELECT * FROM auctions WHERE id = $1', [id]);
    if (!found.length) throw new HttpError(404, 'NOT_FOUND', 'Auction not found');
    const auction = found[0];

    if (auction.is_closed || new Date(auction.ends_at).getTime() <= Date.now()) {
      await closeExpired();
      throw new HttpError(409, 'AUCTION_CLOSED', 'This auction has ended');
    }

    // Single guarded UPDATE = race-safe: only the strictly-highest bid wins.
    const { rows } = await query(
      `UPDATE auctions
         SET highest_bid = $1::numeric, highest_bidder_id = $2
       WHERE id = $3
         AND is_closed = FALSE
         AND ends_at > now()
         AND $1::numeric >= base_rate
         AND (highest_bid IS NULL OR highest_bid < $1::numeric)
       RETURNING *`,
      [amount, req.user.id, id]
    );

    if (!rows.length) {
      // Work out why the guarded update rejected the bid, for a useful error.
      const { rows: current } = await query(
        'SELECT base_rate, highest_bid, highest_bidder_id FROM auctions WHERE id = $1',
        [id]
      );
      const a = current[0] || auction;
      if (Number(amount) < Number(a.base_rate)) {
        throw new HttpError(409, 'BID_TOO_LOW', 'Bid must be at least the base rate', {
          base_rate: Number(a.base_rate),
        });
      }
      throw new HttpError(409, 'BID_TOO_LOW', 'Bid must exceed the current highest bid', {
        highest_bid: a.highest_bid === null ? null : Number(a.highest_bid),
        you_are: a.highest_bidder_id === req.user.id ? 'the current highest bidder' : undefined,
      });
    }

    return ok(res, rows[0], 'Bid placed');
  })
);

module.exports = router;
