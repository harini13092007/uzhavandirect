/**
 * /api/produce — listings CRUD.
 *   GET    /api/produce           public, filterable (category, farmer_id, q, is_sold)
 *   GET    /api/produce/:id       public
 *   POST   /api/produce           farmer only
 *   PUT    /api/produce/:id       farmer only, owner (partial update)
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
} = require('../lib/http');

const router = express.Router();

const UPDATABLE = [
  'category',
  'name',
  'quantity',
  'unit',
  'price',
  'perishability',
  'image_url',
  'location',
  'is_sold',
];

/* --------------------------------- list ---------------------------------- */

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = [];
    const params = [];
    const push = (value) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (req.query.category) where.push(`p.category = ${push(req.query.category)}`);
    if (req.query.farmer_id) {
      where.push(`p.farmer_id = ${push(asId(req.query.farmer_id, 'farmer_id'))}`);
    }
    if (req.query.q) where.push(`LOWER(p.name) LIKE LOWER(${push(`%${req.query.q}%`)})`);
    if (req.query.is_sold !== undefined) {
      where.push(`p.is_sold = ${push(req.query.is_sold === 'true')}`);
    }

    let sql = `SELECT p.*, u.name AS farmer_name
               FROM produce p
               JOIN users u ON u.id = p.farmer_id`;
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY p.id DESC';
    if (req.query.limit) {
      sql += ` LIMIT ${push(Math.min(Number(req.query.limit) || 100, 200))}`;
    }
    if (req.query.offset) {
      sql += ` OFFSET ${push(Math.max(Number(req.query.offset) || 0, 0))}`;
    }

    const { rows } = await query(sql, params);
    return ok(res, rows);
  })
);

/* --------------------------------- by id --------------------------------- */

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const { rows } = await query(
      `SELECT p.*, u.name AS farmer_name
       FROM produce p JOIN users u ON u.id = p.farmer_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'Produce not found');
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
    requireFields(b, ['category', 'name', 'price']);

    const quantity = b.quantity === undefined ? 0 : asNumber(b.quantity, 'quantity', { min: 0 });
    const price = asNumber(b.price, 'price', { min: 0 });

    const { rows } = await query(
      `INSERT INTO produce (farmer_id, category, name, quantity, unit, price,
                            perishability, image_url, location, is_sold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        String(b.category),
        String(b.name),
        quantity,
        b.unit || 'kg',
        price,
        b.perishability || null,
        b.image_url || b.image || null,
        b.location || null,
        b.is_sold === true,
      ]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  })
);

/* --------------------------------- update -------------------------------- */

router.put(
  '/:id',
  authenticate,
  requireRole('farmer'),
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const b = req.body || {};

    const { rows: existing } = await query('SELECT * FROM produce WHERE id = $1', [id]);
    if (!existing.length) throw new HttpError(404, 'NOT_FOUND', 'Produce not found');
    if (existing[0].farmer_id !== req.user.id) {
      throw new HttpError(403, 'FORBIDDEN', 'You can only edit your own produce');
    }

    const sets = [];
    const params = [];
    for (const field of UPDATABLE) {
      if (b[field] === undefined) continue;
      params.push(b[field]);
      sets.push(`${field} = $${params.length}`);
    }
    if (b.image !== undefined) {
      params.push(b.image);
      sets.push(`image_url = $${params.length}`);
    }
    if (!sets.length) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No updatable fields supplied', {
        allowed: [...UPDATABLE, 'image'],
      });
    }
    if (b.quantity !== undefined) asNumber(b.quantity, 'quantity', { min: 0 });
    if (b.price !== undefined) asNumber(b.price, 'price', { min: 0 });

    params.push(id);
    const { rows } = await query(
      `UPDATE produce SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return ok(res, rows[0]);
  })
);

module.exports = router;
