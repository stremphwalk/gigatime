-- DEV-ONLY: Minimal RLS policies to allow Realtime to deliver Postgres Changes
-- when connecting with the anon key (no Supabase Auth JWT).
-- Run this in Supabase SQL Editor. Remove before production tightening.

-- Notes:
-- - These policies grant SELECT to role `anon` on the listed tables.
-- - Realtime RLS uses SELECT policies to decide whether to emit row changes.
-- - Your backend continues to write via server credentials; these policies
--   do not affect writes unless you add INSERT/UPDATE/DELETE policies.

-- Helper: create SELECT policy for anon if it doesn't exist
CREATE OR REPLACE FUNCTION public.__ensure_anon_select_policy(tbl regclass, policy_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = split_part(tbl::text, '.', 2)
      AND p.schemaname = split_part(tbl::text, '.', 1)
      AND p.polname = policy_name
  ) THEN
    EXECUTE format('CREATE POLICY %I ON %s FOR SELECT TO anon USING (true);', policy_name, tbl);
  END IF;
END; $$;

-- Enable RLS on tables (idempotent) and add anon SELECT policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='teams') THEN
    ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.teams', 'dev_allow_anon_select_teams');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_members') THEN
    ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.team_members', 'dev_allow_anon_select_team_members');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_todos') THEN
    ALTER TABLE public.team_todos ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.team_todos', 'dev_allow_anon_select_team_todos');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_calendar_events') THEN
    ALTER TABLE public.team_calendar_events ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.team_calendar_events', 'dev_allow_anon_select_team_calendar_events');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_bulletin_posts') THEN
    ALTER TABLE public.team_bulletin_posts ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.team_bulletin_posts', 'dev_allow_anon_select_team_bulletin_posts');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_todo_assignees') THEN
    ALTER TABLE public.team_todo_assignees ENABLE ROW LEVEL SECURITY;
    PERFORM public.__ensure_anon_select_policy('public.team_todo_assignees', 'dev_allow_anon_select_team_todo_assignees');
  END IF;
END $$;

-- Verify policies
SELECT schemaname, tablename, polname, roles, cmd
FROM pg_policies
WHERE schemaname='public' AND tablename IN (
  'teams','team_members','team_todos','team_calendar_events','team_bulletin_posts','team_todo_assignees'
) ORDER BY 1,2,3;

-- Cleanup helper (optional): drop function after use
-- DROP FUNCTION IF EXISTS public.__ensure_anon_select_policy(tbl regclass, policy_name text);

