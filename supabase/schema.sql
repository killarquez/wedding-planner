-- ==============================================================================
-- Trang & Alfredo Wedding Platform - Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Parties (Family / Group Invitations)
CREATE TABLE IF NOT EXISTS public.parties (
    id TEXT PRIMARY KEY,
    primary_guest_name TEXT NOT NULL,
    invitation_code TEXT UNIQUE NOT NULL,
    total_invited INTEGER NOT NULL DEFAULT 1,
    contact_email TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tables (10-Top Banquet Round Tables & Layout)
CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY,
    table_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    hierarchy_tag TEXT NOT NULL DEFAULT 'general',
    stage_position TEXT NOT NULL DEFAULT 'center',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Guests (Individual Guest RSVP Records & Seating)
CREATE TABLE IF NOT EXISTS public.guests (
    id TEXT PRIMARY KEY,
    party_id TEXT REFERENCES public.parties(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    rsvp_status TEXT NOT NULL DEFAULT 'pending',
    headcount INTEGER NOT NULL DEFAULT 1,
    dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
    dietary_notes TEXT,
    song_request TEXT,
    notes TEXT,
    table_id TEXT REFERENCES public.tables(id) ON DELETE SET NULL,
    table_seat_number INTEGER,
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    relationship_tag TEXT NOT NULL DEFAULT 'general',
    plus_one_names TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Expenses & Budget Engine
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    item_description TEXT NOT NULL,
    estimated_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_invoiced NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deposit_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_due_date TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Milestones & Planning Timeline
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_vi TEXT NOT NULL,
    category TEXT NOT NULL,
    target_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    dependencies TEXT[] NOT NULL DEFAULT '{}',
    assignee TEXT NOT NULL,
    cultural_notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DJ Song Requests & Playlist Queue
CREATE TABLE IF NOT EXISTS public.song_requests (
    id TEXT PRIMARY KEY,
    guest_name TEXT NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT NOT NULL,
    genre TEXT NOT NULL DEFAULT 'other',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Venue Sourcing Archive
CREATE TABLE IF NOT EXISTS public.venues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    max_capacity_guests INTEGER NOT NULL DEFAULT 0,
    ten_top_tables_capacity INTEGER NOT NULL DEFAULT 0,
    allows_host_supplied_alcohol BOOLEAN NOT NULL DEFAULT FALSE,
    corkage_policy TEXT,
    asian_banquet_capable BOOLEAN NOT NULL DEFAULT TRUE,
    menu_starting_price_per_table NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    av_stage_included BOOLEAN NOT NULL DEFAULT TRUE,
    score INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    inquiry_email_draft_en TEXT,
    inquiry_email_draft_vi TEXT
);

-- 8. Agent Activity & Audit Logs
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_guests_party_id ON public.guests(party_id);
CREATE INDEX IF NOT EXISTS idx_guests_table_id ON public.guests(table_id);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON public.guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON public.expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Allow public insert into parties" ON public.parties;
DROP POLICY IF EXISTS "Allow public insert into guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public insert into song_requests" ON public.song_requests;

DROP POLICY IF EXISTS "Allow authenticated full access to parties" ON public.parties;
DROP POLICY IF EXISTS "Allow authenticated full access to tables" ON public.tables;
DROP POLICY IF EXISTS "Allow authenticated full access to guests" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated full access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated full access to milestones" ON public.milestones;
DROP POLICY IF EXISTS "Allow authenticated full access to song_requests" ON public.song_requests;
DROP POLICY IF EXISTS "Allow authenticated full access to venues" ON public.venues;
DROP POLICY IF EXISTS "Allow authenticated full access to agent_logs" ON public.agent_logs;

-- Public Access Policies: Guests can submit RSVPs and song requests
CREATE POLICY "Allow public insert into parties" ON public.parties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert into guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert into song_requests" ON public.song_requests FOR INSERT WITH CHECK (true);

-- Allow authenticated admins (Alfredo & Trang) full access to all tables
CREATE POLICY "Allow authenticated full access to parties" ON public.parties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to tables" ON public.tables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to guests" ON public.guests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to milestones" ON public.milestones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to song_requests" ON public.song_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to venues" ON public.venues FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to agent_logs" ON public.agent_logs FOR ALL USING (auth.role() = 'authenticated');
