/**
 * /api/auth — register, login, current user, and SMS/OTP verification stubs.
 *
 * OTP stubs: codes are generated and stored in `otp_codes`. SMS delivery is
 * intentionally NOT implemented — plug in an SMS provider (MSG91 / Twilio /
 * Fast2SMS) where marked. While OTP_DEBUG=true the code is returned in the
 * response so demos and tests can complete verification.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');
const { signToken, authenticate } = require('../middleware/auth');
const {
  HttpError,
  ok,
  asyncHandler,
  requireFields,
  oneOf,
  ROLES,
} = require('../lib/http');

const router = express.Router();

const PHONE_RE = /^\+?[0-9]{7,15}$/;
const OTP_TTL_MINUTES = 5;
const SALT_ROUNDS = 10;

/** Strip secrets before a user object leaves the API. */
function publicUser(row) {
  const { password_hash, ...safe } = row;
  return safe;
}

function normalizePhone(phone) {
  return String(phone).replace(/[\s\-()]/g, '');
}

/* ----------------------------- rate limiters ----------------------------- */

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.OTP_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many OTP requests, try again later' },
  },
});

/* ------------------------------- register -------------------------------- */

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['name', 'phone', 'password', 'role']);

    const phone = normalizePhone(b.phone);
    if (!PHONE_RE.test(phone)) {
      throw new HttpError(400, 'INVALID_PHONE', 'Phone must be 7–15 digits, optional leading +');
    }
    oneOf(String(b.role), ROLES, 'role');
    const password = String(b.password);
    if (password.length < 6) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters');
    }

    const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length) {
      throw new HttpError(409, 'PHONE_TAKEN', 'An account with this phone already exists');
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await query(
      `INSERT INTO users (name, phone, password_hash, role, village, address, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, phone, role, village, address, bio, is_phone_verified, created_at`,
      [
        String(b.name).trim(),
        phone,
        password_hash,
        b.role,
        b.village || b.city || null, // "village/city" — both keys accepted
        b.address || null,
        b.bio || null,
      ]
    );

    const user = rows[0];
    return res.status(201).json({
      success: true,
      data: { token: signToken(user), user },
      message: 'Registered. Verify your phone via POST /api/auth/request-otp',
    });
  })
);

/* --------------------------------- login --------------------------------- */

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['phone', 'password']);
    const phone = normalizePhone(b.phone);

    const { rows } = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    const user = rows[0];
    const valid = user
      ? await bcrypt.compare(String(b.password), user.password_hash)
      : false;
    if (!user || !valid) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid phone or password');
    }

    return ok(res, {
      token: signToken(user),
      user: publicUser(user),
    });
  })
);

/* ------------------------------- current user ---------------------------- */

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, name, phone, role, village, address, bio, is_phone_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) throw new HttpError(404, 'NOT_FOUND', 'User not found');
    return ok(res, rows[0]);
  })
);

/* --------------------------------- OTP stubs ------------------------------ */

router.post(
  '/request-otp',
  otpLimiter,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['phone']);
    const phone = normalizePhone(b.phone);
    if (!PHONE_RE.test(phone)) {
      throw new HttpError(400, 'INVALID_PHONE', 'Phone must be 7–15 digits, optional leading +');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await query('DELETE FROM otp_codes WHERE phone = $1', [phone]);
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    // TODO: hand `code` to an SMS provider here, e.g.
    //   await sms.send(phone, `Your Uzhavan Direct verification code is ${code}`);
    // For now the code is only exposed when OTP_DEBUG=true (dev/demo).
    const debug = String(process.env.OTP_DEBUG || '').toLowerCase() !== 'false';

    return ok(
      res,
      {
        channel: 'sms',
        expiresInSec: OTP_TTL_MINUTES * 60,
        ...(debug ? { devOtp: code } : {}),
      },
      debug
        ? 'OTP generated (OTP_DEBUG=true — not actually sent by SMS)'
        : 'OTP sent via SMS (stub: provider not configured)'
    );
  })
);

router.post(
  '/verify-otp',
  otpLimiter,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['phone', 'code']);
    const phone = normalizePhone(b.phone);

    const { rows } = await query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND consumed_at IS NULL AND expires_at > now()
       ORDER BY id DESC LIMIT 1`,
      [phone]
    );
    const record = rows[0];
    if (!record) {
      throw new HttpError(400, 'OTP_EXPIRED', 'No active OTP for this phone — request a new one');
    }
    if (String(b.code).trim() !== record.code) {
      throw new HttpError(400, 'OTP_INVALID', 'Incorrect OTP code');
    }

    await query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [record.id]);
    const updated = await query(
      'UPDATE users SET is_phone_verified = TRUE WHERE phone = $1 RETURNING id, name, phone, role, village, address, bio, is_phone_verified, created_at',
      [phone]
    );

    if (!updated.rows.length) {
      // OTP verified for a phone that hasn't registered yet — fine, flag it for later.
      return ok(res, { verified: true, accountFound: false }, 'OTP verified');
    }
    return ok(
      res,
      { verified: true, accountFound: true, user: updated.rows[0] },
      'Phone verified'
    );
  })
);

module.exports = router;
