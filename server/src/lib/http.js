/**
 * HTTP helpers: standard JSON envelope, error type, async wrapper,
 * central error handler, and tiny validation utilities.
 *
 * Success:  { success: true,  data: <payload>, message?: string }
 * Failure:  { success: false, error: { code, message, details? } }
 */

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function ok(res, data, message) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.json(body);
}

function fail(res, status, code, message, details) {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  return res.status(status).json({ success: false, error });
}

/** Wrap an async route handler so rejections reach the error handler (express 4). */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function notFound(message = 'Endpoint not found') {
  return new HttpError(404, 'NOT_FOUND', message);
}

/* ------------------------------ validation ------------------------------ */

const ROLES = ['farmer', 'consumer', 'fpo'];
const STATUSES = ['pending', 'completed', 'refunded'];
const DELIVERY_STAGES = [
  'placed',
  'confirmed',
  'packed',
  'atFarmerCity',
  'atFpo',
  'outForDelivery',
  'delivered',
];

function requireFields(body, fields) {
  const b = body || {};
  const missing = fields.filter(
    (f) => b[f] === undefined || b[f] === null || b[f] === ''
  );
  if (missing.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Missing required fields', {
      missing,
    });
  }
}

function oneOf(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `Invalid ${field}`, {
      allowed,
      received: value,
    });
  }
  return value;
}

function asNumber(value, field, opts = {}) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(n)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a number`, {
      received: value,
    });
  }
  if (opts.min !== undefined && n < opts.min) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be >= ${opts.min}`, {
      received: n,
    });
  }
  if (opts.max !== undefined && n > opts.max) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be <= ${opts.max}`, {
      received: n,
    });
  }
  return n;
}

function asId(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a positive integer`, {
      received: value,
    });
  }
  return n;
}

function asDate(value, field) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a valid date`, {
      received: value,
    });
  }
  return d;
}

/* ---------------------------- error handling ---------------------------- */

const DB_ERROR_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P03', '28000', '28P01'];

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }
  if (err.type === 'entity.parse.failed') {
    return fail(res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
  }
  if (err.type === 'entity.too.large') {
    return fail(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (DB_ERROR_CODES.includes(err.code)) {
    return fail(res, 503, 'DB_UNAVAILABLE', 'Database unavailable, try again later');
  }
  console.error('[api] unhandled error:', err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}

module.exports = {
  HttpError,
  ok,
  fail,
  asyncHandler,
  notFound,
  requireFields,
  oneOf,
  asNumber,
  asId,
  asDate,
  errorHandler,
  ROLES,
  STATUSES,
  DELIVERY_STAGES,
};
