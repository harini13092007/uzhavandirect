/**
 * /api/fpo — batch / shipment management for FPO logistics partners.
 *   GET   /api/fpo/batches          list this FPO's batches
 *   POST  /api/fpo/batches          create; attaching orders assigns them to this FPO
 *   PATCH /api/fpo/batches/:id      update status / details / attached orders
 */
const express = require('express');
const { query, withTransaction } = require('../db');
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

router.use(authenticate, requireRole('fpo'));

/**
 * Validate that every id is a positive integer and an order that is either
 * unassigned or already ours — BEFORE anything is written.
 * Throws 409 ORDERS_NOT_ATTACHABLE with the offending ids.
 */
async function assertAttachable(fpoId, orderIds) {
  if (!orderIds.length) return;
  const ids = orderIds.map((v, i) => asId(v, `orders_list[${i}]`));
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
  const { rows } = await query(
    `SELECT id FROM orders
     WHERE id IN (${placeholders}) AND (fpo_id IS NULL OR fpo_id = $1)`,
    [fpoId, ...ids]
  );
  const attachable = new Set(rows.map((r) => Number(r.id)));
  const rejected = ids.filter((id) => !attachable.has(id));
  if (rejected.length) {
    throw new HttpError(
      409,
      'ORDERS_NOT_ATTACHABLE',
      'Some orders do not exist or belong to another FPO',
      { rejected }
    );
  }
}

/**
 * Attach orders to an FPO. Each order must be unassigned or already ours.
 * Returns the ids that could not be attached.
 */
async function attachOrders(client, fpoId, orderIds) {
  const rejected = [];
  for (const rawId of orderIds) {
    const orderId = asId(rawId, 'orders_list entry');
    const result = await client.query(
      `UPDATE orders SET fpo_id = $1, updated_at = now()
       WHERE id = $2 AND (fpo_id IS NULL OR fpo_id = $1)`,
      [fpoId, orderId]
    );
    if (result.rowCount === 0) rejected.push(orderId);
  }
  return rejected;
}

async function loadBatch(id, fpoId) {
  const { rows } = await query('SELECT * FROM fpo_batches WHERE id = $1', [id]);
  if (!rows.length || rows[0].fpo_id !== fpoId) {
    throw new HttpError(404, 'NOT_FOUND', 'Batch not found');
  }
  return rows[0];
}

/* --------------------------------- list ---------------------------------- */

router.get(
  '/batches',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT * FROM fpo_batches WHERE fpo_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    return ok(res, rows);
  })
);

router.get(
  '/batches/:id',
  asyncHandler(async (req, res) => {
    const batch = await loadBatch(asId(req.params.id, 'id'), req.user.id);
    return ok(res, batch);
  })
);

/* --------------------------------- create -------------------------------- */

router.post(
  '/batches',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['source_cluster', 'destination_hub']);
    const weight =
      b.consolidated_weight_kg === undefined
        ? 0
        : asNumber(b.consolidated_weight_kg, 'consolidated_weight_kg', { min: 0 });
    const orderIds = b.orders_list === undefined ? [] : b.orders_list;
    if (!Array.isArray(orderIds)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'orders_list must be an array of order ids');
    }

    await assertAttachable(req.user.id, orderIds);

    const batch = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO fpo_batches (fpo_id, source_cluster, destination_hub,
                                  consolidated_weight_kg, vehicle_type, transit_status, orders_list)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.user.id,
          String(b.source_cluster),
          String(b.destination_hub),
          weight,
          b.vehicle_type || null,
          b.transit_status || 'loading',
          JSON.stringify(orderIds.map(Number)),
        ]
      );
      await attachOrders(client, req.user.id, orderIds);
      return rows[0];
    });

    return res.status(201).json({ success: true, data: batch });
  })
);

/* --------------------------------- update -------------------------------- */

router.patch(
  '/batches/:id',
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');
    const batch = await loadBatch(id, req.user.id);
    const b = req.body || {};

    const allowed = [
      'source_cluster',
      'destination_hub',
      'consolidated_weight_kg',
      'vehicle_type',
      'transit_status',
    ];
    const sets = [];
    const params = [];
    for (const field of allowed) {
      if (b[field] === undefined) continue;
      params.push(b[field]);
      sets.push(`${field} = $${params.length}`);
    }
    if (b.consolidated_weight_kg !== undefined) {
      asNumber(b.consolidated_weight_kg, 'consolidated_weight_kg', { min: 0 });
    }

    if (b.orders_list !== undefined) {
      if (!Array.isArray(b.orders_list)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'orders_list must be an array of order ids');
      }
      params.push(JSON.stringify(b.orders_list.map(Number)));
      sets.push(`orders_list = $${params.length}`);
    }
    if (!sets.length) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'No updatable fields supplied', {
        allowed: [...allowed, 'orders_list'],
      });
    }
    if (b.orders_list !== undefined) {
      await assertAttachable(req.user.id, b.orders_list);
    }

    const updated = await withTransaction(async (client) => {
      params.push(id);
      const { rows } = await client.query(
        `UPDATE fpo_batches SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (b.orders_list !== undefined) {
        await attachOrders(client, req.user.id, b.orders_list);
      }
      return rows[0];
    });

    // Include the attached orders' current state for convenience.
    const attachIds = (b.orders_list || batch.orders_list || [])
      .map(Number)
      .filter((n) => Number.isInteger(n));
    let orders = [];
    if (attachIds.length) {
      const placeholders = attachIds.map((_, i) => `$${i + 2}`).join(', ');
      const { rows } = await query(
        `SELECT id, status, delivery_stage FROM orders WHERE fpo_id = $1 AND id IN (${placeholders})`,
        [req.user.id, ...attachIds]
      );
      orders = rows;
    }

    return ok(res, { ...updated, orders });
  })
);

module.exports = router;
