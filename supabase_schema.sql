-- ========================================================================
-- BLINKIT DARK STORE DEEP CLEANING TRACKER - SUPABASE DATABASE SCHEMA
-- ========================================================================
-- Project: https://eymcwmwpercvdwcciqaq.supabase.co
-- Vendor: SK Enterprises
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORES MASTER LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  store_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Mumbai',
  google_maps_url TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  assistant_manager_name TEXT,
  assistant_manager_phone TEXT,
  contract_rate NUMERIC DEFAULT 8500,
  next_cleaning_cycle_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLEANINGS (STORE VISIT & SHIFT RECORDS) TABLE
CREATE TABLE IF NOT EXISTS public.cleanings (
  id TEXT PRIMARY KEY,
  sync_id TEXT,
  store_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  google_maps_url TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  cleaning_date DATE NOT NULL,
  punch_in_time TEXT,
  punch_out_time TEXT,
  duration_hours NUMERIC,
  total_cleaners INTEGER DEFAULT 4,
  team_members TEXT,
  labor_cost NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  scope_of_work JSONB,
  checklist JSONB,
  equipment JSONB,
  photos JSONB,
  chemicals_used JSONB,
  manager_signature TEXT,
  audio_remarks TEXT,
  rating NUMERIC DEFAULT 5.0,
  remarks TEXT,
  has_issue BOOLEAN DEFAULT FALSE,
  issue_type TEXT,
  issue_desc TEXT,
  issue_photo TEXT,
  amount NUMERIC DEFAULT 8500,
  payment_status TEXT DEFAULT 'Pending',
  amount_received NUMERIC DEFAULT 0,
  amount_pending NUMERIC DEFAULT 8500,
  payment_date DATE,
  payment_mode TEXT,
  utr_number TEXT,
  payment_notes TEXT,
  supervisor_id TEXT,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  team_vendor TEXT DEFAULT 'SK ENTERPRISES',
  shift TEXT,
  next_cleaning_cycle_days INTEGER DEFAULT 30,
  gps_coords JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPERVISORS ROSTER & CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.supervisors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  assigned_store_codes JSONB,
  status TEXT DEFAULT 'Active',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLEANER WORKERS MASTER & WAGES TABLE
CREATE TABLE IF NOT EXISTS public.cleaners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  daily_wage NUMERIC DEFAULT 500,
  aadhar_no TEXT,
  upi_id TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TONIGHT'S CLEANING SHIFT SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.cleaning_schedules (
  id TEXT PRIMARY KEY,
  store_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  shift_time TEXT DEFAULT '01:00 AM',
  shift TEXT,
  supervisor_id TEXT,
  supervisor_name TEXT,
  cleaners_count INTEGER DEFAULT 4,
  status TEXT DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHEMICAL INVENTORY STOCK TABLE
CREATE TABLE IF NOT EXISTS public.chemical_stock (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'Liters',
  total_stock NUMERIC DEFAULT 50,
  alert_threshold NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHEMICAL LOGS (STOCK IN / STOCK OUT) TABLE
CREATE TABLE IF NOT EXISTS public.chemical_logs (
  id TEXT PRIMARY KEY,
  chemical_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  log_type TEXT NOT NULL, -- 'ADD_STOCK' or 'ISSUE_TO_STORE'
  quantity NUMERIC NOT NULL,
  store_code TEXT,
  store_name TEXT,
  supervisor_name TEXT,
  notes TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CLEANER CASH/UPI ADVANCES TABLE
CREATE TABLE IF NOT EXISTS public.cleaner_advances (
  id TEXT PRIMARY KEY,
  cleaner_id TEXT NOT NULL,
  cleaner_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  advance_date DATE NOT NULL,
  payment_mode TEXT DEFAULT 'Cash',
  notes TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. STORE ISSUES & DEFECTS TABLE
CREATE TABLE IF NOT EXISTS public.store_issues (
  id TEXT PRIMARY KEY,
  store_code TEXT NOT NULL,
  cleaning_id TEXT,
  issue_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'Open',
  photo TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 10. STORE EXPENSES & LOGISTICS TABLE
CREATE TABLE IF NOT EXISTS public.store_expenses (
  id TEXT PRIMARY KEY,
  store_code TEXT,
  city TEXT,
  category TEXT,
  amount NUMERIC DEFAULT 0,
  date DATE,
  paid_to TEXT,
  payment_mode TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FLEET & SCRUBBER MACHINES TABLE
CREATE TABLE IF NOT EXISTS public.equipments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  asset_tag TEXT,
  category TEXT,
  current_location_name TEXT,
  status TEXT DEFAULT 'Available',
  condition TEXT DEFAULT 'Good',
  last_service_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. APP SETTINGS & BILL DETAILS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (OPEN FOR SECURE VENDOR OPERATIONS)
-- ========================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chemical_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Allow all on stores" ON public.stores;
DROP POLICY IF EXISTS "Allow all on cleanings" ON public.cleanings;
DROP POLICY IF EXISTS "Allow all on supervisors" ON public.supervisors;
DROP POLICY IF EXISTS "Allow all on cleaners" ON public.cleaners;
DROP POLICY IF EXISTS "Allow all on cleaning_schedules" ON public.cleaning_schedules;
DROP POLICY IF EXISTS "Allow all on chemical_stock" ON public.chemical_stock;
DROP POLICY IF EXISTS "Allow all on chemical_logs" ON public.chemical_logs;
DROP POLICY IF EXISTS "Allow all on cleaner_advances" ON public.cleaner_advances;
DROP POLICY IF EXISTS "Allow all on store_issues" ON public.store_issues;
DROP POLICY IF EXISTS "Allow all on store_expenses" ON public.store_expenses;
DROP POLICY IF EXISTS "Allow all on equipments" ON public.equipments;
DROP POLICY IF EXISTS "Allow all on app_settings" ON public.app_settings;

-- Allow read/write access via Supabase key
CREATE POLICY "Allow all on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cleanings" ON public.cleanings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on supervisors" ON public.supervisors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cleaners" ON public.cleaners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cleaning_schedules" ON public.cleaning_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chemical_stock" ON public.chemical_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chemical_logs" ON public.chemical_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cleaner_advances" ON public.cleaner_advances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on store_issues" ON public.store_issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on store_expenses" ON public.store_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on equipments" ON public.equipments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Supabase Realtime for instant updates across devices
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cleanings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cleaning_schedules;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chemical_stock;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
