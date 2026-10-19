import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query, withTransaction } from "./db";
import type { BlogUpload } from "./types";
export { MAX_UPLOAD_BYTES } from "./upload-constants";

const uploadReferenceLock = [74123, 1] as const;

export type TelegramUpload = BlogUpload & { _id: string };

type UploadRow = {
  id: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
  removed_at: string | null;
  telegram_file_id: string | null;
  telegram_file_unique_id: string | null;
  mime_type: string | null;
};

type PostUploadReferenceRow = { title: string; thumbnail: string | null; content: unknown };

function serialize(upload: UploadRow): TelegramUpload {
  return { _id: upload.id, url: upload.url, filename: upload.filename, mimeType: upload.mime_type || "application/octet-stream", size: Number(upload.size), createdAt: upload.created_at, removedAt: upload.removed_at ?? undefined };
}

export async function acquireUploadReferenceLock(client: PoolClient) {
  await client.query("SELECT pg_advisory_xact_lock($1, $2)", uploadReferenceLock);
}

function rowReferencesUrl(row: PostUploadReferenceRow, url: string) {
  return row.thumbnail === url || getUploadUrls(row.content, null).includes(url);
}

async function referencedRows(client?: PoolClient) {
  const statement = `SELECT u.id AS upload_id,u.url,p.title,p.thumbnail,p.content
    FROM blog_uploads u JOIN blog_posts p ON p.thumbnail=u.url OR p.content::text LIKE '%' || u.url || '%'
    UNION ALL
    SELECT u.id AS upload_id,u.url,p.title,d.thumbnail,d.content
    FROM blog_uploads u JOIN blog_post_drafts d ON d.thumbnail=u.url OR d.content::text LIKE '%' || u.url || '%'
    JOIN blog_posts p ON p.id=d.post_id`;
  const result = client
    ? await client.query<{ upload_id: string; url: string } & PostUploadReferenceRow>(statement)
    : await query<{ upload_id: string; url: string } & PostUploadReferenceRow>(statement);
  return result.rows.filter((row) => rowReferencesUrl(row, row.url));
}

export async function findReferencedUploads(client?: PoolClient) {
  const rows = await referencedRows(client);
  const references = new Map<string, { uploadId: string; url: string; usedIn: string[] }>();
  for (const row of rows) {
    const current = references.get(row.upload_id) ?? { uploadId: row.upload_id, url: row.url, usedIn: [] };
    if (!current.usedIn.includes(row.title)) current.usedIn.push(row.title);
    references.set(row.upload_id, current);
  }
  return [...references.values()];
}

export async function getUploadReferences(url: string, client?: PoolClient): Promise<string[]> {
  const statement = `SELECT title,thumbnail,content FROM blog_posts
    UNION ALL SELECT p.title,d.thumbnail,d.content FROM blog_post_drafts d JOIN blog_posts p ON p.id=d.post_id`;
  const result = client
    ? await client.query<PostUploadReferenceRow>(statement)
    : await query<PostUploadReferenceRow>(statement);
  return [...new Set<string>(result.rows.filter((row) => rowReferencesUrl(row, url)).map((row) => row.title as string))];
}

export async function ensureUploadUrlsActive(urls: Iterable<string>, client: PoolClient) {
  const uniqueUrls = [...new Set(urls)];
  if (!uniqueUrls.length) return;
  const { rows } = await client.query<{ url: string; removed_at: string | null }>("SELECT url,removed_at FROM blog_uploads WHERE url=ANY($1::text[])", [uniqueUrls]);
  const indexed = new Map(rows.map((row) => [row.url, row.removed_at]));
  const unavailable = uniqueUrls.filter((url) => !indexed.has(url) || indexed.get(url) !== null);
  if (unavailable.length) throw new Error(`Cannot save references to missing or unlisted upload(s): ${unavailable.join(", ")}`);
}

export function getUploadUrls(content: unknown, thumbnail: string | null | undefined): string[] {
  const urls = new Set<string>();
  if (thumbnail?.startsWith("/api/files/")) urls.add(thumbnail);
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const node = value as { attrs?: { src?: unknown }; content?: unknown[] };
    if (typeof node.attrs?.src === "string" && node.attrs.src.startsWith("/api/files/")) urls.add(node.attrs.src);
    (node.content ?? []).forEach(visit);
  };
  visit(content);
  return [...urls];
}

export async function listUploads(client?: PoolClient): Promise<TelegramUpload[]> {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run<UploadRow>("SELECT id,url,filename,size,created_at,removed_at,telegram_file_id,telegram_file_unique_id,mime_type FROM blog_uploads ORDER BY created_at DESC");
  return rows.map(serialize);
}

export async function getUploadById(id: string, includeRemoved = false): Promise<{ upload: TelegramUpload; telegramFileId: string; mimeType: string } | null> {
  const { rows } = await query<UploadRow>(`SELECT id,url,filename,size,created_at,removed_at,telegram_file_id,telegram_file_unique_id,mime_type FROM blog_uploads WHERE id=$1${includeRemoved ? "" : " AND removed_at IS NULL"} LIMIT 1`, [id]);
  const row = rows[0];
  return row?.telegram_file_id ? { upload: serialize(row), telegramFileId: row.telegram_file_id, mimeType: row.mime_type || "application/octet-stream" } : null;
}

export async function addUpload(upload: { filename: string; size: number; createdAt: string; telegramFileId: string; telegramFileUniqueId: string; mimeType: string }) {
  const id = randomUUID();
  const url = `/api/files/${id}`;
  return withTransaction(async (client) => {
    await acquireUploadReferenceLock(client);
    const { rows } = await client.query<UploadRow>("INSERT INTO blog_uploads(id,url,filename,size,created_at,telegram_file_id,telegram_file_unique_id,mime_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (telegram_file_unique_id) WHERE telegram_file_unique_id IS NOT NULL DO UPDATE SET telegram_file_id=EXCLUDED.telegram_file_id, filename=EXCLUDED.filename, size=EXCLUDED.size, mime_type=EXCLUDED.mime_type, removed_at=NULL RETURNING id,url,filename,size,created_at,removed_at,telegram_file_id,telegram_file_unique_id,mime_type", [id, url, upload.filename, upload.size, upload.createdAt, upload.telegramFileId, upload.telegramFileUniqueId, upload.mimeType]);
    return serialize(rows[0]);
  });
}

export async function markUploadRemoved(id: string) {
  return withTransaction(async (client) => {
    await acquireUploadReferenceLock(client);
    const { rows } = await client.query<{ id: string; url: string }>("SELECT id,url FROM blog_uploads WHERE id=$1 AND removed_at IS NULL FOR UPDATE", [id]);
    const upload = rows[0];
    if (!upload) return { removed: false as const, references: [] as string[] };
    const references = await getUploadReferences(upload.url, client);
    if (references.length) return { removed: false as const, references };
    const result = await client.query("UPDATE blog_uploads SET removed_at=now() WHERE id=$1 AND removed_at IS NULL", [id]);
    return { removed: Boolean(result.rowCount), references: [] as string[] };
  });
}
