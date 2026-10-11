import { getSupabase } from "./db";
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
  content: BlogPost["content"];
  status: BlogPost["status"];
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

function serialize(post: PostRow): BlogPost {
  return {
    _id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    publishedAt: post.published_at ?? undefined,
  };
}

const columns = "id,title,slug,excerpt,content,status,created_at,updated_at,published_at";

export async function listPosts(includeDrafts = false): Promise<BlogPost[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return samplePosts.filter((post) => includeDrafts || post.status === "published");
  }
  const query = getSupabase().from("blog_posts").select(columns);
  const { data, error } = await (includeDrafts ? query : query.eq("status", "published"))
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const posts = (data as PostRow[]).map(serialize);
  return posts.length ? posts : samplePosts.filter((post) => includeDrafts || post.status === "published");
}

export async function getPostBySlug(slug: string, includeDraft = false): Promise<BlogPost | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return samplePosts.find((post) => post.slug === slug && (includeDraft || post.status === "published")) ?? null;
  }
  let query = getSupabase().from("blog_posts").select(columns).eq("slug", slug);
  if (!includeDraft) query = query.eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? serialize(data as PostRow) : samplePosts.find((post) => post.slug === slug && (includeDraft || post.status === "published")) ?? null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { data, error } = await getSupabase().from("blog_posts").select(columns).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? serialize(data as PostRow) : null;
}

export async function savePost(input: PostInput & Pick<BlogPost, "createdAt" | "updatedAt"> & { publishedAt?: string }, id?: string): Promise<BlogPost> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase is required for admin post writes.");
  const now = new Date().toISOString();
  const document = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    status: input.status,
    updated_at: now,
    published_at: input.publishedAt ?? null,
  };
  const query = getSupabase().from("blog_posts");
  const result = id
    ? await query.update(document).eq("id", id).select(columns).maybeSingle()
    : await query.insert({ ...document, created_at: now }).select(columns).single();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("Post not found");
  return serialize(result.data as PostRow);
}

export async function slugInUse(slug: string, exceptId?: string): Promise<boolean> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  let query = getSupabase().from("blog_posts").select("id", { head: true, count: "exact" }).eq("slug", slug);
  if (exceptId) query = query.neq("id", exceptId);
  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function deletePost(id: string): Promise<boolean> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const { data, error } = await getSupabase().from("blog_posts").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
