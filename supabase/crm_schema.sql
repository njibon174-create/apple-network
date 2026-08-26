-- supabase/crm_schema.sql
-- Why: extends the schema for the unified CRM + Inventory + Store system.
-- Run in Supabase SQL Editor or via the management API.

-- ============================================
-- ENUM EXTENSIONS
-- ============================================
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'calling';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'credit';

-- ============================================
-- CUSTOMERS (CRM) -- created FIRST so orders can FK to it
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  type TEXT DEFAULT 'walk-in',   -- 'walk-in' | 'online' | 'credit'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);

-- ============================================
-- ORDERS: extra columns (now that customers exists)
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'online'; -- 'online' | 'pos'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid INT DEFAULT 0;

-- ============================================
-- ORDER STATUS LOG (audit trail, shown on tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT SALES (বাকির হিসাব)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_due INT NOT NULL,
  amount_paid INT DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'open',    -- 'open' | 'paid' | 'partial' | 'overdue'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMI (কিস্তি)
-- ============================================
CREATE TABLE IF NOT EXISTS emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_bdt INT NOT NULL,
  months INT NOT NULL,
  monthly_bdt INT NOT NULL,
  paid_months INT DEFAULT 0,
  start_date DATE,
  status TEXT DEFAULT 'active',  -- 'active' | 'completed' | 'defaulted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS: all new tables are owner-only
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_owner" ON customers FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "order_status_log_owner" ON order_status_log FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "credit_sales_owner" ON credit_sales FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "emis_owner" ON emis FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
