"use client";

import Link from "next/link";
import { CalendarDays, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog/types";

function textFromContent(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { text?: unknown; content?: unknown[] };
  return `${typeof node.text === "string" ? node.text : ""} ${(node.content ?? []).map(textFromContent).join(" ")}`;
}

export function BlogIndexControls({ posts, initialTag = "" }: { posts: BlogPost[]; initialTag?: string }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(initialTag);
  const [compact, setCompact] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const tags = useMemo(() => [...new Set(posts.flatMap((post) => post.tags ?? []))].sort(), [posts]);
  const filtered = useMemo(() => posts.filter((post) => {
    const matchesTag = !tag || post.tags?.includes(tag);
    const search = query.trim().toLocaleLowerCase();
    const matchesSearch = !search || `${post.title} ${post.excerpt} ${textFromContent(post.content)}`.toLocaleLowerCase().includes(search);
    return matchesTag && matchesSearch;
  }), [posts, query, tag]);

  return <section className="mt-8">
    <div className="flex flex-wrap items-center gap-3">
      <label className="min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Search articles by title or content</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or content…" className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary" /></label>
      <button type="button" onClick={() => setCompact((value) => !value)} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary" aria-pressed={compact}>{compact ? "Compact list" : "Cards"}</button>
      <button type="button" onClick={() => setShowThumbnails((value) => !value)} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary" aria-pressed={showThumbnails}>{showThumbnails ? "Hide thumbnails" : "Show thumbnails"}</button>
    </div>
    {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setTag("")} className={`rounded-full border px-3 py-1 text-xs ${!tag ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>All</button>{tags.map((item) => <button key={item} type="button" onClick={() => setTag(tag === item ? "" : item)} className={`rounded-full border px-3 py-1 text-xs ${tag === item ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>#{item}</button>)}</div>}
    {filtered.length === 0 ? <p className="mt-8 rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">No articles match your search.</p> : <div className="mt-4 divide-y divide-border">{filtered.map((post) => <article key={post.slug} className={compact ? "py-4" : "py-6"}><Link href={`/blog/${post.slug}`} className={`group flex gap-4 rounded-xl ${compact ? "items-center" : "items-start"}`}>
      {showThumbnails && post.thumbnail && <img src={post.thumbnail} alt="" className={`shrink-0 rounded-lg border border-border object-cover ${compact ? "h-16 w-20" : "h-28 w-40"}`} />}
      <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays size={13} />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} />{Math.max(1, Math.ceil(textFromContent(post.content).split(/\s+/).length / 220))} min read</span></div><h2 className={`mt-1 font-mono font-semibold group-hover:text-primary ${compact ? "text-lg" : "text-2xl"}`}>{post.title}</h2><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt || "Open this post to read more."}</p>{post.tags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{post.tags.map((item) => <span key={item} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">#{item}</span>)}</div>}</div>
    </Link></article>)}</div>}
    <p className="mt-3 text-right text-xs text-muted-foreground">{filtered.length} article{filtered.length === 1 ? "" : "s"}</p>
  </section>;
}
