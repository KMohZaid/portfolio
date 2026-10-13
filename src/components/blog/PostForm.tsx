"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ImagePlus, Save, Send } from "lucide-react";
import { BlogEditor } from "./Editor";
import { BlogContent } from "@/lib/blog/render";
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
  const [content, setContent] = useState<JSONContent>(post?.content ?? emptyContent);
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [visibility, setVisibility] = useState<"public" | "hidden">(post?.visibility ?? "public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  function firstImage(node: JSONContent): string | null {
    if (node.type === "image" && typeof node.attrs?.src === "string") return node.attrs.src;
    for (const child of node.content ?? []) {
      const found = firstImage(child);
      if (found) return found;
    }
    return null;
  }

  function imageUrls(node: JSONContent): string[] {
    const own = node.type === "image" && typeof node.attrs?.src === "string" ? [node.attrs.src] : [];
    return [...own, ...(node.content ?? []).flatMap(imageUrls)];
  }

  const contentImages = [...new Set(imageUrls(content))];
  const suggestedThumbnail = firstImage(content);

  async function uploadThumbnail(file: File) {
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || typeof result.upload?.url !== "string") throw new Error(result.error ?? "Thumbnail upload failed.");
      setThumbnail(result.upload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thumbnail upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(nextStatus: "draft" | "published") {
    setBusy(true); setError("");
    try {
      const payload = { title, slug: slug || slugify(title), excerpt, thumbnail: thumbnail || null, content, status: nextStatus, visibility: nextStatus === "published" && post?.status !== "published" ? "public" : visibility };
      const response = await fetch(post ? `/api/admin/posts/${post._id}` : "/api/admin/posts", { method: post ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save post.");
      router.push("/admin"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save post."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">{preview ? <article className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Preview · not published</p><button type="button" onClick={() => setPreview(false)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><EyeOff size={16} /> Back to editor</button></div><header className="relative overflow-hidden rounded-2xl border border-border bg-card">{thumbnail && <><img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/25" /></>}<div className={`relative z-10 ${thumbnail ? "flex min-h-80 flex-col justify-end p-6 md:p-10" : "p-6 md:p-8"}`}><p className="text-sm text-muted-foreground">{slug ? `/blog/${slug}` : "Post preview"} · {status}</p><h1 className="mt-4 font-mono text-4xl font-bold">{title || "Untitled post"}</h1>{excerpt && <p className="mt-4 text-lg text-muted-foreground">{excerpt}</p>}</div></header><BlogContent content={content} /></article> : <><div><label className="mb-2 block text-sm font-medium" htmlFor="title">Title</label><input id="title" value={title} onChange={(e) => { setTitle(e.target.value); if (!manualSlug) setSlug(slugify(e.target.value)); }} maxLength={180} className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-xl outline-none focus:border-primary" placeholder="A useful title" /></div><div><label className="mb-2 block text-sm font-medium" htmlFor="slug">Slug</label><div className="flex items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"><span>/blog/</span><input id="slug" value={slug} onChange={(e) => { setManualSlug(true); setSlug(slugify(e.target.value)); }} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-foreground outline-none" placeholder="your-post-slug" /></div></div><div><label className="mb-2 block text-sm font-medium" htmlFor="excerpt">Excerpt <span className="text-muted-foreground">(optional, max 500 characters)</span></label><textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} rows={3} className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="A short summary shown in the blog index" /></div><section className="rounded-xl border border-border p-4"><label className="mb-2 block text-sm font-medium" htmlFor="thumbnail">Post thumbnail <span className="text-muted-foreground">(optional)</span></label><div className="flex flex-wrap gap-2"><input id="thumbnail" type="url" value={thumbnail} onChange={(event) => setThumbnail(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Paste an image URL" /><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary"><ImagePlus size={15} /> Upload thumbnail<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadThumbnail(file); }} /></label><button type="button" disabled={!thumbnail} onClick={() => { setThumbnail(""); }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-destructive disabled:opacity-40">Remove</button></div>{contentImages.length > 0 && <div className="mt-3"><p className="mb-2 text-xs text-muted-foreground">Choose an image from your post content:</p><div className="flex flex-wrap gap-2">{[...new Set([...contentImages, ...(suggestedThumbnail ? [suggestedThumbnail] : [])])].map((image) => <button type="button" key={image} onClick={() => { setThumbnail(image); }} className={`overflow-hidden rounded-lg border-2 ${thumbnail === image ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`} aria-label="Use this image as the thumbnail"><img src={image} alt="Select this post image as thumbnail" className="h-16 w-24 object-cover" /></button>)}</div></div>}{thumbnail && <img src={thumbnail} alt="Thumbnail preview" className="mt-3 aspect-video max-h-64 w-full rounded-lg border border-border object-cover" />}</section>{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibility === "hidden"} onChange={(event) => setVisibility(event.target.checked ? "hidden" : "public")} /> Hide this published post from the public blog</label>}{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status === "draft"} onChange={(event) => setStatus(event.target.checked ? "draft" : "published")} /> Unpublish and save this as a draft</label>}<div><span className="mb-2 block text-sm font-medium">Content</span><BlogEditor initialContent={content} onChange={setContent} uploadImages /></div>{error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Current status: <strong className="text-foreground">{status}</strong></span><div className="flex flex-wrap gap-3"><button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><Eye size={16} /> Preview</button><button disabled={busy} onClick={() => void save("draft")} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary disabled:opacity-50"><Save size={16} />{busy ? "Saving…" : post?.status === "published" ? "Save as draft" : "Save draft"}</button><button disabled={busy} onClick={() => void save("published")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Send size={16} />{busy ? "Saving…" : post?.status === "published" && status === "published" ? "Update published post" : "Publish"}</button></div></div></>}</div>;
}
