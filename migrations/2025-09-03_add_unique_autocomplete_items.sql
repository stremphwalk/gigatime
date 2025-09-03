-- Add unique constraint to prevent duplicate custom items per user/category/text
CREATE UNIQUE INDEX IF NOT EXISTS ux_autocomplete_items_user_category_text
  ON autocomplete_items(user_id, category, text);

