/** Server entry point: load env, apply schema, listen. */
require('dotenv').config();
const { createApp } = require('./app');
const { migrate, closePool } = require('./db');

const PORT = Number(process.env.PORT || 3000);

if (!process.env.DATABASE_URL) {
  console.error('[api] DATABASE_URL is not set.\n[api] Copy server/.env.example → server/.env and point it at your PostgreSQL instance.');
  process.exit(1);
}

(async () => {
  await migrate();
  console.log('[db] schema ready ✔');

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[api] Uzhavan Direct API listening on http://localhost:${PORT}`);
    console.log(`[api] health check → GET http://localhost:${PORT}/api/health`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down…`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})().catch(async (err) => {
  console.error('[api] failed to start:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  await closePool().catch(() => {});
  process.exit(1);
});
