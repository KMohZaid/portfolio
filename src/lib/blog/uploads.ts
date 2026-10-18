import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { BlogUpload } from "./types";
export { MAX_UPLOAD_BYTES } from "./upload-constants";

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

function serialize(upload: UploadRow): TelegramUpload {
  return { _id: upload.id, url: upload.url, filename: upload.filename, mimeType: upload.mime_type || "application/octet-stream", size: Number(upload.size), createdAt: upload.created_at, removedAt: upload.removed_at ?? undefined };
}

export async function listUploads(): Promise<TelegramUpload[]> {
  const { rows } = await query<UploadRow>("SELECT id,url,filename,size,created_at,removed_at,telegram_file_id,telegram_file_unique_id,mime_type FROM blog_uploads ORDER BY created_at DESC");
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
  const { rows } = await query<UploadRow>("INSERT INTO blog_uploads(id,url,filename,size,created_at,telegram_file_id,telegram_file_unique_id,mime_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (telegram_file_unique_id) WHERE telegram_file_unique_id IS NOT NULL DO UPDATE SET telegram_file_id=EXCLUDED.telegram_file_id, filename=EXCLUDED.filename, size=EXCLUDED.size, mime_type=EXCLUDED.mime_type, removed_at=NULL RETURNING id,url,filename,size,created_at,removed_at,telegram_file_id,telegram_file_unique_id,mime_type", [id, url, upload.filename, upload.size, upload.createdAt, upload.telegramFileId, upload.telegramFileUniqueId, upload.mimeType]);
  return serialize(rows[0]);
}

export async function markUploadRemoved(id: string) {
  const { rowCount } = await query("UPDATE blog_uploads SET removed_at=now() WHERE id=$1 AND removed_at IS NULL", [id]);
  return Boolean(rowCount);
}
