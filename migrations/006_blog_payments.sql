-- Per-post paywall configuration and verified Razorpay purchases.
CREATE TABLE IF NOT EXISTS blog_post_paywalls (
  post_id uuid PRIMARY KEY REFERENCES blog_posts(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  price_paise integer NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  access_duration_seconds bigint CHECK (access_duration_seconds IS NULL OR access_duration_seconds > 0),
  show_excerpt boolean NOT NULL DEFAULT false,
  show_thumbnail boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT enabled OR price_paise > 0)
);

CREATE TABLE IF NOT EXISTS blog_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE RESTRICT,
  user_id text NOT NULL,
  user_email text NOT NULL,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text UNIQUE,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  access_duration_seconds bigint CHECK (access_duration_seconds IS NULL OR access_duration_seconds > 0),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  paid_at timestamptz,
  access_expires_at timestamptz,
  refund_status text NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_payment_webhook_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_purchases_user_paid_idx ON blog_purchases (user_id, paid_at DESC) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS blog_purchases_post_user_expiry_idx ON blog_purchases (post_id, user_id, access_expires_at) WHERE status = 'paid';
