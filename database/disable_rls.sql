-- ══════════════════════════════════════════════════════
--  TripSync AI — Disable RLS for Firebase Auth
--
--  Since auth is now handled by Firebase (not Supabase JWT),
--  we disable Row Level Security so the anon key can read/write.
--
--  Run this in Supabase SQL Editor AFTER running schema.sql
-- ══════════════════════════════════════════════════════

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_responses DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon role (for the publishable key)
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.trips TO anon;
GRANT ALL ON public.trip_members TO anon;
GRANT ALL ON public.expenses TO anon;
GRANT ALL ON public.settlements TO anon;
GRANT ALL ON public.votes TO anon;
GRANT ALL ON public.vote_responses TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
