import { isDatabaseConfigured, query } from "./db";
import { samplePosts } from "./sample-posts";
import type { BlogPost } from "./types";
import type { z } from "zod";
import { postSchema } from "./validation";
type PostInput = Omit<z.infer<typeof postSchema>, "content"> & { content: BlogPost["content"] };

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  content: BlogPost["content"];
  status: BlogPost["status"];
  visibility: BlogPost["visibility"];
  created_at: Date | string;
  updated_at: Date | string;
  published_at: Date | string | null;
};

function iso(value: Date | string | null) {
  return value instanceof Date ? value.toISOString() : value ?? undefined;
}

function serialize(post: PostRow): BlogPost {
  return {
    _id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    thumbnail: post.thumbnail,
    content: post.content,
    status: post.status,
    visibility: post.visibility,
    createdAt: iso(post.created_at)!,
    updatedAt: iso(post.updated_at)!,
    publishedAt: iso(post.published_at),
  };
}

const columns = "id,title,slug,excerpt,thumbnail,content,status,visibility,created_at,updated_at,published_at";
const isSampleId = (id: string) => id.startsWith("sample-");

export async function listPosts(includeDrafts = false): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) return samplePosts.filter((post) => includeDrafts || (post.status === "published" && post.visibility === "public"));
  const { rows } = await query<PostRow>(`SELECT ${columns} FROM blog_posts ${includeDrafts ? "" : "WHERE status = 'published' AND visibility = 'public'"} ORDER BY published_at DESC NULLS LAST, updated_at DESC`);
  return rows.map(serialize);
}

export async function getPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
  if (!isDatabaseConfigured()) return samplePosts.find((post) => post.slug === slug && (includeDraft || (post.status === "published" && post.visibility === "public"))) ?? null;
  const { rows } = await query<PostRow>(`SELECT ${columns} FROM blog_posts WHERE slug = $1 ${includeDraft ? "" : "AND status = 'published' AND visibility = 'public'"} LIMIT 1`, [slug]);
  return rows[0] ? serialize(rows[0]) : null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!isDatabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await query<PostRow>(`SELECT ${columns} FROM blog_posts WHERE id = $1`, [id]);
  return rows[0] ? serialize(rows[0]) : null;
}

export async function savePost(input: PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string }, id?: string): Promise<BlogPost> {
  if (id && isSampleId(id)) throw new Error("Bundled sample posts cannot be edited");
  const visibility = input.visibility ?? "public";
  const result = id
    ? await query<PostRow>(`UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, thumbnail=$4, content=$5::jsonb, status=$6, visibility=$7, updated_at=$8, published_at=$9 WHERE id=$10 RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.thumbnail, JSON.stringify(input.content), input.status, visibility, input.updatedAt, input.publishedAt ?? null, id])
    : await query<PostRow>(`INSERT INTO blog_posts (title,slug,excerpt,thumbnail,content,status,visibility,created_at,updated_at,published_at) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$8,$9) RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.thumbnail, JSON.stringify(input.content), input.status, visibility, input.createdAt, input.publishedAt ?? null]);
  if (!result.rows[0]) throw new Error("Post not found");
  return serialize(result.rows[0]);
}

export async function slugInUse(slug: string, exceptId?: string): Promise<boolean> {
  const isUuid = Boolean(exceptId && /^[0-9a-f-]{36}$/i.test(exceptId));
  const { rows } = await query<{ exists: boolean }>("SELECT EXISTS (SELECT 1 FROM blog_posts WHERE slug=$1 AND (NOT $2::boolean OR id <> $3::uuid)) AS exists", [slug, isUuid, isUuid ? exceptId : null]);
  return rows[0].exists;
}

export async function setPostVisibility(id: string, visibility: BlogPost["visibility"]): Promise<BlogPost | null> {
  if (isSampleId(id)) return null;
  const { rows } = await query<PostRow>(`UPDATE blog_posts SET visibility=$2, updated_at=now() WHERE id=$1 RETURNING ${columns}`, [id, visibility]);
  return rows[0] ? serialize(rows[0]) : null;
}

export async function deletePost(id: string): Promise<boolean> {
  if (isSampleId(id)) return false;
  const { rowCount } = await query("DELETE FROM blog_posts WHERE id=$1", [id]);
  return Boolean(rowCount);
}
