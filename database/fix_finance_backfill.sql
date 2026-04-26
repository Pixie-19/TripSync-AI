-- ══════════════════════════════════════════════════════
--  FINANCE SYSTEM FIX & BACKFILL
--  Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. Drop existing tables if they have incorrect types (HACKATHON SAFE)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS balances CASCADE;

-- 2. Re-create Transactions Table with TEXT for user IDs
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('expense', 'settlement')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Re-create Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('expense', 'due', 'payment')) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 4. Re-create Balances Table with TEXT for user IDs
CREATE TABLE balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'settled')) NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE balances DISABLE ROW LEVEL SECURITY;

-- 5. BACKFILL LOGIC: Generate balances from existing expenses
-- This script will scan the expenses table and create pending balances for existing data
DO $$
DECLARE
    exp_record RECORD;
    debtor_id TEXT;
    split_count INT;
    share_amount DECIMAL(12, 2);
BEGIN
    FOR exp_record IN SELECT * FROM expenses LOOP
        split_count := array_length(exp_record.split_among, 1);
        IF split_count > 0 THEN
            share_amount := exp_record.amount / split_count;
            
            FOREACH debtor_id IN ARRAY exp_record.split_among LOOP
                -- Skip if payer is the debtor
                IF debtor_id <> exp_record.paid_by THEN
                    -- Check if balance exists
                    IF EXISTS (SELECT 1 FROM balances WHERE trip_id = exp_record.trip_id AND from_user_id = debtor_id AND to_user_id = exp_record.paid_by) THEN
                        UPDATE balances 
                        SET amount = amount + share_amount, updated_at = now()
                        WHERE trip_id = exp_record.trip_id AND from_user_id = debtor_id AND to_user_id = exp_record.paid_by;
                    ELSE
                        INSERT INTO balances (trip_id, from_user_id, to_user_id, amount, status)
                        VALUES (exp_record.trip_id, debtor_id, exp_record.paid_by, share_amount, 'pending');
                    END IF;
                    
                    -- Also log as transaction for history
                    INSERT INTO transactions (trip_id, from_user_id, to_user_id, amount, type)
                    VALUES (exp_record.trip_id, debtor_id, exp_record.paid_by, share_amount, 'expense');
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;
