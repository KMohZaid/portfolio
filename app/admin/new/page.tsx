import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/blog/PostForm";
import { getAdminEmail } from "@/lib/blog/auth";

export const dynamic = "force-dynamic";
export default async function NewPostPage() {
  if (!(await getAdminEmail())) redirect("/login?returnTo=%2Fadmin%2Fnew");
  return <main className="min-h-screen bg-background px-6 pb-20 pt-10 text-foreground"><div className="mx-auto max-w-4xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Dashboard</Link><h1 className="mb-8 mt-8 font-mono text-4xl font-bold">New post</h1><PostForm /></div></main>;
}
