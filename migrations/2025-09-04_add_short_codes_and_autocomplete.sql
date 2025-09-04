-- Migration: Add short_code columns and create autocomplete_items table (if missing)
-- Run this in your Supabase SQL Editor or via your migration runner.

-- Enable UUID extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Add short_code columns to existing tables
ALTER TABLE IF EXISTS smart_phrases
  ADD COLUMN IF NOT EXISTS short_code VARCHAR(4) UNIQUE;

ALTER TABLE IF EXISTS note_templates
  ADD COLUMN IF NOT EXISTS short_code VARCHAR(4) UNIQUE;

-- 2) Create autocomplete_items table (if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'autocomplete_items'
  ) THEN
    CREATE TABLE public.autocomplete_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      short_code VARCHAR(4) UNIQUE,
      text VARCHAR(500) NOT NULL,
      category VARCHAR(100) NOT NULL,
      is_priority BOOLEAN DEFAULT false,
      dosage VARCHAR(100),
      frequency VARCHAR(100),
      dosage_options JSONB,
      frequency_options JSONB,
      description TEXT,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Unique constraint to prevent duplicates per user/category/text
    CREATE UNIQUE INDEX ux_autocomplete_items_user_category_text
      ON public.autocomplete_items (user_id, category, text);
  END IF;
END $$;

-- 3) Backfill short_code values (optional, safe to re-run)
UPDATE smart_phrases
SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
WHERE short_code IS NULL;

UPDATE note_templates
SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
WHERE short_code IS NULL;

UPDATE autocomplete_items
SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
WHERE short_code IS NULL;

-- 4) Helpful indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON public.autocomplete_items(user_id);
CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON public.autocomplete_items(category);

-- Done.
