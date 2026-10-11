# KMohZaid Portfolio

Personal portfolio built with Next.js, React, and Tailwind CSS. The blog adds a MongoDB-backed post editor with a shared Tiptap document model for normal and Notion-like editing modes.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Fill in MongoDB, authentication, allowlist, and email settings (see below)
pnpm dev
```

The portfolio itself still runs without blog configuration; blog and admin routes show a clear unavailable/configuration state until configured. Use Node.js 20.9+ and pnpm.

## Blog and admin configuration

- `MONGODB_URI`: MongoDB connection URI. The app stores blog posts in `blog_posts` and its Telegraph upload index in `blog_uploads` within the selected database.
- `MONGODB_DB`: database name (defaults to `portfolio`).
- `AUTH_SECRET`: a stable random secret of at least 32 characters; generate one with `openssl rand -base64 48`.
- `ADMIN_EMAILS`: comma-separated admin email addresses, normalized case-insensitively.
- `RESEND_API_KEY`: Resend API key used to send sign-in links.
- `AUTH_FROM_EMAIL`: sender configured and verified with Resend.
- `NEXT_PUBLIC_SITE_URL`: canonical origin used to construct the emailed sign-in link (must be HTTPS in production).

Admin login is passwordless: a short-lived, signed one-time link is mailed only to allowlisted emails; successful verification issues an HTTP-only, same-site session cookie (seven-day session). Do not deploy with a sample secret or an unverified sender. The code does not bypass email verification when credentials are missing.

## Writing and images

The public `/blog` index and `/blog/[slug]` pages show published posts only. The `/admin` dashboard supports draft/published create, edit, publish, and delete operations. Both editor views use the exact same Tiptap JSON document; switching view mode does not transform stored content. AI editing is not included.

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
