import { ObjectId } from "mongodb";
import type { WithId, Document } from "mongodb";
import { getDb } from "./db";
import type { BlogPost } from "./types";
import type { z } from "zod";
import { postSchema } from "./validation";
type PostInput = Omit<z.infer<typeof postSchema>, "content"> & { content: BlogPost["content"] };

const collectionName = "blog_posts";

function serialize(post: WithId<Document>): BlogPost {
  return { ...post, _id: String(post._id), createdAt: new Date(post.createdAt).toISOString(), updatedAt: new Date(post.updatedAt).toISOString(), publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined } as BlogPost;
}

export async function listPosts(includeDrafts = false): Promise<BlogPost[]> {
  const collection = (await getDb()).collection(collectionName);
  const posts = await collection.find(includeDrafts ? {} : { status: "published" }).sort({ publishedAt: -1, updatedAt: -1 }).toArray();
  return posts.map(serialize);
}

export async function getPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
  const filter = includeDraft ? { slug } : { slug, status: "published" };
  const post = await (await getDb()).collection(collectionName).findOne(filter);
  return post ? serialize(post) : null;
}

export async function savePost(input: PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string }, id?: string): Promise<BlogPost> {
  const collection = (await getDb()).collection(collectionName);
  const now = new Date();
  const document = { ...input, updatedAt: now };
  if (id) {
    if (!ObjectId.isValid(id)) throw new Error("Invalid post id");
    const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: document }, { returnDocument: "after" });
    if (!result) throw new Error("Post not found");
    return serialize(result);
  }
  const inserted = await collection.insertOne({ ...document, createdAt: now });
  return serialize({ ...document, createdAt: now, _id: inserted.insertedId });
}

export async function slugInUse(slug: string, exceptId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };
  if (exceptId && ObjectId.isValid(exceptId)) filter._id = { $ne: new ObjectId(exceptId) };
  return Boolean(await (await getDb()).collection(collectionName).findOne(filter, { projection: { _id: 1 } }));
}

export async function deletePost(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await getDb()).collection(collectionName).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
