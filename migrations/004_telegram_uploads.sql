ALTER TABLE blog_uploads ADD COLUMN IF NOT EXISTS telegram_file_id text;
ALTER TABLE blog_uploads ADD COLUMN IF NOT EXISTS telegram_file_unique_id text;
ALTER TABLE blog_uploads ADD COLUMN IF NOT EXISTS mime_type text;
