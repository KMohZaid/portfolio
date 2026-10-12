import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { BlogContent } from "@/lib/blog/render";
import { getPostBySlug } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try { post = await getPostBySlug(slug); } catch { notFound(); }
  if (!post) notFound();
  const words = JSON.stringify(post.content).split(/\s+/).length;
  return <main className="min-h-screen bg-background text-foreground"><Header /><article className="mx-auto max-w-3xl px-6 pb-24 pt-32"><Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> All writing</Link><header className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-card">{post.thumbnail && <><img src={post.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/25" /></>}<div className={`relative z-10 ${post.thumbnail ? "flex min-h-80 flex-col justify-end p-6 md:p-10" : "p-6 md:p-8"}`}><div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{Math.max(1, Math.ceil(words / 220))} min read</span></div><h1 className="mt-5 font-mono text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>{post.excerpt && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}</div></header><div className="mt-10"><BlogContent content={post.content} /></div></article></main>;
}
