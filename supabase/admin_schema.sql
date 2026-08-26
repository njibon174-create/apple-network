-- supabase/admin_schema.sql
-- Why: admin panel backend. Adds owner auth (profiles + role), customer message inbox,
-- and the accounting/inventory foundation (purchases, stock_ledger, expenses,
-- cash_transactions, returns). Phase A uses profiles + inquiries + orders; later
-- phases use the rest. Run in Supabase SQL Editor (or via the management API).

-- ============================================
-- ADMIN / AUTH
-- ============================================

-- Profiles: one row per auth user, with role.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',   -- 'owner' | 'staff'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row when a new auth user signs up.
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'owner'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS for profiles: each user sees/updates only their own row. NOTE: do NOT add an
-- "owner sees all profiles" policy that queries `profiles` inside its own USING
-- clause — that causes infinite recursion ("infinite recursion detected in policy
-- for relation profiles"). is_owner() is SECURITY DEFINER so its internal profiles
-- lookup bypasses RLS.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_write" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper: is the current user an owner? Used by other admin-table policies.
-- SECURITY DEFINER so the internal profiles lookup does not recurse on RLS.
CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- CUSTOMER MESSAGES / INQUIRIES (site contact-form inbox)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  order_number TEXT,                -- optional: linked to an order
  status TEXT DEFAULT 'new',        -- new | replied | closed
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
-- Public can insert (contact form); only owner can read/update.
CREATE POLICY "inquiries_insert" ON inquiries FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "inquiries_owner" ON inquiries FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================
-- CUSTOMERS / CRM (auto-created from POS & online orders)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '—',
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'walk-in',        -- walk-in | credit | emi
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_key ON customers(phone) WHERE phone IS NOT NULL AND phone <> '';

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_owner" ON customers FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
-- Public insert: guest checkout (website) registers the buyer by phone. The phone is
-- the unique CRM key (partial unique index on non-null phone). Select is owner-only so
-- customer PII is not exposed to the public; the anon insert above is enough for signup.
CREATE POLICY "customers_insert" ON customers FOR INSERT TO public WITH CHECK (true);

-- Link orders to customers (POS sets this; online guest orders stay NULL).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

-- Owner can manage all orders (POS admin updates). Public guest INSERT stays via
-- the permissive orders_insert policy already in schema.sql — this ADDs owner write
-- without touching the public insert path (separate policies, never AND-ed on INSERT).
CREATE POLICY IF NOT EXISTS "orders_owner" ON orders FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY IF NOT EXISTS "order_items_owner" ON order_items FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- Status audit log: every lifecycle change is recorded (new->calling->confirmed->...).
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_status_log_owner" ON order_status_log FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- Credit receivables (বাকি) + EMI schedule.
CREATE TABLE IF NOT EXISTS credit_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_due INT NOT NULL,
  amount_paid INT NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',         -- open | partial | paid
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_owner" ON credit_sales FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

CREATE TABLE IF NOT EXISTS emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_bdt INT NOT NULL,
  months INT NOT NULL,
  monthly_bdt INT NOT NULL,
  paid_months INT NOT NULL DEFAULT 0,
  start_date DATE,
  status TEXT NOT NULL DEFAULT 'active',       -- active | completed | defaulted
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emis_owner" ON emis FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,        -- snapshot
  supplier TEXT,
  qty INT NOT NULL CHECK (qty > 0),
  unit_cost_bdt INT NOT NULL,        -- cost price paid
  total_cost_bdt INT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 0,
  avg_cost_bdt INT NOT NULL DEFAULT 0,  -- weighted-average cost (for COGS / P&L)
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACCOUNTING: CASH, EXPENSES, RETURNS
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,            -- rent | salary | utility | transport | misc | other
  amount_bdt INT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                -- sale | expense | capital_in | capital_out | refund
  amount_bdt INT NOT NULL,
  ref TEXT,                          -- order_number / expense note
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  product_name TEXT,
  reason TEXT,
  refund_bdt INT NOT NULL DEFAULT 0,
  restock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: all accounting/inventory tables are owner-only.
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_owner" ON purchases FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "stock_ledger_owner" ON stock_ledger FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "expenses_owner" ON expenses FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "cash_owner" ON cash_transactions FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
CREATE POLICY "returns_owner" ON returns FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());
