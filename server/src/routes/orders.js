/**
 * /api/orders — purchase + delivery pipeline.
 *   GET   /api/orders             role-scoped list (consumer/farmer/fpo see their own)
 *   GET   /api/orders/:id         participant only
 *   POST  /api/orders             consumer only — stock is decremented atomically
 *   PATCH /api/orders/:id         participant — status: pending|completed|refunded
 *   PATCH /api/orders/:id/stage   farmer/fpo — delivery_stage, forward-only
 *
 * Stage ownership (forward-only within each band):
 *   farmer : placed → confirmed → packed → atFarmerCity
 *   fpo    : atFarmerCity → atFpo → outForDelivery → delivered
 *   (an fpo must be assigned to the order first — via POST /api/fpo/batches)
 */
const express = require('express');
const { query, withTransaction } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const {
  HttpError,
  ok,
  asyncHandler,
  requireFields,
  oneOf,
  asNumber,
  asId,
  STATUSES,
  DELIVERY_STAGES,
} = require('../lib/http');

const router = express.Router();

const SELECT_ORDER = `
  SELECT o.*,
         c.name AS consumer_name,
         f.name AS farmer_name,
         v.name AS fpo_name,
         p.name AS produce_name,
         p.image_url
  FROM orders o
  JOIN users   c ON c.id = o.consumer_id
  JOIN users   f ON f.id = o.farmer_id
  LEFT JOIN users   v ON v.id = o.fpo_id
  JOIN produce p ON p.id = o.produce_id`;

const FARMER_STAGE_BAND = DELIVERY_STAGES.slice(
  0,
  DELIVERY_STAGES.indexOf('atFarmerCity') + 1
); // placed..atFarmerCity
const FPO_STAGE_BAND = DELIVERY_STAGES.slice(
  DELIVERY_STAGES.indexOf('atFarmerCity')
); // atFarmerCity..delivered

async function loadOrder(id) {
  const { rows } = await query(`${SELECT_ORDER} WHERE o.id = $1`, [id]);
  if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'Order not found');
  return rows[0];
}

function assertParticipant(order, user) {
  const mine = [order.consumer_id, order.farmer_id, order.fpo_id];
  if (!mine.includes(user.id)) {
    // Hide existence from non-participants.
    throw new HttpError(404, 'NOT_FOUND', 'Order not found');
  }
}

/* --------------------------------- list ---------------------------------- */

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const params = [req.user.id];
    let sql = SELECT_ORDER;
    if (req.user.role === 'consumer') sql += ' WHERE o.consumer_id = $1';
    else if (req.user.role === 'farmer') sql += ' WHERE o.farmer_id = $1';
    else sql += ' WHERE o.fpo_id = $1';

    if (req.query.status) {
      params.push(oneOf(req.query.status, STATUSES, 'status'));
      sql += ` AND o.status = $${params.length}`;
    }
    if (req.query.stage) {
      params.push(oneOf(req.query.stage, DELIVERY_STAGES, 'delivery_stage'));
      sql += ` AND o.delivery_stage = $${params.length}`;
    }
    sql += ' ORDER BY o.id DESC';
    const { rows } = await query(sql, params);
    return ok(res, rows);
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await loadOrder(asId(req.params.id, 'id'));
    assertParticipant(order, req.user);
    return ok(res, order);
  })
);

/* --------------------------------- create -------------------------------- */

router.post(
  '/',
  authenticate,
  requireRole('consumer'),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['produce_id', 'quantity', 'address']);
    const produceId = asId(b.produce_id, 'produce_id');
    const quantity = asNumber(b.quantity, 'quantity', { min: 0.0001 });

    if (b.fpo_id !== undefined && b.fpo_id !== null) {
      const fpoId = asId(b.fpo_id, 'fpo_id');
      const { rows } = await query(
        "SELECT id FROM users WHERE id = $1 AND role = 'fpo'",
        [fpoId]
      );
      if (!rows.length) throw new HttpError(400, 'VALIDATION_ERROR', 'fpo_id is not an FPO user');
    }

    const order = await withTransaction(async (client) => {
      // Atomic stock guard: fails the whole order if quantity is unavailable.
      const dec = await client.query(
        `UPDATE produce
            SET quantity = quantity - $1::numeric,
                is_sold = (quantity - $1::numeric) <= 0
          WHERE id = $2 AND quantity >= $1::numeric
          RETURNING *`,
        [quantity, produceId]
      );
      if (!dec.rows.length) {
        throw new HttpError(409, 'OUT_OF_STOCK', 'Not enough quantity available', {
          produce_id: produceId,
        });
      }
      const produce = dec.rows[0];
      const totalPrice = b.total_price !== undefined
        ? asNumber(b.total_price, 'total_price', { min: 0 })
        : Number(produce.price) * quantity;

      const { rows } = await client.query(
        `INSERT INTO orders (consumer_id, farmer_id, fpo_id, produce_id, quantity, unit,
                             total_price, address, delivery_timing)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.user.id,
          produce.farmer_id,
          b.fpo_id != null ? Number(b.fpo_id) : null,
          produceId,
          quantity,
          produce.unit || 'kg',
          totalPrice,
          String(b.address),
          b.delivery_timing || null,
        ]
      );
      return rows[0];
    });

    return res.status(201).json({ success: true, data: order });
  })
);

/* --------------------------------- status -------------------------------- */

router.patch(
  '/:id',
  authenticate,
  requireRole('consumer', 'farmer', 'fpo'),
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const order = await loadOrder(id);
    assertParticipant(order, req.user);

    const b = req.body || {};
    requireFields(b, ['status']);
    const status = oneOf(b.status, STATUSES, 'status');

    const { rows } = await query(
      'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return ok(res, rows[0]);
  })
);

/* ------------------------------- stage step ------------------------------ */

router.patch(
  '/:id/stage',
  authenticate,
  requireRole('farmer', 'fpo'),
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const order = await loadOrder(id);
    assertParticipant(order, req.user); // 404 if this farmer/fpo doesn't own it

    const b = req.body || {};
    requireFields(b, ['delivery_stage']);
    const stage = oneOf(b.delivery_stage, DELIVERY_STAGES, 'delivery_stage');

    const band = req.user.role === 'farmer' ? FARMER_STAGE_BAND : FPO_STAGE_BAND;
    if (!band.includes(stage)) {
      throw new HttpError(
        403,
        'STAGE_NOT_ALLOWED',
        `A ${req.user.role} cannot set delivery_stage to "${stage}"`,
        { allowed_for_role: band }
      );
    }

    const currentIndex = DELIVERY_STAGES.indexOf(order.delivery_stage);
    const nextIndex = DELIVERY_STAGES.indexOf(stage);
    if (nextIndex < currentIndex) {
      throw new HttpError(409, 'STAGE_REGRESSION', 'Delivery stage cannot move backwards', {
        current: order.delivery_stage,
        requested: stage,
      });
    }

    const { rows } = await query(
      'UPDATE orders SET delivery_stage = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [stage, id]
    );
    return ok(res, rows[0], `Delivery stage → ${stage}`);
  })
);

module.exports = router;
