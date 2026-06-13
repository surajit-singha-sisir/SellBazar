-- SellBazar — Neon Serverless Postgres Schema
-- Run this once in the Neon SQL editor before deploying.

-- ── Products ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            TEXT        PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  name_bn       TEXT        NOT NULL DEFAULT '',
  description   TEXT        NOT NULL DEFAULT '',
  price         NUMERIC     NOT NULL,
  sale_price    NUMERIC     NOT NULL DEFAULT 0,
  category      TEXT        NOT NULL DEFAULT '',
  subcategory   TEXT        NOT NULL DEFAULT '',
  category_bn   TEXT        NOT NULL DEFAULT '',
  brand         TEXT        NOT NULL DEFAULT '',
  seller        TEXT        NOT NULL DEFAULT '',
  stock         INTEGER     NOT NULL DEFAULT 0,
  rating        NUMERIC     NOT NULL DEFAULT 4.5,
  review_count  INTEGER     NOT NULL DEFAULT 0,
  location      TEXT        NOT NULL DEFAULT 'Dhaka',
  delivery_days INTEGER     NOT NULL DEFAULT 3,
  is_new        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,
  tags          JSONB       NOT NULL DEFAULT '[]',
  images        JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category    ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products (subcategory);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products (is_featured);

-- ── Orders ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT        PRIMARY KEY,
  customer        JSONB       NOT NULL DEFAULT '{}',
  items           JSONB       NOT NULL DEFAULT '[]',
  subtotal        NUMERIC     NOT NULL DEFAULT 0,
  shipping        NUMERIC     NOT NULL DEFAULT 0,
  discount        NUMERIC     NOT NULL DEFAULT 0,
  coupon_code     TEXT,
  total           NUMERIC     NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'pending',
  payment_method  TEXT        NOT NULL DEFAULT 'cod',
  payment_status  TEXT        NOT NULL DEFAULT 'pending',
  notes           TEXT        NOT NULL DEFAULT '',
  tracking_number TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL UNIQUE,
  phone      TEXT        NOT NULL DEFAULT '',
  division   TEXT        NOT NULL DEFAULT 'Dhaka',
  password   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT        PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  name_bn       TEXT        NOT NULL DEFAULT '',
  icon          TEXT        NOT NULL DEFAULT 'fa-tag',
  color         TEXT        NOT NULL DEFAULT '#6b7280',
  subcategories JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            TEXT        PRIMARY KEY,
  product_id    TEXT        NOT NULL,
  product_slug  TEXT        NOT NULL,
  product_name  TEXT        NOT NULL DEFAULT '',
  order_id      TEXT        NOT NULL,
  user_id       TEXT        NOT NULL,
  user_name     TEXT        NOT NULL DEFAULT 'Anonymous',
  user_email    TEXT        NOT NULL DEFAULT '',
  rating        NUMERIC     NOT NULL,
  title         TEXT        NOT NULL DEFAULT '',
  body          TEXT        NOT NULL DEFAULT '',
  images        JSONB       NOT NULL DEFAULT '[]',
  status        TEXT        NOT NULL DEFAULT 'pending',
  helpful       INTEGER     NOT NULL DEFAULT 0,
  admin_note    TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_slug ON reviews (product_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id      ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id     ON reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status       ON reviews (status);

-- ── Banners ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id            TEXT        PRIMARY KEY,
  tag           TEXT        NOT NULL DEFAULT '',
  title         TEXT        NOT NULL,
  subtitle      TEXT        NOT NULL DEFAULT '',
  cta           TEXT        NOT NULL DEFAULT 'Shop Now',
  link          TEXT        NOT NULL DEFAULT '/',
  image         TEXT        NOT NULL,
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  display_order INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners (active);

-- ── Per-user cart ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_carts (
  user_id    TEXT        PRIMARY KEY,
  cart       JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Per-user wishlist ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_wishlists (
  user_id    TEXT        PRIMARY KEY,
  wishlist   JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
