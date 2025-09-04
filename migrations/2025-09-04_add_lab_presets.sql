-- Create lab_presets table for named lab parsing presets
CREATE TABLE IF NOT EXISTS "lab_presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "settings" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Helpful index for lookups by user
CREATE INDEX IF NOT EXISTS idx_lab_presets_user ON "lab_presets" ("user_id");
