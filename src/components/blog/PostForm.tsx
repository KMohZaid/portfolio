"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Send } from "lucide-react";
import { BlogEditor } from "./Editor";
import { slugify } from "@/lib/blog/slug";
import type { BlogPost } from "@/lib/blog/types";
import type { JSONContent } from "@domternal/core";

const emptyContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function PostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [manualSlug, setManualSlug] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [thumbnail, setThumbnail] = useState(post?.thumbnail ?? "");
  const [thumbnailTouched, setThumbnailTouched] = useState(Boolean(post?.thumbnail));
  const [content, setContent] = useState<JSONContent>(post?.content ?? emptyContent);
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [visibility, setVisibility] = useState<"public" | "hidden">(post?.visibility ?? "public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function firstImage(node: JSONContent): string | null {
    if (node.type === "image" && typeof node.attrs?.src === "string") return node.attrs.src;
    for (const child of node.content ?? []) {
      const found = firstImage(child);
      if (found) return found;
    }
    return null;
  }

  const suggestedThumbnail = firstImage(content);

  async function save(nextStatus: "draft" | "published") {
    setBusy(true); setError("");
    try {
      const payload = { title, slug: slug || slugify(title), excerpt, thumbnail: thumbnail || null, content, status: nextStatus, visibility };
      const response = await fetch(post ? `/api/admin/posts/${post._id}` : "/api/admin/posts", { method: post ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save post.");
      router.push("/admin"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save post."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6"><div><label className="mb-2 block text-sm font-medium" htmlFor="title">Title</label><input id="title" value={title} onChange={(e) => { setTitle(e.target.value); if (!manualSlug) setSlug(slugify(e.target.value)); }} maxLength={180} className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-xl outline-none focus:border-primary" placeholder="A useful title" /></div><div><label className="mb-2 block text-sm font-medium" htmlFor="slug">Slug</label><div className="flex items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"><span>/blog/</span><input id="slug" value={slug} onChange={(e) => { setManualSlug(true); setSlug(slugify(e.target.value)); }} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-foreground outline-none" placeholder="your-post-slug" /></div></div><div><label className="mb-2 block text-sm font-medium" htmlFor="excerpt">Excerpt <span className="text-muted-foreground">(optional, max 500 characters)</span></label><textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} rows={3} className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="A short summary shown in the blog index" /></div><section className="rounded-xl border border-border p-4"><label className="mb-2 block text-sm font-medium" htmlFor="thumbnail">Thumbnail URL <span className="text-muted-foreground">(optional)</span></label><input id="thumbnail" type="url" value={thumbnail} onChange={(event) => { setThumbnailTouched(true); setThumbnail(event.target.value); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="https://…" />{!thumbnailTouched && suggestedThumbnail && <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-3"><div className="flex min-w-0 items-center gap-3"><img src={suggestedThumbnail} alt="" className="h-14 w-20 rounded object-cover" /><p className="text-sm">We found the first image in your post. Use it as the thumbnail?</p></div><button type="button" onClick={() => { setThumbnail(suggestedThumbnail); setThumbnailTouched(true); }} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary">Use image</button></div>}{thumbnail && <img src={thumbnail} alt="Thumbnail preview" className="mt-3 aspect-video max-h-64 w-full rounded-lg border border-border object-cover" />}</section>{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibility === "hidden"} onChange={(event) => setVisibility(event.target.checked ? "hidden" : "public")} /> Hide this published post from the public blog</label>}{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status === "draft"} onChange={(event) => setStatus(event.target.checked ? "draft" : "published")} /> Unpublish and save this as a draft</label>}<div><span className="mb-2 block text-sm font-medium">Content</span><BlogEditor initialContent={content} onChange={setContent} uploadImages /></div>{error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Current status: <strong className="text-foreground">{status}</strong></span><div className="flex gap-3"><button disabled={busy} onClick={() => void save("draft")} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary disabled:opacity-50"><Save size={16} />{busy ? "Saving…" : post?.status === "published" ? "Save as draft" : "Save draft"}</button><button disabled={busy} onClick={() => void save("published")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Send size={16} />{busy ? "Saving…" : post?.status === "published" && status === "published" ? "Update published post" : "Publish"}</button></div></div></div>;
}
