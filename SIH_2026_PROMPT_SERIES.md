# Uzhavan Direct — The Prompt Series

Companion to `SIH_2026_COMPLETION_PLAN.md`. **Each prompt below is self-contained**: copy the code
block into a fresh AI coding session (no other context needed) and it will know exactly what to do.

**How to use this series**

1. Go in order — Group A first (it turns our prototype into the app our PPT promises), then Group B.
2. One prompt = one session/task. Don't merge them; small steps keep errors small.
3. Every prompt already says **free-only** — the agent will not suggest paid services.
4. After each task, run the tests mentioned in its *Done when* line before moving on.

---

## Group A — Change what we have to match the PPT

> Plain English: rewrite the backend in Python (FastAPI + SQLite) exactly as our PPT describes, then
> finish the six promised features on top of it.

### A1 — Rebuild the backend in Python

```text
GOAL: Port the existing Node/Express/PostgreSQL backend in server/ to a Python FastAPI +
SQLite backend with 100% API parity (same URLs, same JSON shapes, same error codes).

CONTEXT:
- Repo root is a static SPA: index.html, style.css, app.js, api.js (vanilla JS, no build step).
  api.js probes GET /api/health and mirrors API data into localStorage; it must NOT need changes.
- server/README.md contains the reference route contract (auth, produce, auctions, orders, fpo,
  notifications) and the response envelope:
  success: { success:true, data, message? } | error: { success:false, error:{code,message,details} }
- server/test/api.test.js has 32 integration tests against pg-mem — these define "parity".

TASK:
1. Create a Python package server/app/ with: main.py (FastAPI app factory: CORS, rate limits,
   JSON error envelope, /api/health), config.py (.env via python-dotenv), database.py (SQLAlchemy 2.x
   engine on SQLite file uzhavan.db, WAL mode, idempotent schema apply on boot), models.py (ORM
   mirrors of ALL tables in server/src/schema.sql including FPO tier columns and notifications),
   schemas.py (Pydantic request/response models), security.py (passlib bcrypt + PyJWT HS256,
   payload {sub, role, name}, 7d expiry), deps.py (get_current_user, require_role).
2. Port every route in server/src/routes/*.js to app/routes/*.py with identical paths, methods,
   query params, role rules and error codes (VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND,
   PHONE_TAKEN, BID_TOO_LOW, AUCTION_CLOSED, OUT_OF_STOCK, STAGE_NOT_ALLOWED, STAGE_REGRESSION,
   RATE_LIMITED, ...). The auction bid must stay a single guarded UPDATE (atomic, no race).
   The delivery stage machine stays forward-only: placed→confirmed→packed→atFarmerCity→atFpo→
   outForDelivery→delivered.
3. Keep OTP stubs (otp_codes table, single-use, 5-minute expiry, OTP_DEBUG flag).
4. Rate limiting via slowapi with the same tiers as .env.example (global / auth / otp).

CONSTRAINTS (free only): fastapi, uvicorn, pydantic v2, sqlalchemy, pyjwt, passlib[bcrypt],
slowapi, python-dotenv, pytest, httpx — all open source. No paid services. Do not modify the
front-end files. Keep server/ README updated as you go.

DONE WHEN: pytest (new server/tests/test_api.py using FastAPI TestClient + sqlite:///:memory:)
ports all 32 behaviours and passes; `uvicorn app.main:app --reload` serves /docs; the SPA opened
with ?api=http://127.0.0.1:8000 can register, login, list produce, bid, and order end-to-end.
```

### A2 — Donations & ratings on the backend

```text
GOAL: Move the existing donations and farmer-ratings features from localStorage to the new
FastAPI + SQLite backend (PPT key feature 6: "Donations and ratings for farmers from consumers").

CONTEXT:
- Frontend app.js already keeps two ledgers: ud_donations [{id, consumerId, farmerId, amount,
  message, createdAt}] and ud_ratings [{consumerId, farmerId, stars, comment}] with helper
  functions (recordDonation, recordRating, farmerDonationsTotal, consumerDonationsTotal).
- Backend is FastAPI + SQLAlchemy in server/app/ (see prompt A1). Route contract and envelope:
  { success:true, data } / { success:false, error:{code,message,details} }.

TASK:
1. Tables: donations (id, consumer_id FK, farmer_id FK, amount NUMERIC CHECK > 0, message,
   created_at) and ratings (id, consumer_id FK, farmer_id FK, stars 1-5 CHECK, comment,
   updated_at, UNIQUE(consumer_id, farmer_id) so re-rating upserts).
2. Endpoints (same envelope as the rest of the API):
   POST /api/donations (consumer) — record donation, notify the farmer (notifications row),
   return the saved record.
   GET /api/farmers/:id/donations — total + recent history (respect any privacy the UI shows).
   POST /api/ratings (consumer) — upsert own rating for a farmer (403 if farmer_id isn't a farmer).
   GET /api/farmers/:id/rating — { average, count, reviews[] with consumer names }.
3. Mirror the records into the same localStorage keys so offline demo mode still renders.

CONSTRAINTS (free only): no payment gateway yet (Razorpay test mode is a separate task).
Input validated with Pydantic; parameterised SQL only; role-checked via the existing JWT deps.

DONE WHEN: pytest covers donate → farmer sees notification → totals add up; rate a farmer twice →
only one row, average updated; SPA farmer profile page shows live totals against the API.
```

### A3 — Real demand tracker

```text
GOAL: Replace the hardcoded demand numbers with GET /api/demand computed from real orders
(PPT key feature 3: "Demand tracker").

CONTEXT:
- app.js renderDemand() reads store.demand() → the seeded object ud_demand (Rice:340, Tomato:280, ...).
- Backend: FastAPI + SQLite (prompt A1). Orders table has produce_id, quantity, total_price,
  created_at; produce has name/category.

TASK:
1. GET /api/demand (farmer role) returns the last 30 days of order volume grouped by produce
   name/category: [{ name, category, orders, quantity, revenue }], sorted by orders desc, LIMIT 20.
   Empty/short history (<10 orders) falls back to the current seed numbers so the demo never
   looks broken.
2. Optional forecast field next_week_trend computed with scikit-learn (free): fit a simple
   LinearRegression over daily order counts; guard with try/except → null on failure.
3. api.js: fetch demand from the API when online, mirror into ud_demand (same key), keep
   renderDemand() unchanged — the bar UI must look identical.

CONSTRAINTS (free only): scikit-learn is allowed (PPT names it) but must be an optional import
(requirements must still install without it → graceful fallback). No paid data sources.

DONE WHEN: creating 3 orders for "Tomato" moves Tomato to the top of the tracker after the API
call; UI identical to today; pytest covers grouping, permission (consumer → 403) and fallback.
```

### A4 — Farmer AI chatbot as an API

```text
GOAL: Move the rule-based farmer chatbot from app.js into POST /api/chat, and optionally add a
free-tier LLM (Google Gemini) with the rules as guaranteed fallback (PPT key feature 4).

CONTEXT:
- app.js lines ~1807+ contain answerBot()/keyword rules (prices, demand, selling, auctions,
  fertilizer, storage, help) and the chat UI (renderChat). The bot greets in the user's language.
- Backend: FastAPI in server/app/.

TASK:
1. POST /api/chat (any authenticated user) body { message, lang?: 'en'|'ta'|'hi' } →
   { reply, source: 'rules'|'llm' }. Port the existing keyword rules to server/app/chat_rules.py
   verbatim (they must give the same answers offline).
2. If env GEMINI_API_KEY is set, call the Gemini free-tier endpoint (generativelanguage.googleapis.com)
   with a system prompt: "You are Uzhavan AI, an agriculture market assistant for Tamil Nadu farmers.
   Answer in the user's language (en/ta/hi), max 80 words, practical, honest about uncertainty."
   Wrap in try/except + 6s timeout → on ANY failure fall back to rules. Cache identical questions
   for 1 hour to stay inside the free quota.
3. Rate limit the endpoint (e.g. 20/min/user) and log usage (source, latency) to audit_log.
4. api.js: send chat to the API when online, fall back to the local rules when offline —
   the existing UI keeps working unchanged.

CONSTRAINTS (free only): Gemini free tier only, never a paid plan; rules engine MUST work with
no key at all. No user PII in prompts (user's first name only).

DONE WHEN: pytest covers rule answers, missing-key fallback, LLM-error fallback and rate limiting;
chat works in ta/hi/en; demo survives with GEMINI_API_KEY unset.
```

### A5 — Auction auto-close job

```text
GOAL: Ensure expired auctions always close themselves and both parties get notified.

CONTEXT: FastAPI backend (prompt A1) with auctions (ends_at, is_closed, highest_bid,
highest_bidder_id) and notifications (user_id, type, message, order_id, batch_id, is_read).

TASK:
1. A background task (asyncio loop or APScheduler — open source) runs every 30s:
   UPDATE auctions SET is_closed=TRUE WHERE is_closed=FALSE AND ends_at <= now().
   For each newly closed auction with a highest bidder → notification to the farmer
   ("Auction #N sold to <name> for ₹X") and to the winner; with no bids → farmer only.
2. GET /api/auctions?open=true must ALSO close expired rows inline first (idempotent safety),
   exactly like the current Express behaviour.
3. Fire a notification when someone is outbid (optional if trivial).

CONSTRAINTS (free only): no cron services, run inside the app process; notifications are in-app
only (no SMS/email).

DONE WHEN: pytest creates an auction ending in the past → first GET marks it closed and writes
exactly one set of notifications (no duplicates on repeat calls).
```

### A6 — Local farm network (nearby farmers & follow)

```text
GOAL: Build the "Local farm network" PPT feature on the backend: discover nearby farmers and
follow them, so consumers can buy from farms around them.

CONTEXT:
- FastAPI backend (prompt A1). users has village/address (no coordinates yet); the SPA has a
  Leaflet map, "nearby" farmer cards, and seed users with followers arrays in localStorage.

TASK:
1. Add optional lat/lon columns to users with an idempotent ALTER (same migration style as
   server/src/schema.sql) + seed Tamil-Nadu coordinates for demo farmers
   (Salem, Erode, Thanjavur, Nilgiris, Keelvelur).
2. New follows table (follower_id FK, farmer_id FK, UNIQUE pair, created_at).
3. Endpoints (same JSON envelope as the rest of the API):
   GET  /api/farmers?q=&near=lat,lon&radius_km=50&limit=  → public profiles
        { id, name, village, bio, avg_rating, produce_count, distance_km?, following },
        distance-sorted when near= given (Haversine — plain math, no paid geocoding).
   GET  /api/farmers/:id → profile + their active produce + rating summary.
   POST /api/farmers/:id/follow  and  DELETE /api/farmers/:id/follow (consumer only,
        400 on self-follow, idempotent).
   GET  /api/farmers/:id/followers → count (full list only for the farmer themselves).
4. Mirror follows into the existing localStorage followers arrays so the offline demo still renders.
5. Wire the SPA: nearby view uses browser geolocation when the user grants it (plain-language
   explanation first), else falls back to village-based listing; follow buttons toggle via API.

CONSTRAINTS (free only): Leaflet + OpenStreetMap already in the project — no paid map or
geocoding APIs; geolocation strictly opt-in; expose only fields the UI already shows (privacy).

DONE WHEN: pytest covers distance sorting, radius filter, follow/unfollow idempotence,
self-follow 400, anonymous 401; demo without location permission still lists farmers;
follow counts agree between API and UI.
```

### A7 — Security hardening pass

```text
GOAL: Harden the FastAPI backend to an OWASP Top 10 checklist level — this is our "strong, secure
web page" deliverable.

CONTEXT: server/app/ is FastAPI + SQLAlchemy + JWT (prompt A1). Frontend api.js sends
Authorization: Bearer <token> and is served from GitHub Pages (origin to be allow-listed).

TASK (each item = code + a test):
1. Security-headers middleware on every response: Strict-Transport-Security,
   X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: no-referrer,
   Content-Security-Policy appropriate for the SPA (no inline scripts beyond what index.html uses;
   frame-ancestors 'none').
2. CORS allow-list from env CORS_ORIGIN (comma separated): only the Pages URL + localhost dev
   origins; methods GET/POST/PUT/PATCH/OPTIONS; allowed headers Content-Type, Authorization.
3. Rate tiers via slowapi: global 300/15min, /api/auth/* 50/15min, OTP 10/15min,
   bids 30/15min per IP (auction flood defence). 429s use our error envelope.
4. bcrypt cost=12; password policy (min 8, must contain letter+digit) enforced by Pydantic;
   login attempts keyed by phone+IP.
5. JWT: secret read from env (refuse to boot with the placeholder value in production mode),
   algorithm pinned, 7-day expiry.
6. JSON body limit 100kB; Pydantic strict types on every body/query; parameterised SQL only.
7. audit_log table (actor_id, action, entity, entity_id, ip, created_at) written on
   register, login, login-failed, bid, order-create, refund, stage-advance.
8. Add pip-audit to CI; ensure no dependency advisories.

CONSTRAINTS (free only): all open-source tooling. No WAF/SaaS. Keep the response envelope intact.

DONE WHEN: pytest proves headers present, CORS rejects foreign origins, 429 fires on auth spam,
placeholder JWT_SECRET aborts boot in prod mode, audit rows are written; pip-audit prints no
vulnerabilities; a written checklist maps each control to its OWASP category for the report.
```

### A8 — Razorpay test-mode donations + UPI QR fallback

```text
GOAL: Add real (test-mode) payment flow for donations, plus a zero-cost UPI QR fallback
(PPT: "Instant UPI payments"; "Razorpay API (planned integration)").

CONTEXT: FastAPI backend with donations table (prompt A2); frontend has recordDonation()
which currently simulates payment.

TASK:
1. Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (test mode). Open-source razorpay Python SDK.
2. POST /api/payments/donation/order → creates a Razorpay order (amount in paise) and returns
   { order_id, amount, currency, key_id } ; store a pending donation row.
3. Frontend opens checkout via Razorpay standard JS (free script), then POSTs
   { razorpay_order_id, razorpay_payment_id, razorpay_signature } → backend verifies HMAC-SHA256
   with KEY_SECRET; only then marks the donation succeeded and notifies the farmer.
4. UPI QR fallback: GET /api/payments/donation/upi-qr → builds a UPI deep-link
   upi://pay?pa=...&pn=Uzhavan%20Direct&am=...&tn=... (no account needed — use the team's UPI id
   from env UPI_VPA); UI shows the QR (client-side QR generation, free library) and a "I paid"
   button that records the donation as unverified with a review flag.
5. Idempotency: same order_id can't be completed twice; webhook route /api/payments/webhook
   with signature verification (raw body) for payment.captured.

CONSTRAINTS (free only): Razorpay charges nothing for test mode and no live money moves.
Never store card data. Secrets only in .env.

DONE WHEN: pytest covers signature-valid, signature-tampered (400), duplicate completion (idempotent),
and QR link generation; full happy path works in the browser with test card 4111 1111 1111 1111.
```

### A9 — Real OTP via SMS provider (free credits)

```text
GOAL: Make OTP verification send real SMS messages through a provider interface, while keeping
the demo mode that shows the OTP on screen (mitigation for PPT's "Fake Farmer Account").

CONTEXT: FastAPI routes request-otp/verify-otp already generate 6-digit codes, store them in
otp_codes (single-use, 5-minute expiry) and return devOtp only when OTP_DEBUG=true (current default).

TASK:
1. sms.py with a provider interface: send(phone, code) → async. Implementations:
   Msg91Provider (env MSG91_AUTH_KEY, template id), ConsoleProvider (dev: logs/returns),
   selected via SMS_PROVIDER env. Free-tier trial credits are enough for the demo.
2. request-otp: generate → store → call provider; response NEVER contains the code unless
   OTP_DEBUG=true. Map provider failure to a graceful message (don't 500 the demo).
3. verify-otp unchanged logic + audit_log entry + rate limit per phone.
4. README section: how to get free trial credits, and that judges can still use OTP_DEBUG=true.

CONSTRAINTS (free only): trial/free tiers (MSG91 / Twilio trial / Fast2SMS) — never a paid plan.
Code hashes or TTL only — never log full OTPs in production mode.

DONE WHEN: pytest covers happy path, wrong code, expired code, reused code, provider-failure
graceful path; OTP_DEBUG=true demo flow still works for offline judging.
```

### A10 — One-command demo seed

```text
GOAL: A judge must be able to run the whole demo with one command and see full data, never an
empty screen — even on a wiped disk (Render free tier is ephemeral).

CONTEXT: FastAPI backend (prompt A1) with tables mirroring server/src/schema.sql; the SPA has
demo expectations (roles farmer/consumer/fpo, demo login john/123 in offline mode, produce with
images from assets/products/, existing notifications).

TASK:
1. python -m app.seed → idempotent: creates tables if missing, inserts demo users
   (phone+password documented in README), 10+ produce items with image_url, 2 open auctions
   (one ending soon), orders in various delivery stages, FPO batch, notifications, donations,
   ratings, 30 days of synthetic order history (feeds the demand tracker).
2. Boot hook: if uzhavan.db is missing or empty → auto-seed on startup (SET SEED_ON_BOOT=false
   to disable in production).
3. python -m app.seed --reset for a clean slate (explicit confirmation flag required).
4. Print a "demo cheat sheet" at the end: URLs, phones/passwords for each role.

CONSTRAINTS (free only): seed data must be synthetic (no real personal data). Safe to re-run.

DONE WHEN: fresh clone → pip install → uvicorn → open SPA → every role can log in and all six
PPT features show non-empty data; running seed twice changes nothing (idempotent).
```

### A11 — CI pipeline (GitHub Actions)

```text
GOAL: Automatic quality gate: every push runs lint + tests + security audit for free.

CONTEXT: Python backend in server/ (app/, tests/), static front-end at repo root, existing
server/test/api.test.js being superseded by pytest.

TASK: .github/workflows/ci.yml → on push/PR:
1. Matrix Python 3.11/3.12; pip install -r requirements.txt (and dev: ruff, pytest, pip-audit).
2. ruff check app tests; pytest -q; pip-audit (fail on vulnerabilities).
3. If server/scripts/smoke_live.py exists and DATABASE_URL provided → run it (continue-on-error
   for forks).
4. Cache pip; keep total runtime < 5 min; badge-worthy steps with clear names.

CONSTRAINTS (free only): GitHub Actions minutes (public repos are unlimited). No third-party
CI SaaS. Never echo secrets.

DONE WHEN: a deliberately broken push turns the workflow red; fixing it turns it green; README
shows the passing badge.
```

### A12 — Deploy: GitHub Pages + Render (free hosting)

```text
GOAL: Put the completed app on the public internet at zero cost: static SPA on GitHub Pages,
FastAPI API on Render, SQLite persistence strategy included.

CONTEXT: repo root is the SPA (index.html, app.js, api.js, style.css, assets/) with .nojekyll;
api.js resolves the API base from ?api= or localStorage ud_api_base, defaulting to
http://localhost:3000 — note it must work against a remote HTTPS API (mixed-content rule:
the Pages site is HTTPS, so the API URL must be HTTPS too, never http://).

TASK:
1. Frontend: publish to GitHub Pages from the repo (existing demo URL pattern
   https://<user>.github.io/uzhavandirect/). Set the default API base to the Render URL in
   api.js (still overridable by ?api= for local dev).
2. Backend: Render free web service from the same repo: build "pip install -r requirements.txt",
   start "uvicorn app.main:app --host 0.0.0.0 --port $PORT". render.yaml committed.
3. Env vars on Render: DATABASE_URL (file path), JWT_SECRET (auto-generated), CORS_ORIGIN
   (exact Pages URL), OTP_DEBUG=false, SMS_PROVIDER=console for now, TRUST_PROXY=1.
4. Persistence: enable SEED_ON_BOOT so the demo self-heals on disk wipe; document optional
   Litestream → Cloudflare R2 continuous backup in README.
5. Lock CORS to the deployed origin only; verify /api/health and /docs behaviour (docs should
   be disabled or protected in production mode).

CONSTRAINTS (free only): Render permanent free plan + GitHub Pages; no paid domains needed
(both give HTTPS). Fly.io is NOT allowed (no free tier in 2026).

DONE WHEN: judges can open the Pages URL, log in, list/buy/bid against the live API, see CORS
block any other origin, and a hard refresh after Render restarts still shows data (seed-on-boot).
```

### A13 — Update the report & PPT to what we actually built

```text
GOAL: Make our written deliverables match reality: FastAPI + SQLite implemented stack (our PPT
promised HTML/CSS/JS + Python FastAPI + SQLite + JWT/bcrypt + scikit-learn + Razorpay).

CONTEXT: Uzhavan_Direct_Final_Report.html (and its PDF) exist at repo root; SIH_2026_COMPLETION_PLAN.md
documents the final architecture, security table, and milestones; PS 26033 features: marketplace,
auction, demand tracker, AI chatbot, farm network, donations+ratings.

TASK:
1. Update the report's technical-approach section: mark each PPT item as Implemented with the
   exact tool (FastAPI, SQLite, PyJWT, bcrypt, scikit-learn, Razorpay test mode) and where it
   lives in the code.
2. Add/refresh: architecture diagram (from the plan doc), security/OWASP checklist table,
   test counts + CI badge, free-hosting table (Pages + Render), live demo + video links.
3. Regenerate the PDF from the updated HTML (Chrome print-to-PDF), replacing the old one.
4. Add a short "How to run in 3 commands" box for judges.

CONSTRAINTS: keep the existing report's visual style; factual only — no invented metrics.

DONE WHEN: the HTML and PDF exist, every claim is true of the current code, and the stack table
matches the PPT's technical-approach row word-for-word where possible.
```

---

## Group B — Create further applications

> Plain English: once Group A ships, these prompts grow the project into a product family —
> an offline-first mobile PWA, an analytics dashboard, a logistics console, price/weather
> companions, and admin tooling.

### B1 — Offline-first PWA (farmers with patchy network)

```text
GOAL: Make the existing SPA installable and fully usable offline (farmers often have no signal).

CONTEXT: static SPA at repo root (index.html, app.js, api.js, style.css, assets/) with a
localStorage fallback layer; no build step; served on GitHub Pages.

TASK:
1. manifest.json (name Uzhavan Direct, icons from assets, standalone display, theme colour #2F6B41)
   + register a small hand-written service worker (no framework): cache-first for app shell +
   assets, network-first with localStorage fallback for /api/*, versioned cache with cleanup.
2. Offline banner + "pending writes" queue in api.js: when a create/bid fails with NETWORK_ERROR,
   store it and replay when back online (bids must NOT replay blindly — show them as "queued, needs
   confirmation"; safe replays only for idempotent actions).
3. Lighthouse PWA checks green (installable, offline start).

CONSTRAINTS (free only, no frameworks): vanilla JS/CSS; keep total added JS < 30KB; works on
3G-first, Android Chrome + iOS Safari.

DONE WHEN: airplane-mode reload shows cached app; install prompt appears; queued listing appears
on the API once online; existing offline demo mode still works.
```

### B2 — FPO logistics console (live map)

```text
GOAL: A dedicated FPO dispatch view: batches on a live Leaflet map with route/status timelines.

CONTEXT: Leaflet 1.9 is already used in the SPA; backend has fpo_batches (source_cluster,
destination_hub, transit_status, orders_list) and orders with FPO tier columns
(fpo_grade, fpo_weigh_kg, fpo_corridor, fpo_vehicle, fpo_ev_agent).

TASK:
1. New SPA view (role=fpo): map with cluster → hub polylines, batch pins coloured by
   transit_status, sidebar list with counts (loading/in-transit/at-hub/delivered).
2. Click a batch → timeline of its orders (grade → weigh → corridor → vehicle → EV agent →
   delivered), each stage updatable inline (existing PATCH /api/fpo/batches/:id/stage).
3. Auto-refresh every 20s (or WebSocket later — out of scope) + unread notification badge sync.
4. KPI strip: kg consolidated today, orders in flight, avg transit hours (from created_at →
   updated_at of delivered orders).

CONSTRAINTS (free only): OpenStreetMap tiles via Leaflet (free usage policy), no paid map APIs.
Mock geodata for demo (synthetic coordinates around Tamil Nadu).

DONE WHEN: creating a batch shows it on the map within 20s; advancing stages updates the timeline;
delivered orders feed the KPI strip; role=fpo login only.
```

### B3 — Farmer analytics dashboard

```text
GOAL: A personal analytics page for farmers: earnings, top crops, price trends, demand forecast —
visualized with free charting.

CONTEXT: FastAPI backend with produce, orders, demand endpoint (A3), ratings, donations;
SPA has farmer dashboard views; PPT promises scikit-learn-based insights.

TASK:
1. GET /api/farmer/stats → totals (revenue 30/90d, orders, avg rating, donation sum), series
   (daily revenue, top 5 crops by revenue), price vs category-average, and next-week demand forecast.
2. Frontend: Chart.js (free, MIT) line/bar charts + sparkline stat cards; en/ta/hi labels via
   existing i18n strings; dark-mode compatible with the 3 themes.
3. Forecast: scikit-learn LinearRegression over daily units sold per category; expose
   { category, predicted_units, confidence } with fallback nulls when history < 14 days.
4. Empty states and a "based on N orders" honesty note (don't fake precision).

CONSTRAINTS (free only): Chart.js CDN, scikit-learn local, no analytics SaaS, no PII exposure
(farmer sees only their own data; role check enforced server-side).

DONE WHEN: pytest checks stats scoping (farmer B can't read farmer A's stats); charts render in
all 3 themes; forecast appears only when enough history exists.
```

### B4 — Mandi price companion (e-NAM / daily digest)

```text
GOAL: Show farmers today's local mandi/e-NAM prices next to their own listings, with a daily
"price tips" digest — PPT cites e-NAM and daily mandi price datasets.

CONTEXT: FastAPI backend + SPA demand tracker view; produce names are Tamil-Nadu staples
(Tomato, Rice, Onion, Milk, Mango...).

TASK:
1. prices table (crop, market, price_min/max/avg, source, date) + importer script
   (scripts/import_mandi_prices.py) that reads a CSV/JSON from an open dataset (data.gov.in open
   data or any openly licensed daily mandi feed) — importer is scheduled in-process daily.
   If the source is unreachable: keep last known prices and mark freshness.
2. GET /api/prices?crop=&market= → latest; GET /api/prices/advice → for each crop the farmer
   sells: "mandi avg ₹X vs your listing ₹Y → you're N% above/below" (rule-based text, i18n).
3. UI: price board on the dashboard (crop, mandi avg, your price, delta arrows), freshness badge.
4. Daily digest: one in-app notification per farmer morning summary (top mover among their crops).

CONSTRAINTS (free only): open/gov datasets only, respect their licences and attribution;
no scraping that violates a site's terms — if no API exists, ship with a bundled sample CSV
updated manually and say so in the UI. No paid market-data APIs.

DONE WHEN: importer + API + board work offline against bundled data; advice text appears in
ta/hi/en; tests cover stale-data marking and per-crop advice maths.
```

### B5 — Voice search (Tamil-first usability)

```text
GOAL: Let farmers search produce and dictate notes by voice, in Tamil/Hindi/English — for
low-literacy users.

CONTEXT: SPA is vanilla JS with an i18n dictionary (en/ta/hi) and a search view over
GET /api/produce?q=.

TASK:
1. Mic button on search + chat inputs using the browser Web Speech API
   (webkitSpeechRecognition; lang = current UI language ta-IN/hi-IN/en-IN).
2. Graceful degradation: unsupported browser → hide mic with tooltip; permission denied → toast.
3. Interim results shown as-you-speak, final transcript triggers the existing search.
4. Tamil normalization for matching (remove diacritic differences, simple transliteration
   fallback so "தக்காளி" finds Tomato listings tagged with both names).
5. A11y pass: aria-labels, keyboard focus order, works with the existing 3 themes.

CONSTRAINTS (free only): Web Speech API only (browser-provided); NO paid speech APIs, no audio
recordings uploaded anywhere (privacy note in the UI).

DONE WHEN: demo shows voice search in ta-IN finding produce; unsupported browsers unaffected;
tests cover the normalization function.
```

### B6 — UPI mobile checkout

```text
GOAL: A mobile-first checkout that pays by UPI intent (the PPT promises instant UPI payments)
with an order trail — works even without Razorpay keys.

CONTEXT: SPA cart/checkout exists (orders POST /api/orders); donations payment flow exists (A8);
env UPI_VPA planned.

TASK:
1. Checkout sheet (mobile bottom-sheet UI): items, total, delivery timing, address, then pay via
   UPI intent link upi://pay?pa=<VPA>&am=<total>&tn=Order<id> (Android opens any UPI app);
   iOS gets a copyable VPA + deep link fallback.
2. Backend: order created with payment_status: 'pending' → POST /api/orders/:id/confirm-payment
   marks 'reported' (self-declared, audited) — optional Razorpay verification when keys exist.
3. Payment states in UI: pending / reported / verified / failed with timeline; farmer sees state
   before packing (guard: packing requires ≥ reported).
4. Receipt view (printable) with order id, items, stage, payment state.

CONSTRAINTS (free only): UPI deep-links cost nothing; no card data ever; Razorpay only in test
mode; every state transition audited.

DONE WHEN: phone demo opens a UPI app with correct amount; order states flow correctly; tests
cover illegal transitions; works fully in test mode on a laptop via QR.
```

### B7 — Admin / trust & safety console

```text
GOAL: An admin role to verify farmers (KYC), review fraud flags, and audit auctions — supports
the PPT's "OTP + verification" and "time-bound biddings" trust story.

CONTEXT: FastAPI backend with users, otp_codes.is_phone_verified, auctions, orders, audit_log
(A7); SPA has 3 roles (farmer/consumer/fpo) with renderNav()-driven sidebar.

TASK:
1. New role 'admin' (seed one admin) + require_role('admin') on new routes:
   GET /api/admin/users?role=&verified=&q= ; PATCH /api/admin/users/:id/verify (marks
   is_phone_verified + audit entry) ; POST /api/admin/users/:id/suspend.
2. Fraud signals (free, rules-only): repeated outbid-without-win, bid below base attempts,
   order cancel spikes, duplicate phone registrations → flagged list with reasons.
3. Auction oversight: list auctions with bid history, close-early action (audited), bid-rate stats.
4. Admin SPA view: tables + filters + actions, danger-zone confirmations, i18n strings.
5. Security: admin routes rate-limited, all actions into audit_log, 404 (not 403) for non-admins
   probing, password re-entry required for suspension.

CONSTRAINTS (free only): no third-party KYC vendor (simulated verification + OTP is our scope);
no real user data beyond what the app already stores.

DONE WHEN: pytest covers role denial, verify/suspend flows, flag reasons; admin can walk a
suspicious auction end-to-end with a full audit trail.
```

### B8 — Weather advisory (free open API)

```text
GOAL: Farm-advisory weather cards driven by the free Open-Meteo API — increases daily active use.

CONTEXT: SPA has farmer dashboard + i18n (en/ta/hi); users have village/city; produce has
location. Backend FastAPI.

TASK:
1. GET /api/weather?lat=&lon= → proxied Open-Meteo (api.open-meteo.com, free, no key) response
   trimmed to what we render: 7-day min/max temp, precipitation probability, wind; server-side
   cache 30 min (free-tier good citizenship).
2. Simple advisory rules per crop category: rain > 70% within 48h → "postpone harvest/sale";
   heat > 38°C → "store in shade, move perishables faster"; etc. → localized one-liners.
3. UI: dashboard card (icon, temp range, rain %) + alert banner when a rule fires; unit-safe,
   timezone-aware (Asia/Kolkata).

CONSTRAINTS (free only): Open-Meteo only (keyless, free); attribution displayed; if the API is
down → cached values or hidden card, never a broken page.

DONE WHEN: pytest covers proxy cache + rule logic + graceful upstream failure; card renders in
ta/hi/en; demo works offline (cached last response).
```

### B9 — Docker packaging + local one-liner

```text
GOAL: The whole system runnable with a single command on any machine (judges' laptop, lab PC).

CONTEXT: Python backend in server/ (FastAPI, SQLite file), static SPA at repo root, docker
available free.

TASK:
1. server/Dockerfile: python:3.12-slim, non-root user, pip install --no-cache, uvicorn on $PORT,
   HEALTHCHECK against /api/health.
2. docker-compose.yml at root: services api (build server/) + web (nginx:alpine serving the SPA,
   proxying /api to the api service for same-origin simplicity), volume for /data/uzhavan.db,
   env from .env.example; seed runs on first boot.
3. README quickstart: docker compose up → http://localhost:8080.
4. Keep non-Docker path working (uvicorn + Pages).

CONSTRAINTS (free only): base images from Docker Hub free tier; no registry push required;
compose v2 syntax; image < 200MB.

DONE WHEN: fresh clone + docker compose up + browser = full demo in < 60s; data survives
compose down/up (volume); healthcheck reported healthy.
```

### B10 — WhatsApp / SMS order alerts

```text
GOAL: Notify farmers and consumers about order milestones outside the app (WhatsApp/SMS),
reaching users who don't keep the tab open.

CONTEXT: FastAPI notifications table (type order/grade/fpo/system) and the notify helpers;
SMS provider interface from A8 (console/msg91). Many rural users live on WhatsApp.

TASK:
1. notifiers.py: interface send(channel, recipient, text) with channels:
   console (default), msg91-sms (reuse A8 creds), whatsapp-cloud (env
   WHATSAPP_TOKEN/PHONE_ID, free WhatsApp Cloud API tier), each with try/except + audit row.
2. Fire on: order placed (farmer), stage advanced to outForDelivery + delivered (consumer),
   auction won (bidder), donation received (farmer). Deduplicate: max 1 message per
   order+stage per user per day.
3. Preferences per user (settings table column notify_email? no — notify_sms, notify_whatsapp
   booleans) respected; quiet hours 21:00–06:00 Asia/Kolkata.
4. Template texts in en/ta/hi, ≤300 chars, opt-out line (STOP to unsubscribe).

CONSTRAINTS (free only): free tiers only (WhatsApp Cloud API business tier, MSG91 trial);
console channel must keep the demo fully functional without any provider; opt-in required,
never message without consent (privacy law friendly).

DONE WHEN: pytest asserts correct channel chosen per preference, dedupe and quiet hours;
demo with console channel shows messages in logs; provider failures never break order flows.
```

### B11 — Installable consumer app shell (mobile PWA)

```text
GOAL: Consumers get an app-like mobile experience: bottom navigation, push-style reminders,
one-tap reinstall — turning the website into an "app" without app stores.

CONTEXT: SPA responsive layout (sidebar collapses to a menu today); PWA basics from B1
(manifest + service worker) exist or should be created if B1 wasn't run yet.

TASK:
1. Mobile IA: bottom tab bar (Home / Search / Basket / Orders / Profile) under 640px; sidebar
   hidden; touch targets ≥ 44px; safe-area insets for notched phones.
2. Web Push (free, VAPID): server route to subscribe + background push on order stage change;
   graceful no-support path (Safari) → in-app bell only. Must reuse notifications table rows.
3. Reinstall prompt: beforeinstallprompt handling with a polite, dismissable sheet (once/14 days).
4. Performance budget: first paint < 2s on throttled 3G (Lighthouse mobile ≥ 90).

CONSTRAINTS (free only): Web Push via existing browser APIs (no paid push SaaS like OneSignal
paid tiers); no app-store submission; no tracking scripts.

DONE WHEN: Lighthouse mobile ≥ 90; install works on Android; stage-change triggers a push while
the tab is closed; iOS falls back to the in-app bell; all views usable one-handed.
```

### B12 — Multilingual landing + marketing site

```text
GOAL: A fast, SEO-friendly public landing page that explains Uzhavan Direct to farmers,
consumers and judges — in Tamil, Hindi and English.

CONTEXT: repo root SPA behind a login; i18n dictionary in app.js; GitHub Pages hosting (free);
existing demo links (GitHub Pages demo + YouTube video) from the SIH submission.

TASK:
1. landing.html: hero (from the field to your home — 0% middleman commission), 6 feature cards
   (marketplace, auction, demand, chatbot, network, donations), how-it-works 3-step, trust badges
   (OTP verified, ratings, time-bound auctions), FAQ, CTA → app index.html.
2. i18n: language switcher writing ?lang= + localStorage, full ta/hi translations (reuse existing
   dictionary where possible), hreflang tags, <html lang> updated.
3. SEO: title/description/OG/Twitter cards, JSON-LD SoftwareApplication schema, sitemap.xml,
   robots.txt (app pages noindex, landing indexable), descriptive alt text everywhere.
4. Accessibility + speed: semantic HTML, contrast ≥ 4.5:1 in all 3 themes, Lighthouse SEO ≥ 95,
   no JS required to read the page (progressive enhancement).

CONSTRAINTS (free only): no paid SEO/analytics tools; optional free analytics = Cloudflare
web analytics or none; fonts from existing Google Fonts; all assets local or already in repo.

DONE WHEN: Lighthouse SEO ≥ 95, a11y ≥ 95; landing renders with JS disabled; every string visible
in ta/hi/en; links into the app preserve the chosen language.
```

---

## Suggested order at a glance

```
A1 ─▶ A2 ─▶ A3 ─▶ A4 ─▶ A5 ─▶ A6 ─▶ A7 ─▶ A8 ─▶ A9 ─▶ A10 ─▶ A11 ─▶ A12 ─▶ A13
 │      (Group A: PPT parity → features → security → demo → deploy → report)
 │
 └─▶ B1 ─▶ B11 ─▶ B3 ─▶ B4 ─▶ B2 ─▶ B6 ─▶ B7 ─▶ B8 ─▶ B10 ─▶ B5 ─▶ B9 ─▶ B12
          (Group B: mobile/offline → insight → logistics → trust → polish)
```

*Each prompt stands alone — paste it into a new session with the repository available and it
will know exactly what to build, with only free tools allowed.*
