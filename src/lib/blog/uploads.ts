import { getSupabase } from "./db";
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
  const { data, error } = await getSupabase().from("blog_uploads").select("id,url,filename,size,created_at,removed_at").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as UploadRow[]).map(serialize);
}

export async function addUpload(upload: Omit<BlogUpload, "_id">) {
  const { data, error } = await getSupabase().from("blog_uploads").insert({
    url: upload.url,
    filename: upload.filename,
    size: upload.size,
    created_at: upload.createdAt,
    removed_at: upload.removedAt ?? null,
  }).select("id,url,filename,size,created_at,removed_at").single();
  if (error) throw error;
  return serialize(data as UploadRow);
}

export async function markUploadRemoved(id: string) {
  const { data, error } = await getSupabase().from("blog_uploads").update({ removed_at: new Date().toISOString() })
    .eq("id", id).is("removed_at", null).select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
