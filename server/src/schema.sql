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
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_consumer ON orders (consumer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders (farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_fpo ON orders (fpo_id);

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
