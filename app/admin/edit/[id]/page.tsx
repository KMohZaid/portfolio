import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/blog/PostForm";
import { getAdminEmail } from "@/lib/blog/auth";
import { getPostById } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminEmail())) redirect("/admin/login");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let post;
  try { post = await getPostById(id); } catch { notFound(); }
  if (!post) notFound();
  return <main className="min-h-screen bg-background px-6 pb-20 pt-10 text-foreground"><div className="mx-auto max-w-4xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Dashboard</Link><h1 className="mb-8 mt-8 font-mono text-4xl font-bold">Edit post</h1><PostForm post={post} /></div></main>;
}
