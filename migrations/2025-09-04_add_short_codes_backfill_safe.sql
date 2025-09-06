-- Safe backfill of short_code columns with existence checks
-- Use this if you saw: ERROR 42703 column "short_code" does not exist

-- smart_phrases backfill only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_phrases' AND column_name = 'short_code'
  ) THEN
    UPDATE public.smart_phrases
    SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
    WHERE short_code IS NULL;
  END IF;
END $$;

-- note_templates backfill only if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'note_templates' AND column_name = 'short_code'
  ) THEN
    UPDATE public.note_templates
    SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
    WHERE short_code IS NULL;
  END IF;
END $$;

-- autocomplete_items backfill only if table and column exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='autocomplete_items'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'autocomplete_items' AND column_name = 'short_code'
  ) THEN
    UPDATE public.autocomplete_items
    SET short_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
    WHERE short_code IS NULL;
  END IF;
END $$;

-- Done.
