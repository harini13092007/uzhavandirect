/**
 * /api/fpo — batch / shipment management for FPO logistics partners.
 *   GET   /api/fpo/inbound          Tier-1 work queue: lots awaiting grading
 *   GET   /api/fpo/batches          list this FPO's batches
 *   GET   /api/fpo/batches/:id      one batch
 *   POST  /api/fpo/batches          create; attaching orders assigns them to this FPO
 *   PATCH /api/fpo/batches/:id      update status / details / attached orders
 *
 * Attaching an order also stamps its Tier-2 columns (fpo_batch_id, fpo_corridor,
 * fpo_vehicle) so the shipment an order travelled on is queryable on the order
 * itself — that is what lets PATCH /api/orders/:id/agent enforce
 * "receive the corridor shipment first".
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

/** "Nilgiris cluster → Thanjavur hub" — the corridor label stored on orders. */
function corridorLabel(batch) {
  return `${batch.source_cluster} → ${batch.destination_hub}`;
}

/**
 * Attach orders to an FPO and stamp their Tier-2 corridor columns.
 * Each order must be unassigned or already ours.
 * Returns the ids that could not be attached.
 *
 * COALESCE keeps an existing value when the batch does not carry one, so
 * patching a batch's status never wipes the corridor it was created with.
 */
async function attachOrders(client, fpoId, orderIds, batch) {
  const rejected = [];
  const batchId = batch && batch.id !== undefined ? batch.id : null;
  const corridor = batch ? corridorLabel(batch) : null;
  const vehicle = batch ? batch.vehicle_type || null : null;

  for (const rawId of orderIds) {
    const orderId = asId(rawId, 'orders_list entry');
    const result = await client.query(
      `UPDATE orders
          SET fpo_id       = $1,
              fpo_batch_id = COALESCE($2, fpo_batch_id),
              fpo_corridor = COALESCE($3, fpo_corridor),
              fpo_vehicle  = COALESCE($4, fpo_vehicle),
              updated_at   = now()
        WHERE id = $5 AND (fpo_id IS NULL OR fpo_id = $1)`,
      [fpoId, batchId, corridor, vehicle, orderId]
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

/* ----------------------------- Tier-1 inbound ----------------------------- */

/**
 * GET /api/fpo/inbound
 *
 * The Tier-1 work queue: lots that have reached the farm-gate collection
 * point, have not been graded yet, and are either unclaimed or already ours.
 * This is the server-side equivalent of the front-end's fpoAwaitingGrade().
 *
 * A lot already claimed by a DIFFERENT FPO is excluded — it is not our work.
 *
 * ?include_graded=true also returns our own already-graded lots (the Tier-1
 * "graded & queued" table).
 */
router.get(
  '/inbound',
  asyncHandler(async (req, res) => {
    const includeGraded = req.query.include_graded === 'true';
    const { rows } = await query(
      `SELECT o.*,
              c.name AS consumer_name,
              f.name AS farmer_name,
              f.village AS farmer_village,
              p.name AS produce_name,
              p.image_url
         FROM orders o
         JOIN users   c ON c.id = o.consumer_id
         JOIN users   f ON f.id = o.farmer_id
         JOIN produce p ON p.id = o.produce_id
        WHERE o.delivery_stage = 'atFarmerCity'
          AND (o.fpo_id IS NULL OR o.fpo_id = $1)
          AND ($2::boolean OR o.fpo_grade IS NULL)
        ORDER BY o.id DESC`,
      [req.user.id, includeGraded]
    );
    return ok(res, rows);
  })
);

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
      await attachOrders(client, req.user.id, orderIds, rows[0]);
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
        await attachOrders(client, req.user.id, b.orders_list, rows[0]);
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
