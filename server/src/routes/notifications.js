/**
 * /api/notifications — the in-app bell in the topbar.
 *
 *   GET   /api/notifications           current user's notifications, newest first
 *   PATCH /api/notifications/:id/read  mark one as read (owner only)
 *
 * Reads are always scoped to `req.user.id`, so a user can never see another
 * user's notifications; a foreign id answers 404 (existence is hidden) which is
 * the same convention the order routes use.
 */
const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { HttpError, ok, asyncHandler, asId } = require('../lib/http');

const router = express.Router();

const COLUMNS = 'id, user_id, type, message, order_id, batch_id, is_read, created_at';

router.use(authenticate);

/* --------------------------------- list ---------------------------------- */

router.get(
  '/',
  asyncHandler(async (req, res) => {
    // `?limit=` and `?unread_only=` are optional; defaults suit the dropdown.
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    const params = [req.user.id];
    let sql = `SELECT ${COLUMNS}
               FROM notifications
               WHERE user_id = $1`;
    if (req.query.unread_only === 'true') sql += ' AND is_read = FALSE';
    params.push(limit);
    sql += ` ORDER BY id DESC
             LIMIT $${params.length}`;

    const { rows } = await query(sql, params);

    // Two plain COUNTs rather than `COUNT(*) FILTER (…)`: keeps the query
    // portable across the real Postgres and the in-memory engine used by tests.
    const total = await query('SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1', [req.user.id]);
    const unread = await query(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );

    return ok(res, {
      items: rows,
      unread: Number(unread.rows[0].n) || 0,
      total: Number(total.rows[0].n) || 0,
    });
  })
);

/* --------------------------------- read ---------------------------------- */

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = asId(req.params.id, 'id');

    const { rows: found } = await query('SELECT user_id FROM notifications WHERE id = $1', [id]);
    // 404 (not 403) for a foreign notification — don't leak which ids exist.
    if (!found.length || Number(found[0].user_id) !== Number(req.user.id)) {
      throw new HttpError(404, 'NOT_FOUND', 'Notification not found');
    }

    const { rows } = await query(
      `UPDATE notifications
          SET is_read = TRUE
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id]
    );
    return ok(res, rows[0], 'Marked as read');
  })
);

module.exports = router;
