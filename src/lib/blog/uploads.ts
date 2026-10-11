import { ObjectId } from "mongodb";
import { getDb } from "./db";
import type { BlogUpload } from "./types";

export const MAX_UPLOAD_BYTES = 4_700_000;
const collectionName = "blog_uploads";

export async function listUploads(): Promise<BlogUpload[]> {
  const items = await (await getDb()).collection(collectionName).find({}).sort({ createdAt: -1 }).toArray();
  return items.map((item) => ({ ...item, _id: String(item._id), createdAt: new Date(item.createdAt).toISOString() } as BlogUpload));
}

export async function addUpload(upload: Omit<BlogUpload, "_id">) {
  const result = await (await getDb()).collection(collectionName).insertOne(upload);
  return { ...upload, _id: String(result.insertedId) };
}

export async function markUploadRemoved(id: string) {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await getDb()).collection(collectionName).updateOne({ _id: new ObjectId(id), removedAt: { $exists: false } }, { $set: { removedAt: new Date() } });
  return result.modifiedCount > 0;
}
