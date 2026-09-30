/**
 * JWT authentication + role authorization middleware.
 * Attaches req.user = { id, role, name } when a valid bearer token is present.
 */
const jwt = require('jsonwebtoken');
const { HttpError } = require('../lib/http');

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    console.warn('[auth] JWT_SECRET not set — using insecure dev secret');
    return 'uzhavan-direct-dev-secret';
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    jwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Missing bearer token'));
  }
  try {
    const payload = jwt.verify(token, jwtSecret());
    req.user = { id: Number(payload.sub), role: payload.role, name: payload.name };
    return next();
  } catch (_) {
    return next(new HttpError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

/** Usage: router.post('/', authenticate, requireRole('farmer'), handler) */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new HttpError(403, 'FORBIDDEN', `Requires role: ${roles.join(' or ')}`)
      );
    }
    return next();
  };
}

module.exports = { authenticate, requireRole, signToken };
