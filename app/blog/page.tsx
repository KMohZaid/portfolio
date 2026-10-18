import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";
import { BlogIndexControls } from "@/components/blog/BlogIndexControls";
import { Header } from "@/components/Header";
import { MouseSpotlight } from "@/components/MouseSpotlight";
import { listPosts } from "@/lib/blog/posts";
import config from "@/config.json";

export const dynamic = "force-dynamic";

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string | string[] }> }) {
  const params = await searchParams;
  const initialTag = typeof params.tag === "string" ? params.tag : "";
  let posts = [];
  let databaseError = false;
  try { posts = await listPosts(); } catch { databaseError = true; }
  return <main className="relative min-h-screen bg-transparent text-foreground">
    <MouseSpotlight />
    <Header />
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-32">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Back to portfolio</Link>
      <div className="mt-12 border-b border-border pb-9"><p className="font-mono text-sm text-primary">~/writing</p><h1 className="mt-3 font-mono text-4xl font-bold md:text-5xl">Notes &amp; <span className="text-gradient">ideas.</span></h1><p className="mt-4 max-w-2xl text-muted-foreground">Thoughts on building software, backend systems, and the things I learn along the way.</p></div>
      {databaseError ? <div className="mt-10 rounded-xl border border-border bg-card p-6"><Terminal className="mb-3 text-primary" /><p className="font-medium">The blog is temporarily unavailable.</p><p className="mt-2 text-sm text-muted-foreground">Database connection is not configured or could not be reached.</p></div> : posts.length === 0 ? <div className="mt-10 rounded-xl border border-border bg-card p-8 text-center"><p className="font-mono text-primary">$ ls posts/</p><p className="mt-3 text-muted-foreground">Nothing published just yet. Check back soon.</p></div> : <BlogIndexControls posts={posts} initialTag={initialTag} />}
      <p className="mt-14 text-center font-mono text-xs text-muted-foreground">{config.personal.name} · writing from the terminal</p>
    </div>
  </main>;
}
