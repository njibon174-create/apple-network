-- supabase/catalog_schema.sql
-- Why: Brand -> Model hierarchy + request-products for Apple Network.
-- Run each block in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ============================================================
-- 1. BRANDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  logo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_sort ON brands(sort_order);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_owner_all" ON brands FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================================
-- 2. MODELS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  full_detail_bn TEXT,
  full_detail_en TEXT,
  launch_year INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_brand ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_public_read" ON models FOR SELECT USING (true);
CREATE POLICY "models_owner_all" ON models FOR ALL TO authenticated USING (is_owner());

-- ============================================================
-- 3. PRODUCTS TABLE — ALTER to add brand_id / model_id
-- ============================================================
-- Add FK columns (nullable-safe so existing rows don't break).
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id) ON DELETE SET NULL;

-- Drop the old TEXT columns once new FK columns are populated (uncomment after migration).
-- ALTER TABLE products DROP COLUMN IF NOT EXISTS brand;
-- ALTER TABLE products DROP COLUMN IF NOT EXISTS brand_en;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_model ON products(model_id);

-- ============================================================
-- 4. REQUEST PRODUCTS TABLE (supplier request tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS request_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expected_price_bdt INT NOT NULL,
  expected_arrival TIMESTAMPTZ,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested',  -- requested | ordered | arrived | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_products_status ON request_products(status);

ALTER TABLE request_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "request_products_public_read" ON request_products FOR SELECT USING (true);
CREATE POLICY "request_products_owner_all" ON request_products FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================================
-- 5. SEED — common Bangladesh-market brands
-- ============================================================
INSERT INTO brands (name_bn, name_en, logo_url, sort_order) VALUES
-- (name_bn, name_en, logo_url, sort_order)
('অ্যাপল', 'Apple', NULL, 1),
('স্যামসাং', 'Samsung', NULL, 2),
('এইচপি', 'HP', NULL, 3),
('অ্যানকার', 'Anker', NULL, 4),
('বেসিয়াস', 'Baseus', NULL, 5),
('টেমপেড আর্টিস্ট', 'Tempered Artist', NULL, 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. HELPER: linked product view (joins brand + model)
-- ============================================================
CREATE OR REPLACE VIEW v_products_catalog AS
SELECT
  p.*,
  b.name_bn AS brand_name_bn,
  b.name_en AS brand_name_en,
  b.logo_url AS brand_logo_url,
  m.name_bn AS model_name_bn,
  m.name_en AS model_name_en,
  m.full_detail_bn AS model_full_detail_bn,
  m.full_detail_en AS model_full_detail_en,
  m.launch_year AS model_launch_year,
  m.is_active AS model_is_active
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN models m ON p.model_id = m.id;

-- ============================================================
-- DONE
-- ============================================================
-- Next steps after running:
-- 1. Insert brand rows (see seed above, or add your own).
-- 2. Insert model rows for each brand (iPhone 15, Galaxy S24, etc.).
-- 3. Populate brand_id / model_id on existing products via admin UI (edit each product).
-- 4. Once all products have brand_id set, uncomment the DROP COLUMN lines above.
