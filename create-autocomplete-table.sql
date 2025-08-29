-- Create autocomplete_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS autocomplete_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_priority BOOLEAN DEFAULT false,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    description TEXT,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_autocomplete_items_user_id ON autocomplete_items(user_id);
CREATE INDEX IF NOT EXISTS idx_autocomplete_items_category ON autocomplete_items(category);
CREATE INDEX IF NOT EXISTS idx_autocomplete_items_priority ON autocomplete_items(is_priority);