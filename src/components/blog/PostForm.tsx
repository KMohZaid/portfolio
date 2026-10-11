"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlogEditor } from "./Editor";
import { slugify } from "@/lib/blog/slug";
import type { BlogPost } from "@/lib/blog/types";
import type { JSONContent } from "@tiptap/react";

const emptyContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function PostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [manualSlug, setManualSlug] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState<JSONContent>(post?.content ?? emptyContent);
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(nextStatus: "draft" | "published") {
    setBusy(true); setError("");
    try {
      const payload = { title, slug: slug || slugify(title), excerpt, content, status: nextStatus };
      const response = await fetch(post ? `/api/admin/posts/${post._id}` : "/api/admin/posts", { method: post ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save post.");
      router.push("/admin"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save post."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6"><div><label className="mb-2 block text-sm font-medium" htmlFor="title">Title</label><input id="title" value={title} onChange={(e) => { setTitle(e.target.value); if (!manualSlug) setSlug(slugify(e.target.value)); }} maxLength={180} className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-xl outline-none focus:border-primary" placeholder="A useful title" /></div><div><label className="mb-2 block text-sm font-medium" htmlFor="slug">Slug</label><div className="flex items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"><span>/blog/</span><input id="slug" value={slug} onChange={(e) => { setManualSlug(true); setSlug(slugify(e.target.value)); }} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-foreground outline-none" placeholder="your-post-slug" /></div></div><div><label className="mb-2 block text-sm font-medium" htmlFor="excerpt">Excerpt <span className="text-muted-foreground">(optional, max 500 characters)</span></label><textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} rows={3} className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="A short summary shown in the blog index" /></div><div><span className="mb-2 block text-sm font-medium">Content</span><BlogEditor initialContent={content} onChange={setContent} uploadImages /></div>{error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Current status: <strong className="text-foreground">{status}</strong></span><div className="flex gap-3"><button disabled={busy} onClick={() => void save("draft")} className="rounded-lg border border-border px-4 py-2 text-sm hover:border-primary disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button><button disabled={busy} onClick={() => void save("published")} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{post?.status === "published" ? "Update published post" : "Publish"}</button></div></div></div>;
}
