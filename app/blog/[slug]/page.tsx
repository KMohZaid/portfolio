import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { MouseSpotlight } from "@/components/MouseSpotlight";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { RazorpayCheckout } from "@/components/blog/RazorpayCheckout";
import { getBlogHeadings, BlogContent } from "@/lib/blog/render";
import { getPostBySlug } from "@/lib/blog/posts";
import { getAdminEmail, getSignedInUser } from "@/lib/blog/auth";
import { getPaywall, userHasAccess } from "@/lib/blog/payments";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, adminEmail] = await Promise.all([getSignedInUser(), getAdminEmail()]);
  let post;
  try { post = await getPostBySlug(slug, false, false, user?.id, Boolean(adminEmail)); } catch { notFound(); }
  if (!post) notFound();
  const paywall = post.isPaid && post._id ? await getPaywall(post._id) : null;
  const hasAccess = !paywall?.enabled || Boolean(adminEmail) || await userHasAccess(post._id!, user?.id);
  const locked = Boolean(paywall?.enabled && !hasAccess);

  if (paywall?.enabled && !hasAccess && (paywall.showExcerpt || paywall.showThumbnail)) {
    const publicMetadata = await getPostBySlug(slug, false, true, undefined, true);
    if (publicMetadata) post = { ...post, excerpt: paywall.showExcerpt ? publicMetadata.excerpt : "", thumbnail: paywall.showThumbnail ? publicMetadata.thumbnail : null };
  }
  if (paywall?.enabled && hasAccess) {
    try { post = await getPostBySlug(slug, false, true, undefined, true); } catch { notFound(); }
    if (!post) notFound();
  }

  const words = JSON.stringify(post.content).split(/\s+/).length;
  const headings = getBlogHeadings(post.content);
  const pricePaise = paywall?.pricePaise ?? post.pricePaise ?? 0;
  return <main className="relative min-h-screen bg-transparent text-foreground"><MouseSpotlight /><Header /><article className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32 xl:pr-[18rem]"><Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> All writing</Link><header className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{post.thumbnail && <img src={post.thumbnail} alt="" className="aspect-[16/8] w-full bg-muted object-cover" />}<div className="p-6 md:p-8"><div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-primary" />{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</span>{!locked && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-primary" />{Math.max(1, Math.ceil(words / 220))} min read</span>}{paywall?.enabled && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><LockKeyhole size={13} /> Paid article</span>}</div><h1 className="blog-article-title mt-5 font-mono font-bold leading-tight text-primary">{post.title}</h1>{post.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{post.tags.map((tag) => <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary hover:border-primary">#{tag}</Link>)}</div>}{locked && paywall && !paywall.showExcerpt ? <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"><span className="font-medium text-primary">Description is hidden</span><p className="mt-1">Purchase this blog to know more.</p></div> : post.excerpt && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}</div></header>{locked ? <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-card p-6 md:p-8"><div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><LockKeyhole size={18} /><h2 className="font-mono text-lg font-semibold">Unlock this article</h2></div><p className="mt-2 text-sm text-muted-foreground">{user ? "Purchase access to read the full article." : "Sign in to purchase access to this article."}</p><p className="mt-4 text-2xl font-bold">₹{(pricePaise / 100).toFixed(2)} <span className="text-sm font-normal text-muted-foreground">INR</span></p>{user ? <div className="mt-4"><RazorpayCheckout postId={post._id!} slug={post.slug} title={post.title} pricePaise={pricePaise} /></div> : <div className="mt-4"><p className="mb-3 text-sm text-muted-foreground">Log in to pay and access the content later.</p><div className="flex flex-wrap items-center gap-3"><Link href={`/login?returnTo=${encodeURIComponent(`/blog/${post.slug}`)}`} className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Log in</Link><button type="button" disabled aria-disabled="true" className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground opacity-50">Unlock for ₹{(pricePaise / 100).toFixed(2)}</button></div></div>}</section> : <div className="mt-10"><BlogTableOfContents headings={headings} /><BlogContent content={post.content} /></div>}</article></main>;
}
