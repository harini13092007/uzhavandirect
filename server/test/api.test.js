/**
 * Integration tests: Express app + in-memory PostgreSQL (pg-mem).
 * Run: npm test
 *
 * Covers: envelope format, CORS, rate-limit headers, register/login/JWT,
 * OTP stubs, produce CRUD + ownership, auction bidding + expiry, order
 * creation with atomic stock decrement, status/stage transition rules,
 * and FPO batch attachment.
 */
process.env.JWT_SECRET = 'test-secret';
process.env.OTP_DEBUG = 'true';
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
process.env.OTP_RATE_LIMIT_MAX = '100000';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { newDb } = require('pg-mem');

const { setPool, migrate, closePool } = require('../src/db');
const { createApp } = require('../src/app');

let base;
let server;
const tokens = {}; // role alias → JWT
const state = {}; // shared fixtures (ids etc.)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, { token, body, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, json };
}

before(async () => {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  setPool(new Pool());
  await migrate();

  const app = createApp();
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await closePool().catch(() => {});
});

/* --------------------------- health / CORS / 404 -------------------------- */

test('GET /api/health returns the success envelope', async () => {
  const r = await api('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.equal(r.json.data.status, 'ok');
});

test('CORS echoes the request origin', async () => {
  const r = await api('GET', '/api/health', { headers: { origin: 'http://example.test' } });
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://example.test');
});

test('unknown API route returns a JSON 404 envelope', async () => {
  const r = await api('GET', '/api/nope');
  assert.equal(r.status, 404);
  assert.equal(r.json.success, false);
  assert.equal(r.json.error.code, 'NOT_FOUND');
});

test('malformed JSON body returns 400 INVALID_JSON', async () => {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{nope',
  });
  const json = await res.json();
  assert.equal(res.status, 400);
  assert.equal(json.error.code, 'INVALID_JSON');
});

test('rate limiter is active (headers present)', async () => {
  const r = await api('GET', '/api/health');
  assert.ok(r.headers.get('ratelimit-limit') || r.headers.get('x-ratelimit-limit'));
});

/* --------------------------------- auth ---------------------------------- */

test('register: creates farmer, consumer and fpo accounts', async () => {
  const people = [
    ['farmer', 'Ravi Farmer', '9000000001', { village: 'Keelvelur' }],
    ['consumer', 'Divya Buyer', '9000000002', { city: 'Chennai' }],
    ['fpo', 'Meena Agro FPO', '9000000003', { village: 'Trichy' }],
  ];
  for (const [alias, name, phone, extra] of people) {
    const r = await api('POST', '/api/auth/register', {
      body: { name, phone, password: 'secret123', role: alias, ...extra },
    });
    assert.equal(r.status, 201, `${alias}: ${JSON.stringify(r.json)}`);
    assert.ok(r.json.data.token);
    assert.equal(r.json.data.user.role, alias);
    assert.equal(r.json.data.user.password_hash, undefined, 'hash must not leak');
    tokens[alias] = r.json.data.token;
  }
  assert.equal((await api('GET', '/api/auth/me', { token: tokens.farmer })).json.data.village, 'Keelvelur');
  assert.equal((await api('GET', '/api/auth/me', { token: tokens.consumer })).json.data.village, 'Chennai', 'city maps to village');
});

test('register: validation errors', async () => {
  const dup = await api('POST', '/api/auth/register', {
    body: { name: 'Clone', phone: '9000000001', password: 'secret123', role: 'consumer' },
  });
  assert.equal(dup.status, 409);
  assert.equal(dup.json.error.code, 'PHONE_TAKEN');

  const badRole = await api('POST', '/api/auth/register', {
    body: { name: 'X', phone: '9000000099', password: 'secret123', role: 'admin' },
  });
  assert.equal(badRole.status, 400);

  const shortPw = await api('POST', '/api/auth/register', {
    body: { name: 'X', phone: '9000000098', password: '123', role: 'consumer' },
  });
  assert.equal(shortPw.status, 400);
});

test('login: success, wrong password, unknown phone', async () => {
  const okLogin = await api('POST', '/api/auth/login', {
    body: { phone: '9000000002', password: 'secret123' },
  });
  assert.equal(okLogin.status, 200);
  assert.equal(okLogin.json.data.user.role, 'consumer');
  assert.equal(okLogin.json.data.user.password_hash, undefined);

  const badPw = await api('POST', '/api/auth/login', {
    body: { phone: '9000000002', password: 'wrong' },
  });
  assert.equal(badPw.status, 401);
  assert.equal(badPw.json.error.code, 'INVALID_CREDENTIALS');

  const unknown = await api('POST', '/api/auth/login', {
    body: { phone: '9999999999', password: 'whatever' },
  });
  assert.equal(unknown.status, 401);
});

test('me: requires a valid token', async () => {
  assert.equal((await api('GET', '/api/auth/me')).status, 401);
  assert.equal((await api('GET', '/api/auth/me', { token: 'garbage' })).status, 401);
  const r = await api('GET', '/api/auth/me', { token: tokens.farmer });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.phone, '9000000001');
});

test('OTP stubs: request → verify → account flagged verified', async () => {
  const req1 = await api('POST', '/api/auth/request-otp', { body: { phone: '9000000002' } });
  assert.equal(req1.status, 200);
  assert.match(req1.json.data.devOtp, /^\d{6}$/);

  const wrong = await api('POST', '/api/auth/verify-otp', {
    body: { phone: '9000000002', code: '000000' },
  });
  assert.equal(wrong.status, 400);
  assert.equal(wrong.json.error.code, 'OTP_INVALID');

  const good = await api('POST', '/api/auth/verify-otp', {
    body: { phone: '9000000002', code: req1.json.data.devOtp },
  });
  assert.equal(good.status, 200);
  assert.equal(good.json.data.verified, true);
  assert.equal(good.json.data.user.is_phone_verified, true);

  const reuse = await api('POST', '/api/auth/verify-otp', {
    body: { phone: '9000000002', code: req1.json.data.devOtp },
  });
  assert.equal(reuse.status, 400, 'OTP must be single-use');
});

/* -------------------------------- produce -------------------------------- */

test('produce: consumers cannot create; farmers can', async () => {
  const forbidden = await api('POST', '/api/produce', {
    token: tokens.consumer,
    body: { category: 'Vegetables', name: 'Fake', price: 1 },
  });
  assert.equal(forbidden.status, 403);

  const r = await api('POST', '/api/produce', {
    token: tokens.farmer,
    body: {
      category: 'Vegetables',
      name: 'Tomato',
      quantity: 10,
      unit: 'kg',
      price: 40,
      perishability: '2 days',
      image_url: 'assets/products/tomato.jpg',
      location: 'Keelvelur',
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  state.produceId = r.json.data.id;
  assert.equal(r.json.data.is_sold, false);

  const missing = await api('POST', '/api/produce', {
    token: tokens.farmer,
    body: { category: 'Vegetables', name: 'NoPrice' },
  });
  assert.equal(missing.status, 400);
  assert.deepEqual(missing.json.error.details.missing, ['price']);
});

test('produce: list filters and single fetch', async () => {
  const all = await api('GET', '/api/produce');
  assert.equal(all.status, 200);
  assert.ok(all.json.data.some((p) => p.id === state.produceId));
  assert.ok(all.json.data[0].farmer_name, 'joins farmer name');

  const search = await api('GET', '/api/produce?q=toma');
  assert.ok(search.json.data.every((p) => p.name.toLowerCase().includes('toma')));
  assert.ok(search.json.data.length >= 1);

  const byCat = await api('GET', '/api/produce?category=Dairy');
  assert.ok(byCat.json.data.every((p) => p.category === 'Dairy'));

  const one = await api('GET', `/api/produce/${state.produceId}`);
  assert.equal(one.json.data.name, 'Tomato');
  assert.equal((await api('GET', '/api/produce/999999')).status, 404);
});

test('produce: PUT enforces ownership and validates numbers', async () => {
  const notMine = await api('PUT', `/api/produce/${state.produceId}`, {
    token: tokens.consumer,
    body: { name: 'Hacked' },
  });
  assert.equal(notMine.status, 403);

  const badPrice = await api('PUT', `/api/produce/${state.produceId}`, {
    token: tokens.farmer,
    body: { price: -5 },
  });
  assert.equal(badPrice.status, 400);

  const r = await api('PUT', `/api/produce/${state.produceId}`, {
    token: tokens.farmer,
    body: { price: 45, name: 'Tomato (organic)' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.price, 45);
  assert.equal(r.json.data.name, 'Tomato (organic)');
});

/* -------------------------------- auctions -------------------------------- */

test('auction: farmer opens auction on own produce', async () => {
  const notMine = await api('POST', '/api/auctions', {
    token: tokens.consumer,
    body: { produce_id: state.produceId, base_rate: 500, ends_at: Date.now() + 60000 },
  });
  assert.equal(notMine.status, 403);

  const r = await api('POST', '/api/auctions', {
    token: tokens.farmer,
    body: {
      produce_id: state.produceId,
      base_rate: 500,
      quantity: 5,
      ends_at: new Date(Date.now() + 60000).toISOString(),
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  state.auctionId = r.json.data.id;
  assert.equal(r.json.data.highest_bid, null);

  const past = await api('POST', '/api/auctions', {
    token: tokens.farmer,
    body: { produce_id: state.produceId, base_rate: 100, ends_at: new Date(Date.now() - 1000).toISOString() },
  });
  assert.equal(past.status, 400, 'ends_at must be in the future');
});

test('auction: bidding rules (base rate, highest, role)', async () => {
  const tooLow = await api('POST', `/api/auctions/${state.auctionId}/bid`, {
    token: tokens.consumer,
    body: { amount: 100 },
  });
  assert.equal(tooLow.status, 409);
  assert.equal(tooLow.json.error.code, 'BID_TOO_LOW');

  const first = await api('POST', `/api/auctions/${state.auctionId}/bid`, {
    token: tokens.consumer,
    body: { amount: 500 },
  });
  assert.equal(first.status, 200, JSON.stringify(first.json));
  assert.equal(first.json.data.highest_bid, 500);

  const notOutbid = await api('POST', `/api/auctions/${state.auctionId}/bid`, {
    token: tokens.consumer,
    body: { amount: 500 },
  });
  assert.equal(notOutbid.status, 409, 'must strictly exceed current bid');

  const higher = await api('POST', `/api/auctions/${state.auctionId}/bid`, {
    token: tokens.consumer,
    body: { amount: 750 },
  });
  assert.equal(higher.status, 200);
  assert.equal(higher.json.data.highest_bid, 750);

  const asFarmer = await api('POST', `/api/auctions/${state.auctionId}/bid`, {
    token: tokens.farmer,
    body: { amount: 900 },
  });
  assert.equal(asFarmer.status, 403, 'only consumers bid');

  assert.equal((await api('POST', '/api/auctions/999999/bid', { token: tokens.consumer, body: { amount: 999 } })).status, 404);
});

test('auction: expired auctions auto-close and reject bids', async () => {
  const r = await api('POST', '/api/auctions', {
    token: tokens.farmer,
    body: {
      produce_id: state.produceId,
      base_rate: 10,
      ends_at: new Date(Date.now() + 300).toISOString(),
    },
  });
  assert.equal(r.status, 201);
  await sleep(500);

  const list = await api('GET', '/api/auctions?open=true');
  assert.ok(list.json.data.every((a) => !a.is_closed));
  assert.ok(!list.json.data.some((a) => a.id === r.json.data.id));

  const bid = await api('POST', `/api/auctions/${r.json.data.id}/bid`, {
    token: tokens.consumer,
    body: { amount: 999 },
  });
  assert.equal(bid.status, 409);
  assert.equal(bid.json.error.code, 'AUCTION_CLOSED');
});

/* --------------------------------- orders --------------------------------- */

test('order: consumer buys with atomic stock decrement', async () => {
  const r = await api('POST', '/api/orders', {
    token: tokens.consumer,
    body: {
      produce_id: state.produceId,
      quantity: 2,
      address: '12, Mount Poonamallee Road, Chennai',
      delivery_timing: 'Morning 8–11 AM',
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  state.orderId = r.json.data.id;
  assert.equal(r.json.data.status, 'pending');
  assert.equal(r.json.data.delivery_stage, 'placed');
  assert.equal(r.json.data.total_price, 90, 'price 45 × qty 2');
  assert.equal(r.json.data.unit, 'kg');
  assert.equal(r.json.data.farmer_id, (await api('GET', '/api/auth/me', { token: tokens.farmer })).json.data.id);

  const produce = await api('GET', `/api/produce/${state.produceId}`);
  assert.equal(produce.json.data.quantity, 8, 'stock decremented');

  const overStock = await api('POST', '/api/orders', {
    token: tokens.consumer,
    body: { produce_id: state.produceId, quantity: 999, address: 'Nowhere' },
  });
  assert.equal(overStock.status, 409);
  assert.equal(overStock.json.error.code, 'OUT_OF_STOCK');
});

test('order: farmers cannot place orders', async () => {
  const r = await api('POST', '/api/orders', {
    token: tokens.farmer,
    body: { produce_id: state.produceId, quantity: 1, address: 'x' },
  });
  assert.equal(r.status, 403);
});

test('order: delivery stage transitions are role-scoped and forward-only', async () => {
  const stage = (s, token) =>
    api('PATCH', `/api/orders/${state.orderId}/stage`, { token, body: { delivery_stage: s } });

  assert.equal((await stage('packed', tokens.consumer)).status, 403, 'consumers do not advance stages');

  const packed = await stage('packed', tokens.farmer);
  assert.equal(packed.status, 200, JSON.stringify(packed.json));
  assert.equal(packed.json.data.delivery_stage, 'packed');

  const regression = await stage('placed', tokens.farmer);
  assert.equal(regression.status, 409);
  assert.equal(regression.json.error.code, 'STAGE_REGRESSION');

  const farmerTooFar = await stage('delivered', tokens.farmer);
  assert.equal(farmerTooFar.status, 403);
  assert.equal(farmerTooFar.json.error.code, 'STAGE_NOT_ALLOWED');

  const fpoUnassigned = await stage('atFpo', tokens.fpo);
  assert.equal(fpoUnassigned.status, 404, 'fpo must be assigned first');

  const badStage = await api('PATCH', `/api/orders/${state.orderId}/stage`, {
    token: tokens.farmer,
    body: { delivery_stage: 'teleported' },
  });
  assert.equal(badStage.status, 400);
});

test('order: status updates are validated and participant-only', async () => {
  const bad = await api('PATCH', `/api/orders/${state.orderId}`, {
    token: tokens.consumer,
    body: { status: 'cancelled' },
  });
  assert.equal(bad.status, 400);

  const r = await api('PATCH', `/api/orders/${state.orderId}`, {
    token: tokens.consumer,
    body: { status: 'completed' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.status, 'completed');
  assert.equal(r.json.data.updated_at !== undefined, true);
});

test('order: lists are scoped by role', async () => {
  const consumerList = await api('GET', '/api/orders', { token: tokens.consumer });
  assert.ok(consumerList.json.data.some((o) => o.id === state.orderId));

  const fpoList = await api('GET', '/api/orders', { token: tokens.fpo });
  assert.ok(!fpoList.json.data.some((o) => o.id === state.orderId), 'not assigned yet');

  const filter = await api('GET', '/api/orders?status=completed', { token: tokens.consumer });
  assert.ok(filter.json.data.every((o) => o.status === 'completed'));

  const badFilter = await api('GET', '/api/orders?status=bogus', { token: tokens.consumer });
  assert.equal(badFilter.status, 400);

  assert.equal((await api('GET', `/api/orders/${state.orderId}`, { token: tokens.fpo })).status, 404);
});

/* ------------------------------- FPO batches ------------------------------ */

test('fpo: batch creation attaches orders to the FPO', async () => {
  const r = await api('POST', '/api/fpo/batches', {
    token: tokens.fpo,
    body: {
      source_cluster: 'Keelvelur village',
      destination_hub: 'Chennai hub',
      consolidated_weight_kg: 120.5,
      vehicle_type: 'Refrigerated truck',
      orders_list: [state.orderId],
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  state.batchId = r.json.data.id;
  assert.deepEqual(r.json.data.orders_list, [state.orderId]);

  const fpoList = await api('GET', '/api/orders', { token: tokens.fpo });
  const assigned = fpoList.json.data.find((o) => o.id === state.orderId);
  assert.ok(assigned, 'order now visible to the FPO');
  assert.equal(assigned.fpo_name, 'Meena Agro FPO');
});

test('fpo: batches are scoped and reject foreign/missing orders', async () => {
  const missing = await api('POST', '/api/fpo/batches', {
    token: tokens.fpo,
    body: { source_cluster: 'a', destination_hub: 'b', orders_list: [999999] },
  });
  assert.equal(missing.status, 409);
  assert.deepEqual(missing.json.error.details.rejected, [999999]);

  assert.equal((await api('GET', '/api/fpo/batches', { token: tokens.consumer })).status, 403);
  assert.equal((await api('GET', '/api/fpo/batches', { token: tokens.fpo })).json.data.length, 1);
});

test('fpo: assigned fpo can advance stages from atFarmerCity onward', async () => {
  const stage = (s, token) =>
    api('PATCH', `/api/orders/${state.orderId}/stage`, { token, body: { delivery_stage: s } });

  const confirmed = await stage('confirmed', tokens.fpo);
  assert.equal(confirmed.status, 403, 'confirming is the farmer\'s job');

  const atFpo = await stage('atFpo', tokens.fpo);
  assert.equal(atFpo.status, 200, JSON.stringify(atFpo.json));
  assert.equal(atFpo.json.data.delivery_stage, 'atFpo');

  const done = await stage('delivered', tokens.fpo);
  assert.equal(done.status, 200);
  assert.equal(done.json.data.delivery_stage, 'delivered');

  const patch = await api('PATCH', `/api/fpo/batches/${state.batchId}`, {
    token: tokens.fpo,
    body: { transit_status: 'delivered' },
  });
  assert.equal(patch.status, 200);
  assert.equal(patch.json.data.transit_status, 'delivered');
  assert.ok(Array.isArray(patch.json.data.orders));
});

/* ============================================================================
 * FPO tier lifecycle: Tier-1 grading + Tier-2 corridor stamping + Tier-3 agent
 * ========================================================================== */

/** Buy 1 unit and walk it to the farm-gate collection point (atFarmerCity). */
async function orderAtCollectionPoint() {
  const created = await api('POST', '/api/orders', {
    token: tokens.consumer,
    body: { produce_id: state.produceId, quantity: 1, address: '14 Anna Nagar, Chennai' },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  const id = created.json.data.id;
  for (const s of ['confirmed', 'packed', 'atFarmerCity']) {
    const r = await api('PATCH', `/api/orders/${id}/stage`, {
      token: tokens.farmer,
      body: { delivery_stage: s },
    });
    assert.equal(r.status, 200, `advance to ${s}: ${JSON.stringify(r.json)}`);
  }
  return id;
}

test('fpo: inbound queue lists ungraded lots and grading claims the lot', async () => {
  const orderId = await orderAtCollectionPoint();
  const fpoId = (await api('GET', '/api/auth/me', { token: tokens.fpo })).json.data.id;

  const inbound = await api('GET', '/api/fpo/inbound', { token: tokens.fpo });
  assert.equal(inbound.status, 200, JSON.stringify(inbound.json));
  assert.ok(inbound.json.data.some((o) => o.id === orderId), 'new lot is in the Tier-1 queue');

  // Only FPOs may grade.
  assert.equal((await api('GET', '/api/fpo/inbound', { token: tokens.farmer })).status, 403);
  assert.equal(
    (await api('PATCH', `/api/orders/${orderId}/grading`, {
      token: tokens.farmer,
      body: { fpo_grade: 'A', fpo_weigh_kg: 10 },
    })).status,
    403,
    'farmers cannot grade'
  );
  assert.equal(
    (await api('PATCH', `/api/orders/${orderId}/grading`, {
      token: tokens.consumer,
      body: { fpo_grade: 'A', fpo_weigh_kg: 10 },
    })).status,
    403,
    'consumers cannot grade either'
  );

  // Validation.
  const badGrade = await api('PATCH', `/api/orders/${orderId}/grading`, {
    token: tokens.fpo,
    body: { fpo_grade: 'D', fpo_weigh_kg: 10 },
  });
  assert.equal(badGrade.status, 400);
  assert.equal(badGrade.json.error.code, 'VALIDATION_ERROR');
  assert.equal(
    (await api('PATCH', `/api/orders/${orderId}/grading`, {
      token: tokens.fpo,
      body: { fpo_grade: 'A', fpo_weigh_kg: 0 },
    })).status,
    400,
    'weight must be positive'
  );
  assert.equal(
    (await api('PATCH', `/api/orders/${orderId}/grading`, { token: tokens.fpo, body: { fpo_grade: 'A' } })).status,
    400,
    'weight is required'
  );

  // Happy path — grade is normalised to upper case.
  const graded = await api('PATCH', `/api/orders/${orderId}/grading`, {
    token: tokens.fpo,
    body: { fpo_grade: 'b', fpo_weigh_kg: 12.5 },
  });
  assert.equal(graded.status, 200, JSON.stringify(graded.json));
  assert.equal(graded.json.data.fpo_grade, 'B');
  assert.equal(Number(graded.json.data.fpo_weigh_kg), 12.5);
  assert.ok(graded.json.data.fpo_graded_at, 'fpo_graded_at is stamped');
  assert.equal(graded.json.data.fpo_id, fpoId, 'lot is claimed by this FPO');

  // The values must survive a completely fresh read, not just the PATCH reply.
  const fresh = await api('GET', `/api/orders/${orderId}`, { token: tokens.fpo });
  assert.equal(fresh.status, 200, JSON.stringify(fresh.json));
  assert.equal(fresh.json.data.fpo_grade, 'B', 'grade survives a fresh GET');
  assert.equal(Number(fresh.json.data.fpo_weigh_kg), 12.5, 'weighment survives a fresh GET');
  assert.ok(fresh.json.data.fpo_graded_at, 'timestamp survives a fresh GET');

  // Graded lots leave the default queue but remain visible on request.
  const afterGrading = await api('GET', '/api/fpo/inbound', { token: tokens.fpo });
  assert.ok(!afterGrading.json.data.some((o) => o.id === orderId), 'graded lot left the open queue');
  const withGraded = await api('GET', '/api/fpo/inbound?include_graded=true', { token: tokens.fpo });
  assert.ok(withGraded.json.data.some((o) => o.id === orderId), 'include_graded returns it');

  // A different FPO may not re-grade or steal a claimed lot.
  const otherFpo = await api('POST', '/api/auth/register', {
    body: { name: 'Other FPO', phone: '9000007777', password: 'secret123', role: 'fpo' },
  });
  const steal = await api('PATCH', `/api/orders/${orderId}/grading`, {
    token: otherFpo.json.data.token,
    body: { fpo_grade: 'A', fpo_weigh_kg: 5 },
  });
  assert.equal(steal.status, 403);
  assert.equal(steal.json.error.code, 'FORBIDDEN');

  state.gradedOrderId = orderId;
});

test('fpo: grading is refused before the lot reaches the collection point', async () => {
  const created = await api('POST', '/api/orders', {
    token: tokens.consumer,
    body: { produce_id: state.produceId, quantity: 1, address: '12 Marina Road, Chennai' },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));

  const tooEarly = await api('PATCH', `/api/orders/${created.json.data.id}/grading`, {
    token: tokens.fpo,
    body: { fpo_grade: 'A', fpo_weigh_kg: 3 },
  });
  assert.equal(tooEarly.status, 409);
  assert.equal(tooEarly.json.error.code, 'STAGE_NOT_ALLOWED');
  assert.equal(tooEarly.json.error.details.required, 'atFarmerCity');
});

test('fpo: attaching a batch stamps the corridor columns on the order', async () => {
  const batch = await api('POST', '/api/fpo/batches', {
    token: tokens.fpo,
    body: {
      source_cluster: 'Nilgiris cluster',
      destination_hub: 'Thanjavur hub',
      consolidated_weight_kg: 12.5,
      vehicle_type: 'truck',
      orders_list: [state.gradedOrderId],
    },
  });
  assert.equal(batch.status, 201, JSON.stringify(batch.json));
  state.corridorBatchId = batch.json.data.id;

  const orders = await api('GET', '/api/orders', { token: tokens.fpo });
  const order = orders.json.data.find((o) => o.id === state.gradedOrderId);
  assert.ok(order, 'order is visible to the FPO');
  assert.equal(order.fpo_batch_id, state.corridorBatchId);
  assert.equal(order.fpo_corridor, 'Nilgiris cluster → Thanjavur hub');
  assert.equal(order.fpo_vehicle, 'truck');

  // The batch status patch must not wipe the corridor stamped above.
  const patched = await api('PATCH', `/api/fpo/batches/${state.corridorBatchId}`, {
    token: tokens.fpo,
    body: { transit_status: 'dispatched' },
  });
  assert.equal(patched.status, 200);
  const reread = await api('GET', `/api/orders/${state.gradedOrderId}`, { token: tokens.fpo });
  assert.equal(reread.json.data.fpo_corridor, 'Nilgiris cluster → Thanjavur hub');
});

test('fpo: EV agent assignment requires a received corridor shipment', async () => {
  const orderId = state.gradedOrderId;
  const assign = (agent) =>
    api('PATCH', `/api/orders/${orderId}/agent`, { token: tokens.fpo, body: { agent } });

  // Batch is still in transit → the doorstep handover must wait.
  const tooEarly = await assign('Kumar · EV-01');
  assert.equal(tooEarly.status, 409, JSON.stringify(tooEarly.json));
  assert.equal(tooEarly.json.error.code, 'BATCH_NOT_RECEIVED');

  // Role + payload guards.
  assert.equal(
    (await api('PATCH', `/api/orders/${orderId}/agent`, { token: tokens.consumer, body: { agent: 'x' } })).status,
    403,
    'consumers cannot assign agents'
  );
  assert.equal((await api('PATCH', `/api/orders/${orderId}/agent`, { token: tokens.fpo, body: {} })).status, 400);

  // Receive the shipment at the destination hub, then assign.
  const received = await api('PATCH', `/api/fpo/batches/${state.corridorBatchId}`, {
    token: tokens.fpo,
    body: { transit_status: 'received' },
  });
  assert.equal(received.status, 200);

  const assigned = await assign('Kumar · EV-01');
  assert.equal(assigned.status, 200, JSON.stringify(assigned.json));
  assert.equal(assigned.json.data.fpo_ev_agent, 'Kumar · EV-01');
  assert.ok(assigned.json.data.fpo_ev_assigned_at, 'fpo_ev_assigned_at is stamped');
  assert.equal(assigned.json.data.delivery_stage, 'outForDelivery', 'stage advanced in the same write');
});

test('fpo: an order with no corridor batch is dispatched directly', async () => {
  const orderId = await orderAtCollectionPoint();
  const graded = await api('PATCH', `/api/orders/${orderId}/grading`, {
    token: tokens.fpo,
    body: { fpo_grade: 'A', fpo_weigh_kg: 4 },
  });
  assert.equal(graded.status, 200, 'grading alone claims the order for the FPO');
  assert.equal(graded.json.data.fpo_batch_id, null, 'no corridor shipment attached');

  const assigned = await api('PATCH', `/api/orders/${orderId}/agent`, {
    token: tokens.fpo,
    body: { agent: 'Anitha · EV-02' },
  });
  assert.equal(assigned.status, 200, 'no receive step needed without a batch');
  assert.equal(assigned.json.data.delivery_stage, 'outForDelivery');
});

/* ============================== notifications ============================ */

/** Current user's notifications, newest first. */
async function myNotifications(token, query = '') {
  const r = await api('GET', '/api/notifications' + query, { token });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json.data;
}

test('notifications: workflow events notify the right people', async () => {
  const consumerId = (await api('GET', '/api/auth/me', { token: tokens.consumer })).json.data.id;
  const farmerId = (await api('GET', '/api/auth/me', { token: tokens.farmer })).json.data.id;
  const fpoId = (await api('GET', '/api/auth/me', { token: tokens.fpo })).json.data.id;

  // orderAtCollectionPoint() advances the order 3 times → the consumer should
  // have heard about every one of those stage moves.
  const orderId = await orderAtCollectionPoint();

  const consumerBefore = await myNotifications(tokens.consumer, '?limit=200');
  const stageAlerts = consumerBefore.items.filter((n) => n.order_id === orderId && n.type === 'order');
  assert.ok(stageAlerts.length >= 3, `consumer heard about each stage move (got ${stageAlerts.length})`);
  assert.ok(consumerBefore.unread > 0, 'unread count is reported');

  // Tier-1 grading completion → the farmer and consumer are told, the acting
  // FPO is not (it already knows — notifyOrderParticipants skips the actor).
  const graded = await api('PATCH', `/api/orders/${orderId}/grading`, {
    token: tokens.fpo,
    body: { fpo_grade: 'A', fpo_weigh_kg: 7 },
  });
  assert.equal(graded.status, 200, JSON.stringify(graded.json));

  const farmerData = await myNotifications(tokens.farmer, '?limit=200');
  const gradeAlerts = farmerData.items.filter((n) => n.order_id === orderId && n.type === 'grade');
  assert.equal(gradeAlerts.length, 1, 'farmer is told their lot was graded');
  assert.ok(gradeAlerts[0].message.includes('A'), 'message carries the grade');
  assert.ok(gradeAlerts[0].created_at, 'created_at is present');

  const fpoData = await myNotifications(tokens.fpo, '?limit=200');
  assert.equal(
    fpoData.items.filter((n) => n.type === 'grade' && n.order_id === orderId).length,
    0,
    'the acting FPO is not notified about its own grading'
  );

  // Batch dispatch + receive → everyone on the shipment is told.
  const batch = await api('POST', '/api/fpo/batches', {
    token: tokens.fpo,
    body: {
      source_cluster: 'Nilgiris cluster',
      destination_hub: 'Thanjavur hub',
      consolidated_weight_kg: 7,
      vehicle_type: 'truck',
      orders_list: [orderId],
    },
  });
  assert.equal(batch.status, 201, JSON.stringify(batch.json));
  state.notifyBatchId = batch.json.data.id;

  await api('PATCH', `/api/fpo/batches/${batch.json.data.id}`, {
    token: tokens.fpo,
    body: { transit_status: 'dispatched' },
  });
  let after = await myNotifications(tokens.consumer, '?limit=200');
  const dispatchAlerts = after.items.filter((n) => n.batch_id === batch.json.data.id);
  assert.equal(dispatchAlerts.length, 1, 'dispatch alert delivered to the consumer');
  assert.ok(dispatchAlerts[0].message.includes('dispatched'));

  await api('PATCH', `/api/fpo/batches/${batch.json.data.id}`, {
    token: tokens.fpo,
    body: { transit_status: 'dispatched' },
  });
  after = await myNotifications(tokens.consumer, '?limit=200');
  assert.equal(
    after.items.filter((n) => n.batch_id === batch.json.data.id).length,
    1,
    're-patching the same status does not spam the bell'
  );

  await api('PATCH', `/api/fpo/batches/${batch.json.data.id}`, {
    token: tokens.fpo,
    body: { transit_status: 'received' },
  });
  after = await myNotifications(tokens.consumer, '?limit=200');
  assert.equal(
    after.items.filter((n) => n.batch_id === batch.json.data.id).length,
    2,
    'receive alert delivered as well'
  );

  // EV assignment → consumer hears once more, again with the FPO excluded.
  const assigned = await api('PATCH', `/api/orders/${orderId}/agent`, {
    token: tokens.fpo,
    body: { agent: 'Kumar · EV-01' },
  });
  assert.equal(assigned.status, 200, JSON.stringify(assigned.json));
  after = await myNotifications(tokens.consumer, '?limit=200');
  const evAlerts = after.items.filter((n) => n.order_id === orderId && n.type === 'fpo');
  assert.ok(evAlerts.length >= 1, 'EV assignment alert delivered');
  assert.ok(evAlerts.some((n) => n.message.includes('Kumar')));

  // Sanity: everything written for this order belongs to a real user.
  assert.ok(consumerId && farmerId && fpoId);
});

test('notifications: list, mark read, and cross-user isolation', async () => {
  const consumerId = (await api('GET', '/api/auth/me', { token: tokens.consumer })).json.data.id;
  const farmerId = (await api('GET', '/api/auth/me', { token: tokens.farmer })).json.data.id;

  const list = await myNotifications(tokens.consumer, '?limit=5');
  assert.ok(Array.isArray(list.items), 'items is an array');
  assert.equal(typeof list.unread, 'number');
  assert.equal(typeof list.total, 'number');
  assert.ok(list.items.length > 0, 'the consumer has notifications from the previous test');
  assert.ok(
    list.items.every((n) => n.user_id === consumerId),
    'a user only ever sees their own notifications'
  );
  assert.ok(list.items.every((n) => typeof n.is_read === 'boolean'));

  // Another user's notifications are not readable either.
  const farmerData = await myNotifications(tokens.farmer, '?limit=5');
  assert.ok(
    farmerData.items.every((n) => n.user_id === farmerId),
    'the farmer only sees their own'
  );
  assert.ok(
    !farmerData.items.some((n) => list.items.some((mine) => mine.id === n.id)),
    'the two lists share no notification ids'
  );

  // Mark one read.
  const target = list.items.find((n) => !n.is_read);
  assert.ok(target, 'there is an unread notification to exercise');

  const read = await api('PATCH', `/api/notifications/${target.id}/read`, {
    token: tokens.consumer,
  });
  assert.equal(read.status, 200, JSON.stringify(read.json));
  assert.equal(read.json.data.is_read, true, 'marked as read');
  assert.equal(read.json.data.id, target.id);

  // …and it survives a fresh GET, having left the unread-only view.
  const unreadOnly = await myNotifications(tokens.consumer, '?unread_only=true&limit=200');
  assert.ok(
    !unreadOnly.items.some((n) => n.id === target.id),
    'read notifications leave the unread-only view'
  );

  // Another user cannot mark my notification as read (404, existence hidden).
  const foreign = await api('PATCH', `/api/notifications/${target.id}/read`, {
    token: tokens.farmer,
  });
  assert.equal(foreign.status, 404);
  assert.equal(foreign.json.error.code, 'NOT_FOUND');

  // A made-up id is a 404 too, not a 500.
  const missing = await api('PATCH', '/api/notifications/999999/read', {
    token: tokens.consumer,
  });
  assert.equal(missing.status, 404);

  // And it is rejected without a token at all.
  assert.equal((await api('GET', '/api/notifications')).status, 401);
  assert.equal((await api('PATCH', `/api/notifications/${target.id}/read`)).status, 401);
});

test('unauthenticated write endpoints are rejected', async () => {
  assert.equal((await api('POST', '/api/produce', { body: { category: 'x', name: 'y', price: 1 } })).status, 401);
  assert.equal((await api('POST', '/api/orders', { body: { produce_id: 1, quantity: 1, address: 'x' } })).status, 401);
  assert.equal((await api('POST', '/api/fpo/batches', { body: { source_cluster: 'a', destination_hub: 'b' } })).status, 401);
});
