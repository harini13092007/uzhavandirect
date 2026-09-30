# Uzhavan Direct — Backend API

Node.js + Express + PostgreSQL backend for the SIH 2026 "Uzhavan Direct"
farm-to-table marketplace. Replaces the front-end's `localStorage` layer with a
scalable, role-aware REST API.

## Features

- **Auth**: JWT bearer tokens, bcrypt password hashing, three roles
  (`farmer` | `consumer` | `fpo`), SMS/OTP verification **stubs**
  (`request-otp` / `verify-otp`, single-use codes with 5-minute expiry).
- **Models**: `users`, `produce`, `auctions`, `orders`, `fpo_batches`
  (see [src/schema.sql](src/schema.sql)).
- **Endpoints**: produce listings, live auctions with race-safe bidding,
  orders with atomic stock decrements and a role-scoped delivery pipeline,
  FPO batch/shipment management.
- **Ops**: CORS allow-list, tiered rate limiting (global + auth + OTP),
  uniform JSON response envelope, idempotent migrations on boot,
  graceful shutdown.

## Quick start

```bash
cd server
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm install
npm run migrate               # optional — schema also applies on boot
npm start                     # API on http://localhost:3000
npm test                      # integration tests (in-memory Postgres via pg-mem)
```

Health check: `GET http://localhost:3000/api/health`

## Response envelope

Every response uses the same shape:

```json
{ "success": true,  "data": { "…": "payload" }, "message": "optional" }
{ "success": false, "error": { "code": "MACHINE_CODE", "message": "Human readable", "details": {} } }
```

Common error codes: `VALIDATION_ERROR` (400), `INVALID_PHONE` (400),
`UNAUTHENTICATED` / `INVALID_TOKEN` / `INVALID_CREDENTIALS` (401),
`FORBIDDEN` (403), `NOT_FOUND` (404), `PHONE_TAKEN` / `BID_TOO_LOW` /
`AUCTION_CLOSED` / `OUT_OF_STOCK` / `STAGE_NOT_ALLOWED` /
`STAGE_REGRESSION` / `ORDERS_NOT_ATTACHABLE` (409), `RATE_LIMITED` /
`AUTH_RATE_LIMITED` (429), `DB_UNAVAILABLE` (503), `INTERNAL_ERROR` (500).

## Authentication

```bash
# register → { token, user }
curl -X POST localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Ravi","phone":"9000000001","password":"secret123","role":"farmer","village":"Keelvelur"}'

# login → { token, user }
curl -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"phone":"9000000001","password":"secret123"}'

# use the token
curl localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

JWT payload: `{ sub: userId, role, name }`, expiry `JWT_EXPIRES_IN` (7d default).

### OTP stubs

- `POST /api/auth/request-otp` `{ phone }` → generates a 6-digit code,
  stores it in `otp_codes`. **SMS delivery is not implemented** — the code
  contains a marked `// TODO` where an SMS provider (MSG91 / Twilio /
  Fast2SMS) plugs in. While `OTP_DEBUG=true` the code is returned as
  `data.devOtp` so demos/tests can complete verification.
- `POST /api/auth/verify-otp` `{ phone, code }` → single-use, 5-minute codes;
  marks the user `is_phone_verified`.

## Endpoints

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | — | liveness |
| POST | `/api/auth/register` | — | `{ name, phone, password, role, village?\|city?, address?, bio? }` |
| POST | `/api/auth/login` | — | `{ phone, password }` → `{ token, user }` |
| GET | `/api/auth/me` | any | current user |
| POST | `/api/auth/request-otp` | — | `{ phone }` (rate-limited separately) |
| POST | `/api/auth/verify-otp` | — | `{ phone, code }` |
| GET | `/api/produce` | — | filters: `?category=&farmer_id=&q=&is_sold=&limit=&offset=` |
| GET | `/api/produce/:id` | — | single listing |
| POST | `/api/produce` | farmer | `{ category, name, price, quantity?, unit?, perishability?, image_url?, location? }` |
| PUT | `/api/produce/:id` | farmer (owner) | partial update of the same fields |
| GET | `/api/auctions` | — | `?open=true` hides closed; expired ones auto-close first |
| GET | `/api/auctions/:id` | — | includes produce + bidder names |
| POST | `/api/auctions` | farmer | `{ produce_id, base_rate, ends_at, quantity?, unit? }` (own produce only) |
| POST | `/api/auctions/:id/bid` | consumer | `{ amount }` — must be ≥ base rate and strictly > current bid; enforced in a single guarded `UPDATE` so concurrent bids can't tie |
| GET | `/api/orders` | any | scoped to your role's orders; `?status=&delivery_stage=` |
| GET | `/api/orders/:id` | participant | |
| POST | `/api/orders` | consumer | `{ produce_id, quantity, address, delivery_timing?, fpo_id? }`; stock decremented atomically, `total_price = price × quantity` |
| PATCH | `/api/orders/:id` | participant | `{ status: pending\|completed\|refunded }` |
| PATCH | `/api/orders/:id/stage` | farmer / fpo | `{ delivery_stage }` — see below |
| GET | `/api/fpo/batches` | fpo | own batches |
| GET | `/api/fpo/batches/:id` | fpo | |
| POST | `/api/fpo/batches` | fpo | `{ source_cluster, destination_hub, consolidated_weight_kg?, vehicle_type?, transit_status?, orders_list? }` — attaching orders assigns them to the FPO |
| PATCH | `/api/fpo/batches/:id` | fpo (owner) | update fields / `orders_list` / `transit_status` |

### Delivery pipeline

Stages: `placed → confirmed → packed → atFarmerCity → atFpo → outForDelivery → delivered`

- **farmer** advances `placed … atFarmerCity` (confirm, pack, dispatch to city)
- **fpo** advances `atFarmerCity … delivered` — and must be assigned to the
  order first (attach it via `POST /api/fpo/batches`)
- transitions are **forward-only** (`STAGE_REGRESSION` on 409)
- consumers may set `status` but never move stages

## CORS & rate limiting

- `CORS_ORIGIN=*` (default) or comma-separated allow-list of origins.
- Global: `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` (300 / 15 min).
- `/api/auth/*`: `AUTH_RATE_LIMIT_MAX` (50 / 15 min);
- OTP endpoints: `OTP_RATE_LIMIT_MAX` (10 / 15 min).
- Limits return `429` in the standard error envelope.

## Project structure

```
server/
├── src/
│   ├── index.js          # bootstrap: env → migrate → listen
│   ├── app.js            # express app: CORS, rate limits, routes, 404s
│   ├── db.js             # pg Pool, query(), withTransaction(), migrate()
│   ├── schema.sql        # idempotent DDL (all tables IF NOT EXISTS)
│   ├── migrate.js        # `npm run migrate`
│   ├── lib/http.js       # envelope, HttpError, validators, error handler
│   ├── middleware/auth.js# JWT sign/verify, requireRole()
│   └── routes/           # auth, produce, auctions, orders, fpo
└── test/api.test.js      # 25 integration tests (pg-mem, no Postgres needed)
```

## Integrating the front-end

The static SPA still runs fully offline on `localStorage`. To move it to this
API, swap each `store.*` call for `fetch(API + path, { headers: { Authorization } })`
and keep the same rendering code — list endpoints return the same field names
as the seed objects (`name`, `price`, `quantity`, `image_url`, …). Suggested
order: auth first (`register`/`login` → keep the JWT in memory), then produce,
then orders/auctions.

> Note: the front-end currently tracks an extra delivery step `atCustomerCity`
> that the API spec omits — the API follows the agreed 7-stage pipeline listed
> above. Add the stage to both sides together if you want it back.
