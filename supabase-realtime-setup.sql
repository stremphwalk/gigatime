-- Supabase Realtime Setup (Postgres Changes)
-- Paste this entire script into your Supabase SQL Editor and run.
-- It enables Realtime replication for specific tables and configures
-- REPLICA IDENTITY so UPDATE/DELETE payloads include full row data.

-- 0) Ensure the standard Realtime publication exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Create an empty publication; we will add tables below
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 1) Add your app tables to the Realtime publication (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='teams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_todos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_todos;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_calendar_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_calendar_events;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_bulletin_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_bulletin_posts;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- (Optional) If you added multi-assignee links and want events for those too
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_todo_assignees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_todo_assignees;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Ensure UPDATE/DELETE events include old values
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='teams') THEN
  ALTER TABLE public.teams SET (autovacuum_vacuum_scale_factor = 0.1);
  ALTER TABLE public.teams REPLICA IDENTITY FULL;
END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_members') THEN
  ALTER TABLE public.team_members REPLICA IDENTITY FULL;
END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_todos') THEN
  ALTER TABLE public.team_todos REPLICA IDENTITY FULL;
END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_calendar_events') THEN
  ALTER TABLE public.team_calendar_events REPLICA IDENTITY FULL;
END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_bulletin_posts') THEN
  ALTER TABLE public.team_bulletin_posts REPLICA IDENTITY FULL;
END IF; END $$;

-- Optional
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_todo_assignees'
  ) THEN
    ALTER TABLE public.team_todo_assignees REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 3) Verify: list all tables in the supabase_realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY 1,2;

-- If you later need to remove a table from the publication, use:
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.table_name;
