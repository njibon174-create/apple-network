-- supabase/modules_schema.sql
-- Why: extends Apple Network schema with Returns Management, Credit Management,
-- CashBook enhancements, and Reports foundation. Run in Supabase SQL Editor.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout).

-- ============================================================
-- 1. RETURNS MANAGEMENT — enhance existing returns table
-- ============================================================

-- Add status, condition, returned_at, processed_by to track full lifecycle.
ALTER TABLE returns ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'restocked'));
ALTER TABLE returns ADD COLUMN IF NOT EXISTS condition TEXT
  CHECK (condition IN ('new', 'like_new', 'good', 'damaged'));
ALTER TABLE returns ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS qty INT NOT NULL DEFAULT 1 CHECK (qty > 0);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_returned_at ON returns(returned_at);

-- Return status audit log (tracks every status transition).
CREATE TABLE IF NOT EXISTS return_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE return_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "return_status_log_owner" ON return_status_log
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================================
-- 2. CREDIT MANAGEMENT — credit memos + payment tracking
-- ============================================================

-- Credit memos: issue a credit memo against a credit sale (partial refund / adjustment).
CREATE TABLE IF NOT EXISTS credit_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount_bdt INT NOT NULL CHECK (amount_bdt > 0),
  reason TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE credit_memos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_memos_owner" ON credit_memos
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- Payment tracking: each payment made against a credit sale.
CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE CASCADE,
  amount_bdt INT NOT NULL CHECK (amount_bdt > 0),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  method TEXT,                -- cod | bkash | nagad | cash | card
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_payments_owner" ON credit_payments
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_sale ON credit_payments(credit_sale_id);

-- ============================================================
-- 3. CASHBOOK — already exists (cash_transactions). Enhance categorization.
-- ============================================================

-- Add a 'channel' column to cash_transactions for sales-by-channel tracking.
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS channel TEXT
  CHECK (channel IN ('online', 'pos', 'credit', 'emi', 'capital', 'refund', 'expense', 'other'));

-- Add 'source_order_id' for linking cash to orders.
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS source_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================================
-- 4. REPORTS — views for P&L, sales by channel, credit outstanding, inventory valuation
-- ============================================================

-- Inventory valuation view: product_id, name, qty on hand, avg cost, total value.
CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT
  sl.product_id,
  p.name AS product_name,
  p.brand,
  sl.qty AS qty_on_hand,
  sl.avg_cost_bdt,
  (sl.qty * sl.avg_cost_bdt) AS total_value_bdt
FROM stock_ledger sl
JOIN products p ON p.id = sl.product_id
WHERE sl.qty > 0;

-- Sales by channel summary view.
CREATE OR REPLACE VIEW v_sales_by_channel AS
SELECT
  COALESCE(ct.channel, 'other') AS channel,
  COUNT(*) AS transaction_count,
  SUM(ct.amount_bdt) AS total_amount_bdt
FROM cash_transactions ct
WHERE ct.type = 'sale'
GROUP BY COALESCE(ct.channel, 'other');

-- Credit outstanding summary view (combines credit_sales + emis).
CREATE OR REPLACE VIEW v_credit_outstanding AS
SELECT
  cs.id,
  cs.customer_id,
  c.name AS customer_name,
  c.phone,
  cs.total_due,
  cs.amount_paid,
  (cs.total_due - cs.amount_paid) AS outstanding_bdt,
  cs.due_date,
  cs.status,
  cs.created_at,
  NULL AS emi_total_bdt,
  NULL AS emi_outstanding_bdt
FROM credit_sales cs
LEFT JOIN customers c ON c.id = cs.customer_id
UNION ALL
SELECT
  e.id,
  e.customer_id,
  c.name AS customer_name,
  c.phone,
  NULL AS total_due,
  NULL AS amount_paid,
  (e.total_bdt - e.monthly_bdt * e.paid_months) AS outstanding_bdt,
  NULL AS due_date,
  e.status,
  e.created_at,
  e.total_bdt AS emi_total_bdt,
  (e.total_bdt - e.monthly_bdt * e.paid_months) AS emi_outstanding_bdt
FROM emis e
LEFT JOIN customers c ON c.id = e.customer_id;

-- Returns summary view.
CREATE OR REPLACE VIEW v_returns_summary AS
SELECT
  r.id,
  r.order_id,
  r.order_number,
  r.product_name,
  r.reason,
  r.condition,
  r.qty,
  r.refund_bdt,
  r.restock,
  r.status,
  r.returned_at,
  r.created_at,
  r.processed_by
FROM returns r;

-- Profit & Loss summary (period-based, reusable by reports page).
CREATE OR REPLACE VIEW v_pl_summary AS
SELECT
  COALESCE(SUM(oi.line_total_bdt), 0) AS revenue,
  COALESCE(SUM(oi.qty * sl.avg_cost_bdt), 0) AS cogs,
  COALESCE(SUM(ex.amount_bdt), 0) AS expenses
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN stock_ledger sl ON sl.product_id = oi.product_id
LEFT JOIN expenses ex ON ex.created_at >= (SELECT MIN(o2.created_at) FROM orders o2)
  AND ex.created_at <= (SELECT MAX(o2.created_at) FROM orders o2)
WHERE o.status != 'cancelled';

-- ============================================================
-- DONE
-- ============================================================
