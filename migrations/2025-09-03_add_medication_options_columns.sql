-- Add array-like jsonb columns for medication autocomplete
ALTER TABLE autocomplete_items
  ADD COLUMN IF NOT EXISTS dosage_options jsonb,
  ADD COLUMN IF NOT EXISTS frequency_options jsonb;

