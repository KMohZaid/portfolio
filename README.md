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
2. Set `AUTH_SECRET` to a stable random secret of at least 32 characters; generate one with `openssl rand -base64 48`. Set `BETTER_AUTH_URL` to your site's origin only, for example `https://your-domain.example` (do not append `/api/auth`); the auth handler is mounted at `/api/auth`.
3. `BETTER_AUTH_API_KEY` is optional for the current Dash plugin setup; leave it blank until a valid key is available, and keep any supplied key server-only. Authentication is self-hosted against your PostgreSQL database and does not depend on Dash ownership verification.
4. Configure Google and/or GitHub OAuth credentials (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`). Register callback URLs `https://your-domain.example/api/auth/callback/google` and `https://your-domain.example/api/auth/callback/github` at the corresponding provider. For a custom OpenID Connect provider, set `CUSTOM_OIDC_PROVIDER_ID`, `CUSTOM_OIDC_DISCOVERY_URL`, `CUSTOM_OIDC_CLIENT_ID`, and optionally secret/name/scopes. For local development register `http://localhost:3000/api/auth/callback/<provider>` and allow `http://localhost:3000` in `BETTER_AUTH_TRUSTED_ORIGINS`.
5. Set `ADMIN_EMAILS` to comma-separated administrator email addresses. OAuth sign-in gives users reader accounts, but admin pages and every admin API independently validate Better Auth's server-side session, verified email status, and the email against this allowlist. Do not treat authenticated readers as admins.
6. For Razorpay, set server-only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Use a Test Mode Key ID (`rzp_test_…`) and its matching secret during development; use Live Mode credentials only when you deliberately enable real payments. A webhook is optional but recommended for asynchronous payment confirmation. In the matching Razorpay Test Mode or Live Mode dashboard, add your environment's public HTTPS URL ending in `/api/payments/webhook`, select the `payment.captured` event, and set the chosen webhook signing secret as `RAZORPAY_WEBHOOK_SECRET`. Never expose either secret in client code, tracked files, logs, or URLs. Apply [`migrations/006_blog_payments.sql`](migrations/006_blog_payments.sql) to the database before enabling paywalls.
7. Optionally set `BETTER_AUTH_TRUSTED_ORIGINS` to comma-separated browser origins (not callback URLs). `APP_URL` is supported as a backwards-compatible fallback origin. Never trust arbitrary forwarded host values.
8. Load the example articles only when desired by running `pnpm db:seed`; this prints only each inserted title and slug.

The SQL uses ordinary PostgreSQL tables, constraints, and indexes. No provider-specific extensions, SDKs, or RLS setup is required. Never expose database URLs, `AUTH_SECRET`, OAuth secrets, or `BETTER_AUTH_API_KEY` in a client bundle, tracked file, or logs.

OAuth providers authenticate users and Better Auth persists the user, provider account, and database-backed HTTP-only session. Admin access is a separate server-side allowlist decision that additionally requires a verified email; new users do not acquire admin privileges merely by signing in. Sign-in uses `/login` and preserves a validated local return destination. A different provider with an existing email is never linked implicitly: sign in to the existing account and explicitly link the other provider from `/blog/account`. Explicit linking requires a verified matching email. Signed-in users can manage connected providers and review Razorpay purchases at `/blog/account`; receipts are available for completed purchases. `BETTER_AUTH_ALLOWED_HOSTS` is optional; when set to comma-separated hostnames, Better Auth can form OAuth callback URLs from those incoming hosts, otherwise it uses the canonical `BETTER_AUTH_URL`. Never trust arbitrary forwarded host values. This is Better Auth, not NextAuth.js/Auth.js.

## Blogging and additional features

AI assistance was used to speed up implementation and help refine features. The design direction and feature ideas were mine; I had plans in mind and kept separate demos as references while working to implement them effectively. AI helped me build and improve the blog, editor, and payment features, but it did not replace my design direction.

The portfolio includes a blog with an admin area for creating, editing, publishing, and hiding posts, plus optional paid articles using Razorpay. Blog content, accounts, and purchases use PostgreSQL. The portfolio can run without blog configuration and then uses bundled read-only sample posts. A free PostgreSQL provider such as Neon can work for light portfolio blogging; review its current free-tier limits and connection guidance before relying on it.

The editor is based on Domternal's Notion-style editor, with additional adjustments for this project. The public `/blog` index and `/blog/[slug]` pages show published, public posts; the admin dashboard supports drafts, publishing, hiding, and optional thumbnail URLs. Telegram-backed admin uploads store files through a Telegram bot rather than in PostgreSQL. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_UPLOAD_CHAT_ID` to enable uploads and file delivery; keep the bot token server-side. The current maximum upload size is 20 MB per file. For larger files, use separate cloud storage and embed or link to the file instead. You can also embed YouTube videos.

Razorpay support was added as an optional feature, in part because a friend wanted it for personal research work. To enable checkout, configure matching `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` values server-side. Start with Test Mode credentials. A webhook is optional but recommended for asynchronous payment confirmation; see `.env.example` for configuration details.

The project is intended to be hostable on serverless platforms such as Vercel, so a dedicated server is not necessarily required. Database, upload, and provider limits may need configuration for your chosen host. `.env.example` documents the environment variables, what they are used for, and whether they are optional. Use it as a setup guide, and keep real credentials and personal values out of tracked files. An AI assistant can also help explain hosting and configuration—use placeholders when asking for help, never actual secrets, tokens, cookies, or database URLs.

There is still plenty I would like to improve, including a glowing pulse animation along the left edge of the screen integrated with the table of contents, as well as other refinements.

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
