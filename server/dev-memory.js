/**
 * ============================================================================
 * DEV / DEMO SERVER — the real API on an in-memory PostgreSQL (pg-mem)
 * ============================================================================
 * The production entry point (src/index.js) needs a real `DATABASE_URL`.
 * This file boots the SAME Express app against pg-mem instead, so the whole
 * front-end ↔ back-end integration can be demoed and tested on any machine
 * without installing PostgreSQL.
 *
 *   node dev-memory.js            # API on http://localhost:3000
 *   npm run dev:memory            # same thing
 *
 * ⚠️  Everything is lost when the process stops — this is a DEMO server only.
 *     Never use it in production; use `npm start` with a real database.
 *
 * It also seeds the same demo accounts the front-end knows about, so logging in
 * with karthik_farms / divya_buys / thanjai_fpo (password "123") talks to the
 * real API instead of localStorage.
 * ============================================================================
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { newDb } = require('pg-mem');

const { setPool, migrate, query } = require('./src/db');
const { createApp } = require('./src/app');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'uzhavan-direct-dev-secret';
process.env.OTP_DEBUG = process.env.OTP_DEBUG || 'true';

// NOTE: `|| 3000` also catches PORT="0", which would otherwise bind a random port.
const PORT = Number(process.env.PORT) || 3000;

/**
 * Must match apiPasswordFor() in the front-end (api.js): the API enforces a
 * 6-character minimum, so the short demo passwords are padded deterministically.
 *   '123'      → 'ud-123-demo'
 *   'pass123'  → 'pass123'
 */
function demoPassword(pw) {
  const s = String(pw);
  return s.length >= 6 ? s : 'ud-' + s + '-demo';
}

/* --------------------------------- seed ----------------------------------- */

const DEMO_USERS = [
  { name: 'Karthik Raman', phone: '9876543210', password: '123', role: 'farmer',
    village: 'Salem, TN', bio: 'Third-generation paddy & vegetable farmer.' },
  { name: 'Meena Devi', phone: '9123456780', password: 'pass123', role: 'farmer',
    village: 'Erode, TN', bio: 'Organic dairy & millet farm.' },
  { name: 'Divya Sundar', phone: '9988776655', password: '123', role: 'consumer',
    village: 'Chennai', address: '14 Anna Nagar, Chennai, Tamil Nadu' },
  { name: 'Thanjavur Agri Cluster FPO', phone: '9000009000', password: '123', role: 'fpo',
    village: 'Thanjavur', address: 'APMC Yard, Thanjavur, Tamil Nadu',
    bio: 'Farmer Producer Organisation handling first-mile aggregation and corridor freight.' },
];

/** Mirrors the produce seeded in app.js so the marketplace is identical. */
const DEMO_PRODUCE = [
  { farmer: 0, name: 'Rice',      category: 'grains/cereals/pulses', quantity: 500, unit: 'kg',    price: 42 },
  { farmer: 0, name: 'Tomato',    category: 'vegetable',             quantity: 120, unit: 'kg',    price: 28 },
  { farmer: 0, name: 'Onion',     category: 'vegetable',             quantity: 200, unit: 'kg',    price: 35 },
  { farmer: 0, name: 'Mango',     category: 'fruit',                 quantity: 80,  unit: 'kg',    price: 60 },
  { farmer: 0, name: 'Wheat',     category: 'grains/cereals/pulses', quantity: 700, unit: 'kg',    price: 32 },
  { farmer: 0, name: 'Brinjal',   category: 'vegetable',             quantity: 70,  unit: 'kg',    price: 22 },
  { farmer: 0, name: 'Potato',    category: 'vegetable',             quantity: 220, unit: 'kg',    price: 26 },
  { farmer: 0, name: 'Turmeric',  category: 'grains/cereals/pulses', quantity: 60,  unit: 'kg',    price: 180 },
  { farmer: 1, name: 'Milk',      category: 'dairy',                 quantity: 60,  unit: 'litre', price: 52 },
  { farmer: 1, name: 'Carrot',    category: 'vegetable',             quantity: 90,  unit: 'kg',    price: 30 },
  { farmer: 1, name: 'Toor Dal',  category: 'grains/cereals/pulses', quantity: 150, unit: 'kg',    price: 110 },
  { farmer: 1, name: 'Banana',    category: 'fruit',                 quantity: 90,  unit: 'kg',    price: 45 },
  { farmer: 1, name: 'Spinach',   category: 'vegetable',             quantity: 45,  unit: 'kg',    price: 18 },
  { farmer: 1, name: 'Eggs',      category: 'dairy',                 quantity: 40,  unit: 'dozen', price: 90 },
  { farmer: 1, name: 'Coconut',   category: 'fruit',                 quantity: 120, unit: 'dozen', price: 38 },
];

/** Insert the demo rows once, so restarts against a fresh memory DB work. */
async function seed() {
  const { rows } = await query('SELECT COUNT(*) AS n FROM users');
  if (Number(rows[0].n) > 0) {
    console.log('[seed] users already present — skipping');
    return;
  }

  const farmerIds = [];
  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash(demoPassword(u.password), 10);
    const inserted = await query(
      `INSERT INTO users (name, phone, password_hash, role, village, address, bio, is_phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id`,
      [u.name, u.phone, hash, u.role, u.village, u.address || null, u.bio || null]
    );
    if (u.role === 'farmer') farmerIds.push(inserted.rows[0].id);
    console.log(`[seed] ${u.role.padEnd(8)} ${u.name} · ${u.phone} · password "${u.password}"`);
  }

  for (const p of DEMO_PRODUCE) {
    await query(
      `INSERT INTO produce (farmer_id, category, name, quantity, unit, price, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [farmerIds[p.farmer], p.category, p.name, p.quantity, p.unit, p.price, 'Tamil Nadu']
    );
  }
  console.log(`[seed] ${DEMO_PRODUCE.length} produce listings`);
}

/* ---------------------------------- boot ---------------------------------- */

(async () => {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  setPool(new Pool());

  await migrate();
  console.log('[db] in-memory PostgreSQL ready ✔');
  await seed();

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log('');
    console.log(`  Uzhavan Direct API (DEMO, in-memory) → http://localhost:${PORT}`);
    console.log(`  Health check → http://localhost:${PORT}/api/health`);
    console.log('  Demo logins: john/123 with Farmer · Consumer · FPO selected');
    console.log('');
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch((err) => {
  console.error('[dev-memory] failed to start:', err);
  process.exit(1);
});
