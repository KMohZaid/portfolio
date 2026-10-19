import { isDatabaseConfigured, query, withTransaction } from "./db";
import type { PoolClient } from "pg";
import { acquireUploadReferenceLock, ensureUploadUrlsActive, getUploadUrls } from "./uploads";
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
  is_paid?: boolean;
  paywall_price_paise?: number;
  paywall_show_excerpt?: boolean;
  paywall_show_thumbnail?: boolean;
  paywall_access_duration_seconds?: number | null;
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
    isPaid: post.is_paid ?? false,
    pricePaise: post.paywall_price_paise == null ? undefined : Number(post.paywall_price_paise),
    showExcerpt: post.paywall_show_excerpt ?? true,
    showThumbnail: post.paywall_show_thumbnail ?? true,
    accessDurationSeconds: post.paywall_access_duration_seconds == null ? null : Number(post.paywall_access_duration_seconds),
  };
}

const columns = "id,title,slug,excerpt,tags,thumbnail,content,status,visibility,created_at,updated_at,published_at";
const paidColumns = "coalesce(pw.enabled,false) AS is_paid,pw.price_paise AS paywall_price_paise,coalesce(pw.show_excerpt,true) AS paywall_show_excerpt,coalesce(pw.show_thumbnail,true) AS paywall_show_thumbnail,pw.access_duration_seconds AS paywall_access_duration_seconds";
function publicColumns(canSeePaidContent: boolean, includeDrafts = false, buyerParameter?: string) {
  if (includeDrafts) return `blog_posts.${columns.replaceAll(",", ",blog_posts.")},${paidColumns}`;
  const purchaseAccess = buyerParameter
    ? `EXISTS (SELECT 1 FROM blog_purchases bp WHERE bp.post_id=blog_posts.id AND bp.user_id=${buyerParameter} AND bp.status='paid' AND (bp.access_expires_at IS NULL OR bp.access_expires_at > now()))`
    : "FALSE";
  const canReadPaidContent = `(${canSeePaidContent ? "TRUE" : "FALSE"} OR ${purchaseAccess})`;
  return `blog_posts.id,blog_posts.title,blog_posts.slug,CASE WHEN coalesce(pw.enabled,false) AND NOT ${canReadPaidContent} THEN CASE WHEN coalesce(pw.show_excerpt,false) THEN blog_posts.excerpt ELSE '' END ELSE blog_posts.excerpt END AS excerpt,blog_posts.tags,CASE WHEN coalesce(pw.enabled,false) AND NOT ${canReadPaidContent} AND NOT coalesce(pw.show_thumbnail,false) THEN NULL ELSE blog_posts.thumbnail END AS thumbnail,CASE WHEN coalesce(pw.enabled,false) AND NOT ${canReadPaidContent} THEN '{"type":"doc","content":[]}'::jsonb ELSE blog_posts.content END AS content,blog_posts.status,blog_posts.visibility,blog_posts.created_at,blog_posts.updated_at,blog_posts.published_at,${paidColumns}`;
}
const paidJoin = "LEFT JOIN blog_post_paywalls pw ON pw.post_id=blog_posts.id";
const isSampleId = (id: string) => id.startsWith("sample-");

export async function listAdminPostSummaries(): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) return samplePosts;
  const { rows } = await query<PostRow>(`SELECT blog_posts.id,blog_posts.title,blog_posts.slug,blog_posts.excerpt,blog_posts.tags,blog_posts.thumbnail,
    '{"type":"doc","content":[]}'::jsonb AS content,blog_posts.status,blog_posts.visibility,blog_posts.created_at,blog_posts.updated_at,blog_posts.published_at,
    coalesce(pw.enabled,false) AS is_paid,pw.price_paise AS paywall_price_paise,coalesce(pw.show_excerpt,true) AS paywall_show_excerpt,
    coalesce(pw.show_thumbnail,true) AS paywall_show_thumbnail,pw.access_duration_seconds AS paywall_access_duration_seconds
    FROM blog_posts LEFT JOIN blog_post_paywalls pw ON pw.post_id=blog_posts.id
    ORDER BY blog_posts.updated_at DESC`);
  return rows.map(serialize);
}

export async function listPosts(includeDrafts = false, search = "", tag = "", buyerUserId?: string, isAdmin = false): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) return samplePosts.filter((post) => (includeDrafts || (post.status === "published" && post.visibility === "public")) && (!tag || post.tags.includes(tag)) && (!search || `${post.title} ${post.excerpt} ${textContent(post.content)}`.toLowerCase().includes(search.toLowerCase())));
  const clauses = [includeDrafts ? "TRUE" : "blog_posts.status = 'published' AND blog_posts.visibility = 'public'"];
  const values: unknown[] = [];
  if (tag) { values.push(tag); clauses.push(`$${values.length} = ANY(blog_posts.tags)`); }
  if (search) { values.push(search); const parameter = values.length; clauses.push(`(to_tsvector('english', coalesce(blog_posts.title,'') || ' ' || coalesce(blog_posts.excerpt,'') || ' ' || coalesce(blog_posts.content_text,'')) @@ websearch_to_tsquery('english', $${parameter}) OR blog_posts.title ILIKE '%' || $${parameter} || '%')`); }
  const buyerParameter = buyerUserId ? `$${values.push(buyerUserId)}` : undefined;
  const selectColumns = publicColumns(isAdmin, includeDrafts, buyerParameter);
  const { rows } = await query<PostRow>(`SELECT ${selectColumns} FROM blog_posts ${paidJoin} WHERE ${clauses.join(" AND ")} ORDER BY blog_posts.published_at DESC NULLS LAST, blog_posts.updated_at DESC`, values);
  return rows.map(serialize);
}

function textContent(content: BlogPost["content"]): string {
  const visit = (node: { text?: string; content?: unknown[] }): string => `${node.text ?? ""} ${(node.content ?? []).map((child) => child && typeof child === "object" ? visit(child as { text?: string; content?: unknown[] }) : "").join(" ")}`;
  return visit(content);
}

export async function getPostBySlug(slug: string, includeDraft = false, canSeePaidContent = false, buyerUserId?: string, isAdmin = false): Promise<BlogPost | null> {
  if (!isDatabaseConfigured()) return samplePosts.find((post) => post.slug === slug && (includeDraft || (post.status === "published" && post.visibility === "public"))) ?? null;
  const values: unknown[] = [slug];
  const buyerParameter = buyerUserId ? `$${values.push(buyerUserId)}` : undefined;
  const selectColumns = publicColumns(canSeePaidContent || isAdmin, includeDraft, buyerParameter);
  const { rows } = await query<PostRow>(`SELECT ${selectColumns} FROM blog_posts ${paidJoin} WHERE blog_posts.slug = $1 ${includeDraft ? "" : "AND blog_posts.status = 'published' AND blog_posts.visibility = 'public'"} LIMIT 1`, values);
  return rows[0] ? serialize(rows[0]) : null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!isDatabaseConfigured()) return null;
  const sample = samplePosts.find((post) => post._id === id);
  if (sample) return sample;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { rows } = await query<PostRow>(`SELECT blog_posts.${columns.replaceAll(",", ",blog_posts.")},coalesce(pw.enabled,false) AS is_paid,pw.price_paise AS paywall_price_paise,coalesce(pw.show_excerpt,true) AS paywall_show_excerpt,coalesce(pw.show_thumbnail,true) AS paywall_show_thumbnail,pw.access_duration_seconds AS paywall_access_duration_seconds FROM blog_posts LEFT JOIN blog_post_paywalls pw ON pw.post_id=blog_posts.id WHERE blog_posts.id = $1`, [id]);
  return rows[0] ? serialize(rows[0]) : null;
}

type SavePostInput = PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string | null; publishDateMode?: "preserve" | "now" | "custom" };

async function persistPost(client: PoolClient, input: SavePostInput, id?: string, preserveDraft = false) {
  if (id && isSampleId(id)) throw new Error("Bundled sample posts cannot be edited");
  await ensureUploadUrlsActive(getUploadUrls(input.content, input.thumbnail), client);
  const visibility = input.status === "published" ? input.visibility ?? "public" : "hidden";
  const publishedAt = input.status !== "published" ? input.publishedAt ?? null : input.publishDateMode === "now" ? input.updatedAt : input.publishedAt ?? input.updatedAt;
  const contentText = textContent(input.content).trim();
  const result = id
    ? await client.query<PostRow>(`UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, tags=$4, thumbnail=$5, content=$6::jsonb, content_text=$7, status=$8, visibility=$9, updated_at=$10, published_at=$11 WHERE id=$12 RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), contentText, input.status, visibility, input.updatedAt, publishedAt, id])
    : await client.query<PostRow>(`INSERT INTO blog_posts (title,slug,excerpt,tags,thumbnail,content,content_text,status,visibility,created_at,updated_at,published_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$10,$11) RETURNING ${columns}`, [input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), contentText, input.status, visibility, input.createdAt, publishedAt]);
  if (!result.rows[0]) throw new Error("Post not found");
  if (id && input.status === "published" && !preserveDraft) await client.query("DELETE FROM blog_post_drafts WHERE post_id=$1", [id]);
  return serialize(result.rows[0]);
}

export async function savePost(input: SavePostInput, id?: string, preserveDraft = false): Promise<BlogPost> {
  return withTransaction(async (client) => {
    await acquireUploadReferenceLock(client);
    return persistPost(client, input, id, preserveDraft);
  });
}

export async function saveWorkingDraft(id: string, input: PostInput & Pick<BlogPost, "updatedAt">) {
  await withTransaction(async (client) => {
    await acquireUploadReferenceLock(client);
    await ensureUploadUrlsActive(getUploadUrls(input.content, input.thumbnail), client);
    await client.query(`INSERT INTO blog_post_drafts (post_id,title,slug,excerpt,tags,thumbnail,content,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8) ON CONFLICT (post_id) DO UPDATE SET title=EXCLUDED.title, slug=EXCLUDED.slug, excerpt=EXCLUDED.excerpt, tags=EXCLUDED.tags, thumbnail=EXCLUDED.thumbnail, content=EXCLUDED.content, updated_at=EXCLUDED.updated_at`, [id, input.title, input.slug, input.excerpt, input.tags, input.thumbnail, JSON.stringify(input.content), input.updatedAt]);
  });
  return getPostById(id);
}

export async function promoteWorkingDraft(id: string, input: SavePostInput) {
  const post = await withTransaction(async (client) => {
    await acquireUploadReferenceLock(client);
    const { rows } = await client.query<{ title: string; slug: string; excerpt: string; tags: string[]; thumbnail: string | null; content: BlogPost["content"] }>("SELECT title,slug,excerpt,tags,thumbnail,content FROM blog_post_drafts WHERE post_id=$1", [id]);
    const draft = rows[0];
    if (!draft) return null;
    const promoted = await persistPost(client, { ...input, status: "published", visibility: input.visibility, ...draft }, id, true);
    await client.query("DELETE FROM blog_post_drafts WHERE post_id=$1", [id]);
    return promoted;
  });
  return post;
}

export async function getPostDraft(id: string) {
  const { rows } = await query<{ post_id: string; title: string; slug: string; excerpt: string; tags: string[]; thumbnail: string | null; content: BlogPost["content"]; updated_at: Date | string }>(`SELECT post_id,title,slug,excerpt,tags,thumbnail,content,updated_at FROM blog_post_drafts WHERE post_id=$1`, [id]);
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
