-- Create run-list tables manually
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- run_lists: one per user per day
CREATE TABLE IF NOT EXISTS run_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TIMESTAMP NOT NULL,
  mode VARCHAR(20) DEFAULT 'prepost',
  carry_forward_defaults JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_run_lists_user_day ON run_lists(user_id, day);

-- list_patients: ordered patients within a run_list
CREATE TABLE IF NOT EXISTS list_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_list_id UUID NOT NULL REFERENCES run_lists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  alias VARCHAR(32),
  active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP,
  carry_forward_overrides JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_list_patients_run_list_position ON list_patients(run_list_id, position);

-- run_list_notes: single note per list_patient (with TTL)
CREATE TABLE IF NOT EXISTS run_list_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_patient_id UUID NOT NULL UNIQUE REFERENCES list_patients(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL DEFAULT '',
  structured_sections JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  version_head_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_run_list_notes_expires ON run_list_notes(expires_at);

-- run_list_note_versions: version history per note
CREATE TABLE IF NOT EXISTS run_list_note_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES run_list_notes(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL DEFAULT '',
  structured_sections JSONB DEFAULT '{}'::jsonb,
  source VARCHAR(20) DEFAULT 'user_edit',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_run_list_note_versions_note ON run_list_note_versions(note_id);

-- user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_preferences_user ON user_preferences(user_id);
