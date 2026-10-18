import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePlus2, LockKeyhole, Pencil, UserRound } from "lucide-react";
import { getAdminEmail } from "@/lib/blog/auth";
import { listPosts } from "@/lib/blog/posts";
import { UploadManager } from "@/components/blog/UploadManager";
import { PaywallDialogButton } from "@/components/blog/PaywallDialogButton";
import { AdminPaywallRefresh } from "@/components/blog/AdminPaywallRefresh";
import { DeletePostButton } from "./DeletePostButton";
import { VisibilityToggle } from "./VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const email = await getAdminEmail();
  if (!email) redirect("/login?returnTo=%2Fadmin");

  let posts = [];
  let error = "";
  try { posts = await listPosts(true); } catch (e) { error = e instanceof Error ? e.message : "Unable to load posts."; }

  return (
    <main className="min-h-screen bg-transparent px-6 pb-20 pt-10 text-foreground">
      <AdminPaywallRefresh />
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Portfolio</Link>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">admin · {email}</p>
            <h1 className="mt-2 font-mono text-4xl font-bold">Writing dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage drafts, published or hidden posts, and your upload index.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/account" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><UserRound size={16} /> Account</Link>
            <Link href="/blog" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><ExternalLink size={16} /> View blog</Link>
            <Link href="/admin/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><FilePlus2 size={16} /> New post</Link>
          </div>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-4"><button className="text-sm text-muted-foreground hover:text-foreground">Sign out</button></form>
        <section className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><h2 className="font-mono text-lg font-semibold">Posts <span className="text-sm text-muted-foreground">({posts.length})</span></h2></div>
          {error ? <p className="p-5 text-sm text-destructive">{error}</p> : posts.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No posts yet. Create a draft or publish your first post.</div> : (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <article key={post._id} className="overflow-hidden border-b border-border last:border-b-0">
                  {post.thumbnail && <img src={post.thumbnail} alt="" className="aspect-[16/7] w-full bg-muted object-cover" />}
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1"><p className="mb-1 break-all font-mono text-xs text-muted-foreground">/blog/{post.slug}</p><h3 className="flex items-center gap-2 font-mono text-lg font-semibold text-primary">{post.title}{post.isPaid && <span title={`Paid · ₹${((post.pricePaise ?? 0) / 100).toFixed(2)}`} aria-label={`Paid article, ₹${((post.pricePaise ?? 0) / 100).toFixed(2)}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400"><LockKeyhole size={13} />₹{((post.pricePaise ?? 0) / 100).toFixed(2)}</span>}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">{post.status === "draft" ? <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">draft</span> : post.visibility === "hidden" ? <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-400">hidden</span> : <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">published</span>}</div></div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{post.status === "published" && post.publishedAt ? `Published ${new Date(post.publishedAt).toLocaleDateString()} · ` : ""}Updated {new Date(post.updatedAt).toLocaleDateString()}</p>
                    {post.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">#{tag}</span>)}</div>}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {post.status === "published" && post.visibility === "public" && <Link href={`/blog/${post.slug}`} aria-label="View post" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"><ExternalLink size={16} /> View</Link>}
                      <Link href={`/admin/edit/${post._id}`} aria-label="Edit post" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"><Pencil size={16} /> Edit</Link>
                      <PaywallDialogButton postId={post._id!} initialSettings={{ enabled: post.isPaid ?? false, pricePaise: post.pricePaise ?? 0, accessDurationSeconds: post.accessDurationSeconds ?? null, showExcerpt: post.showExcerpt ?? true, showThumbnail: post.showThumbnail ?? true }} />
                      {post.status === "published" && <VisibilityToggle id={post._id!} visibility={post.visibility} />}
                      <DeletePostButton id={post._id!} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className="mt-8"><UploadManager /></div>
      </div>
    </main>
  );
}
