-- Uzhavan Direct — PostgreSQL schema (idempotent: safe to run on every start)

CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  name              TEXT        NOT NULL,
  phone             TEXT        NOT NULL UNIQUE,
  password_hash     TEXT        NOT NULL,
  role              TEXT        NOT NULL CHECK (role IN ('farmer', 'consumer', 'fpo')),
  village           TEXT,                       -- village / city
  address           TEXT,
  bio               TEXT,
  is_phone_verified BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP verification codes (SMS delivery is stubbed — see src/routes/auth.js)
CREATE TABLE IF NOT EXISTS otp_codes (
  id          SERIAL PRIMARY KEY,
  phone       TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes (phone);

CREATE TABLE IF NOT EXISTS produce (
  id             SERIAL PRIMARY KEY,
  farmer_id      INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  category       TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  quantity       NUMERIC     NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit           TEXT        NOT NULL DEFAULT 'kg',
  price          NUMERIC     NOT NULL CHECK (price >= 0),
  perishability  TEXT,
  image_url      TEXT,
  location       TEXT,
  is_sold        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_produce_farmer ON produce (farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_category ON produce (category);

CREATE TABLE IF NOT EXISTS auctions (
  id                SERIAL PRIMARY KEY,
  farmer_id         INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  produce_id        INTEGER     NOT NULL REFERENCES produce (id) ON DELETE CASCADE,
  base_rate         NUMERIC     NOT NULL CHECK (base_rate >= 0),
  unit              TEXT        NOT NULL DEFAULT 'kg',
  quantity          NUMERIC     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  highest_bid       NUMERIC,
  highest_bidder_id INTEGER     REFERENCES users (id) ON DELETE SET NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  is_closed         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auctions_farmer ON auctions (farmer_id);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON auctions (ends_at);

-- fpo_batches is declared BEFORE orders because orders.fpo_batch_id references it.
CREATE TABLE IF NOT EXISTS fpo_batches (
  id                     SERIAL PRIMARY KEY,
  fpo_id                 INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  source_cluster         TEXT        NOT NULL,
  destination_hub        TEXT        NOT NULL,
  consolidated_weight_kg NUMERIC     NOT NULL DEFAULT 0 CHECK (consolidated_weight_kg >= 0),
  vehicle_type           TEXT,
  transit_status         TEXT        NOT NULL DEFAULT 'loading',
  orders_list            JSONB       NOT NULL DEFAULT '[]',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fpo_batches_fpo ON fpo_batches (fpo_id);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  consumer_id     INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  farmer_id       INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  fpo_id          INTEGER     REFERENCES users (id) ON DELETE SET NULL,
  produce_id      INTEGER     NOT NULL REFERENCES produce (id) ON DELETE CASCADE,
  quantity        NUMERIC     NOT NULL CHECK (quantity > 0),
  unit            TEXT        NOT NULL DEFAULT 'kg',
  total_price     NUMERIC     NOT NULL CHECK (total_price >= 0),
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'refunded')),
  delivery_stage  TEXT        NOT NULL DEFAULT 'placed'
                  CHECK (delivery_stage IN
                    ('placed', 'confirmed', 'packed', 'atFarmerCity', 'atFpo', 'outForDelivery', 'delivered')),
  address         TEXT,
  delivery_timing TEXT,
  -- ---------------------------------------------------------------------
  -- FPO lifecycle columns: the three tier steps recorded per order.
  --   Tier-1  first-mile collection  → fpo_grade / fpo_weigh_kg / fpo_graded_at
  --   Tier-2  corridor batching      → fpo_batch_id / fpo_corridor / fpo_vehicle
  --   Tier-3  destination hub        → fpo_ev_agent / fpo_ev_assigned_at
  -- ---------------------------------------------------------------------
  -- NOTE: the checks are written NULL-safely (`IS NULL OR …`). Standard SQL
  -- passes a CHECK when it evaluates to NULL, but some engines (and pg-mem in
  -- the test suite) do not — being explicit keeps a plain INSERT, which leaves
  -- these columns empty, valid everywhere.
  fpo_grade          TEXT    CHECK (fpo_grade IS NULL OR fpo_grade IN ('A', 'B', 'C')),
  fpo_weigh_kg       NUMERIC CHECK (fpo_weigh_kg IS NULL OR fpo_weigh_kg >= 0),
  fpo_graded_at      TIMESTAMPTZ,
  fpo_batch_id       INTEGER REFERENCES fpo_batches (id) ON DELETE SET NULL,
  fpo_corridor       TEXT,
  fpo_vehicle        TEXT,
  fpo_ev_agent       TEXT,
  fpo_ev_assigned_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_consumer ON orders (consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders (farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_fpo ON orders (fpo_id);
CREATE INDEX IF NOT EXISTS idx_orders_fpo_batch ON orders (fpo_batch_id);

-- ---------------------------------------------------------------------------
-- In-app notifications (bell in the topbar). Deliberately minimal: no push,
-- email or SMS — these rows only feed the existing dropdown.
--   user_id   recipient (the farmer, consumer or FPO who sees the badge)
--   type      grouping shown in the dropdown: order | grade | fpo | system
--   order_id  set when the alert is about one specific order
--   batch_id  set when the alert is about one corridor shipment
-- order_id/batch_id are ON DELETE SET NULL so deleting an order never
-- destroys the alert history it produced.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'info'
             CHECK (type IN ('order', 'grade', 'fpo', 'system')),
  message    TEXT        NOT NULL,
  order_id   INTEGER     REFERENCES orders (id) ON DELETE SET NULL,
  batch_id   INTEGER     REFERENCES fpo_batches (id) ON DELETE SET NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read);

-- ---------------------------------------------------------------------------
-- MIGRATION: FPO tier columns for databases created before they existed.
-- `CREATE TABLE IF NOT EXISTS` above cannot add columns to an existing table,
-- so these idempotent ALTERs upgrade an older orders table in place. On a
-- fresh database every statement is a no-op (the columns already exist).
-- ---------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_grade          TEXT    CHECK (fpo_grade IS NULL OR fpo_grade IN ('A', 'B', 'C'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_weigh_kg       NUMERIC CHECK (fpo_weigh_kg IS NULL OR fpo_weigh_kg >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_graded_at      TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_batch_id       INTEGER REFERENCES fpo_batches (id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_corridor       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_vehicle        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_ev_agent       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fpo_ev_assigned_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_fpo_batch ON orders (fpo_batch_id);

-- MIGRATION: notifications did not exist before this step either.
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'info'
             CHECK (type IN ('order', 'grade', 'fpo', 'system')),
  message    TEXT        NOT NULL,
  order_id   INTEGER     REFERENCES orders (id) ON DELETE SET NULL,
  batch_id   INTEGER     REFERENCES fpo_batches (id) ON DELETE SET NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read);
