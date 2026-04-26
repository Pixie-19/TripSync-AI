-- Add to your Supabase SQL Editor after the main schema

-- ─── GROUP CHAT MESSAGES ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.group_messages TO anon;

CREATE INDEX IF NOT EXISTS idx_group_messages_trip_id ON public.group_messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON public.group_messages(created_at);

-- Enable Realtime for group chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
