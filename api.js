/* ============================================================================
 * UZHAVAN DIRECT — BACKEND API LAYER
 * ----------------------------------------------------------------------------
 * This file is the ONLY place in the front-end that talks to the
 * Express + PostgreSQL API in `server/`. Everything else in app.js keeps
 * reading and writing the same `store` (localStorage) shapes it always has,
 * so no existing view had to be rewritten.
 *
 * How it works (the "API-first, localStorage-fallback" model):
 *
 *   1. On boot we probe GET /api/health.
 *        • reachable  → data is fetched from the API and MIRRORED into the
 *                       same localStorage keys the app already uses.
 *        • unreachable → the app behaves exactly as it did before, purely
 *                       offline on localStorage. Nothing breaks.
 *
 *   2. Every write (listing, bid, order, batch, delivery stage) is tried
 *      against the API first when the record exists on the backend.
 *      Seeded/demo records that were never sent to the backend keep using
 *      localStorage, so the demo stays 100% clickable.
 *
 *   3. A JWT is kept in localStorage under `ud_api_token` and attached to
 *      every authenticated request as `Authorization: Bearer <token>`.
 *
 * Loaded BEFORE app.js in index.html so app.js can use `api.*`.
 * ========================================================================== */

/* ------------------------------------------------------------------ config */

/** Base URL of the backend. Override with ?api=http://host:port or
 *  localStorage.setItem('ud_api_base', '…') — handy for demos on another box. */
const API_BASE = (() => {
  try {
    const fromQuery = new URLSearchParams(location.search).get('api');
    if (fromQuery) { localStorage.setItem('ud_api_base', fromQuery); return fromQuery.replace(/\/$/, ''); }
    return (localStorage.getItem('ud_api_base') || 'http://localhost:3000').replace(/\/$/, '');
  } catch (_) {
    return 'http://localhost:3000';
  }
})();

const API_ENABLED = true;          // master switch — set false to force offline mode
const API_TIMEOUT_MS = 8000;       // per-request timeout
const API_PROBE_TIMEOUT_MS = 3500; // health check gets a shorter leash
const API_PROBE_CACHE_MS = 15000;  // don't re-probe more often than this

/* -------------------------------------------------------------------- state */

let apiToken = localStorage.getItem('ud_api_token') || null; // saved JWT
let apiOnline = null;        // null = unknown, true/false after a probe
let apiLastProbe = 0;        // timestamp of the last probe
let apiSessionExpired = false; // stops repeated "session expired" toasts

/* --------------------------------------------------- request / response core */

/** Build a `?a=1&b=2` query string, skipping empty values. */
function apiQuery(params) {
  if (!params) return '';
  const usable = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!usable.length) return '';
  return '?' + usable.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

/**
 * One reusable fetch() wrapper for the whole app.
 *
 * Never throws — always resolves to one of:
 *   { ok: true,  status, data }                      // envelope.success === true
 *   { ok: false, status, error: { code, message, details } }
 *
 * error.code is 'NETWORK_ERROR' when the backend simply isn't reachable,
 * which is how the rest of the app detects "we're offline, use localStorage".
 */
async function apiRequest(method, path, options = {}) {
  const { body, auth = true, timeout = API_TIMEOUT_MS } = options;

  if (!API_ENABLED) {
    return { ok: false, status: 0, error: { code: 'API_DISABLED', message: 'API layer disabled' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && apiToken) headers.Authorization = 'Bearer ' + apiToken;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    // AbortError / TypeError("Failed to fetch") — backend down, wrong URL, or
    // blocked by the browser. Treat all of them as "API unavailable".
    clearTimeout(timer);
    apiOnline = false;
    apiRenderStatus();
    return {
      ok: false,
      status: 0,
      error: {
        code: err && err.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: err && err.name === 'AbortError'
          ? 'The server took too long to respond.'
          : 'Cannot reach the Uzhavan Direct API.',
      },
    };
  }
  clearTimeout(timer);

  // A successful round-trip means the API is alive.
  if (apiOnline !== true) { apiOnline = true; apiRenderStatus(); }

  let payload = null;
  try { payload = await res.json(); } catch (_) { payload = null; }

  if (res.ok && payload && payload.success === true) {
    return { ok: true, status: res.status, data: payload.data, message: payload.message };
  }

  const error = (payload && payload.error) || {};
  const result = {
    ok: false,
    status: res.status,
    error: {
      code: error.code || (res.ok ? 'UNEXPECTED_RESPONSE' : 'HTTP_' + res.status),
      message: error.message || 'Request failed.',
      details: error.details,
    },
  };

  // Expired / invalid JWT: drop the session once and send the user back to login.
  if (res.status === 401 && auth && apiToken) apiHandleExpiredSession(result.error);
  return result;
}

/** Turn any API error object into one sentence a farmer or judge can read. */
function apiErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  const byCode = {
    NETWORK_ERROR: 'Backend offline — showing the local demo data.',
    TIMEOUT: 'The server is taking too long. Try again.',
    API_DISABLED: 'Backend connection is switched off in this build.',
    DB_UNAVAILABLE: 'The database is unavailable. Please retry shortly.',
    INVALID_CREDENTIALS: 'Invalid phone number or password.',
    INVALID_TOKEN: 'Your session has expired — please log in again.',
    UNAUTHENTICATED: 'Please log in to continue.',
    FORBIDDEN: 'Your role is not allowed to do that.',
    VALIDATION_ERROR: error.details && error.details.missing
      ? 'Missing fields: ' + error.details.missing.join(', ')
      : 'Some details are invalid. Please check the form.',
    PHONE_TAKEN: 'That phone number is already registered.',
    NOT_FOUND: 'That record no longer exists on the server.',
    OUT_OF_STOCK: 'Not enough stock available for that quantity.',
    BID_TOO_LOW: 'Your bid must be higher than the current bid.',
    AUCTION_CLOSED: 'This auction has already ended.',
    STAGE_NOT_ALLOWED: 'Your role cannot move the order to that stage.',
    STAGE_REGRESSION: 'Delivery stages cannot move backwards.',
    ORDERS_NOT_ATTACHABLE: 'Some orders belong to another FPO organisation.',
    BATCH_NOT_RECEIVED: 'Receive the corridor shipment at the hub before assigning a doorstep agent.',
    RATE_LIMITED: 'Too many requests — please slow down.',
    AUTH_RATE_LIMITED: 'Too many login attempts — please wait a minute.',
    OTP_EXPIRED: 'That OTP expired — request a new one.',
    OTP_INVALID: 'Incorrect OTP.',
  };
  return byCode[error.code] || error.message || 'Something went wrong.';
}

/** Convenience: toast an API failure and log the raw error for debugging. */
function apiToastError(error, context) {
  console.warn('[api]', context || '', error);
  toast('⚠️ ' + apiErrorMessage(error));
}

/* -------------------------------------------------------------- session mgmt */

/** Save the JWT + user returned by /api/auth/login or /api/auth/register. */
function apiSetSession(token, user) {
  apiToken = token || null;
  apiSessionExpired = false;
  if (token) localStorage.setItem('ud_api_token', token);
  return user;
}

/** Forget the session (used by logout and by expired-token handling). */
function apiClearSession() {
  apiToken = null;
  apiSessionExpired = false;
  localStorage.removeItem('ud_api_token');
}

function apiHandleExpiredSession(error) {
  apiClearSession();
  if (apiSessionExpired) return;   // only nag once per expiry
  apiSessionExpired = true;
  apiRenderStatus();
  toast('🔒 ' + apiErrorMessage(error));
  if (typeof showLoginScreen === 'function') showLoginScreen();
}

/* ------------------------------------------------------------------ probe */

/** Is the backend up? Cached for API_PROBE_CACHE_MS so boot stays fast. */
async function apiProbe(force) {
  if (!API_ENABLED) { apiOnline = false; apiRenderStatus(); return false; }
  const fresh = apiOnline !== null && Date.now() - apiLastProbe < API_PROBE_CACHE_MS;
  if (!force && fresh) return apiOnline;

  const res = await apiRequest('GET', '/api/health', { auth: false, timeout: API_PROBE_TIMEOUT_MS });
  apiLastProbe = Date.now();
  apiOnline = res.ok === true;
  apiRenderStatus();
  return apiOnline;
}

/* --------------------------------------------------------------- typed facade */

/** Thin, readable wrapper over apiRequest(). One entry per backend endpoint. */
const api = {
  base: API_BASE,
  health:      ()               => apiRequest('GET',  '/api/health', { auth: false }),

  auth: {
    login:      (phone, password) => apiRequest('POST', '/api/auth/login',    { auth: false, body: { phone, password } }),
    register:   (payload)         => apiRequest('POST', '/api/auth/register', { auth: false, body: payload }),
    me:         ()                => apiRequest('GET',  '/api/auth/me'),
    requestOtp: (phone)           => apiRequest('POST', '/api/auth/request-otp', { auth: false, body: { phone } }),
    verifyOtp:  (phone, code)     => apiRequest('POST', '/api/auth/verify-otp',  { auth: false, body: { phone, code } }),
  },

  produce: {
    list:   (params)          => apiRequest('GET',  '/api/produce' + apiQuery(params), { auth: false }),
    get:    (id)              => apiRequest('GET',  '/api/produce/' + id, { auth: false }),
    create: (payload)         => apiRequest('POST', '/api/produce', { body: payload }),
    update: (id, payload)     => apiRequest('PUT',  '/api/produce/' + id, { body: payload }),
  },

  auctions: {
    list:   (params)          => apiRequest('GET',  '/api/auctions' + apiQuery(params), { auth: false }),
    get:    (id)              => apiRequest('GET',  '/api/auctions/' + id, { auth: false }),
    create: (payload)         => apiRequest('POST', '/api/auctions', { body: payload }),
    bid:    (id, amount)      => apiRequest('POST', '/api/auctions/' + id + '/bid', { body: { amount } }),
  },

  orders: {
    list:      (params)       => apiRequest('GET',   '/api/orders' + apiQuery(params)),
    get:       (id)           => apiRequest('GET',   '/api/orders/' + id),
    create:    (payload)      => apiRequest('POST',  '/api/orders', { body: payload }),
    setStatus: (id, status)   => apiRequest('PATCH', '/api/orders/' + id, { body: { status } }),
    setStage:  (id, stage)    => apiRequest('PATCH', '/api/orders/' + id + '/stage',
                                            { body: { delivery_stage: toApiStage(stage) } }),
    // Tier-1: record the digital weighment + AGMARK grade (also claims the lot).
    setGrading: (id, grade, weighKg) => apiRequest('PATCH', '/api/orders/' + id + '/grading',
                                            { body: { fpo_grade: grade, fpo_weigh_kg: weighKg } }),
    // Tier-3: record the EV doorstep agent AND advance to outForDelivery atomically.
    assignAgent: (id, agent)  => apiRequest('PATCH', '/api/orders/' + id + '/agent', { body: { agent } }),
  },

  fpo: {
    /** Tier-1 work queue: lots at the collection point awaiting grading. */
    inbound:      (params)    => apiRequest('GET',   '/api/fpo/inbound' + apiQuery(params)),
    listBatches:  ()          => apiRequest('GET',   '/api/fpo/batches'),
    getBatch:     (id)        => apiRequest('GET',   '/api/fpo/batches/' + id),
    createBatch:  (payload)   => apiRequest('POST',  '/api/fpo/batches', { body: payload }),
    updateBatch:  (id, patch) => apiRequest('PATCH', '/api/fpo/batches/' + id, { body: patch }),
  },
};

/* ============================================================================
 * DELIVERY-STAGE COMPATIBILITY MAPPING
 * ----------------------------------------------------------------------------
 * The front-end tracks 8 steps; the backend models 7. The only difference is
 * `atCustomerCity`, an extra front-end step that sits between arriving in the
 * destination city and arriving at the FPO hub.
 *
 *   front-end: placed → confirmed → packed → atFarmerCity → atCustomerCity
 *              → atFpo → outForDelivery → delivered
 *   backend:   placed → confirmed → packed → atFarmerCity
 *              → atFpo → outForDelivery → delivered
 *
 * Mapping rules (one place, both directions):
 *   • front-end → backend: `atCustomerCity` collapses to `atFpo`. Both mean
 *     "the goods have reached the destination" and the backend's FPO band
 *     starts at `atFpo`, so nothing is lost and no step is skipped illegally.
 *   • backend → front-end: identity. Every backend stage already exists in the
 *     front-end list, so the UI keeps its full 8-step timeline.
 *
 * The front-end's own FPO dispatch already jumps over `atCustomerCity` (see
 * dispatchFpoBatch in app.js), so in practice the two stay in lock-step.
 * ========================================================================== */

/** The backend's 7-stage pipeline (mirrors server/src/lib/http.js). */
const API_STAGES = ['placed', 'confirmed', 'packed', 'atFarmerCity', 'atFpo', 'outForDelivery', 'delivered'];

/** front-end stage → backend stage. */
function toApiStage(stage) {
  if (stage === 'atCustomerCity') return 'atFpo';
  return API_STAGES.includes(stage) ? stage : 'placed';
}

/** backend stage → front-end stage. */
function fromApiStage(stage) {
  return DELIVERY_STAGES.includes(stage) ? stage : 'placed';
}

/** Backend transit_status ↔ the front-end's batch status words. */
const API_BATCH_STATUS = { loading: 'assembling', assembling: 'assembling', dispatched: 'dispatched', received: 'received', delivered: 'received' };
function toApiBatchStatus(status) { return status === 'assembling' ? 'assembling' : status === 'dispatched' ? 'dispatched' : 'received'; }
function fromApiBatchStatus(status) { return API_BATCH_STATUS[status] || 'assembling'; }

/* ============================================================================
 * MIRRORING — backend rows ➜ the localStorage shapes app.js already renders
 * ----------------------------------------------------------------------------
 * The API uses numeric ids; the demo data uses strings like 'p1' / 'o1'.
 * Mirrored records get an `apiId` field and a prefixed id ('api_p7'), so both
 * worlds coexist in the same arrays and every existing view keeps working.
 * ========================================================================== */

/** Backend requires a 6-character minimum; demo passwords are 3. */
function apiPasswordFor(password) {
  const pw = String(password || '');
  return pw.length >= 6 ? pw : 'ud-' + pw + '-demo';
}

/** Local storage key for an API user, e.g. 12 → 'api_u12'. */
function apiUserKey(id) { return 'api_u' + id; }

/** Find the localStorage username linked to a backend user id. */
function apiUsernameForId(id) {
  if (id === null || id === undefined) return undefined;
  const users = store.users() || {};
  const hit = Object.keys(users).find(k => users[k] && Number(users[k].apiId) === Number(id));
  return hit || apiUserKey(id);
}

/** Local username (a key in ud_users) for the currently logged-in account. */
function apiLocalUser() { return currentUser ? (store.users() || {})[currentUser] : null; }

/** Backend id of the logged-in account, or null when running offline. */
function apiUserId() {
  const me = apiLocalUser();
  return me && me.apiId ? Number(me.apiId) : null;
}

/**
 * Upsert a backend user into `ud_users` and return the localStorage key to use
 * as `currentUser`. Preference order:
 *   1. a record already linked to this backend id   (re-login)
 *   2. a record with the same phone number          (seeded demo accounts)
 *   3. a new 'api_u<id>' record                     (brand-new backend signup)
 *
 * Reusing the existing demo username matters: seeded orders/produce reference
 * farmers by username ('karthik_farms'), so keeping the same key means every
 * existing filter keeps matching after the switch to API data.
 */
function apiMirrorUser(apiUser) {
  const users = store.users() || {};
  let uname = Object.keys(users).find(k => users[k] && Number(users[k].apiId) === Number(apiUser.id));
  if (!uname) {
    uname = Object.keys(users).find(k => users[k] && users[k].phone && String(users[k].phone) === String(apiUser.phone));
  }
  if (!uname) uname = apiUserKey(apiUser.id);

  const existing = users[uname] || {};
  const merged = {
    ...existing,
    apiId: Number(apiUser.id),
    type: apiUser.role || existing.type,
    name: apiUser.name || existing.name,
    phone: apiUser.phone || existing.phone,
    password: existing.password,                       // never overwrite the local demo password
    village: apiUser.village || existing.village,
    city: apiUser.village || existing.city,
    address: apiUser.address || existing.address,
    bio: apiUser.bio || existing.bio,
    followers: existing.followers || [],
    donations: existing.donations || [],
    notifications: existing.notifications || [],
  };
  if (merged.type === 'consumer') merged.following = existing.following || [];
  if (merged.type === 'fpo') {
    merged.cluster = existing.cluster || 'New cluster';
    merged.hub = existing.hub || 'New hub';
  }
  users[uname] = merged;
  store.saveUsers(users);
  return uname;
}

/**
 * Resolve the local username for a farmer referenced by an API row.
 * Links by id, then by name (seeded demo farmers), then creates a stub so
 * names and avatars still render for farmers we have never logged in as.
 */
function apiUsernameForFarmer(row) {
  const byId = apiUsernameForId(row.farmer_id);
  const users = store.users() || {};
  if (users[byId]) return byId;

  if (row.farmer_name) {
    const byName = Object.keys(users).find(
      k => users[k] && users[k].type === 'farmer' && users[k].name === row.farmer_name
    );
    if (byName) { users[byName].apiId = Number(row.farmer_id); store.saveUsers(users); return byName; }
  }

  const stub = apiUserKey(row.farmer_id);
  users[stub] = {
    type: 'farmer',
    apiId: Number(row.farmer_id),
    name: row.farmer_name || 'Farmer #' + row.farmer_id,
    followers: [], donations: [], notifications: [],
  };
  store.saveUsers(users);
  return stub;
}

/* ------------------------------- normalisers ------------------------------ */

/** API produce row → the shape produceCardEl()/renderSellItem() expect. */
function produceFromApi(row) {
  const name = row.name;
  return {
    id: 'api_p' + row.id,
    apiId: Number(row.id),
    farmer: apiUsernameForFarmer({ farmer_id: row.farmer_id, farmer_name: row.farmer_name }),
    name,
    category: row.category,
    qty: Number(row.quantity),
    unit: row.unit,
    price: Number(row.price),
    image: row.image_url || PRODUCT_PHOTOS[name] || '',
    icon: iconFor(name, row.category),
    perish: row.perishability || guessPerishability(name, row.category),
    sold: !!row.is_sold,
    location: row.location || '',
  };
}

/** API order row → the front-end order object (same field names as the seed). */
function orderFromApi(row) {
  const address = row.address || '';
  return {
    id: 'api_o' + row.id,
    apiId: Number(row.id),
    farmer: apiUsernameForId(row.farmer_id),
    consumer: row.consumer_name || 'Consumer',
    produceId: row.produce_id ? 'api_p' + row.produce_id : undefined,
    item: row.produce_name || 'Order',
    qty: Number(row.quantity),
    unit: row.unit,
    price: Number(row.total_price),
    city: cityFromAddress(address),
    address,
    status: row.status,
    date: String(row.created_at || '').slice(0, 10),
    // The backend's 7 stages map straight onto the front-end's 8.
    deliveryStage: fromApiStage(row.delivery_stage),
    // delivery_timing doubles as the consumer's chosen slot (see the tracking modal).
    fpoDeliveryTiming: row.delivery_timing
      ? { label: row.delivery_timing, type: 'custom', value: '' }
      : undefined,
    image: row.image_url || undefined,
    // Backend ids we need for later writes.
    apiFarmerId: row.farmer_id || null,
    apiFpoId: row.fpo_id || null,

    // ---- FPO tier lifecycle (mirrors the orders columns added server-side) ----
    // Tier-1 collection: AGMARK grade + digital weighment.
    fpoGrade: row.fpo_grade || undefined,
    fpoWeighKg: row.fpo_weigh_kg === null || row.fpo_weigh_kg === undefined
      ? undefined : Number(row.fpo_weigh_kg),
    fpoGradedAt: row.fpo_graded_at || undefined,
    // Tier-2 corridor: which shipment carried it (mapped to the LOCAL batch id
    // so the Tier-3 "receive first" guard keeps matching locally).
    fpoBatchId: row.fpo_batch_id ? apiLocalBatchId(row.fpo_batch_id) : undefined,
    fpoCorridor: row.fpo_corridor || undefined,
    fpoVehicle: row.fpo_vehicle || undefined,
    // Tier-3 last mile: the EV doorstep agent on the parcel.
    fpoEvAgent: row.fpo_ev_agent || undefined,
    fpoEvAssignedAt: row.fpo_ev_assigned_at || undefined,
    // `o.fpo` is compared against currentUser throughout the FPO views.
    fpo: row.fpo_id ? apiUsernameForId(row.fpo_id) : undefined,
  };
}

/**
 * Translate a backend batch id into the id the local batch row uses.
 * A batch assembled in the browser is saved as 'fb<timestamp>' locally and
 * then registered with the server, so the two ids differ; prefer the local one
 * so `store.fpoBatches().find(b => b.id === order.fpoBatchId)` keeps working.
 */
function apiLocalBatchId(apiBatchId) {
  const local = (store.fpoBatches() || []).find(b => Number(b.apiId) === Number(apiBatchId));
  return local ? local.id : 'api_fb' + apiBatchId;
}

/** API auction row → the shape renderAuctionList() already renders. */
function auctionFromApi(row) {
  return {
    id: 'api_a' + row.id,
    apiId: Number(row.id),
    produceApiId: Number(row.produce_id),
    farmer: apiUsernameForFarmer({ farmer_id: row.farmer_id, farmer_name: row.farmer_name }),
    item: row.produce_name,
    image: row.image_url || PRODUCT_PHOTOS[row.produce_name] || '',
    icon: iconFor(row.produce_name, row.category),
    baseRate: Number(row.base_rate),
    unit: row.unit,
    qty: Number(row.quantity),
    highestBid: row.highest_bid === null || row.highest_bid === undefined ? Number(row.base_rate) : Number(row.highest_bid),
    highestBidder: row.highest_bidder_name || null,
    endsAt: new Date(row.ends_at).getTime(),
    sold: !!row.is_closed,
  };
}

/** API batch row → the shape the FPO Tier-2/Tier-3 views render. */
function batchFromApi(row) {
  const source = row.source_cluster;
  const hub = row.destination_hub;
  return {
    id: 'api_fb' + row.id,
    apiId: Number(row.id),
    fpo: apiUsernameForId(row.fpo_id),
    sourceCluster: source,
    destinationHub: hub,
    corridor: source + ' → ' + hub,
    vehicle: row.vehicle_type || 'truck',
    // orders_list holds backend order ids — prefix them so they match mirrored orders.
    orderIds: (row.orders_list || []).map(n => 'api_o' + n),
    weightKg: Number(row.consolidated_weight_kg),
    status: fromApiBatchStatus(row.transit_status),
    createdAt: row.created_at,
    dispatchedAt: row.transit_status === 'dispatched' ? row.created_at : undefined,
    receivedAt: row.transit_status === 'received' ? row.created_at : undefined,
  };
}

/* --------------------------------- merging -------------------------------- */

/**
 * Merge normalised API records into a localStorage array, matching on `id`.
 * Existing records are refreshed in place (no duplicates); new ones are added.
 */
function apiMergeInto(storageKey, incoming) {
  const list = store.get(storageKey) || [];
  const byId = new Map(list.map(r => [r.id, r]));
  const byApiId = new Map();
  list.forEach(r => { if (r.apiId) byApiId.set(Number(r.apiId), r); });

  let added = 0, updated = 0;
  incoming.forEach(record => {
    // Match on apiId FIRST. A record can be created locally and registered with
    // the backend straight after (an FPO batch is the clear example: the local
    // row keeps id 'fb…' while the server knows it as id 4), so matching on `id`
    // alone would show the same shipment twice.
    const existing = (record.apiId && byApiId.get(Number(record.apiId))) || byId.get(record.id);
    if (existing) {
      const localId = existing.id;                 // keep the id the UI already uses
      Object.assign(existing, record, { id: localId });
      if (existing.apiId) byApiId.set(Number(existing.apiId), existing);
      updated++;
    } else {
      list.push(record);
      byId.set(record.id, record);
      if (record.apiId) byApiId.set(Number(record.apiId), record);
      added++;
    }
  });
  store.set(storageKey, list);
  return { added, updated };
}

/* ------------------------------------------------------------------ syncing */

/**
 * Pull everything this role is allowed to see and mirror it locally, then
 * redraw. Called after login and whenever the user asks to reconnect.
 * Any failure is swallowed — the local demo data stays on screen.
 */
async function apiSyncAll(options = {}) {
  if (!API_ENABLED || !(await apiProbe())) return { ok: false, offline: true };

  const summary = { ok: true, offline: false, produce: 0, auctions: 0, orders: 0, batches: 0 };

  // Public endpoints — the marketplace should always reflect the backend.
  const produce = await api.produce.list({ limit: 200 });
  if (produce.ok) summary.produce = apiMergeInto('ud_produce', produce.data.map(produceFromApi)).added;

  const auctions = await api.auctions.list();
  if (auctions.ok) summary.auctions = apiMergeInto('ud_auctions', auctions.data.map(auctionFromApi)).added;

  // Role-scoped endpoints need a token.
  if (apiToken && currentUser) {
    const orders = await api.orders.list();
    if (orders.ok) summary.orders = apiMergeInto('ud_orders', orders.data.map(orderFromApi)).added;

    if (currentRole === 'fpo') {
      // Tier-1 queue: lots at the collection point that are unclaimed or ours.
      // GET /api/orders only returns orders already assigned to this FPO, so
      // without this the FPO would never see a new lot to grade.
      const inbound = await api.fpo.inbound({ include_graded: 'true' });
      if (inbound.ok) summary.inbound = apiMergeInto('ud_orders', inbound.data.map(orderFromApi)).added;

      const batches = await api.fpo.listBatches();
      if (batches.ok) summary.batches = apiMergeInto('ud_fpo_batches', batches.data.map(batchFromApi)).added;
    }
  }

  apiRenderStatus();
  if (options.rerender !== false && typeof renderView === 'function') {
    renderView(currentView);
    if (currentRole === 'consumer') refreshCartViews();
  }
  return summary;
}

/* ------------------------------------------------------------------ status chip */

/** Small topbar pill that makes the backend connection visible during a demo. */
function apiRenderStatus() {
  const chip = document.getElementById('apiStatusChip');
  if (!chip) return;
  const on = apiOnline === true;
  chip.classList.toggle('online', on);
  chip.classList.toggle('offline', apiOnline === false);
  chip.textContent = on ? '🟢 API' : '⚪ Demo';
  chip.title = on
    ? 'Connected to ' + API_BASE + ' — data is served by the backend'
    : 'Backend unreachable at ' + API_BASE + ' — running on local demo data. Click to retry.';
}

/** Click handler: re-probe and resync, with plain-language feedback. */
async function apiStatusChipClicked() {
  const chip = document.getElementById('apiStatusChip');
  if (chip) chip.textContent = '⏳ …';
  const online = await apiProbe(true);
  if (!online) { apiRenderStatus(); toast('⚠️ Backend offline at ' + API_BASE + ' — using local demo data.'); return; }
  const summary = await apiSyncAll();
  apiRenderStatus();
  toast(`✅ Connected to ${API_BASE}` +
    (summary.orders || summary.produce ? ` · synced ${summary.produce} listings, ${summary.orders} orders` : ''));
}

/* ------------------------------------------------------------------ boot hook */

/**
 * Called (without await) from boot(). Probes the API, refreshes the JWT's
 * user via /api/auth/me, pulls data, then re-renders. Never blocks or breaks
 * the offline experience.
 */
async function apiBoot() {
  if (!API_ENABLED) { apiOnline = false; apiRenderStatus(); return; }

  // A saved token from a previous visit should be validated before we trust it.
  if (apiToken && currentUser) {
    const me = await api.auth.me();
    if (me.ok) {
      const uname = apiMirrorUser(me.data);
      if (uname !== currentUser) currentUser = uname;
    } else if (me.error && (me.error.code === 'INVALID_TOKEN' || me.error.code === 'UNAUTHENTICATED')) {
      apiHandleExpiredSession(me.error);   // 401 → clear session, back to login
      return;
    }
  }

  await apiSyncAll();
  apiRenderStatus();
}

/* ============================================================================
 * WRITE-THROUGH HELPERS
 * ----------------------------------------------------------------------------
 * One small function per action app.js performs. Each one:
 *   • uses the backend when the record exists there and the user is signed in,
 *   • mirrors the backend's answer into localStorage so the existing views
 *     re-render with real server data,
 *   • quietly falls back to the local demo path when the API is offline.
 *
 * app.js only had to gain a single call in each action — no view was rewritten.
 * ========================================================================== */

/* ------------------------------------------------------------------- login */

/**
 * API-FIRST LOGIN.
 * Returns true when it fully handled the attempt (signed in, or a definitive
 * rejection was shown), false when app.js should fall back to its original
 * localStorage-only demo login.
 */
async function loginViaApi(identifier, password) {
  if (!API_ENABLED) return false;
  if (!(await apiProbe())) return false;            // backend down → local demo

  const users = store.users() || {};
  // Resolve "username or phone" to a local record we might know.
  let uname = null;
  if (String(identifier).toLowerCase() === 'john') uname = DEMO_LOGIN_USERS[selectedRole];
  else if (users[identifier]) uname = identifier;
  else if (/^\+?\d{7,15}$/.test(identifier)) {
    uname = Object.keys(users).find(k => users[k] && String(users[k].phone) === String(identifier)) || null;
  }

  const local = uname ? users[uname] : null;
  const phone = (local && local.phone) || (/^\+?\d{7,15}$/.test(identifier) ? identifier : null);
  if (!phone) return false;                         // nothing the backend could match

  // Demo passwords are shorter than the API's 6-character minimum, so pad them
  // deterministically for BOTH register and login.
  const apiPassword = local ? apiPasswordFor(local.password) : String(password);

  let res = local ? await api.auth.login(phone, apiPassword)
                  : { ok: false, error: { code: 'INVALID_CREDENTIALS' } };

  // First time a seeded demo account talks to the backend → create it, then log in.
  if (!res.ok && local && res.error && res.error.code === 'INVALID_CREDENTIALS') {
    const reg = await api.auth.register({
      name: local.name, phone, password: apiPassword, role: local.type,
      village: local.village || local.city, address: local.address, bio: local.bio,
    });
    res = reg.ok ? reg : await api.auth.login(phone, apiPassword);
  }

  if (!res.ok) {
    // Any failure (offline mid-request, rate limit, wrong password) falls through
    // to the local check so the offline demo can never lock anyone out.
    if (res.error && (res.error.code === 'NETWORK_ERROR' || res.error.code === 'TIMEOUT')) return false;
    console.warn('[api] login rejected by backend:', res.error);
    return false;
  }

  if (res.data.user.role !== selectedRole) {
    toast(`❌ This account is registered as ${res.data.user.role}, not ${selectedRole}.`);
    return true;
  }

  apiSetSession(res.data.token, res.data.user);
  const username = apiMirrorUser(res.data.user);
  toast(`👋 Signed in via backend as ${res.data.user.name}`);
  loginAs(username);
  return true;
}

/** Fire-and-forget: make a newly signed-up account exist on the backend too. */
async function registerOnBackend(account) {
  if (!API_ENABLED) return;
  if (!(await apiProbe())) return;
  const res = await api.auth.register({
    name: account.name, phone: account.phone, password: apiPasswordFor(account.pass), role: account.role,
  });
  if (!res.ok && res.error && res.error.code !== 'PHONE_TAKEN') {
    console.warn('[api] signup not mirrored to backend:', res.error);
  }
  // Best-effort OTP handshake so the backend account is marked verified.
  if (res.ok) {
    const otp = await api.auth.requestOtp(account.phone);
    if (otp.ok && otp.data && otp.data.devOtp) await api.auth.verifyOtp(account.phone, otp.data.devOtp);
  }
}

/* ----------------------------------------------------------------- produce */

/**
 * Create a listing. API-first when the farmer is signed in against the backend;
 * always falls back to a local listing so the demo keeps working.
 * Returns true when the backend accepted it.
 */
async function addProduceListing(fields) {
  const me = getUser(currentUser);

  if (API_ENABLED && apiToken && (await apiProbe())) {
    const res = await api.produce.create({
      name: fields.name,
      category: fields.category,
      price: fields.price,
      quantity: fields.qty,
      unit: fields.unit,
      perishability: guessPerishability(fields.name, fields.category),
      image_url: fields.image || '',
      location: (me && (me.village || me.city)) || '',
    });
    if (res.ok) {
      // Mirror the backend row (it carries the real numeric id we need later).
      apiMergeInto('ud_produce', [produceFromApi({
        ...res.data,
        farmer_id: apiUserId(),
        farmer_name: me ? me.name : undefined,
      })]);
      return true;
    }
    apiToastError(res.error, 'create produce');
  }

  // Local-only listing (backend offline or rejected the write).
  const produce = store.produce();
  produce.push({
    id: 'p' + Date.now(), farmer: currentUser, name: fields.name, category: fields.category,
    qty: fields.qty, unit: fields.unit, price: fields.price, image: fields.image,
    icon: iconFor(fields.name, fields.category),
    perish: guessPerishability(fields.name, fields.category), sold: false,
  });
  store.saveProduce(produce);
  return false;
}

/* ---------------------------------------------------------------- auctions */

/** Open an auction. Backend auctions need a backend produce row. */
async function startAuctionListing(produce, baseRate, qty, hours) {
  const endsAt = Date.now() + hours * 3600 * 1000;

  if (API_ENABLED && apiToken && produce.apiId && (await apiProbe())) {
    const res = await api.auctions.create({
      produce_id: produce.apiId,
      base_rate: baseRate,
      quantity: qty,
      unit: produce.unit,
      ends_at: new Date(endsAt).toISOString(),
    });
    if (res.ok) {
      apiMergeInto('ud_auctions', [auctionFromApi({
        ...res.data,
        produce_name: produce.name,
        category: produce.category,
        image_url: produce.image || res.data.image_url,
        farmer_name: getUser(currentUser) ? getUser(currentUser).name : undefined,
      })]);
      return true;
    }
    apiToastError(res.error, 'create auction');
  }

  const auctions = store.auctions();
  auctions.push({
    id: 'a' + Date.now(), farmer: currentUser, item: produce.name, image: produce.image,
    icon: produce.icon, baseRate, unit: produce.unit, qty, highestBid: baseRate,
    highestBidder: null, endsAt, sold: false,
  });
  store.saveAuctions(auctions);
  return false;
}

/** Mirror a bid to the backend (the local UI already updated optimistically). */
async function syncBidToApi(auction, amount) {
  if (!API_ENABLED || !apiToken || !auction.apiId) return;
  if (!(await apiProbe())) return;
  const res = await api.auctions.bid(auction.apiId, amount);
  if (!res.ok) apiToastError(res.error, 'place bid');
}

/* ------------------------------------------------------------------ orders */

/**
 * Create real backend orders for the cart lines that came from backend
 * listings. Lines whose produce has no `apiId` stay local-only (demo data).
 */
async function createBackendOrders(lines, consumerUser) {
  if (!lines.length) return;
  if (!(await apiProbe())) return;
  const address = String(consumerUser.address || '').trim();

  for (const entry of lines) {
    const res = await api.orders.create({
      produce_id: entry.product.apiId,
      quantity: entry.line.qty,
      address,
    });
    if (res.ok) {
      const record = orderFromApi({
        ...res.data,
        consumer_name: consumerUser.name,
        produce_name: entry.product.name,
        image_url: entry.product.image,
      });
      record.farmer = entry.product.farmer;   // keep the username the UI already uses
      apiMergeInto('ud_orders', [record]);
    } else {
      apiToastError(res.error, 'create order');
    }
  }

  // Re-pull so the consumer sees the server's authoritative stock + order list.
  await apiSyncAll();
}

/** Mirror a delivery-stage change (`setOrderStage` is the single writer). */
async function syncOrderStageToApi(order, stage) {
  if (!API_ENABLED || !apiToken || !order || !order.apiId) return;
  if (currentRole !== 'farmer' && currentRole !== 'fpo') return;   // server allows only these roles
  if (!(await apiProbe())) return;

  const res = await api.orders.setStage(order.apiId, stage);
  if (res.ok) return;

  // The backend runs the 7-step pipeline. When the front-end's extra
  // 'atCustomerCity' step (mapped to atFpo) makes a local move look like a
  // regression or an out-of-band change, that's the expected compatibility
  // behaviour — note it and move on instead of alarming the user.
  const expected = ['STAGE_REGRESSION', 'STAGE_NOT_ALLOWED'];
  if (res.error && expected.includes(res.error.code)) {
    console.warn('[api] stage kept local only:', toApiStage(stage), res.error.code);
    return;
  }
  apiToastError(res.error, 'update delivery stage');
}

/** Mirror an order status change (pending / completed / refunded). */
async function syncOrderStatusToApi(order, status) {
  if (!API_ENABLED || !apiToken || !order || !order.apiId) return;
  if (!(await apiProbe())) return;
  const res = await api.orders.setStatus(order.apiId, status);
  if (!res.ok) apiToastError(res.error, 'update order status');
}

/* ------------------------------------------------- FPO Tier-1 / Tier-3 ---- */

/**
 * Tier-1: persist the AGMARK grade + digital weighment.
 * The same call also claims the lot for this FPO on the backend (fpo_id).
 * Not re-mirrored from the response — the response is a bare orders row with
 * no joined names, and confirmFpoGrade() has already set the local values; the
 * next full sync brings back the fully-joined row.
 */
async function syncFpoGradeToApi(order, grade, weighKg) {
  if (!API_ENABLED || !apiToken || !order || !order.apiId) return;
  if (!(await apiProbe())) return;
  const res = await api.orders.setGrading(order.apiId, grade, weighKg);
  if (res.ok) return;

  // A lot that has not reached the collection point yet is a local/remote
  // timing difference, not something to alarm the manager about.
  if (res.error && res.error.code === 'STAGE_NOT_ALLOWED') {
    console.warn('[api] grading kept local only:', res.error.code);
    return;
  }
  apiToastError(res.error, 'record FPO grading');
}

/**
 * Tier-3: record the EV doorstep agent. The backend endpoint also advances the
 * order to 'outForDelivery' in the same statement, which is why app.js calls
 * setOrderStage(..., { skipApiSync: true }) for this one transition.
 */
async function syncEvAgentToApi(order, agent) {
  if (!API_ENABLED || !apiToken || !order || !order.apiId) return;
  if (!(await apiProbe())) return;
  const res = await api.orders.assignAgent(order.apiId, agent);
  if (res.ok) return;
  if (res.error && ['BATCH_NOT_RECEIVED', 'STAGE_REGRESSION', 'STAGE_NOT_ALLOWED'].includes(res.error.code)) {
    // The local UI already enforces the receive-first rule, so these only mean
    // the two sides briefly disagreed — keep the local state and move on.
    console.warn('[api] agent assignment kept local only:', res.error.code);
    return;
  }
  apiToastError(res.error, 'assign EV agent');
}

/* --------------------------------------------------------------- FPO batch */

/**
 * Attach the backend id to a batch the FPO just assembled locally, and let the
 * backend assign the member orders to this FPO (required before it may advance
 * their delivery stages). Orders that exist only in the demo are skipped.
 */
async function syncNewBatchToBackend(batch, orderIds) {
  if (!API_ENABLED || !apiToken) return;
  const orders = store.orders();
  const apiOrderIds = orderIds
    .map(id => (orders.find(o => o.id === id) || {}).apiId)
    .filter(Boolean);
  if (!apiOrderIds.length) return;                  // every lot is demo-only
  if (!(await apiProbe())) return;

  const res = await api.fpo.createBatch({
    source_cluster: batch.sourceCluster,
    destination_hub: batch.destinationHub,
    consolidated_weight_kg: batch.weightKg,
    vehicle_type: batch.vehicle,
    transit_status: 'assembling',
    orders_list: apiOrderIds,
  });
  if (!res.ok) { apiToastError(res.error, 'create FPO batch'); return; }

  const batches = store.fpoBatches();
  const live = batches.find(b => b.id === batch.id);
  if (live) { live.apiId = Number(res.data.id); store.saveFpoBatches(batches); }
}

/** Mirror a batch status change (assembling → dispatched → received). */
async function syncBatchStatusToApi(batch, status) {
  if (!API_ENABLED || !apiToken || !batch || !batch.apiId) return;
  if (!(await apiProbe())) return;
  const res = await api.fpo.updateBatch(batch.apiId, { transit_status: toApiBatchStatus(status) });
  if (!res.ok) apiToastError(res.error, 'update FPO batch');
}
