import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { BlogContent, getBlogHeadings } from "@/lib/blog/render";
import { getPostBySlug } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try { post = await getPostBySlug(slug); } catch { notFound(); }
  if (!post) notFound();
  const words = JSON.stringify(post.content).split(/\s+/).length;
  const headings = getBlogHeadings(post.content);
  return <main className="min-h-screen bg-background text-foreground"><Header /><article className="mx-auto max-w-3xl px-6 pb-24 pt-32"><Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> All writing</Link><header className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{post.thumbnail && <img src={post.thumbnail} alt="" className="aspect-[16/8] w-full bg-muted object-cover" />}<div className="p-6 md:p-8"><div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-primary" />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-primary" />{Math.max(1, Math.ceil(words / 220))} min read</span></div><h1 className="blog-article-title mt-5 font-mono font-bold leading-tight text-primary">{post.title}</h1>{post.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:border-primary">#{tag}</Link>)}</div>}{post.excerpt && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}</div></header><div className="mt-10"><BlogTableOfContents headings={headings} /><BlogContent content={post.content} /></div></article></main>;
}
