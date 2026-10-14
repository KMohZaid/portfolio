-- Blog metadata, full-text search, and separate working copies for published posts.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_text text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON blog_posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS blog_posts_content_search_idx ON blog_posts USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content_text, '')));

CREATE OR REPLACE FUNCTION blog_json_text(node jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result text := '';
  child jsonb;
BEGIN
  IF jsonb_typeof(node) = 'object' THEN
    IF node ? 'text' AND jsonb_typeof(node->'text') = 'string' THEN result := node->>'text'; END IF;
    IF jsonb_typeof(node->'content') = 'array' THEN
      FOR child IN SELECT value FROM jsonb_array_elements(node->'content') LOOP
        result := result || ' ' || blog_json_text(child);
      END LOOP;
    END IF;
  ELSIF jsonb_typeof(node) = 'array' THEN
    FOR child IN SELECT value FROM jsonb_array_elements(node) LOOP
      result := result || ' ' || blog_json_text(child);
    END LOOP;
  END IF;
  RETURN result;
END $$;
UPDATE blog_posts SET content_text = trim(blog_json_text(content)) WHERE content_text = '';

CREATE TABLE IF NOT EXISTS blog_post_drafts (
  post_id uuid PRIMARY KEY REFERENCES blog_posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  thumbnail text,
  content jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_post_drafts_slug_idx ON blog_post_drafts (slug);
