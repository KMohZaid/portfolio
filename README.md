# KMohZaid Portfolio

Personal portfolio built with Next.js, React, and Tailwind CSS. The blog uses a generic PostgreSQL database through the `pg` driver and the MIT-licensed Domternal React editor, with Classic and Notion-style modes over the same JSON document.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Set database, authentication, allowlist, and email settings (see below)
pnpm dev
```

The portfolio itself still runs without blog configuration; the public blog then uses three bundled read-only sample posts. Admin sign-in and writes require a configured PostgreSQL database and email sender. Use Node.js 20.9+ and pnpm.

## Blog and admin configuration

1. Configure a PostgreSQL database and set `DATABASE_URL` to its direct connection string. Apply [`migrations/001_blog.sql`](migrations/001_blog.sql) with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_blog.sql`. The runtime prefers `DATABASE_URL_POOLED` when set and otherwise uses `DATABASE_URL`. Both are server-only and must not use a `NEXT_PUBLIC_` prefix.
2. Set `AUTH_SECRET` to a stable random secret of at least 32 characters; generate one with `openssl rand -base64 48`.
3. Set `ADMIN_EMAILS` to comma-separated admin email addresses, normalized case-insensitively. The example is `kthecoder7@gmail.com`; replace it if a different admin should be authorized.
4. Set `RESEND_API_KEY` and `AUTH_FROM_EMAIL` to a sender configured and verified with Resend.
5. `APP_URL` is an optional server-only canonical origin used to construct the email's sign-in page URL; set it to the current deployment's origin when you want a fixed canonical domain. If omitted, the request host is used only after matching it against `TRUSTED_HOSTS` (comma-separated host[:port] allowlist; localhost defaults are for development only). In production, the origin must use HTTPS. These server-only settings avoid hardcoding a domain in client bundles and prevent arbitrary host headers from poisoning email links.
6. Load four idempotent Domternal-format example articles by running `pnpm db:seed` after setting `DATABASE_URL`; this prints only each inserted title and slug.

The SQL uses ordinary PostgreSQL tables, constraints, and indexes. No provider-specific extensions, SDKs, roles, or row-level security setup are required. The application connects only from server code; never expose database URLs in a client bundle, tracked files, or logs.

Admin login is passwordless: a random six-digit code is emailed only to allowlisted addresses, expires after five minutes, and is stored only as an HMAC hash. Codes are single-use and verification attempts are rate-limited; successful verification issues an HTTP-only, same-site session cookie (seven-day session). Email verification uses `APP_URL` when configured; otherwise the request origin is accepted only when its host is on `TRUSTED_HOSTS`, and HTTPS is required in production. Configure trusted proxy host/protocol forwarding carefully. Do not deploy with a sample secret or an unverified sender. The code does not bypass email verification when credentials are missing.

## Writing and images

The public `/blog` index and `/blog/[slug]` pages show published, public posts only. The `/admin` dashboard supports draft/published create, edit, publish, hide/unhide, and delete operations. Hiding a published post preserves all its content while removing it from public listings and detail routes. Classic and Notion-style editor modes use Domternal's shared ProseMirror JSON schema; switching modes keeps compatible document nodes (paragraphs, headings, lists, links, quotes, code, images, and horizontal rules). Domternal Pro-only features such as hosted collaboration, comments, version history, AI, and DOCX import/export are not used. AI editing is not included.

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
