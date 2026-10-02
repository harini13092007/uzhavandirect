# Uzhavan Direct — SIH 2026 Completion Plan

**Problem statement ID:** 26033 — *"Multiple Intermediaries reduce farmers earnings and increase consumer prices."*
**Theme:** Agriculture, FoodTech and Rural Development · **Team:** Green Coders (171380)
**Goal of this document:** a complete, **100% free-source** plan to finish our web app — written so that
anyone on the team (even with zero backend experience) can understand *what* we are building, *why*,
and *how* every piece works.

> **Stack decision (agreed):** the PPT says **HTML/CSS/JS frontend + Python FastAPI backend + SQLite
> database + JWT/bcrypt authentication + scikit-learn + Razorpay**. We follow the PPT. The existing
> Node/Express server in `server/` is **not thrown away** — it becomes the *reference specification*:
> same routes, same responses, same tests, rewritten in Python.

---

## Table of contents

1. [The big picture (start here)](#1-the-big-picture-start-here)
2. [Beginner glossary](#2-beginner-glossary)
3. [How a request travels — 3 visual walkthroughs](#3-how-a-request-travels--3-visual-walkthroughs)
4. [The backend explained from zero](#4-the-backend-explained-from-zero)
5. [Feature gap table (the 6 required features)](#5-feature-gap-table-the-6-required-features)
6. [The 7 completion phases (free stack)](#6-the-7-completion-phases-free-stack)
7. [Milestones and risks](#7-milestones-and-risks)

---

## 1. The big picture (start here)

Imagine a **farm shop**:

| In the shop | In our app | Name programmers use |
|---|---|---|
| The shop window & shelves customers see | The pages you see and click (`index.html`, `style.css`, `app.js`) | **Frontend** |
| The kitchen + cash register behind the window | The Python program that does the real work (login, auctions, orders) | **Backend** |
| The shop's ledger book with every customer, sale and price | One file `uzhavan.db` containing every table | **Database** |
| The waiter carrying orders to the kitchen and food back | JSON messages sent over HTTP (`fetch()` in `api.js`) | **API** |
| The waiter's notepad showing who the customer is | A signed **JWT** token attached to each request | **Token / auth** |

### The whole system in one picture

```
                    ┌─────────────────── FREE HOSTING ───────────────────┐
                    │  GitHub Pages (frontend)                          │
                    │  https://<user>.github.io/uzhavandirect/          │
                    └───────────────────────┬────────────────────────────┘
                                            │ the browser downloads
                                            ▼
┌────────────────────────── BROWSER (the shop window) ──────────────────────────────┐
│  index.html  → page structure        style.css → looks                         │
│  app.js      → what clicks do        api.js → THE WAITER (talks to backend)        │
│                                                                                   │
│  localStorage = a small notebook the browser keeps so the app still works          │
│                 when the internet is gone (offline demo mode)                      │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │  ① HTTPS request, JSON body
                               │     Authorization: Bearer <JWT>
                               ▼
┌──────────────────────── FREE HOSTING ────────────────┐
│  Render free tier — BACKEND (the kitchen)            │
│  Python + FastAPI                                    │
│                                                       │
│   routes/    → every URL we support (the menu)        │
│   security   → checks who you are (JWT + bcrypt)      │
│   limits     → slowapi rate limiter (bouncer)         │
│   models     → Python classes that mirror the tables  │
└──────────────────────────────┬───────────────────────┘
                               │  ② SQLAlchemy sends SQL
                               ▼
┌──────────────────────── DATABASE (the ledger) ──────────────────────────┐
│  SQLite → ONE file called uzhavan.db                                  │
│  tables: users, otp_codes, produce, auctions, orders,               │
│          fpo_batches, notifications, (+ donations, ratings, audit_log)│
└─────────────────────────────────────────────────────────────────────┘
```

**Two golden rules of the plan**

1. **The frontend never changes its "waiter" language.** `api.js` already sends/receives JSON in a fixed
   shape (explained in §4.5). As long as FastAPI answers with the *same* shapes, the whole website keeps
   working — we only swap the kitchen.
2. **Everything must be free.** Every tool below is free for our use (free tier or open-source). Paid
   upgrades are listed only as "future options".

---

## 2. Beginner glossary

Each card: **what it is** in one sentence, and **why we use it**.

| Term | What it is | Why we use it |
|---|---|---|
| **Frontend** | The HTML/CSS/JS that runs *inside the browser*. | What judges see and click. |
| **Backend** | A program running on a **server** that the browser asks for data. | Keeps secrets (passwords) away from the browser. |
| **API** | A list of URLs that accept and return JSON. | The contract between frontend and backend. |
| **Endpoint / route** | One URL + one method, e.g. `POST /api/orders`. | Each action of the app is one endpoint. |
| **HTTP method** | `GET` = read, `POST` = create, `PUT/PATCH` = change, `DELETE` = remove. | Tells the backend *what kind* of action you want. |
| **JSON** | Text in `{ "key": value }` format. | The universal language between browser and server. |
| **Database** | A structured store of data that survives restarts. | localStorage disappears; a database does not. |
| **SQLite** | A database that is **one file** on disk (e.g. `uzhavan.db`). | Zero setup, free, and exactly what our PPT promises. |
| **SQL** | The language to ask a database questions (`SELECT … FROM …`). | All data retrieval happens through SQL. |
| **Table** | Rows + columns, like a spreadsheet inside the database. | Each kind of thing (users, orders) gets a table. |
| **Primary key (PK)** | The unique `id` of a row. | Every row is addressable and linkable. |
| **Foreign key (FK)** | A column pointing at another table's PK (e.g. `orders.farmer_id`). | Connects data: this order → that farmer. |
| **ORM** | A bridge that lets Python read/write tables as if they were Python objects. | SQLAlchemy = our ORM; less string-SQL, fewer bugs. |
| **Migration** | Idempotent script that creates/updates tables on startup. | `CREATE TABLE IF NOT EXISTS` = safe to run repeatedly. |
| **FastAPI** | A free Python framework that turns functions into API endpoints. | The PPT says Python; FastAPI also auto-documents our API. |
| **Uvicorn** | The web *server* program that runs FastAPI and listens on a port. | `uvicorn app.main:app` = start the backend. |
| **Pydantic** | Library that validates/serialises Python data structures. | Rejects bad input *before* it touches our code. |
| **JWT** | A tamper-proof signed badge that says "this is user #42, role=farmer". | Stateless login — no server session needed. |
| **bcrypt** | A one-way password scrambler (hashing). | We store scrambles, never real passwords. |
| **Hash** | A fingerprint of data; easy to compute, impossible to reverse. | `password_hash` column in `users`. |
| **OTP** | One-Time Password sent to a phone (6 digits, expires in 5 min). | Stops fake farmer accounts (a PPT requirement). |
| **Rate limiting** | "Only N requests per minute per IP". | Stops brute-force attacks and auction spam. |
| **CORS** | Browser rule: which sites may call our API. | Allow-list only our GitHub Pages origin. |
| **HTTPS / TLS** | Encrypted connection (the padlock). | Free from the host; protects tokens in transit. |
| **Token / `Authorization` header** | `Authorization: Bearer <jwt>` sent with every private request. | How the backend knows who is calling. |
| **CSP / security headers** | Response headers that tell the browser what is allowed. | Cheap, powerful defence (our "helmet"). |
| **scikit-learn** | Free Python machine-learning library. | Demand forecast feature promised in the PPT. |
| **Deployment** | Putting the app on a public server so judges can open it. | GitHub Pages + Render = free hosting. |
| **CI (GitHub Actions)** | Scripts that automatically run tests on every push. | Catches broken code before judges do. |

---

## 3. How a request travels — 3 visual walkthroughs

These three flows are what judges ask about most. Read them once and you understand 90% of the backend.

### 3.1 Login (authentication)

```
 FARMER'S BROWSER                              FASTAPI BACKEND
 ───────────────                               ──────────────
 1. types phone "9000000001" + password
    and presses Log in
                                               │
 2. api.js sends POST /api/auth/login ───────▶ 3. Pydantic checks the body:
       { phone, password }                        is phone 10 digits? password present?
                                                │  no → 400 VALIDATION_ERROR
 4.                                          5. look up user by phone in SQLite:
                                                 SELECT * FROM users WHERE phone = ?
                                               not found → 401 INVALID_CREDENTIALS
                                            6. bcrypt.compare(plain, stored_hash)
                                               mismatch → 401 INVALID_CREDENTIALS
                                            7. make a JWT:
                                                 payload = { sub: 42, role: "farmer" }
                                                 sign it with SECRET (only server knows)
                                               expiry = 7 days
 ◀── 200 { success:true, data:{ token, user } } ─
 8. api.js stores token in localStorage
       key: ud_api_token
 9. EVERY later request adds the header:
       Authorization: Bearer <token>
                                              10. verify signature + expiry
                                                  wrong/expired → 401 INVALID_TOKEN
                                                  else → you are user #42 ✅
```

**Why this is safe:** the password travels only over HTTPS; the server stores only a bcrypt *scramble*;
the JWT is **signed, not encrypted** — anyone can *read* it, but nobody can *change* `role: "farmer"`
to `role: "admin"` without the secret.

### 3.2 Placing a bid (why auction fraud can't happen)

```
 2 consumers click "Bid ₹1,000" at the same millisecond
 ──────────────────────────────────────────────────────
 Consumer A ──POST /api/auctions/7/bid {amount:1000}──▶ ┌───────────────┐
 Consumer B ──POST /api/auctions/7/bid {amount:1000}──▶ │   FastAPI     │
                                                       └───────┬───────┘
                          ONE guarded SQL statement (atomic):
                          UPDATE auctions
                             SET highest_bid = 1000
                           WHERE id = 7
                             AND is_closed = FALSE
                             AND (highest_bid IS NULL OR highest_bid < 1000)
                           RETURNING *;
                                                       ┌───────────────┐
            A's UPDATE → 1 row changed → ✅ winner     │  SQLite locks  │
            B's UPDATE → 0 rows changed → ❌ 409       │  one writer    │
                                                       │  at a time     │
                                                       └───────────────┘
```

**Why this matters:** the check and the write happen in **one database statement**, so two equal bids can
never both win (race condition prevented). This is the "auction manipulation" defence from our PPT.

### 3.3 Buying produce (nobody can oversell)

```
 POST /api/orders { produce_id: 5, quantity: 10 }
 ────────────────────────────────────────────────
 BEGIN TRANSACTION;                              ← SQLite "hold on, all-or-nothing"
    SELECT quantity FROM produce WHERE id = 5;   → 8 left
    8 < 10 ?  → yes → ROLLBACK; return 409 OUT_OF_STOCK      ❌ nothing saved
    (if enough)
    UPDATE produce SET quantity = quantity - 10 WHERE id = 5;
    INSERT INTO orders (...)  VALUES (... total = price × 10 ...);
    INSERT INTO notifications (user_id, message) ...   ← farmer gets a bell 🔔
 COMMIT;                                         ← everything above is saved together
 ────────────────────────────────────────────────
 A crash halfway? SQLite undoes the whole block — data never goes inconsistent.
```

---

## 4. The backend explained from zero

### 4.1 The four Python tools (one plain sentence + analogy each)

| Tool | Plain sentence | Analogy |
|---|---|---|
| **FastAPI** | A free library that turns any Python function into an API endpoint just by decorating it with `@router.post("/api/…")`. | The *menu printer* — you write dishes, it prints the menu (URLs) and even serves a live menu page at `/docs`. |
| **Uvicorn** | The program that actually listens on a network port and feeds requests to FastAPI. | The *chef's station* — it takes tickets from the waiter and hands them to the kitchen. |
| **Pydantic** | Defines the exact shape of incoming/outgoing data; anything malformed is rejected automatically. | The *ticket checker* — a ticket missing an item never reaches the chef. |
| **SQLAlchemy** | Lets us write `session.query(User).filter_by(phone=…)` instead of raw SQL strings; it compiles to SQL for us. | The *ledger clerk* — we speak Python, they write the neat SQL. |

### 4.2 What the backend folder will look like (each file, in plain words)

```
server/                      ← same folder, now Python inside
├── app/
│   ├── __init__.py          # empty file: marks this as a Python package
│   ├── main.py              # ★ builds the FastAPI app: CORS, secure headers,
│   │                        #   rate limits, mounts every router, /api/health
│   ├── config.py            # reads .env (SECRET keys) — never hard-code secrets
│   ├── database.py          # connects to SQLite file; runs schema on boot
│   ├── models.py            # Python classes that MIRROR the tables (the ORM)
│   ├── schemas.py           # Pydantic: what a valid request/response looks like
│   ├── security.py          # bcrypt hash/compare + JWT create/verify
│   ├── deps.py              # get_current_user(), require_role("farmer") …
│   ├── seed.py              # one command = demo data for judges
│   └── routes/
│       ├── auth.py          # register, login, me, request-otp, verify-otp
│       ├── produce.py       # list/create/edit produce
│       ├── auctions.py      # list/create/bid (guarded UPDATE lives here)
│       ├── orders.py        # buy, track, advance delivery stage
│       ├── fpo.py           # batches + shipment pipeline
│       ├── notifications.py # in-app bell
│       ├── donations.py     # 🆕 donations API (PPT feature)
│       ├── ratings.py       # 🆕 farmer ratings (PPT feature)
│       ├── demand.py        # 🆕 demand tracker from real orders
│       └── chat.py          # 🆕 farmer AI chatbot (rules + optional Gemini)
├── tests/
│   └── test_api.py          # pytest version of the existing 32 tests
├── requirements.txt         # pip list of everything (all free)
├── .env                     # secrets — git-ignored
├── .env.example             # template with dummy values — committed
└── README.md                # how to run it
```

**What happens to a request, step by step:**

```
 HTTP request
   → main.py middlewares (CORS check → security headers → rate limiter → JSON parser)
   → router (e.g. routes/orders.py)         "which function handles this URL?"
   → dependency get_current_user()          "who is calling? valid JWT?"
   → Pydantic schema                         "is the body valid?"
   → SQLAlchemy (SQL to SQLite)              "do the data work"
   → return {"success": true, "data": …}     "same envelope the frontend expects"
```

### 4.3 SQLite visualized

SQLite is **one file**. That's it — no server to install, no password to configure.

```bash
# you'll type this to start the backend:
uvicorn app.main:app --reload          # backend on http://127.0.0.1:8000
# ...and this to SEE the database with your own eyes (free GUI):
# DB Browser for SQLite → open server/uzhavan.db → Browse Data tab → click tables
```

Inside `uzhavan.db` after `python -m app.seed` you will literally see rows like:

```
users                          produce
id | name  | role     | …     id | name   | price | farmer_id | quantity
---+-------+---------+       ---+--------+-------+-----------+--------
 1 | Ravi  | farmer   | …      1 | Tomato |  28   | 1         | 120
 2 | Divya | consumer | …      2 | Rice   |  62   | 1         | 500
```

### 4.4 ER diagram — how the tables connect

Solid line = required link (`NOT NULL`), dotted = optional link (nullable).
`1 ──< n` reads as "one row of the left table can be linked to many rows of the right table".

```
                          ┌─────────────────────┐
                          │       users         │   roles: farmer | consumer | fpo
                          ├─────────────────────┤
                          │ id            (PK)  │
                          │ phone        (UQ)   │◄─────────────────────────────┐
                          │ password_hash        │                             │
                          │ role, village, bio   │                             │
                          │ is_phone_verified    │                             │
                          └┬──────┬──────┬──────┬┘                              │
         ┌────────────────┘      │      │      └───────────────┐               │
         │ 1:n                   │      │ 1:n                 │ 1:n           │
         ▼                       ▼      ▼                     ▼               ▼
┌─────────────────┐   ┌──────────────┐  ┌──────────────┐   ┌────────────────────────┐
│    produce      │   │   auctions   │   │    orders    │   │      otp_codes         │
├─────────────────┤   ├──────────────┤  ├──────────────┤   ├────────────────────────┤
│ id         (PK) │   │ id      (PK) │  │ id      (PK) │   │ id    (PK)            │
│ farmer_id  (FK)─┼──▶│ farmer_id(FK)│  │ consumer_id(FK)▶  │ phone                 │
│ name, category  │   │ produce_id(FK)──▶ farmer_id (FK)   │ code, expires_at      │
│ price, quantity  │   │ base_rate    │  │ produce_id(FK)  │ consumed_at           │
│ unit, image_url  │   │ highest_bid  │  │ fpo_id     (FK) │└────────────────────────┘
│ is_sold          │   │ highest_bidder▶ │ fpo_batch_id(FK)│
└─────────────────┘   │ ends_at,     │  │ quantity, total  │        ┌──────────────────┐
         ▲            │ is_closed    │  │ status           │        │  notifications   │
         │            └──────────────┘  │ delivery_stage   │        ├──────────────────┤
         │ (an auction sells produce)   │ address, timing  │        │ id         (PK)  │
         │                              │ fpo_grade/weigh  │        │ user_id    (FK)──┼──▶ users
         │                              └───┬──────────┬───┘        │ type, message    │
         │                                  │          │            │ order_id   (FK)──┼──▶ orders
         │                                  │          │            │ batch_id   (FK)──┼──▶ fpo_batches
         │                                  ▼          ▼            │ is_read          │
         │                       ┌──────────────────────────┐      └──────────────────┘
         │                       │      fpo_batches         │              ▲
         │                       ├──────────────────────────┤              │
         │                       │ id                  (PK) │──────────────┘
         │                       │ fpo_id         (FK) ──── ┼──▶ users
         │                       │ source_cluster, dest_hub │
         │                       │ transit_status,          │
         │                       │ orders_list (JSON)       │
         │                       └──────────────────────────┘
         │
         │  🆕 PLANNED (Phase 4) — new tables:
         │  ┌────────────────────────┐   ┌────────────────────────┐   ┌─────────────────────┐
         │  │      donations         │   │        ratings         │   │      audit_log      │
         │  ├────────────────────────┤   ├────────────────────────┤   ├─────────────────────┤
         └─▶│ id (PK)               │   │ id (PK)                │   │ id (PK)             │
            │ consumer_id (FK) ─▶ u │   │ consumer_id (FK) ─▶ u  │   │ actor_id (FK) ─▶ u  │
            │ farmer_id   (FK) ─▶ u │   │ farmer_id   (FK) ─▶ u  │   │ action, entity,     │
            │ amount, message        │   │ stars 1–5, comment     │   │ entity_id, ip,      │
            │ created_at             │   │ updated_at (UNIQUE on  │   │ created_at          │
            └────────────────────────┘   │  consumer+farmer pair) │   └─────────────────────┘
                                         └────────────────────────┘

   NOTE: "demand" has NO table — it is a QUESTION we ask the orders table:
   SELECT name, COUNT(*) FROM orders … GROUP BY name  (last 30 days)
```

### 4.5 Route contract — the promise to the frontend

This table is copied **1:1 from the existing Express README** (plus the notifications routes). FastAPI
must answer each row with the *same* JSON envelope and field names — that is "parity", and it is why
`api.js` needs **no changes**. Rows marked 🆕 are new PPT features (Phase 4).

| Method | Path | Who | What it does |
|---|---|---|---|
| GET | `/api/health` | anyone | liveness probe (`api.js` uses it to decide online/offline) |
| POST | `/api/auth/register` | anyone | create account → `{ token, user }` |
| POST | `/api/auth/login` | anyone | `{ phone, password }` → `{ token, user }` |
| GET | `/api/auth/me` | any logged in | current user from the JWT |
| POST | `/api/auth/request-otp` | anyone | send 6-digit code (rate-limited separately) |
| POST | `/api/auth/verify-otp` | anyone | single-use, 5-min code → `is_phone_verified` |
| GET | `/api/produce` | anyone | `?category=&farmer_id=&q=&is_sold=&limit=&offset=` |
| GET | `/api/produce/:id` | anyone | one listing |
| POST | `/api/produce` | farmer | create listing |
| PUT | `/api/produce/:id` | farmer (owner) | partial update |
| GET | `/api/auctions` | anyone | `?open=true` hides closed; auto-closes expired |
| GET | `/api/auctions/:id` | anyone | with produce + bidder names |
| POST | `/api/auctions` | farmer | create auction for own produce |
| POST | `/api/auctions/:id/bid` | consumer | guarded single-statement bid (§3.2) |
| GET | `/api/orders` | any | scoped to your role; `?status=&delivery_stage=` |
| GET | `/api/orders/:id` | participant | order detail |
| POST | `/api/orders` | consumer | atomic stock decrement (§3.3) |
| PATCH | `/api/orders/:id` | participant | `status: pending\|completed\|refunded` |
| PATCH | `/api/orders/:id/stage` | farmer / fpo | forward-only delivery stage |
| GET | `/api/fpo/batches` | fpo | own batches |
| GET | `/api/fpo/batches/:id` | fpo | batch detail |
| POST | `/api/fpo/batches` | fpo | create batch; attaching orders assigns them |
| PATCH | `/api/fpo/batches/:id` | fpo (owner) | update fields / transit status |
| GET | `/api/notifications` | any | own notifications + unread count |
| PATCH | `/api/notifications/:id/read` | owner | mark one read (404 hides foreign ids) |
| POST | `/api/donations` 🆕 | consumer | record donation to a farmer |
| GET | `/api/farmers/:id/donations` 🆕 | anyone | donation total + history (consented) |
| POST | `/api/ratings` 🆕 | consumer | upsert 1–5★ rating for a farmer |
| GET | `/api/farmers/:id/rating` 🆕 | anyone | average + count + reviews |
| GET | `/api/demand` 🆕 | farmer | top categories last 30 days from real orders |
| POST | `/api/chat` 🆕 | any | farmer AI chatbot reply (rules + optional LLM) |

**Response envelope (unchanged, both versions):**

```json
{ "success": true,  "data": { "…": "payload" }, "message": "optional" }
{ "success": false, "error": { "code": "MACHINE_CODE", "message": "Human readable", "details": {} } }
```

**Delivery pipeline (unchanged):**
`placed → confirmed → packed → atFarmerCity → atFpo → outForDelivery → delivered`
(forward-only; farmer advances the first half, FPO the second; regression → 409 `STAGE_REGRESSION`.)

---

## 5. Feature gap table (the 6 required features)

| # | PPT feature | Works today? | What's missing | Closed in |
|---|---|---|---|---|
| 1 | **Direct marketplace** | ✅ full UI (search, cart, categories, images) + Express endpoints | Move endpoints to FastAPI; free image hosting policy | P1 |
| 2 | **Smart online auction** | ✅ race-safe bidding, base rate, closing times | Python port + auto-close job + notifications | P1, P4 |
| 3 | **Demand tracker** | ⚠️ UI shows **seeded** numbers from `ud_demand` | Real `GET /api/demand` computed from orders + scikit-learn forecast | P4 |
| 4 | **Farmer AI chatbot** | ⚠️ works, but rules live **inside `app.js`** (client-side) | Move to `POST /api/chat`; add optional free Gemini; Tamil/Hindi replies | P4 |
| 5 | **Local farm network** | ⚠️ followers/nearby UI on localStorage only | Backend follow endpoints + radius/map search | P4 |
| 6 | **Donations & ratings** | ⚠️ ledgers exist (`ud_donations`, `ud_ratings`) — **no backend** | Donations/ratings tables + endpoints + Razorpay test mode | P4 |
| — | Security ("strong, secure web page") | ⚠️ Express has rate limits + CORS; no headers/CSP/audit | Full hardening package (§6, P3) | P3 |
| — | Deployment | ❌ only localhost + old GitHub Pages demo | Free hosting for FastAPI + database persistence | P5 |

---

## 6. The 7 completion phases (free stack)

> Every phase lists: **what** we do, **tools** (all free), and **what you'll type**.

### P0 — Rebuild order (why this sequence)

```
 P1 backend port ──▶ P2 database strategy ──▶ P3 security ──▶ P4 features
        │                                                          │
        └──────────── tests keep passing ◀────────────────────────┘
                                   │
                    P5 hosting ◀───┴───▶ P6 CI ◀──▶ P7 report/PPT
```

### P1 — Port the backend to FastAPI + SQLite

* **What:** recreate every row of the route contract (§4.5) in Python, byte-for-byte compatible responses.
* **Tools (free/open-source):** `fastapi`, `uvicorn`, `pydantic` v2, `sqlalchemy` 2.x (+ built-in SQLite),
  `pyjwt`, `passlib[bcrypt]`, `slowapi`, `pytest` + `httpx` (TestClient).
* **Acceptance:** the existing 32 integration tests, rewritten in pytest against an **in-memory SQLite**
  (`sqlite:///:memory:`), all pass; `npm` server stays untouched until the parity gate is green.
* **What you'll type:**
  ```bash
  cd server
  python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
  pip install fastapi "uvicorn[standard]" sqlalchemy pyjwt "passlib[bcrypt]" slowapi pytest httpx
  uvicorn app.main:app --reload                          # http://127.0.0.1:8000/docs (live API docs!)
  pytest                                                  # all green = parity achieved
  ```
* **Beginner note:** `/docs` is FastAPI's gift to us — an auto-generated, clickable API explorer we can
  show judges without writing a line of UI.

### P2 — Free database strategy

* **What:** SQLite as the production database (as the PPT promises) **plus** a persistence story, because
  free hosts wipe disks.
* **Tools:** SQLite (WAL mode), **DB Browser for SQLite** (free GUI to *see* data),
  **Litestream** (free, open-source) streaming `uzhavan.db` → **Cloudflare R2** (free 10 GB),
  **Neon** free Postgres as the documented upgrade path (same SQLAlchemy models, one connection string).
* **What you'll type:**
  ```bash
  python -m app.seed                     # create tables + demo data, safe to re-run
  litestream replicate uzhavan.db s3://<bucket>/uzhavan.db    # continuous backup
  ```
* **Demo safety net:** on hosts with ephemeral disks, the app **re-seeds on boot** if the file is missing —
  a judge can never see an empty app.

### P3 — Security hardening (the "strong, secure web page")

Each control → the attack it stops (this table doubles as our OWASP Top 10 talking point):

| Control (free) | Attack it stops |
|---|---|
| Secure-headers middleware: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, tight `Content-Security-Policy` | Clickjacking, MIME-sniffing, referrer leaks (**A05 Misconfiguration**) |
| CORS **allow-list** (only our GitHub Pages origin + localhost), methods/headers restricted | Cross-site data theft from browsers (**A05**) |
| bcrypt cost 12; password min-length + complexity check in Pydantic | Password cracking / stuffing (**A07 Auth failures**) |
| JWT: 16+ byte secret from `.env`, 7-day expiry, `sub`+`role` claims, algorithm pinned to HS256 | Token forgery / algorithm confusion |
| Three rate-limit tiers (global 300/15min, auth 50/15min, OTP 10/15min) + **per-IP bid throttle** | Brute force, OTP spam, auction flooding (**A04 Rate limits**) |
| SQLAlchemy **bound parameters only** (no f-string SQL) | SQL injection (**A03 Injection**) |
| Pydantic validation on every body; JSON body cap 100 kB | Malformed-input crashes / payload bombs |
| `audit_log` table (login, bid, order, refund events + IP) | Undetectable abuse; evidence for judges (**A09 Logging**) |
| Frontend XSS audit: replace user-data `innerHTML` interpolation with `textContent` / escape helper | Stored XSS from malicious names/comments (**A03 XSS**) |
| Secrets only in `.env` (git-ignored), `.env.example` committed; `pip-audit` + `npm audit` in CI | Leaked keys, known-vulnerable dependencies (**A06 Components**) |
| HTTPS enforced by host (free Let's Encrypt); HSTS header | Token sniffing on the wire (**A02 Crypto failures**) |
| Uploads: `image_url` host allow-list (or our own `/static`), no HTML rendering | Malicious content injection |

* **What you'll type:** `pip install pip-audit` → `pip-audit` (must print: no vulnerabilities).

### P4 — Complete the 6 PPT features

| Feature | Endpoint(s) | Free tech | Notes |
|---|---|---|---|
| Donations | `POST /api/donations`, `GET /api/farmers/:id/donations` | SQLAlchemy + **Razorpay test mode** (free integration, ₹0) with HMAC signature verification; **UPI QR fallback** (zero cost) | wires the existing `ud_donations` ledger |
| Ratings | `POST /api/ratings` (upsert), `GET /api/farmers/:id/rating` | unique constraint on (consumer, farmer) | powers "trust in quality" from PPT |
| Demand tracker | `GET /api/demand` | SQL `GROUP BY` last 30 days → **scikit-learn** linear trend for next-week forecast (seed fallback if <10 orders) | replaces fake seed numbers |
| AI chatbot | `POST /api/chat` | rule engine (offline, deterministic) + **optional Gemini free tier** behind `LLM_API_KEY`; replies in en/ta/hi | quota-safe: rules are the fallback |
| Local farm network | `GET /api/farmers?near=`, `POST /api/farmers/:id/follow` | lat/lon Haversine in SQL; Leaflet map already in frontend | |
| Auction auto-close | APScheduler job (open-source) every minute | closes `ends_at < now()` → notification rows | prevents stuck auctions |
| OTP via SMS | same routes, provider interface inside | **MSG91** trial credits (or Twilio trial); `OTP_DEBUG=false` in prod | keeps `devOtp` only in demo mode |

### P5 — Free hosting & deployment

| Piece | Host | Free because… | Watch out |
|---|---|---|---|
| Frontend | **GitHub Pages** (already configured: `.nojekyll`, live demo exists) | free static hosting + HTTPS | set `CORS_ORIGIN` to exactly this URL |
| Backend | **Render** free web service (permanent free plan, verified 2026) | free FastAPI hosting | **ephemeral disk** → P2 seed-on-boot + Litestream backup |
| Backend alt | Google Cloud Run $0 request tier (container) | free request quota | same ephemeral FS note |
| Not used | Fly.io | **no free tier in 2026** (verified) | — |
| Database upgrade | Neon free Postgres (when allowed to leave the PPT stack) | free 0.5 GB | one `DATABASE_URL` change |

* **What you'll type:** `git push` (Pages auto-publishes) and connect the repo in Render's dashboard
  (build: `pip install -r requirements.txt`, start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).

### P6 — CI, tests and quality (free)

* **GitHub Actions** workflow (public repos: unlimited; private: free quota): on every push →
  `ruff` (lint) → `pytest` (32+ tests) → `pip-audit` (dependency CVEs).
* Port `server/scripts/smoke-live.js` to `scripts/smoke_live.py` (hits a running server end-to-end).
* Frontend: **Lighthouse** (built into Chrome, free) for performance/a11y/SEO + axe DevTools free audit.
* **What you'll type:** `pip install ruff` → `ruff check app tests`.

### P7 — Align the report & PPT

* Update `Uzhavan_Direct_Final_Report.html` → regenerate PDF: implemented stack table (FastAPI + SQLite),
  architecture diagram from §1, security table from P3, test counts, live links.
* The PPT's "Python / FastAPI / SQLite / JWT+bcrypt / scikit-learn / Razorpay" row must now read
  **"Implemented"** instead of "proposed".

---

## 7. Milestones and risks

### Milestones (beginner-paced estimates, small team of 2–3)

| Milestone | Deliverable | "Done" looks like | Est. |
|---|---|---|---|
| **M1** | FastAPI skeleton + auth parity | register/login/me/OTP pass in pytest; `/docs` works | 2–3 days |
| **M2** | All route-contract rows ported | 32/32 pytest green; frontend runs against FastAPI via `?api=` | 3–4 days |
| **M3** | Security + CI | headers/CORS/limits live; GitHub Actions badge green; pip-audit clean | 1–2 days |
| **M4** | 6 features complete | demand real, chat API up, donations+ratings on backend, Razorpay test flow | 3–5 days |
| **M5** | Deployed free | Pages frontend ↔ Render API, CORS locked, seed-on-boot verified | 1 day |
| **M6** | Report/PPT/demo polish | regenerated PDF, 5-minute demo script, one-command demo | 1–2 days |

### Risk table

| Risk | Likelihood | Impact | Mitigation (already in plan) |
|---|---|---|---|
| Render free disk wipes SQLite | high | data loss | seed-on-boot + Litestream→R2 continuous backup (P2) |
| Gemini free-tier quota cuts (they shrink often; verified tight in 2026) | high | chatbot down | rule engine is the default; LLM only behind a key with graceful fallback |
| SMS trial credits run out mid-demo | medium | OTP fails | `OTP_DEBUG` demo path + on-screen OTP for judges |
| Python learning curve for the team | medium | slow port | route contract + 32 tests = machine-checked safety net; `/docs` speeds integration |
| XSS via existing `innerHTML` usage in `app.js` | medium | account theft | explicit audit task in P3 before deployment |
| JWT kept in localStorage (readable by injected JS) | medium | token theft | CSP + XSS audit reduce the vector; optional httpOnly cookie upgrade later |
| Judges expect the old Node server | low | confusion | keep `server/` history; report explains the PPT-driven rewrite |
| Internet down at the venue | low | demo dead | app already falls back to localStorage offline mode |

---

### Appendix A — The 6 problem-statement features ↔ our delivery

| PPT key feature | Where it lives after completion |
|---|---|
| 1. Direct marketplace | `routes/produce.py` + SPA marketplace views |
| 2. Smart online auction | `routes/auctions.py` (guarded UPDATE) + APScheduler closer |
| 3. Demand tracker | `routes/demand.py` + scikit-learn forecast + existing bar UI |
| 4. Farmer AI chatbot | `routes/chat.py` (rules + optional Gemini) + existing chat UI |
| 5. Local farm network | follow endpoints + Leaflet radius map |
| 6. Donations & ratings | `routes/donations.py`, `routes/ratings.py` + Razorpay test mode |

*See `SIH_2026_PROMPT_SERIES.md` for the ready-to-paste prompts that execute each phase.*
