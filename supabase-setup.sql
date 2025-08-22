-- Supabase Database Setup Script for Gigatime
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS team_calendar_events CASCADE;
DROP TABLE IF EXISTS team_todos CASCADE;
DROP TABLE IF EXISTS smart_phrases CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS note_templates CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS user_lab_settings CASCADE;
DROP TABLE IF EXISTS pertinent_negative_presets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table (for session storage)
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions (expire);

-- Create users table
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(100),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  profile_image_url VARCHAR(500),
  specialty VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  group_code VARCHAR(4) NOT NULL UNIQUE,
  max_members INTEGER DEFAULT 6,
  created_by_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Create team_members junction table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create note_templates table
CREATE TABLE note_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareable_id VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  sections JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  patient_name VARCHAR(100),
  patient_mrn VARCHAR(50),
  patient_dob VARCHAR(20),
  template_id UUID REFERENCES note_templates(id),
  template_type VARCHAR(50),
  content JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create smart_phrases table
CREATE TABLE smart_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shareable_id VARCHAR(12) UNIQUE NOT NULL DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  trigger VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  description VARCHAR(200),
  category VARCHAR(50),
  elements JSONB,
  is_public BOOLEAN DEFAULT false,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create team_todos table
CREATE TABLE team_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP,
  assigned_to_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create team_calendar_events table
CREATE TABLE team_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT false,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_lab_settings table
CREATE TABLE user_lab_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  panel_id VARCHAR NOT NULL,
  lab_id VARCHAR NOT NULL,
  trending_count INTEGER NOT NULL DEFAULT 3,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, panel_id, lab_id)
);

-- Create pertinent_negative_presets table
CREATE TABLE pertinent_negative_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  selected_symptoms JSONB NOT NULL,
  user_id VARCHAR DEFAULT 'default-user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_teams_group_code ON teams(group_code);
CREATE INDEX idx_teams_expires_at ON teams(expires_at);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_team_id ON notes(team_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_note_templates_user_id ON note_templates(user_id);
CREATE INDEX idx_note_templates_shareable_id ON note_templates(shareable_id);
CREATE INDEX idx_smart_phrases_user_id ON smart_phrases(user_id);
CREATE INDEX idx_smart_phrases_trigger ON smart_phrases(trigger);
CREATE INDEX idx_smart_phrases_shareable_id ON smart_phrases(shareable_id);
CREATE INDEX idx_team_todos_team_id ON team_todos(team_id);
CREATE INDEX idx_team_todos_assigned_to_id ON team_todos(assigned_to_id);
CREATE INDEX idx_team_calendar_events_team_id ON team_calendar_events(team_id);
CREATE INDEX idx_team_calendar_events_start_date ON team_calendar_events(start_date);
CREATE INDEX idx_user_lab_settings_user_id ON user_lab_settings(user_id);
CREATE INDEX idx_pertinent_negative_presets_user_id ON pertinent_negative_presets(user_id);

-- Create a default user for development (optional - remove in production)
INSERT INTO users (id, email, first_name, last_name, specialty)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'doctor@hospital.com',
  'Dr. Sarah',
  'Mitchell',
  'Emergency Medicine'
) ON CONFLICT (id) DO NOTHING;

-- Create default note templates
INSERT INTO note_templates (name, type, description, sections, is_default, is_public, user_id)
VALUES 
(
  'Admission Note',
  'admission',
  'Standard admission note template',
  '[
    {"id": "reason", "name": "Reason for Admission", "type": "textarea", "required": true},
    {"id": "hpi", "name": "History of Present Illness", "type": "textarea", "required": true},
    {"id": "pmh", "name": "Past Medical History", "type": "textarea", "required": false},
    {"id": "allergies", "name": "Allergies", "type": "textarea", "required": true},
    {"id": "social", "name": "Social History", "type": "textarea", "required": false},
    {"id": "medications", "name": "Medications", "type": "textarea", "required": true},
    {"id": "physical", "name": "Physical Exam", "type": "textarea", "required": true},
    {"id": "labs", "name": "Labs", "type": "textarea", "required": false},
    {"id": "imaging", "name": "Imaging", "type": "textarea", "required": false},
    {"id": "impression", "name": "Impression", "type": "textarea", "required": true},
    {"id": "plan", "name": "Plan", "type": "textarea", "required": true}
  ]'::jsonb,
  true,
  true,
  NULL
),
(
  'Progress Note',
  'progress',
  'Standard progress note template',
  '[
    {"id": "evolution", "name": "Evolution", "type": "textarea", "required": true},
    {"id": "physical", "name": "Physical Exam", "type": "textarea", "required": true},
    {"id": "labs", "name": "Labs", "type": "textarea", "required": false},
    {"id": "imaging", "name": "Imaging", "type": "textarea", "required": false},
    {"id": "impression", "name": "Impression", "type": "textarea", "required": true},
    {"id": "plan", "name": "Plan", "type": "textarea", "required": true}
  ]'::jsonb,
  true,
  true,
  NULL
),
(
  'Consult Note',
  'consult',
  'Standard consultation note template',
  '[
    {"id": "reason", "name": "Reason for Consultation", "type": "textarea", "required": true},
    {"id": "hpi", "name": "History of Present Illness", "type": "textarea", "required": true},
    {"id": "pmh", "name": "Past Medical History", "type": "textarea", "required": false},
    {"id": "allergies", "name": "Allergies", "type": "textarea", "required": true},
    {"id": "social", "name": "Social History", "type": "textarea", "required": false},
    {"id": "medications", "name": "Medications", "type": "textarea", "required": true},
    {"id": "physical", "name": "Physical Exam", "type": "textarea", "required": true},
    {"id": "labs", "name": "Labs", "type": "textarea", "required": false},
    {"id": "imaging", "name": "Imaging", "type": "textarea", "required": false},
    {"id": "impression", "name": "Impression", "type": "textarea", "required": true},
    {"id": "plan", "name": "Plan", "type": "textarea", "required": true}
  ]'::jsonb,
  true,
  true,
  NULL
);

-- Grant permissions (adjust based on your Supabase setup)
-- These are examples - modify based on your security requirements
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- If using Supabase Auth, you might want to grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_note_templates_updated_at BEFORE UPDATE ON note_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_smart_phrases_updated_at BEFORE UPDATE ON smart_phrases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_team_todos_updated_at BEFORE UPDATE ON team_todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_team_calendar_events_updated_at BEFORE UPDATE ON team_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_user_lab_settings_updated_at BEFORE UPDATE ON user_lab_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_pertinent_negative_presets_updated_at BEFORE UPDATE ON pertinent_negative_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Database setup completed successfully!' as message;