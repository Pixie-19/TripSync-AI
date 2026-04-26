-- ══════════════════════════════════════════════════════
--  TripSync AI  –  Firebase-Compatible Supabase Schema
--  Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- Enable UUID extension (still useful for trip/expense IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────
-- Now using TEXT for IDs to support Firebase UIDs
CREATE TABLE IF NOT EXISTS public.users (
  id          TEXT PRIMARY KEY, -- Firebase UID
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TRIPS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  destination  TEXT NOT NULL,
  budget       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'INR',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  num_people   INTEGER NOT NULL DEFAULT 2,
  invite_code  TEXT NOT NULL UNIQUE,
  created_by   TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferences  TEXT[] DEFAULT '{}',
  itinerary    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TRIP MEMBERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trip_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id   UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

-- ─── EXPENSES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  category     TEXT NOT NULL DEFAULT 'other'
               CHECK (category IN ('food','transport','stay','activities','shopping','other')),
  paid_by      TEXT NOT NULL REFERENCES public.users(id),
  split_among  TEXT[] NOT NULL DEFAULT '{}', -- Array of Firebase UIDs
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SETTLEMENTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settlements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user   TEXT NOT NULL REFERENCES public.users(id),
  to_user     TEXT NOT NULL REFERENCES public.users(id),
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  settled     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at  TIMESTAMPTZ
);

-- ─── VOTES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  options     JSONB NOT NULL DEFAULT '[]',
  created_by  TEXT NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at     TIMESTAMPTZ
);

-- ─── VOTE RESPONSES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vote_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vote_id       UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_index  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vote_id, user_id)
);

-- ─── DISABLE RLS FOR HACKATHON ─────────────────────────
-- Since we are using Firebase, we bypass Supabase RLS for simplicity
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_responses DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ─── INDEXES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_votes_trip_id ON public.votes(trip_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_vote_id ON public.vote_responses(vote_id);
CREATE INDEX IF NOT EXISTS idx_settlements_trip_id ON public.settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON public.trips(invite_code);
