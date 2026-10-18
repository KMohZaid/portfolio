# KMohZaid Portfolio

Personal portfolio built with Next.js, React, and Tailwind CSS. The blog uses a generic PostgreSQL database through the `pg` driver and the MIT-licensed Domternal React editor, with Classic and Notion-style modes over the same JSON document.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Set database, Better Auth, provider, and admin allowlist settings (see below)
pnpm dev
```

The portfolio itself still runs without blog configuration; the public blog then uses three bundled read-only sample posts. Reader accounts and admin writes require a configured PostgreSQL database and at least one OAuth provider. Use Node.js 20.9+ and pnpm.

## Blog and admin configuration

1. Configure the existing PostgreSQL database and set `DATABASE_URL` to its direct connection string. Apply [`migrations/001_blog.sql`](migrations/001_blog.sql) and [`migrations/002_better_auth.sql`](migrations/002_better_auth.sql) using `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <migration>`. Both are idempotent and preserve existing blog data and legacy auth tables. The runtime prefers `DATABASE_URL_POOLED` when set; Better Auth and blog persistence use the same PostgreSQL database. Keep both URLs server-side.
2. Set `AUTH_SECRET` to a stable random secret of at least 32 characters; generate one with `openssl rand -base64 48`. Set `BETTER_AUTH_URL` to the site origin only, e.g. `https://web.kmohzaid.eu.org` (do not append `/api/auth`); the auth handler is mounted at `/api/auth`.
3. `BETTER_AUTH_API_KEY` is optional for the current Dash plugin setup; leave it blank until a valid key is available, and keep any supplied key server-only. Authentication is self-hosted against your PostgreSQL database and does not depend on Dash ownership verification.
4. Configure Google and/or GitHub OAuth credentials (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`). Register callback URLs `https://web.kmohzaid.eu.org/api/auth/callback/google` and/or `/api/auth/callback/github` at the corresponding provider. For a custom OpenID Connect provider, set `CUSTOM_OIDC_PROVIDER_ID`, `CUSTOM_OIDC_DISCOVERY_URL`, `CUSTOM_OIDC_CLIENT_ID`, and optionally secret/name/scopes. For local development register `http://localhost:3000/api/auth/callback/<provider>` and allow `http://localhost:3000` in `BETTER_AUTH_TRUSTED_ORIGINS`.
5. Set `ADMIN_EMAILS` to comma-separated administrator email addresses. OAuth sign-in gives users reader accounts, but admin pages and every admin API independently validate Better Auth's server-side session, verified email status, and the email against this allowlist. Do not treat authenticated readers as admins.
6. For Razorpay, set server-only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Use a Test Mode Key ID (`rzp_test_…`) and its matching secret during development; use Live Mode credentials only when you deliberately enable real payments. Configure a webhook for `payment.captured` at `/api/payments/webhook` and set its signing secret as `RAZORPAY_WEBHOOK_SECRET`. Never expose either secret in client code, tracked files, logs, or URLs. Apply [`migrations/006_blog_payments.sql`](migrations/006_blog_payments.sql) to the test database before enabling paywalls.
7. Optionally set `BETTER_AUTH_TRUSTED_ORIGINS` to comma-separated browser origins (not callback URLs). `APP_URL` is supported as a backwards-compatible fallback origin. Never trust arbitrary forwarded host values.
8. Load the example articles only when desired by running `pnpm db:seed`; this prints only each inserted title and slug.

The SQL uses ordinary PostgreSQL tables, constraints, and indexes. No provider-specific extensions, SDKs, or RLS setup is required. Never expose database URLs, `AUTH_SECRET`, OAuth secrets, or `BETTER_AUTH_API_KEY` in a client bundle, tracked file, or logs.

OAuth providers authenticate users and Better Auth persists the user, provider account, and database-backed HTTP-only session. Admin access is a separate server-side allowlist decision that additionally requires a verified email; new users do not acquire admin privileges merely by signing in. Sign-in uses `/login` and preserves a validated local return destination. A different provider with an existing email is never linked implicitly: sign in to the existing account and explicitly link the other provider from `/blog/account`. Explicit linking requires a verified matching email. Signed-in users can manage connected providers and review Razorpay purchases at `/blog/account`; receipts are available for completed purchases. `BETTER_AUTH_ALLOWED_HOSTS` is optional; when set to comma-separated hostnames, Better Auth can form OAuth callback URLs from those incoming hosts, otherwise it uses the canonical `BETTER_AUTH_URL`. Never trust arbitrary forwarded host values. This is Better Auth, not NextAuth.js/Auth.js.

## Writing and images

The public `/blog` index and `/blog/[slug]` pages show published, public posts only. The `/admin` dashboard supports draft/published create, edit, publish, hide/unhide, and delete operations. Save draft never publishes; publishing requires the explicit Publish action, and a published post can be returned to draft. Hiding a published post preserves all its content while removing it from public listings and detail routes. Posts can optionally use a thumbnail URL (including the first image in the post content), shown on the blog index and as the post hero. The editor opens in Notion style by default, with Normal and Notion-style modes using Domternal's shared ProseMirror JSON schema; switching modes keeps compatible document nodes (paragraphs, headings, lists, links, quotes, code, images, and horizontal rules). Domternal Pro-only features such as hosted collaboration, comments, version history, AI, and DOCX import/export are not used. AI editing is not included.

The editor's Telegraph upload proxy limits input files to 4,700,000 bytes (below the documented 5 MiB practical client limit). Telegraph upload is an undocumented endpoint; it may reject requests or block the server IP. On upload failure, the editor displays an actionable error and supports inserting a remote image URL. Uploaded files are hosted by Telegraph, not in this database. This site keeps a local index of upload references. Telegraph/Graph does not expose a public API to list or delete uploaded files; "Unlist" only marks an entry removed in this local index and does not delete the remote image. Images inserted in post content remain accessible at their original URLs.

## Scripts

- `pnpm dev` — development server
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript check

## Credits

The admin/dashboard implementation was informed by the Reddit discussion: [r/reactjs comment](https://www.reddit.com/r/reactjs/comments/1kphbcn/comment/msxq1lx/).

## Disclaimer: use of AI

1. My about-me section, skill descriptions, and journey are based on my story that I gave to AI to help fill out properly.
2. As I am not that good with frontend, I used AI help with design and also took inspiration from other websites.

## Honorable mentions

1. [Mahesh Babu](https://www.maheshbabu11.dev/) — [GitHub](https://github.com/MaheshBabu11)
2. [Farman Ansari](https://www.imsahil.org/) — [GitHub](https://github.com/Sahil0976)

There are many more portfolio websites I looked at for inspiration, but I cannot think of them right now. Those are the two I took the most inspiration from.
