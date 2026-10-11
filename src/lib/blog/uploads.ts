import { query } from "./db";
import type { BlogUpload } from "./types";

export const MAX_UPLOAD_BYTES = 4_700_000;

type UploadRow = {
  id: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
  removed_at: string | null;
};

function serialize(upload: UploadRow): BlogUpload {
  return { _id: upload.id, url: upload.url, filename: upload.filename, size: upload.size, createdAt: upload.created_at, removedAt: upload.removed_at ?? undefined };
}

export async function listUploads(): Promise<BlogUpload[]> {
  const { rows } = await query<UploadRow>("SELECT id,url,filename,size,created_at,removed_at FROM blog_uploads ORDER BY created_at DESC");
  return rows.map(serialize);
}

export async function addUpload(upload: Omit<BlogUpload, "_id">) {
  const { rows } = await query<UploadRow>("INSERT INTO blog_uploads(url,filename,size,created_at,removed_at) VALUES($1,$2,$3,$4,$5) RETURNING id,url,filename,size,created_at,removed_at", [upload.url, upload.filename, upload.size, upload.createdAt, upload.removedAt ?? null]);
  return serialize(rows[0]);
}

export async function markUploadRemoved(id: string) {
  const { rowCount } = await query("UPDATE blog_uploads SET removed_at=now() WHERE id=$1 AND removed_at IS NULL", [id]);
  return Boolean(rowCount);
}
