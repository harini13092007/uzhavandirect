/**
 * Database access layer.
 *
 * Wraps a single `pg` Pool behind query()/withTransaction() so routes never
 * touch connection details, and migrations run from schema.sql (idempotent).
 * Tests inject an in-memory pool via setPool().
 */
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('[db] DATABASE_URL is not set — set it in server/.env before starting.');
    }
    pool = new Pool(connectionString ? { connectionString } : undefined);
  }
  return pool;
}

/** Inject a pool (used by tests with an in-memory Postgres). */
function setPool(p) {
  pool = p;
}

async function query(text, params) {
  return getPool().query(text, params);
}

/** Run fn(client) inside a transaction; rolls back on throw. */
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore rollback failure */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Apply schema.sql (all statements are IF NOT EXISTS — safe on every boot). */
async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await query(sql);
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, setPool, query, withTransaction, migrate, closePool };
