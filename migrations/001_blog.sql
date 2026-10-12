-- Generic PostgreSQL schema for the portfolio blog. Safe to apply repeatedly; no destructive operations.
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  thumbnail text,
  content jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS thumbnail text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_visibility_check' AND conrelid = 'blog_posts'::regclass) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_visibility_check CHECK (visibility IN ('public', 'hidden'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS blog_posts_public_order_idx ON blog_posts (published_at DESC NULLS LAST, updated_at DESC) WHERE status = 'published' AND visibility = 'public';
CREATE INDEX IF NOT EXISTS blog_posts_admin_order_idx ON blog_posts (updated_at DESC);

CREATE TABLE IF NOT EXISTS blog_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  filename text NOT NULL,
  size bigint NOT NULL CHECK (size >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS blog_uploads_created_idx ON blog_uploads (created_at DESC);

CREATE TABLE IF NOT EXISTS blog_login_tokens (
  jti uuid PRIMARY KEY,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blog_login_tokens_email_created_idx ON blog_login_tokens (email, created_at DESC);
CREATE INDEX IF NOT EXISTS blog_login_tokens_expiry_idx ON blog_login_tokens (expires_at);

CREATE TABLE IF NOT EXISTS blog_admin_sessions (
  jti uuid PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS blog_admin_sessions_expiry_idx ON blog_admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS blog_login_rate_limits (
  key text PRIMARY KEY,
  next_allowed_at timestamptz NOT NULL,
  requests integer NOT NULL DEFAULT 1 CHECK (requests > 0)
);
CREATE INDEX IF NOT EXISTS blog_login_rate_limits_expiry_idx ON blog_login_rate_limits (next_allowed_at);
