-- supabase/schema.sql
-- Why: complete database schema for Apple Network e-commerce.
-- Run this in Supabase SQL Editor after creating the project.

-- ============================================
-- ENUMS & TYPES
-- ============================================
CREATE TYPE product_condition AS ENUM ('new_official', 'new_unofficial', 'used_excellent', 'used_good');
CREATE TYPE order_status AS ENUM ('confirmed', 'preparing', 'shipping', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cod', 'bkash', 'nagad', 'card', 'emi');

-- ============================================
-- CORE TABLES
-- ============================================

-- Categories (phones, accessories, laptops, etc.)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon_name TEXT,               -- lucide icon name
  description_bn TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (phones, accessories, etc.)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  name_bn TEXT,
  brand TEXT NOT NULL,
  brand_en TEXT,
  desc_bn TEXT NOT NULL,
  desc_en TEXT,
  image_primary TEXT NOT NULL,   -- main product image URL
  image_gallery TEXT[],          -- additional images
  price_bdt INT NOT NULL,        -- current price in BDT
  regular_price_bdt INT,         -- crossed-out price
  condition product_condition NOT NULL DEFAULT 'new_official',
  colors TEXT[],                 -- available colors
  storages TEXT[],               -- available storages
  rams TEXT[],                   -- available RAMs
  specs JSONB,                   -- key:value spec pairs
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  emi_from_bdt INT,              -- monthly EMI starting from
  badge TEXT,                    -- hot / top / demand / choice / excellent / good / NULL
  tags TEXT[],                   -- search tags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart (server-side cart for logged-in users)
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,               -- for guest carts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color TEXT,
  storage TEXT,
  ram TEXT,
  condition product_condition,
  qty INT DEFAULT 1 CHECK (qty > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id, color, storage, ram, condition)
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,  -- e.g. AN-20260824-0001
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,                     -- guest orders
  status order_status DEFAULT 'confirmed',
  subtotal_bdt INT NOT NULL,
  shipping_bdt INT DEFAULT 0,
  discount_bdt INT DEFAULT 0,
  total_bdt INT NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending/paid/failed/refunded
  payment_ref TEXT,                      -- bKash/Nagad transaction ID
  emi_bank TEXT,                         -- if EMI
  emi_months INT,                        -- if EMI
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_division TEXT NOT NULL,
  shipping_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,      -- snapshot at order time
  product_image TEXT,
  color TEXT,
  storage TEXT,
  ram TEXT,
  condition product_condition,
  unit_price_bdt INT NOT NULL,
  qty INT DEFAULT 1 CHECK (qty > 0),
  line_total_bdt INT NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Categories: public read
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);

-- Products: public read
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);

-- Carts: users see only their own (or their session)
CREATE POLICY "carts_own" ON carts FOR ALL USING (
  auth.uid() = user_id OR session_id = current_setting('request.jwt.claims.session_id', true)
) WITH CHECK (
  auth.uid() = user_id OR session_id = current_setting('request.jwt.claims.session_id', true)
);

CREATE POLICY "cart_items_own" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR carts.session_id = current_setting('request.jwt.claims.session_id', true)))
) WITH CHECK (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR carts.session_id = current_setting('request.jwt.claims.session_id', true)))
);

-- Orders: users see their own
CREATE POLICY "orders_own" ON orders FOR SELECT USING (
  auth.uid() = user_id OR session_id = current_setting('request.jwt.claims.session_id', true)
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_own" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR orders.session_id = current_setting('request.jwt.claims.session_id', true)))
);

-- Reviews: public read, authenticated write
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_condition ON products(condition);
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate order number: AN-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
  today TEXT := to_char(NOW(), 'YYYYMMDD');
  seq INT;
BEGIN
  SELECT COALESCE(MAX(substring(order_number FROM 'AN-' || today || '-(\d+)')::int), 0) + 1
  INTO seq
  FROM orders
  WHERE order_number LIKE 'AN-' || today || '-%';
  RETURN 'AN-' || today || '-' || lpad(seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order_number on insert
CREATE OR REPLACE FUNCTION set_order_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- ============================================
-- SEED DATA (matches lib/data.js)
-- ============================================
-- Categories
INSERT INTO categories (slug, name_bn, name_en, icon_name, description_bn, sort_order) VALUES
('phones', 'মোবাইল ফোন', 'Phones', 'Smartphone', 'নতুন ও পুরানো, অফিশিয়াল ও আনঅফিশিয়াল', 1),
('accessories', 'এক্সেসরি', 'Accessories', 'Headphones', 'চার্জার, কেস, ইয়ারফোন, পাওয়ার ব্যাংক', 2),
('laptops', 'ল্যাপটপ', 'Laptops', 'Laptop', 'সকল ব্র্যান্ডের ল্যাপটপ', 3),
('tablets', 'ট্যাবলেট', 'Tablets', 'Tablet', 'Android ও iPad ট্যাবলেট', 4),
('watches', 'স্মার্ট ওয়াচ', 'Smart Watches', 'Watch', 'স্মার্ট ওয়াচ ও ফিটনেস ব্যান্ড', 5),
('tvs', 'টেলিভিশন', 'TVs', 'Tv', 'স্মার্ট টিভি ও অ্যান্ড্রয়েড টিভি', 6),
('audio', 'অডিও', 'Audio', 'Headphones', 'হেডফোন, স্পিকার, ইয়ারবাডস', 7);

-- Products (trimmed sample — full list in lib/data.js)
INSERT INTO products (slug, category_id, name, name_bn, brand, brand_en, desc_bn, image_primary, price_bdt, regular_price_bdt, condition, colors, storages, rams, specs, rating, review_count, emi_from_bdt, badge, tags) VALUES
('samsung-galaxy-a24', (SELECT id FROM categories WHERE slug='phones'), 'Samsung Galaxy A24', 'Samsung Galaxy A24', 'Samsung', 'Samsung', 'সাংগ দিনের ব্যাটারি, ৯০Hz ডিসপ্লে, ৫০MP ক্যামেরা', '/images/products/samsung.png', 22900, 24900, 'new_official', ARRAY['ব্ল্যাক', 'সিলভার', 'গ্রিন', 'ব্লু'], ARRAY['128GB'], ARRAY['6GB'], '{"Display":"6.5\" Super AMOLED 90Hz","Processor":"MediaTek Helio G99","RAM":"6GB","Storage":"128GB","Camera":"50MP+5MP+2MP","Battery":"5000mAh 25W"}', 4.3, 124, 1950, 'hot', ARRAY['samsung','mid-range','90hz']),
('iphone-15', (SELECT id FROM categories WHERE slug='phones'), 'iPhone 15 128GB', 'iPhone 15 ১২৮GB', 'Apple', 'Apple', 'Dynamic Island, A16 Bionic, USB-C', '/images/products/iphone.png', 114900, NULL, 'new_official', ARRAY['ব্লু', 'পিংক', 'ইয়েলো', 'গ্রিন', 'ব্ল্যাক'], ARRAY['128GB','256GB','512GB'], ARRAY['6GB'], '{"Display":"6.1\" Super Retina XDR","Processor":"A16 Bionic","Storage":"128GB","Camera":"48MP+12MP","USB":"USB-C"}', 4.8, 89, 3190, 'choice', ARRAY['apple','flagship','dynamic-island']),
('iphone-13-used', (SELECT id FROM categories WHERE slug='phones'), 'iPhone 13 (প্রিলাভড)', 'iPhone 13 (প্রিলাভড)', 'Apple', 'Apple', 'ব্যাটারি হেলথ ৯০%+, বক্স ও অ্যাকসেসরি সহ', '/images/products/iphone.png', 62000, 68000, 'used_excellent', ARRAY['স্টারলাইট', 'মিডনাইট', 'ব্লু', 'পিংক', 'রেড'], ARRAY['128GB','256GB'], ARRAY['4GB'], '{"Display":"6.1\" Super Retina XDR","Processor":"A15 Bionic","Storage":"128GB","Camera":"12MP+12MP"}', 4.5, 67, 1720, 'excellent', ARRAY['apple','preloved','budget-flagship']),
('tempered-glass-universal', (SELECT id FROM categories WHERE slug='accessories'), 'টেম্পারড গ্লাস স্ক্রিন প্রোটেক্টর', 'টেম্পারড গ্লাস', 'Universal', 'Universal', '৯H হার্ডনেস, ফিঙ্গারপ্রিন্ট রেজিস্ট্যান্ট', '/images/products/charger.png', 250, 350, 'new_official', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], '{"Hardness":"9H","Thickness":"0.33mm","Type":"Full Cover"}', 4.2, 203, NULL, 'demand', ARRAY['protector','screen']),
('fast-charger-25w', (SELECT id FROM categories WHERE slug='accessories'), '২৫W ফাস্ট চার্জার (USB-C)', '২৫W ফাস্ট চার্জার', 'Samsung', 'Samsung', 'PPS সাপোর্ট, স্মার্টফোনের সাথে কম্প্যাটিবল', '/images/products/charger.png', 1200, 1500, 'new_official', ARRAY['সাদা'], ARRAY[]::text[], ARRAY[]::text[], '{"Power":"25W","Port":"USB-C","Protocol":"PD+PPS"}', 4.6, 145, NULL, NULL, ARRAY['charger','fast-charge']),
('anker-powerbank-10000', (SELECT id FROM categories WHERE slug='accessories'), 'Anker PowerCore 10000mAh', 'Anker PowerCore ১০০০০mAh', 'Anker', 'Anker', 'কম্প্যাক্ট, PowerIQ, USB-C ইন/আউট', '/images/products/powerbank.png', 2850, 3200, 'new_official', ARRAY['ব্ল্যাক'], ARRAY[]::text[], ARRAY[]::text[], '{"Capacity":"10000mAh","Output":"USB-C 18W + USB-A 12W","Input":"USB-C 18W"}', 4.7, 92, NULL, 'top', ARRAY['powerbank','anker']),
('samsung-watch6', (SELECT id FROM categories WHERE slug='watches'), 'Samsung Galaxy Watch6 40mm', 'Samsung Galaxy Watch6 ৪০mm', 'Samsung', 'Samsung', 'BioActive Sensor, Sleep Coaching, LTE অপশন', '/images/products/watch.png', 28900, 31900, 'new_official', ARRAY['গ্রাফাইট', 'সিলভার', 'গোল্ড'], ARRAY[]::text[], ARRAY[]::text[], '{"Display":"1.3\" Super AMOLED","Battery":"300mAh","Sensors":"BioActive (HR, ECG, BIA)"}', 4.4, 56, 790, NULL, ARRAY['samsung','wearable']),
('samsung-galaxy-tab-a9', (SELECT id FROM categories WHERE slug='tablets'), 'Samsung Galaxy Tab A9 8.7"', 'Samsung Galaxy Tab A9 ৮.৭"', 'Samsung', 'Samsung', 'কম্প্যাক্ট ট্যাবলেট, Dolby Atmos, ৫১০০mAh', '/images/products/tablet.png', 18900, 20900, 'new_official', ARRAY['গ্রাফাইট', 'সিলভার', 'নেভি'], ARRAY['64GB','128GB'], ARRAY['4GB'], '{"Display":"8.7\" WXGA+","Processor":"MediaTek Helio G99","Battery":"5100mAh"}', 4.1, 34, 510, NULL, ARRAY['samsung','tablet','compact']),
('tempered-glass-iphone', (SELECT id FROM categories WHERE slug='accessories'), 'iPhone টেম্পারড গ্লাস (Full Cover)', 'iPhone টেম্পারড গ্লাস', 'Universal', 'Universal', 'Dynamic Island কাটআউট, ৯H, এন্টি-গ্লেয়ার', '/images/products/charger.png', 350, 450, 'new_official', ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], '{"Hardness":"9H","Compatibility":"iPhone 14/15 Series"}', 4.3, 112, NULL, 'good', ARRAY['iphone','protector']),
('wireless-earbuds', (SELECT id FROM categories WHERE slug='audio'), 'ব אחריםss Bluetooth ইয়ারবাডস', 'বলuetooth ইয়ারবাডস', 'Baseus', 'Baseus', 'ENC নয়েজ ক্যাঞ্চেলেশন, ৩০ ঘন্টা ব্যাটারি', '/images/products/earbuds.png', 2200, 2800, 'new_official', ARRAY['সাদা', 'ব্ল্যাক'], ARRAY[]::text[], ARRAY[]::text[], '{"Driver":"10mm","Battery":"6h (30h case)","ANC":"ENC","Bluetooth":"5.3"}', 4.5, 78, NULL, 'new', ARRAY['earbuds','bluetooth','anc']),
('hp-laptop-15s', (SELECT id FROM categories WHERE slug='laptops'), 'HP 15s-fq5000 (i5 12th Gen)', 'HP ১৫s i5 ১২th Gen', 'HP', 'HP', '১৫.৬" FHD, ৮GB RAM, ৫১২GB SSD', '/images/products/laptop.png', 58900, 62900, 'new_official', ARRAY['সিলভার'], ARRAY['512GB'], ARRAY['8GB'], '{"Processor":"Intel Core i5-1235U","RAM":"8GB DDR4","Storage":"512GB NVMe SSD","Display":"15.6\" FHD"}', 4.2, 29, 1630, NULL, ARRAY['hp','laptop','student']),
('samsung-tv-43', (SELECT id FROM categories WHERE slug='tvs'), 'Samsung 43" Crystal UHD 4K', 'Samsung ৪৩" ৪K টিভি', 'Samsung', 'Samsung', 'PurColor, Motion Xcelerator, Tizen OS', '/images/products/tv.png', 38900, 42900, 'new_official', ARRAY['টাইটান গ্রে'], ARRAY[]::text[], ARRAY[]::text[], '{"Display":"43\" 4K UHD","OS":"Tizen","HDR":"HDR10+","Audio":"20W"}', 4.6, 41, 1080, NULL, ARRAY['samsung','tv','4k']);

-- ============================================
-- VIEWS
-- ============================================
CREATE VIEW v_products_full AS
SELECT p.*, c.slug AS category_slug, c.name_bn AS category_name_bn, c.name_en AS category_name_en
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.in_stock = true;

-- ============================================
-- DONE
-- ============================================
-- After running this:
-- 1. Enable "Email" auth provider in Supabase Auth
-- 2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
-- 3. Deploy!