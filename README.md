# KMohZaid Portfolio

Personal portfolio built with Next.js, React, and Tailwind CSS. The blog uses Supabase Postgres and the MIT-licensed Domternal React editor, with Classic and Notion-style modes over the same JSON document.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Fill in Supabase, authentication, allowlist, and email settings (see below)
pnpm dev
```

The portfolio itself still runs without blog configuration; the public blog then uses three bundled sample posts so layouts can be tested without Supabase. Admin sign-in and writes remain unavailable until configured, and no fake admin authentication or write mode is provided. Use Node.js 20.9+ and pnpm.

## Blog and admin configuration

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. To load the three demo articles, run [`supabase/sample-posts.sql`](supabase/sample-posts.sql) afterward. The public blog also includes bundled read-only samples when the server Supabase credentials are absent.
2. Set `SUPABASE_URL` to the project URL and `SUPABASE_SERVICE_ROLE_KEY` to the server secret/service-role key from Project Settings → API in `.env.local` and your server deployment environment. The publishable key is not a substitute for the secret/service-role key required by this server-only persistence layer. The server key bypasses row-level security: keep it secret, never prefix it with `NEXT_PUBLIC_`, and never expose it in browser code. The project's publishable key is not needed by this server-only app.
3. Set `AUTH_SECRET` to a stable random secret of at least 32 characters; generate one with `openssl rand -base64 48`.
4. Set `ADMIN_EMAILS` to comma-separated admin email addresses, normalized case-insensitively. The example is `mzaidkapadia+portfolio@gmail.com`; replace it if a different admin should be authorized.
5. Set `RESEND_API_KEY` and `AUTH_FROM_EMAIL` to a sender configured and verified with Resend.
6. `APP_URL` is an optional server-only canonical origin used to construct the email's sign-in page URL; set it to the current deployment's origin (for example, `https://your-domain.example`) when you want a fixed canonical domain. If omitted, the request host is used only after matching it against `TRUSTED_HOSTS` (comma-separated host[:port] allowlist; localhost defaults are for development only). In production, the origin must use HTTPS. These server-only settings avoid hardcoding a domain in client bundles and prevent arbitrary host headers from poisoning email links.

The SQL creates `blog_posts`, `blog_uploads`, and private admin-auth/rate-limit tables. Row-level security is enabled and direct `anon`/`authenticated` access is revoked; the app accesses these tables only from server-side code using the Supabase service role key. Do not include that key in any client bundle.

Admin login is passwordless: a random six-digit code is emailed only to allowlisted addresses, expires after five minutes, and is stored only as an HMAC hash. Codes are atomically single-use and verification attempts are rate-limited; successful verification issues an HTTP-only, same-site session cookie (seven-day session). Email verification uses `APP_URL` when configured; otherwise the request origin is accepted only when its host is on `TRUSTED_HOSTS` (default: localhost development hosts), and HTTPS is required in production. Configure trusted proxy host/protocol forwarding carefully. Do not deploy with a sample secret or an unverified sender. The code does not bypass email verification when credentials are missing.

## Writing and images

The public `/blog` index and `/blog/[slug]` pages show published posts only. The `/admin` dashboard supports draft/published create, edit, publish, and delete operations. Classic and Notion-style editor modes use Domternal's shared ProseMirror JSON schema; switching modes keeps compatible document nodes (paragraphs, headings, lists, links, quotes, code, images, and horizontal rules). Domternal Pro-only features such as hosted collaboration, comments, version history, AI, and DOCX import/export are not used. AI editing is not included.

The editor's Telegraph upload proxy limits input files to 4,700,000 bytes (below the documented 5 MiB practical client limit). Telegraph upload is an undocumented endpoint; it may reject requests or block the server IP. On upload failure, the editor displays an actionable error and supports inserting a remote image URL. Uploaded files are hosted by Telegraph, not in this database. This site keeps a local index of upload references. Telegraph/Graph does not expose a public API to list or delete uploaded files; "Unlist" only marks an entry removed in this local index and **does not delete the remote image**. Images inserted in post content remain accessible at their original URLs.

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
