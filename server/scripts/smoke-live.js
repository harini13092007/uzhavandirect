/**
 * ============================================================================
 * LIVE SMOKE TEST — frontend ↔ backend integration contract
 * ============================================================================
 * Unlike `npm test` (which uses an in-memory database and a random port), this
 * script talks to a REAL running server and walks the exact request sequence
 * the browser makes, in the order the browser makes it.
 *
 *   1. terminal A:  cd server && npm run dev:memory
 *   2. terminal B:  cd server && npm run smoke
 *
 * Exits non-zero if any check fails, so it can gate a demo.
 * ============================================================================
 */
const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';
const results = [];

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? '✔' : '✘'} ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  // ---- health
  let r = await call('GET', '/api/health');
  check('GET /api/health', r.status === 200 && r.json.success, 'status ' + r.status);

  // ---- farmer login with the PADDED demo password (mirrors apiPasswordFor)
  r = await call('POST', '/api/auth/login', { body: { phone: '9876543210', password: 'ud-123-demo' } });
  check('farmer login (padded demo password)', r.status === 200 && r.json.data.token, 'role=' + (r.json.data ? r.json.data.user.role : '?'));
  const farmer = r.json.data;

  r = await call('GET', '/api/auth/me', { token: farmer.token });
  check('GET /api/auth/me', r.status === 200 && r.json.data.role === 'farmer', r.json.data && r.json.data.name);

  // ---- invalid token handling (what api.js turns into "session expired")
  r = await call('GET', '/api/auth/me', { token: 'not-a-real-token' });
  check('invalid JWT → 401 INVALID_TOKEN', r.status === 401 && r.json.error.code === 'INVALID_TOKEN', r.json.error && r.json.error.code);

  // ---- produce
  r = await call('GET', '/api/produce?limit=200');
  const seededProduce = r.json.data.length;
  check('GET /api/produce (seeded listings)', r.status === 200 && seededProduce >= 15, seededProduce + ' rows');

  r = await call('POST', '/api/produce', {
    token: farmer.token,
    body: { name: 'Smoke Cucumber', category: 'vegetable', price: 25, quantity: 40, unit: 'kg', image_url: '' },
  });
  check('POST /api/produce (create)', r.status === 201 && r.json.data.id, 'id=' + (r.json.data && r.json.data.id));
  const newProduce = r.json.data;

  r = await call('PUT', '/api/produce/' + newProduce.id, { token: farmer.token, body: { price: 27 } });
  check('PUT /api/produce/:id (update)', r.status === 200 && Number(r.json.data.price) === 27, 'price=' + (r.json.data && r.json.data.price));

  // ---- auction
  r = await call('POST', '/api/auctions', {
    token: farmer.token,
    body: { produce_id: newProduce.id, base_rate: 30, quantity: 20, unit: 'kg', ends_at: new Date(Date.now() + 3600e3).toISOString() },
  });
  check('POST /api/auctions (create)', r.status === 201 && r.json.data.id, 'id=' + (r.json.data && r.json.data.id));
  const auction = r.json.data;

  r = await call('GET', '/api/auctions');
  check('GET /api/auctions (list)', r.status === 200 && Array.isArray(r.json.data), r.json.data.length + ' rows');

  // ---- consumer
  r = await call('POST', '/api/auth/login', { body: { phone: '9988776655', password: 'ud-123-demo' } });
  check('consumer login', r.status === 200 && r.json.data.user.role === 'consumer', r.json.data && r.json.data.user.name);
  const consumer = r.json.data;

  r = await call('POST', `/api/auctions/${auction.id}/bid`, { token: consumer.token, body: { amount: 35 } });
  check('POST /api/auctions/:id/bid', r.status === 200 && Number(r.json.data.highest_bid) === 35, 'highest=' + (r.json.data && r.json.data.highest_bid));

  r = await call('POST', `/api/auctions/${auction.id}/bid`, { token: consumer.token, body: { amount: 31 } });
  check('bid lower than current → 409 BID_TOO_LOW', r.status === 409 && r.json.error.code === 'BID_TOO_LOW', r.json.error && r.json.error.code);

  // ---- order
  r = await call('POST', '/api/orders', {
    token: consumer.token,
    body: { produce_id: newProduce.id, quantity: 5, address: '14 Anna Nagar, Chennai, Tamil Nadu' },
  });
  check('POST /api/orders (checkout)', r.status === 201 && r.json.data.id, 'total=₹' + (r.json.data && r.json.data.total_price));
  const order = r.json.data;

  r = await call('GET', '/api/orders', { token: consumer.token });
  check('GET /api/orders (consumer scoped)', r.status === 200 && r.json.data.length >= 1, r.json.data.length + ' rows');

  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: farmer.token, body: { delivery_stage: 'confirmed' } });
  check('farmer advances stage → confirmed', r.status === 200 && r.json.data.delivery_stage === 'confirmed', r.json.data && r.json.data.delivery_stage);

  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: farmer.token, body: { delivery_stage: 'atFpo' } });
  check('farmer outside band → 403 STAGE_NOT_ALLOWED', r.status === 403 && r.json.error.code === 'STAGE_NOT_ALLOWED', r.json.error && r.json.error.code);

  // ---- FPO
  r = await call('POST', '/api/auth/login', { body: { phone: '9000009000', password: 'ud-123-demo' } });
  check('fpo login', r.status === 200 && r.json.data.user.role === 'fpo', r.json.data && r.json.data.user.name);
  const fpo = r.json.data;

  r = await call('POST', '/api/fpo/batches', {
    token: fpo.token,
    body: {
      source_cluster: 'Nilgiris cluster',
      destination_hub: 'Thanjavur hub',
      consolidated_weight_kg: 5,
      vehicle_type: 'truck',
      transit_status: 'assembling',
      orders_list: [order.id],
    },
  });
  check('POST /api/fpo/batches (attaches order)', r.status === 201 && r.json.data.id, 'batch ' + (r.json.data && r.json.data.id));
  const batch = r.json.data;

  r = await call('GET', '/api/orders', { token: fpo.token });
  check('GET /api/orders (fpo scoped after attach)', r.status === 200 && r.json.data.length >= 1, r.json.data.length + ' rows');

  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: fpo.token, body: { delivery_stage: 'atFpo' } });
  check('fpo advances stage → atFpo', r.status === 200 && r.json.data.delivery_stage === 'atFpo', r.json.data && r.json.data.delivery_stage);

  // Setting the SAME stage is a harmless no-op (idempotent), which is what the
  // frontend relies on when a local move maps onto an already-reached step.
  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: fpo.token, body: { delivery_stage: 'atFpo' } });
  check('same stage again is idempotent (200)', r.status === 200 && r.json.data.delivery_stage === 'atFpo', r.json.data && r.json.data.delivery_stage);

  // A stage outside the FPO band is refused before anything else.
  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: fpo.token, body: { delivery_stage: 'packed' } });
  check('stage outside FPO band → 403 STAGE_NOT_ALLOWED', r.status === 403 && r.json.error.code === 'STAGE_NOT_ALLOWED', r.json.error && r.json.error.code);

  // A genuine backwards move *within* the band is a regression; api.js swallows it.
  r = await call('PATCH', `/api/orders/${order.id}/stage`, { token: fpo.token, body: { delivery_stage: 'atFarmerCity' } });
  check('backwards stage → 409 STAGE_REGRESSION (handled softly)', r.status === 409 && r.json.error.code === 'STAGE_REGRESSION', r.json.error && r.json.error.code);

  // ---- Tier-1: AGMARK grading + digital weighment (new endpoint)
  r = await call('PATCH', `/api/orders/${order.id}/grading`, {
    token: fpo.token,
    body: { fpo_grade: 'a', fpo_weigh_kg: 4.5 },
  });
  check('PATCH /api/orders/:id/grading (Tier-1, grade normalised)',
    r.status === 200 && r.json.data.fpo_grade === 'A' && Number(r.json.data.fpo_weigh_kg) === 4.5,
    'grade=' + (r.json.data && r.json.data.fpo_grade) + ' weigh=' + (r.json.data && r.json.data.fpo_weigh_kg));

  r = await call('PATCH', `/api/orders/${order.id}/grading`, {
    token: fpo.token,
    body: { fpo_grade: 'Z', fpo_weigh_kg: 1 },
  });
  check('invalid AGMARK grade → 400', r.status === 400, r.json.error && r.json.error.code);

  r = await call('GET', '/api/fpo/inbound?include_graded=true', { token: fpo.token });
  check('GET /api/fpo/inbound (Tier-1 queue)', r.status === 200 && Array.isArray(r.json.data), r.json.data.length + ' lots');

  r = await call('PATCH', `/api/orders/${order.id}/agent`, { token: fpo.token, body: { agent: 'Kumar · EV-01' } });
  check('EV agent before the shipment is received → 409 BATCH_NOT_RECEIVED',
    r.status === 409 && r.json.error.code === 'BATCH_NOT_RECEIVED', r.json.error && r.json.error.code);

  r = await call('PATCH', `/api/fpo/batches/${batch.id}`, { token: fpo.token, body: { transit_status: 'dispatched' } });
  check('PATCH /api/fpo/batches/:id → dispatched', r.status === 200 && r.json.data.transit_status === 'dispatched', r.json.data && r.json.data.transit_status);

  r = await call('PATCH', `/api/fpo/batches/${batch.id}`, { token: fpo.token, body: { transit_status: 'received' } });
  check('PATCH /api/fpo/batches/:id → received', r.status === 200 && r.json.data.transit_status === 'received', r.json.data && r.json.data.transit_status);

  r = await call('GET', '/api/fpo/batches', { token: fpo.token });
  check('GET /api/fpo/batches (list)', r.status === 200 && r.json.data.length >= 1, r.json.data.length + ' batches');

  // ---- Tier-3: EV doorstep agent assignment (new endpoint)
  r = await call('PATCH', `/api/orders/${order.id}/agent`, {
    token: fpo.token,
    body: { agent: 'Kumar · EV-01' },
  });
  check('PATCH /api/orders/:id/agent (Tier-3) → outForDelivery',
    r.status === 200 && r.json.data.fpo_ev_agent === 'Kumar · EV-01' && r.json.data.delivery_stage === 'outForDelivery',
    'agent=' + (r.json.data && r.json.data.fpo_ev_agent) + ' stage=' + (r.json.data && r.json.data.delivery_stage));

  r = await call('GET', `/api/orders/${order.id}`, { token: consumer.token });
  check('consumer sees the graded + agent-assigned order',
    r.status === 200 && r.json.data.fpo_grade === 'A' && r.json.data.fpo_ev_agent === 'Kumar · EV-01',
    'grade=' + (r.json.data && r.json.data.fpo_grade));

  // ---- role guards
  r = await call('POST', '/api/produce', { token: consumer.token, body: { name: 'X', category: 'vegetable', price: 1 } });
  check('consumer cannot create produce → 403', r.status === 403, r.json.error && r.json.error.code);

  r = await call('GET', '/api/orders');
  check('orders require auth → 401', r.status === 401, r.json.error && r.json.error.code);

  const failed = results.filter(x => !x.pass);
  console.log('\n' + (failed.length ? '✘ FAILED: ' + failed.length : '✔ ALL ' + results.length + ' SMOKE CHECKS PASSED'));
  process.exit(failed.length ? 1 : 0);
})().catch(err => { console.error('smoke crashed:', err); process.exit(1); });
