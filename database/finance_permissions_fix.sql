-- ══════════════════════════════════════════════════════
--  FINANCE SYSTEM: PERMISSIONS & SECURITY FIX
--  Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Ensure RLS is disabled for the new tables (Firebase compatibility)
ALTER TABLE IF EXISTS public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

-- 2. Grant ALL permissions to the 'anon' role
-- Since the frontend uses the public/anon key, it needs explicit grants 
-- on tables where RLS is disabled but the role isn't 'authenticated' (Supabase's default)
GRANT ALL ON public.balances TO anon;
GRANT ALL ON public.transactions TO anon;
GRANT ALL ON public.notifications TO anon;

-- Also grant to 'authenticated' just in case
GRANT ALL ON public.balances TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- 3. Grant sequence usage (crucial for inserts to work)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Double check Table Names (Must be plural)
-- If your tables were created without plural names, run these renames:
-- ALTER TABLE IF EXISTS balance RENAME TO balances;
-- ALTER TABLE IF EXISTS transaction RENAME TO transactions;
-- ALTER TABLE IF EXISTS notification RENAME TO notifications;
