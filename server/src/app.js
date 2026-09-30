/**
 * Express application factory. Kept separate from index.js so tests can
 * build the app without opening a port or touching the database.
 */
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler, fail } = require('./lib/http');

const authRouter = require('./routes/auth');
const produceRouter = require('./routes/produce');
const auctionsRouter = require('./routes/auctions');
const ordersRouter = require('./routes/orders');
const fpoRouter = require('./routes/fpo');

function limited({ windowMs, max, code }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code, message: 'Too many requests — please slow down' },
    },
  });
}

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

  // CORS — "*" by default, or a comma-separated allow-list via CORS_ORIGIN.
  const origin = process.env.CORS_ORIGIN || '*';
  app.use(
    cors({
      origin:
        origin === '*'
          ? true
          : origin.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '100kb' }));

  // Global API limiter + a stricter layer applied to auth routes below.
  const apiLimiter = limited({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    code: 'RATE_LIMITED',
  });
  const authLimiter = limited({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 50),
    code: 'AUTH_RATE_LIMITED',
  });
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) =>
    res.json({
      success: true,
      data: { status: 'ok', uptimeSec: Math.round(process.uptime()), time: new Date().toISOString() },
    })
  );

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/produce', produceRouter);
  app.use('/api/auctions', auctionsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/fpo', fpoRouter);

  // JSON 404s (HTML for anything else would be confusing in an API client).
  app.use('/api', (req, res) => fail(res, 404, 'NOT_FOUND', 'Endpoint not found'));
  app.use((req, res) => fail(res, 404, 'NOT_FOUND', 'Route not found'));

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
