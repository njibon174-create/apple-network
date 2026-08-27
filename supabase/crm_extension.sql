-- supabase/crm_extension.sql
-- Why: adds the multi-phone, multi-address, type-history and activity-log tables
-- on top of the existing customers table (owned by supabase/crm_schema.sql).
-- Run in Supabase SQL Editor after the base CRM schema is deployed.
-- All tables are owner-only via is_owner() (defined in admin_schema.sql).

-- ============================================
-- CUSTOMER PHONES (multiple mobile numbers per customer)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_phones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  label       TEXT,                   -- e.g. 'মূল', 'বিকলাঙ্গ', 'কর্ম'
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,  -- the canonical number shown on the profile
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_phones_customer ON customer_phones(customer_id);

ALTER TABLE customer_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_phones_owner" ON customer_phones
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================
-- CUSTOMER ADDRESSES (multiple delivery / billing addresses)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'বাড়ি',      -- 'বাড়ি' | 'অফিস' | 'অন্য'
  full_address TEXT NOT NULL,
  area         TEXT,                 -- neighbourhood / landmark
  city         TEXT,
  division     TEXT,                 -- ঢাকা / চট্টগ্রাম / রাজশাহী / খুলনা / বরিশাল / সিলেট / ময়মনসিংহ
  zip          TEXT,
  phone        TEXT,                 -- delivery contact number for this address
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_addresses_owner" ON customer_addresses
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================
-- CUSTOMER TYPE CHANGE LOG (audit trail for each type transition)
-- walk-in | credit | emi | online
-- ============================================
CREATE TABLE IF NOT EXISTS customer_type_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_type    TEXT,
  to_type      TEXT NOT NULL,
  reason       TEXT,                 -- why the type was changed (staff note)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_type_log_customer ON customer_type_log(customer_id);

ALTER TABLE customer_type_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_type_log_owner" ON customer_type_log
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================
-- CUSTOMER ACTIVITY LOG (every action: order placed, payment received,
-- credit memo created, phone added, address updated, note changed, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,        -- order_placed | payment_received | credit_memo | emi_created
                                  -- | phone_added | phone_removed | phone_set_primary
                                  -- | address_added | address_updated | address_removed
                                  -- | type_changed | note_updated | customer_created | customer_updated
  summary      TEXT NOT NULL,        -- one-line human-readable description (Bengali/English mix OK)
  detail       JSONB,                -- optional structured payload (order_number, amount, phone, address_id, etc.)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_activity_log_customer ON customer_activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_log_kind ON customer_activity_log(kind);

ALTER TABLE customer_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_activity_log_owner" ON customer_activity_log
  FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

-- ============================================
-- HELPERS
-- ============================================

-- Trigger to keep customer_addresses.updated_at fresh.
CREATE OR REPLACE FUNCTION trg_set_address_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_address_updated_at ON customer_addresses;
CREATE TRIGGER trg_address_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION trg_set_address_updated_at();

-- Auto-add the phone that lives on the customers.phone column into
-- customer_phones as the primary number when a customer is created
-- and doesn't already have any phones. Keeps the two tables in sync
-- with zero app effort.
CREATE OR REPLACE FUNCTION sync_primary_phone_on_create()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' AND NEW.phone <> '—' THEN
    INSERT INTO customer_phones (customer_id, phone, label, is_primary)
      SELECT NEW.id, NEW.phone, 'মূল', TRUE
      WHERE NOT EXISTS (
        SELECT 1 FROM customer_phones WHERE customer_id = NEW.id LIMIT 1
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_primary_phone ON customers;
CREATE TRIGGER trg_sync_primary_phone
  AFTER INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION sync_primary_phone_on_create();
