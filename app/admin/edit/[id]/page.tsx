import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/blog/PostForm";
import { getAdminEmail } from "@/lib/blog/auth";
import { getDb } from "@/lib/blog/db";
import { ObjectId } from "mongodb";
import type { BlogPost } from "@/lib/blog/types";

export const dynamic = "force-dynamic";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminEmail())) redirect("/admin/login");
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();
  let raw;
  try { raw = await (await getDb()).collection("blog_posts").findOne({ _id: new ObjectId(id) }); } catch { notFound(); }
  if (!raw) notFound();
  const post = { ...raw, _id: String(raw._id), createdAt: new Date(raw.createdAt).toISOString(), updatedAt: new Date(raw.updatedAt).toISOString(), publishedAt: raw.publishedAt ? new Date(raw.publishedAt).toISOString() : undefined } as BlogPost;
  return <main className="min-h-screen bg-background px-6 pb-20 pt-10 text-foreground"><div className="mx-auto max-w-4xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Dashboard</Link><h1 className="mb-8 mt-8 font-mono text-4xl font-bold">Edit post</h1><PostForm post={post} /></div></main>;
}
