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
  tags: string[];
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
    tags: post.tags ?? [],
    thumbnail: post.thumbnail,
    content: post.content,
    status: post.status,
    visibility: post.visibility,
    createdAt: iso(post.created_at)!,
    updatedAt: iso(post.updated_at)!,
    publishedAt: iso(post.published_at),
  };
}

const columns = "id,title,slug,excerpt,tags,thumbnail,content,status,visibility,created_at,updated_at,published_at";
const draftColumns = "post_id,title,slug,excerpt,tags,thumbnail,content,updated_at";
const isSampleId = (id: string) => id.startsWith("sample-");

export async function listPosts(includeDrafts = false, search = "", tag = ""): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) return samplePosts.filter((post) => (includeDrafts || (post.status === "published" && post.visibility === "public")) && (!tag || post.tags.includes(tag)) && (!search || `${post.title} ${post.excerpt} ${textContent(post.content)}`.toLowerCase().includes(search.toLowerCase())));
  const clauses = [includeDrafts ? "TRUE" : "status = 'published' AND visibility = 'public'"];
  const values: unknown[] = [];
  if (tag) { values.push(tag); clauses.push(`$${values.length} = ANY(tags)`); }
  if (search) { values.push(search); const parameter = values.length; clauses.push(`(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content_text,'')) @@ websearch_to_tsquery('english', $${parameter}) OR title ILIKE '%' || $${parameter} || '%')`); }
  const { rows } = await query<PostRow>(`SELECT ${columns} FROM blog_posts WHERE ${clauses.join(" AND ")} ORDER BY published_at DESC NULLS LAST, updated_at DESC`, values);
  return rows.map(serialize);
}

function textContent(content: BlogPost["content"]): string {
  const visit = (node: { text?: string; content?: unknown[] }): string => `${node.text ?? ""} ${(node.content ?? []).map((child) => child && typeof child === "object" ? visit(child as { text?: string; content?: unknown[] }) : "").join(" ")}`;
  return visit(content);
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

export async function savePost(input: PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string | null; publishDateMode?: "preserve" | "now" | "custom" }, id?: string, preserveDraft = false): Promise<BlogPost> {
  if (id && isSampleId(id)) throw new Error("Bundled sample posts cannot be edited");
  const visibility = input.status === "published" ? input.visibility ?? "public" : "hidden";
  const publishedAt = input.status !== "published" ? input.publishedAt ?? null : input.publishDateMode === "now" ? input.updatedAt : input.publishedAt ?? input.updatedAt;
  const contentText = textContent(input.content).trim();
  const result = id
    ? await query<PostRow>(`UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, tags=$4, thumbnail=$5, content=$6::jsonb, content_text=$7, status=$8, visibility=$9, updated_at=$10, published_at=$11 WHERE id=$12 RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), contentText, input.status, visibility, input.updatedAt, publishedAt, id])
    : await query<PostRow>(`INSERT INTO blog_posts (title,slug,excerpt,tags,thumbnail,content,content_text,status,visibility,created_at,updated_at,published_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$10,$11) RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), contentText, input.status, visibility, input.createdAt, publishedAt]);
  if (!result.rows[0]) throw new Error("Post not found");
  if (id && input.status === "published" && !preserveDraft) await query("DELETE FROM blog_post_drafts WHERE post_id=$1", [id]);
  return serialize(result.rows[0]);
}

export async function saveWorkingDraft(id: string, input: PostInput & Pick<BlogPost, "updatedAt">) {
  await query(`INSERT INTO blog_post_drafts (post_id,title,slug,excerpt,tags,thumbnail,content,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) ON CONFLICT (post_id) DO UPDATE SET title=EXCLUDED.title, slug=EXCLUDED.slug, excerpt=EXCLUDED.excerpt, tags=EXCLUDED.tags, thumbnail=EXCLUDED.thumbnail, content=EXCLUDED.content, updated_at=EXCLUDED.updated_at`, [id, input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), input.updatedAt]);
  return getPostById(id);
}

export async function promoteWorkingDraft(id: string, input: PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string | null; publishDateMode?: "preserve" | "now" | "custom" }) {
  const draft = await getPostDraft(id);
  if (!draft) return null;
  const post = await savePost({ ...input, status: "published", visibility: input.visibility, title: draft.title, slug: draft.slug, excerpt: draft.excerpt, tags: draft.tags, thumbnail: draft.thumbnail, content: draft.content }, id, true);
  await query("DELETE FROM blog_post_drafts WHERE post_id=$1", [id]);
  return post;
}

export async function getPostDraft(id: string) {
  const { rows } = await query<{ post_id: string; title: string; slug: string; excerpt: string; tags: string[]; thumbnail: string | null; content: BlogPost["content"]; updated_at: Date | string }>(`SELECT ${draftColumns} FROM blog_post_drafts WHERE post_id=$1`, [id]);
  return rows[0] ? { ...rows[0], updatedAt: iso(rows[0].updated_at) } : null;
}

export async function discardPostDraft(id: string) {
  const { rowCount } = await query("DELETE FROM blog_post_drafts WHERE post_id=$1", [id]);
  return Boolean(rowCount);
}


export async function slugInUse(slug: string, exceptId?: string): Promise<boolean> {
  const isUuid = Boolean(exceptId && /^[0-9a-f-]{36}$/i.test(exceptId));
  const { rows } = await query<{ exists: boolean }>("SELECT EXISTS (SELECT 1 FROM blog_posts WHERE slug=$1 AND (NOT $2::boolean OR id <> $3::uuid)) OR EXISTS (SELECT 1 FROM blog_post_drafts WHERE slug=$1 AND (NOT $2::boolean OR post_id <> $3::uuid)) AS exists", [slug, isUuid, isUuid ? exceptId : null]);
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
