/**
 * In-app notification helper — the only place that writes to `notifications`.
 *
 * Used by the order routes (stage / status / grading / EV agent) and the FPO
 * batch routes (dispatch / receive). Every helper excludes the acting user, so
 * you are never notified about an action you just performed yourself.
 *
 * Every helper accepts an optional `db` object (anything with `.query`). Pass
 * the transaction `client` when you are inside `withTransaction()` so the
 * notification commits (or rolls back) atomically with the change that caused
 * it; leave it out to use the pool directly.
 */
const { query } = require('../db');

/** Allowed by the `type` CHECK constraint in schema.sql. */
const NOTIFICATION_TYPES = ['order', 'grade', 'fpo', 'system'];

/** Human-readable delivery stages, used to build the message text. */
const STAGE_LABELS = {
  placed: 'has been placed',
  confirmed: 'has been confirmed',
  packed: 'has been packed',
  atFarmerCity: 'reached the farm-gate collection point',
  atFpo: 'arrived at the destination FPO hub',
  outForDelivery: 'is out for delivery',
  delivered: 'has been delivered',
};

function q(db) {
  return db && typeof db.query === 'function' ? db.query.bind(db) : query;
}

const ORDER_COLUMNS =
  'id, user_id, type, message, order_id, batch_id, is_read, created_at';

/** Insert one notification. Returns the row, or null when nothing was written. */
async function createNotification(payload, db) {
  const { userId, type, message, orderId = null, batchId = null } = payload;
  if (!userId || !message) return null;

  const { rows } = await q(db)(
    `INSERT INTO notifications (user_id, type, message, order_id, batch_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${ORDER_COLUMNS}`,
    [
      Number(userId),
      NOTIFICATION_TYPES.includes(type) ? type : 'system',
      String(message).slice(0, 300),
      orderId === null || orderId === undefined ? null : Number(orderId),
      batchId === null || batchId === undefined ? null : Number(batchId),
    ]
  );
  return rows[0] || null;
}

/**
 * Tell everyone taking part in an order except the person who acted.
 * `participants` is any object carrying numeric consumer_id / farmer_id /
 * fpo_id — i.e. a row from the shared SELECT_ORDER join.
 */
async function notifyOrderParticipants(participants, actorUserId, payload, db) {
  const recipients = [
    participants.consumer_id,
    participants.farmer_id,
    participants.fpo_id,
  ].filter(id => id !== null && id !== undefined && Number(id) !== Number(actorUserId));

  const created = [];
  for (const userId of recipients) {
    const row = await createNotification({ ...payload, userId }, db);
    if (row) created.push(row);
  }
  return created;
}

/**
 * Fan one message out to the participants of several orders (used when a whole
 * corridor shipment changes state). `rows` come from SELECT_BATCH_ORDERS below.
 */
async function notifyManyOrders(rows, actorUserId, payload, db) {
  const created = [];
  for (const order of rows) {
    const results = await notifyOrderParticipants(order, actorUserId, payload, db);
    for (const row of results) created.push(row);
  }
  return created;
}

/**
 * Load the participants + produce name for a list of order ids so a batch-wide
 * notification can say which produce moved. Built as a static IN list because
 * every id has already been validated with asId() (positive integers only).
 */
async function selectBatchOrders(orderIds, db) {
  const ids = orderIds
    .map(n => Number(n))
    .filter(n => Number.isInteger(n) && n > 0);
  if (!ids.length) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await q(db)(
    `SELECT o.id, o.consumer_id, o.farmer_id, o.fpo_id, p.name AS produce_name
       FROM orders o
       JOIN produce p ON p.id = o.produce_id
      WHERE o.id IN (${placeholders})`,
    ids
  );
  return rows;
}

module.exports = {
  NOTIFICATION_TYPES,
  STAGE_LABELS,
  createNotification,
  notifyOrderParticipants,
  notifyManyOrders,
  selectBatchOrders,
};
