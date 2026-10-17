-- BillPulse75 — PostgreSQL schema
-- Mirrors src/types/bill.ts. All money columns are whole VND (no decimals).
-- Safe to re-run: every object is created only if missing.

BEGIN;

-- ─── Users & sessions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL, -- used to log in
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL, -- scrypt, format: scrypt$<salt>$<hash>
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usernames and emails are unique, compared case-insensitively
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));

-- Only a SHA-256 of the session token is stored; the raw token lives in the
-- browser's httpOnly cookie, so a database leak doesn't expose live sessions.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

-- ─── Products ───────────────────────────────────────────────────────────────
-- Shared catalogue: one row per distinct product, keyed by the same normalized
-- name the app builds in normalizeItemKey() (lowercase, accents removed).
-- Holds no personal data; prices live on bill_items, which belong to a user.
CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    normalized_key TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL DEFAULT 'cái',
    category TEXT NOT NULL DEFAULT 'Hàng tiêu dùng',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Bills ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id           BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  merchant_name     TEXT        NOT NULL,
  branch            TEXT,
  bill_number       TEXT,
  bill_date         DATE        NOT NULL,
  bill_time         TIME,
  category          TEXT        NOT NULL DEFAULT 'Other'
                    CHECK (category IN (
                      'Supermarket', 'Groceries', 'Dining & Cafe', 'Utilities',
                      'Electronics & Tech', 'Healthcare & Pharmacy', 'Other'
                    )),
  payment_method    TEXT,
  subtotal          BIGINT      NOT NULL CHECK (subtotal >= 0),
  discount_total    BIGINT      NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  vat               BIGINT      NOT NULL DEFAULT 0 CHECK (vat >= 0),
  total_amount      BIGINT      NOT NULL CHECK (total_amount >= 0),
  confidence_notes  TEXT,
  file_name         TEXT,
  file_type         TEXT        CHECK (file_type IN ('image', 'pdf')),
  -- Where the uploaded receipt is stored (object storage URL/key).
  -- The app's base64 filePreview is deliberately not stored in the database.
  file_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bills_user_date_idx ON bills (user_id, bill_date DESC);

-- ─── Bill items ─────────────────────────────────────────────────────────────
-- raw_name / canonical_name / unit / category are kept as printed on that
-- receipt, so a bill always shows exactly what was scanned even if the
-- product row is later renamed.
CREATE TABLE IF NOT EXISTS bill_items (
  id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bill_id         TEXT          NOT NULL REFERENCES bills (id) ON DELETE CASCADE,
  product_id      BIGINT        NOT NULL REFERENCES products (id),
  line_no         INT           NOT NULL,
  raw_name        TEXT          NOT NULL,
  canonical_name  TEXT          NOT NULL,
  unit            TEXT          NOT NULL DEFAULT 'cái',
  quantity        NUMERIC(10,3) NOT NULL DEFAULT 1 CHECK (quantity > 0), -- fractional for kg
  unit_price      BIGINT        NOT NULL CHECK (unit_price >= 0),
  total_price     BIGINT        NOT NULL CHECK (total_price >= 0),
  discount        BIGINT        NOT NULL DEFAULT 0 CHECK (discount >= 0),
  category        TEXT,
  UNIQUE (bill_id, line_no)
);

CREATE INDEX IF NOT EXISTS bill_items_bill_id_idx ON bill_items (bill_id);

CREATE INDEX IF NOT EXISTS bill_items_product_id_idx ON bill_items (product_id);

-- ─── Views matching the app's price-tracking types ──────────────────────────
-- Both views are per user: always filter by user_id.

-- One row per purchase of a product (PricePoint in src/types/bill.ts).
CREATE OR REPLACE VIEW item_price_history AS
SELECT
    b.user_id,
    bi.product_id,
    p.canonical_name,
    b.bill_date AS date,
    bi.unit_price,
    b.merchant_name AS store,
    b.id AS bill_id,
    bi.quantity,
    bi.total_price,
    b.created_at
FROM
    bill_items bi
    JOIN bills b ON b.id = bi.bill_id
    JOIN products p ON p.id = bi.product_id;

-- One row per user × product with latest vs previous price (PriceTrendSummary).
-- Purchases are ordered the same way the app does: by bill date, oldest first.
CREATE OR REPLACE VIEW product_price_trends AS
WITH ordered AS (
  SELECT
    h.*,
    LAG(h.unit_price) OVER w  AS previous_unit_price,
    ROW_NUMBER() OVER (PARTITION BY h.user_id, h.product_id
                       ORDER BY h.date DESC, h.created_at DESC) AS recency
  FROM item_price_history h
  WINDOW w AS (PARTITION BY h.user_id, h.product_id ORDER BY h.date, h.created_at)
),
stats AS (
  SELECT
    user_id,
    product_id,
    MIN(unit_price)                AS min_price,
    MAX(unit_price)                AS max_price,
    ROUND(AVG(unit_price))::BIGINT AS avg_price,
    SUM(quantity)                  AS total_quantity_bought,
    SUM(total_price)               AS total_spent,
    COUNT(*)                       AS purchase_count
  FROM item_price_history
  GROUP BY user_id, product_id
)
SELECT
  o.user_id,
  p.id                                        AS product_id,
  p.canonical_name,
  p.unit,
  p.category,
  o.unit_price                                AS current_unit_price,
  o.previous_unit_price,
  COALESCE(o.unit_price - o.previous_unit_price, 0) AS price_diff,
  CASE
    WHEN o.previous_unit_price > 0
      THEN ROUND((o.unit_price - o.previous_unit_price) * 100.0 / o.previous_unit_price, 2)
    ELSE 0
  END                                         AS percent_change,
  CASE
    WHEN o.previous_unit_price IS NULL            THEN 'NEW'
    WHEN o.unit_price > o.previous_unit_price     THEN 'INCREASED'
    WHEN o.unit_price < o.previous_unit_price     THEN 'DECREASED'
    ELSE 'UNCHANGED'
  END                                         AS status,
  s.min_price,
  s.max_price,
  s.avg_price,
  o.date                                      AS last_purchased_date,
  o.store                                     AS last_store,
  s.total_quantity_bought,
  s.total_spent,
  s.purchase_count
FROM ordered o
JOIN products p ON p.id = o.product_id
JOIN stats    s ON s.user_id = o.user_id AND s.product_id = o.product_id
WHERE o.recency = 1;

COMMIT;