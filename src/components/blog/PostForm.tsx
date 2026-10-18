"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, ImagePlus, Save, Send } from "lucide-react";
import { MAX_UPLOAD_BYTES } from "@/lib/blog/upload-constants";
import { BlogEditor } from "./Editor";
import { PaywallSettings } from "./PaywallSettings";
import { BlogContent } from "@/lib/blog/render";
import { slugify } from "@/lib/blog/slug";
import type { BlogPost } from "@/lib/blog/types";
import type { JSONContent } from "@domternal/core";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const emptyContent: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const localDateTime = (value: string) => { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };

export function PostForm({ post, hasUnpublishedDraft = false }: { post?: BlogPost; hasUnpublishedDraft?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [manualSlug, setManualSlug] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [thumbnail, setThumbnail] = useState(post?.thumbnail ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt ? localDateTime(post.publishedAt) : "");
  const [publishDateMode, setPublishDateMode] = useState<"preserve" | "now" | "custom">("preserve");
  const [content, setContent] = useState<JSONContent>(post?.content ?? emptyContent);
  const [status, setStatus] = useState<"draft" | "published">(post?.status ?? "draft");
  const [unpublishPost, setUnpublishPost] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "hidden">(post?.visibility ?? "public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmDateChoice, setConfirmDateChoice] = useState<"draft" | "published" | null>(null);

  function imageUrls(node: JSONContent): string[] {
    const own = node.type === "image" && typeof node.attrs?.src === "string" ? [node.attrs.src] : [];
    return [...own, ...(node.content ?? []).flatMap(imageUrls)];
  }

  const contentImages = [...new Set(imageUrls(content))];
  function addTag(value = tagDraft) {
    const values = value.split(/[\s,]+/).map((part) => part.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "")).filter(Boolean);
    if (values.length) setTags((current) => [...new Set([...current, ...values])].slice(0, 12));
    setTagDraft("");
  }

  async function uploadThumbnail(file: File) {
    if (!file.type.startsWith("image/")) { setError("Choose an image file for the thumbnail."); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setError("Thumbnail files must be 20 MB or smaller."); return; }
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const text = await response.text();
      let result: { upload?: { url?: string }; error?: string };
      try { result = JSON.parse(text); } catch { throw new Error("Image upload endpoint returned an invalid response. Please try again."); }
      if (!response.ok || typeof result.upload?.url !== "string") throw new Error(result.error ?? "Thumbnail upload failed.");
      setThumbnail(result.upload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Thumbnail upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save(nextStatus: "draft" | "published", unpublish = false) {
    if (nextStatus === "published" && post?.publishedAt && publishDateMode === "preserve") { setConfirmDateChoice(nextStatus); return; }
    await persist(nextStatus, publishDateMode, unpublish);
  }

  async function persist(nextStatus: "draft" | "published", dateMode: "preserve" | "now" | "custom", unpublish = false) {
    setBusy(true); setError("");
    try {
      const selectedDate = dateMode === "now" ? new Date().toISOString() : dateMode === "custom" ? (publishedAt ? new Date(publishedAt).toISOString() : null) : post?.publishedAt ?? null;
      const payload = { title, slug: slug || slugify(title), excerpt, tags, thumbnail: thumbnail || null, content, status: nextStatus, unpublish: unpublish || (unpublishPost && post?.status === "published"), visibility: nextStatus === "published" && post?.status !== "published" ? "public" : visibility, publishedAt: selectedDate, publishDateMode: dateMode };
      const response = await fetch(post ? `/api/admin/posts/${post._id}` : "/api/admin/posts", { method: post ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await response.text();
      let result: { error?: string; requestId?: string };
      try { result = JSON.parse(text); } catch { throw new Error("The server returned an unexpected response while saving."); }
      if (!response.ok) throw new Error(`${result.error ?? "Unable to save post."}${result.requestId ? ` (Reference: ${result.requestId})` : ""}`);
      if (post && nextStatus === "draft" && post.status === "published") router.refresh();
      else { router.push("/admin"); router.refresh(); }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save post."); }
    finally { setBusy(false); }
  }

  return <><div className="space-y-6">{hasUnpublishedDraft && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Editing unpublished changes. The published version remains live until you publish these changes.</p>}{preview ? <article className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Preview · not published</p><button type="button" onClick={() => setPreview(false)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><EyeOff size={16} /> Back to editor</button></div><header className="overflow-hidden rounded-2xl border border-border bg-card">{thumbnail && <img src={thumbnail} alt="" className="aspect-[16/8] w-full bg-muted object-cover" />}<div className="p-6 md:p-8"><p className="text-sm text-muted-foreground">{slug ? `/blog/${slug}` : "Post preview"} · {status}</p><h1 className="mt-4 font-mono text-4xl font-bold text-primary">{title || "Untitled post"}</h1>{excerpt && <p className="mt-4 text-lg text-muted-foreground">{excerpt}</p>}</div></header><BlogContent content={content} /></article> : <><div><label className="mb-2 block text-sm font-medium" htmlFor="title">Title</label><input id="title" value={title} onChange={(e) => { setTitle(e.target.value); if (!manualSlug) setSlug(slugify(e.target.value)); }} maxLength={180} className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-xl outline-none focus:border-primary" placeholder="A useful title" /></div><div><label className="mb-2 block text-sm font-medium" htmlFor="slug">Slug</label><div className="flex items-center rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"><span>/blog/</span><input id="slug" value={slug} onChange={(e) => { setManualSlug(true); setSlug(slugify(e.target.value)); }} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-foreground outline-none" placeholder="your-post-slug" /></div></div><div><label className="mb-2 block text-sm font-medium" htmlFor="excerpt">Excerpt <span className="text-muted-foreground">(optional, max 500 characters)</span></label><textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} rows={3} className="w-full resize-y rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="A short summary shown in the blog index" /></div><section className="rounded-xl border border-border p-4"><label className="mb-2 block text-sm font-medium" htmlFor="tags">Tags</label><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => setTags((current) => current.filter((entry) => entry !== tag))} className="rounded-full border border-border px-3 py-1 text-xs text-primary">#{tag} ×</button>)}<input id="tags" value={tagDraft} onChange={(event) => { const value = event.target.value; if (/[\s,]/.test(value)) { const parts = value.split(/[\s,]+/); const completed = parts.slice(0, -1).join(" "); if (completed) addTag(completed); setTagDraft(parts.at(-1) ?? ""); } else setTagDraft(value); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === "," || event.key === " ") { event.preventDefault(); addTag(); } }} onBlur={() => { if (tagDraft.trim()) addTag(); }} placeholder="Add tags separated by spaces or commas" className="min-w-48 flex-1 bg-transparent px-2 py-1 text-sm outline-none" /></div></section><section className="rounded-xl border border-border p-4"><label className="mb-2 block text-sm font-medium" htmlFor="published-date">Publication date</label><div className="flex flex-wrap items-center gap-2"><input id="published-date" type="datetime-local" value={publishedAt} onChange={(event) => { setPublishedAt(event.target.value); setPublishDateMode("custom"); }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => { setPublishedAt(new Date().toISOString().slice(0, 16)); setPublishDateMode("now"); }} className="rounded-lg border border-border px-3 py-2 text-sm">Set to now</button>{post?.publishedAt && <button type="button" onClick={() => setPublishDateMode("preserve")} className={`rounded-lg border px-3 py-2 text-sm ${publishDateMode === "preserve" ? "border-primary text-primary" : "border-border"}`}>Keep existing date</button>}</div><p className="mt-2 text-xs text-muted-foreground">Choose a date to manually set it, or preserve the original when updating a published post.</p></section><section className="rounded-xl border border-border p-4"><label className="mb-2 block text-sm font-medium" htmlFor="thumbnail">Post thumbnail <span className="text-muted-foreground">(optional)</span></label><div className="space-y-2"><input id="thumbnail" type="url" value={thumbnail} onChange={(event) => setThumbnail(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Paste an image URL" /><div className="flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary"><ImagePlus size={15} /> Upload thumbnail<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadThumbnail(file); }} /></label><button type="button" disabled={!thumbnail} onClick={() => { setThumbnail(""); }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-destructive disabled:opacity-40">Remove</button></div></div>{contentImages.length > 0 && <div className="mt-3"><p className="mb-2 text-xs text-muted-foreground">Choose an image from your post content:</p><div className="flex flex-wrap gap-2">{contentImages.map((image) => <button type="button" key={image} onClick={() => { setThumbnail(image); }} className={`overflow-hidden rounded-lg border-2 ${thumbnail === image ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`} aria-label="Use this image as the thumbnail"><img src={image} alt="Select this post image as thumbnail" className="h-16 w-24 object-cover" /></button>)}</div></div>}{thumbnail && <img src={thumbnail} alt="Thumbnail preview" className="mt-3 aspect-video max-h-64 w-full rounded-lg border border-border object-cover" />}</section>{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibility === "hidden"} onChange={(event) => setVisibility(event.target.checked ? "hidden" : "public")} /> Hide this published post from the public blog</label>}{post?.status === "published" && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={unpublishPost} onChange={(event) => setUnpublishPost(event.target.checked)} /> Unpublish this post entirely</label>}{hasUnpublishedDraft && <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { const response = await fetch(`/api/admin/posts/${post?._id}?draft=true`, { method: "DELETE" }); if (!response.ok) throw new Error("Unable to discard draft changes."); window.location.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to discard draft changes."); } finally { setBusy(false); } }} className="rounded-lg border border-destructive/50 px-3 py-2 text-sm text-destructive">Discard draft changes</button>}<div><span className="mb-2 block text-sm font-medium">Content</span><BlogEditor initialContent={content} onChange={setContent} uploadImages /></div><PaywallSettings postId={post?._id} />{error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Current status: <strong className="text-foreground">{status}</strong></span><div className="flex flex-wrap gap-3"><button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><Eye size={16} /> Preview</button><button disabled={busy} onClick={() => void save("draft")} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary disabled:opacity-50"><Save size={16} />{busy ? "Saving…" : post?.status === "published" ? "Save as draft" : "Save draft"}</button><button disabled={busy} onClick={() => void save(unpublishPost ? "draft" : "published", unpublishPost)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"><Send size={16} />{busy ? "Saving…" : unpublishPost ? "Unpublish post" : post?.status === "published" && status === "published" ? "Update published post" : "Publish"}</button></div></div></>}</div><Dialog open={confirmDateChoice !== null} onOpenChange={(open) => { if (!open) setConfirmDateChoice(null); }}><DialogContent><DialogHeader><DialogTitle>Publication date</DialogTitle><DialogDescription>Keep the existing publication date, or change it to now before publishing?</DialogDescription></DialogHeader><DialogFooter><button type="button" className="rounded-lg border border-border px-4 py-2 text-sm" onClick={() => { setConfirmDateChoice(null); void persist("published", "now"); }}>Use current time</button><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => { setConfirmDateChoice(null); void persist("published", "preserve"); }}>Keep existing date</button></DialogFooter></DialogContent></Dialog></>;
}
