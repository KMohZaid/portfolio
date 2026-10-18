-- Preserve references in post JSON and thumbnails when consolidating legacy duplicate rows.
CREATE OR REPLACE FUNCTION blog_replace_upload_url(value jsonb, old_url text, new_url text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF jsonb_typeof(value) = 'string' THEN
    IF value #>> '{}' = old_url THEN RETURN to_jsonb(new_url); END IF;
    RETURN value;
  ELSIF jsonb_typeof(value) = 'array' THEN
    RETURN (SELECT coalesce(jsonb_agg(blog_replace_upload_url(item, old_url, new_url)), '[]'::jsonb) FROM jsonb_array_elements(value) item);
  ELSIF jsonb_typeof(value) = 'object' THEN
    RETURN (SELECT coalesce(jsonb_object_agg(key, blog_replace_upload_url(item, old_url, new_url)), '{}'::jsonb) FROM jsonb_each(value) AS entry(key, item));
  END IF;
  RETURN value;
END;
$$;

DO $$
DECLARE duplicate_row record;
BEGIN
  FOR duplicate_row IN
    SELECT duplicate.id, duplicate.url, keeper.url AS keeper_url
    FROM (
      SELECT id, url, telegram_file_unique_id,
             first_value(url) OVER (PARTITION BY telegram_file_unique_id ORDER BY created_at, id) AS keeper_url,
             row_number() OVER (PARTITION BY telegram_file_unique_id ORDER BY created_at, id) AS position
      FROM blog_uploads
      WHERE telegram_file_unique_id IS NOT NULL
    ) duplicate
    JOIN blog_uploads keeper ON keeper.url = duplicate.keeper_url
    WHERE duplicate.position > 1
    ORDER BY duplicate.id
  LOOP
    UPDATE blog_posts
    SET content = blog_replace_upload_url(content, duplicate_row.url, duplicate_row.keeper_url),
        thumbnail = CASE WHEN thumbnail = duplicate_row.url THEN duplicate_row.keeper_url ELSE thumbnail END
    WHERE content::text LIKE '%' || duplicate_row.url || '%' OR thumbnail = duplicate_row.url;
    UPDATE blog_post_drafts
    SET content = blog_replace_upload_url(content, duplicate_row.url, duplicate_row.keeper_url),
        thumbnail = CASE WHEN thumbnail = duplicate_row.url THEN duplicate_row.keeper_url ELSE thumbnail END
    WHERE content::text LIKE '%' || duplicate_row.url || '%' OR thumbnail = duplicate_row.url;
    DELETE FROM blog_uploads WHERE id = duplicate_row.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS blog_uploads_telegram_unique_id_idx
  ON blog_uploads (telegram_file_unique_id)
  WHERE telegram_file_unique_id IS NOT NULL;

DROP FUNCTION blog_replace_upload_url(jsonb, text, text);
