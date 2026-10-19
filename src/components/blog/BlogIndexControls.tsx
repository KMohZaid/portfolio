"use client";

import Link from "next/link";
import { CalendarDays, Clock3, LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog/types";

function textFromContent(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { text?: unknown; content?: unknown[] };
  return `${typeof node.text === "string" ? node.text : ""} ${(node.content ?? []).map(textFromContent).join(" ")}`;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return <>{parts.map((part, index) => part.toLocaleLowerCase() === term.toLocaleLowerCase() ? <mark key={index} className="rounded-sm bg-primary/25 px-0.5 text-foreground">{part}</mark> : part)}</>;
}

function searchSnippet(post: BlogPost, query: string) {
  const body = textFromContent(post.content).replace(/\s+/g, " ").trim();
  const index = body.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());
  if (!query.trim() || index < 0) return "";
  const start = Math.max(0, index - 70);
  const end = Math.min(body.length, index + query.trim().length + 110);
  return `${start > 0 ? "…" : ""}${body.slice(start, end)}${end < body.length ? "…" : ""}`;
}

export function BlogIndexControls({ posts, initialTag = "", isAdmin = false, purchasedPostIds = [] }: { posts: BlogPost[]; initialTag?: string; isAdmin?: boolean; purchasedPostIds?: string[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(initialTag);
  const [compact, setCompact] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [viewAsUser, setViewAsUser] = useState(false);
  const purchasedIds = useMemo(() => new Set(purchasedPostIds), [purchasedPostIds]);
  const tags = useMemo(() => [...new Set(posts.flatMap((post) => post.tags ?? []))].sort(), [posts]);
  const tagCounts = useMemo(() => new Map(tags.map((item) => [item, posts.filter((post) => post.tags?.includes(item)).length])), [posts, tags]);
  const filtered = useMemo(() => posts.filter((post) => {
    const matchesTag = !tag || post.tags?.includes(tag);
    const search = query.trim().toLocaleLowerCase();
    const bought = Boolean(post._id && purchasedIds.has(post._id));
    const locked = Boolean(post.isPaid && !bought && (!isAdmin || viewAsUser));
    const searchableText = `${post.title} ${locked && post.showExcerpt === false ? "" : post.excerpt} ${locked ? "" : textFromContent(post.content)}`;
    const matchesSearch = !search || searchableText.toLocaleLowerCase().includes(search);
    return matchesTag && matchesSearch;
  }), [posts, query, tag, purchasedIds, isAdmin, viewAsUser]);

  return <section className="mt-8">
    <div className="flex flex-wrap items-center gap-3">
      <label className="min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Search articles by title or content</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or content…" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" /></label>
      <div role="group" aria-label="Article layout" className="inline-flex rounded-lg bg-muted p-1">
        <button type="button" onClick={() => setCompact(false)} aria-pressed={!compact} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${!compact ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Cards</button>
        <button type="button" onClick={() => setCompact(true)} aria-pressed={compact} className={`rounded-md px-3 py-1.5 text-sm transition-colors ${compact ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Compact list</button>
      </div>
      <button type="button" onClick={() => setShowThumbnails((value) => !value)} className={`rounded-lg border px-3 py-2 text-sm ${showThumbnails ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`} aria-pressed={showThumbnails}>{showThumbnails ? "Hide thumbnails" : "Show thumbnails"}</button>
      {isAdmin && <button type="button" role="switch" aria-checked={viewAsUser} aria-label="View as user" onClick={() => setViewAsUser((value) => !value)} className={`rounded-lg border px-3 py-2 text-sm ${viewAsUser ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>View as user: {viewAsUser ? "On" : "Off"}</button>}
    </div>
    {tags.length > 0 && <div role="group" aria-label="Filter articles by tag" className="mt-4 flex flex-wrap gap-2">
      <button type="button" aria-pressed={!tag} onClick={() => setTag("")} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${!tag ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground hover:border-primary/50"}`}>All <span className={`rounded-full px-1.5 ${!tag ? "bg-black/20 text-white" : "bg-background text-foreground"}`}>{posts.length}</span></button>
      {tags.map((item) => { const active = tag === item; return <button key={item} type="button" aria-pressed={active} onClick={() => setTag(active ? "" : item)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground hover:border-primary/50"}`}>{item} <span className={`rounded-full px-1.5 ${active ? "bg-black/20 text-white" : "bg-background text-foreground"}`}>{tagCounts.get(item)}</span></button>; })}
    </div>}
    {filtered.length === 0 ? <p className="mt-8 rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">No articles match your search.</p> : <div className={compact ? "mt-4 divide-y divide-border" : "mt-6 grid grid-cols-1 gap-6"}>{filtered.map((post) => {
      const bought = Boolean(post._id && purchasedIds.has(post._id));
      const locked = Boolean(post.isPaid && !bought && (!isAdmin || viewAsUser));
      return <article key={post.slug} className={compact ? "py-4" : "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"}><Link href={`/blog/${post.slug}`} className={`group flex rounded-xl ${compact ? "items-center gap-4" : "h-full flex-col"}`}>
      {showThumbnails && post.thumbnail && (!locked || post.showThumbnail !== false) && <img src={post.thumbnail} alt="" className={compact ? "h-16 w-24 shrink-0 rounded-lg border border-border bg-muted object-cover" : "aspect-[16/7] w-full border-b border-border bg-muted object-cover"} />}{showThumbnails && locked && post.showThumbnail === false && <div aria-hidden="true" className={`flex items-center justify-center bg-gradient-to-br from-primary/25 via-muted to-emerald-500/20 ${compact ? "h-16 w-24 shrink-0 rounded-lg" : "aspect-[16/7] w-full border-b border-border"}`}><LockKeyhole size={compact ? 20 : 36} className="text-emerald-600/80 dark:text-emerald-300/80" /></div>}
      <div className={compact ? "min-w-0 flex-1" : "flex flex-1 flex-col p-5 md:p-7"}><div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} />{Math.max(1, Math.ceil(textFromContent(post.content).split(/\s+/).length / 220))} min read</span>{post.isPaid && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">{bought ? "You bought" : locked ? <><LockKeyhole size={12} /> Paid · ₹{((post.pricePaise ?? 0) / 100).toFixed(2)}</> : `Paid · ₹${((post.pricePaise ?? 0) / 100).toFixed(2)}`}</span>}</div><h2 className={`mt-2 font-mono font-semibold text-primary group-hover:underline ${compact ? "text-lg" : "text-xl md:text-2xl"}`}><HighlightedText text={post.title} query={query} /></h2><p className={`mt-2 text-sm text-muted-foreground ${compact ? "line-clamp-2" : "line-clamp-3 leading-relaxed"}`}><HighlightedText text={locked && post.showExcerpt === false ? "Purchase this blog to know more." : post.excerpt || (query.trim() && !locked ? searchSnippet(post, query) : "Open this post to read more.")} query={query} /></p>{post.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{post.tags.map((item) => <span key={item} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{item}</span>)}</div>}</div>
    </Link></article>})}</div>}
    <p className="mt-3 text-right text-xs text-muted-foreground">{filtered.length} article{filtered.length === 1 ? "" : "s"}</p>
  </section>;
}
