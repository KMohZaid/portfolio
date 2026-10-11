import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BlogPost } from "./types";

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

type UploadRow = {
  id: string;
  url: string;
  filename: string;
  size: number;
  created_at: string;
  removed_at: string | null;
};

type Database = {
  public: {
    Tables: {
      blog_posts: { Row: PostRow; Insert: Omit<PostRow, "id"> & { id?: string }; Update: Partial<Omit<PostRow, "id">>; Relationships: [] };
      blog_uploads: { Row: UploadRow; Insert: Omit<UploadRow, "id"> & { id?: string }; Update: Partial<Omit<UploadRow, "id">>; Relationships: [] };
      blog_login_tokens: { Row: { jti: string; email: string; code_hash: string; expires_at: string; attempts: number; created_at: string }; Insert: { jti: string; email: string; code_hash: string; expires_at: string; attempts?: number; created_at?: string }; Update: Partial<{ jti: string; email: string; code_hash: string; expires_at: string; attempts: number; created_at: string }>; Relationships: [] };
      blog_admin_sessions: { Row: { jti: string; email: string; expires_at: string }; Insert: { jti: string; email: string; expires_at: string }; Update: Partial<{ jti: string; email: string; expires_at: string }>; Relationships: [] };
      blog_login_rate_limits: { Row: { key: string; next_allowed_at: string; requests: number }; Insert: { key: string; next_allowed_at: string; requests?: number }; Update: Partial<{ key: string; next_allowed_at: string; requests: number }>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      claim_blog_login_rate_limit: { Args: { p_key: string; p_now: string; p_next_allowed_at: string }; Returns: boolean };
      consume_blog_login_code: { Args: { p_email: string; p_code_hash: string; p_now: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let client: SupabaseClient<Database> | undefined;

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }
  client ??= createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
