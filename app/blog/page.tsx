import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, Terminal } from "lucide-react";
import { Header } from "@/components/Header";
import { listPosts } from "@/lib/blog/posts";
import config from "@/config.json";

export const dynamic = "force-dynamic";

function readingTime(content: unknown) { return `${Math.max(1, Math.ceil(JSON.stringify(content).split(/\s+/).length / 220))} min read`; }

export default async function BlogPage() {
  let posts = [];
  let databaseError = false;
  try { posts = await listPosts(); } catch { databaseError = true; }
  return <main className="min-h-screen bg-background text-foreground">
    <Header />
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Back to portfolio</Link>
      <div className="mt-12 border-b border-border pb-9"><p className="font-mono text-sm text-primary">~/writing</p><h1 className="mt-3 font-mono text-4xl font-bold md:text-5xl">Notes &amp; <span className="text-gradient">ideas.</span></h1><p className="mt-4 max-w-2xl text-muted-foreground">Thoughts on building software, backend systems, and the things I learn along the way.</p></div>
      {databaseError ? <div className="mt-10 rounded-xl border border-border bg-card p-6"><Terminal className="mb-3 text-primary" /><p className="font-medium">The blog is temporarily unavailable.</p><p className="mt-2 text-sm text-muted-foreground">Database connection is not configured or could not be reached.</p></div> : posts.length === 0 ? <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center"><p className="font-mono text-primary">$ ls posts/</p><p className="mt-3 text-muted-foreground">Nothing published just yet. Check back soon.</p></div> : <div className="divide-y divide-border">{posts.map((post) => <article key={post.slug} className="py-8"><Link href={`/blog/${post.slug}`} className="group"><div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{readingTime(post.content)}</span></div><h2 className="mt-3 font-mono text-2xl font-semibold group-hover:text-primary">{post.title}</h2><p className="mt-3 leading-relaxed text-muted-foreground">{post.excerpt || "Open this post to read more."}</p><span className="mt-4 inline-block font-mono text-sm text-primary">Read article →</span></Link></article>)}</div>}
      <p className="mt-14 text-center font-mono text-xs text-muted-foreground">{config.personal.name} · writing from the terminal</p>
    </div>
  </main>;
}
