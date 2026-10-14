import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, FilePlus2, Pencil, UserRound } from "lucide-react";
import { getAdminEmail } from "@/lib/blog/auth";
import { listPosts } from "@/lib/blog/posts";
import { UploadManager } from "@/components/blog/UploadManager";
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
    <main className="min-h-screen bg-background px-6 pb-20 pt-10 text-foreground">
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
                <div key={post._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.thumbnail && <img src={post.thumbnail} alt="" className="h-12 w-16 rounded-md border border-border object-cover" />}
                      <div className="min-w-0"><h3 className="truncate font-medium">{post.title}</h3>
                      {post.status === "draft" ? <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">draft</span> : post.visibility === "hidden" ? <span className="mt-1 inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">hidden</span> : null}</div>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">/blog/{post.slug} · {post.status === "published" && post.publishedAt ? `published ${new Date(post.publishedAt).toLocaleDateString()} · ` : ""}updated {new Date(post.updatedAt).toLocaleDateString()}</p>
                    {post.tags?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">#{tag}</span>)}</div>}
                  </div>
                  {post.status === "published" && post.visibility === "public" && <Link href={`/blog/${post.slug}`} aria-label="View post" className="rounded p-2 text-muted-foreground hover:text-primary"><ExternalLink size={17} /></Link>}
                  <Link href={`/admin/edit/${post._id}`} aria-label="Edit post" className="rounded p-2 text-muted-foreground hover:text-primary"><Pencil size={17} /></Link>
                  {post.status === "published" && <VisibilityToggle id={post._id!} visibility={post.visibility} />}
                  <DeletePostButton id={post._id!} />
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="mt-8"><UploadManager /></div>
      </div>
    </main>
  );
}
