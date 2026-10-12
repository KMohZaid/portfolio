import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, LogOut } from "lucide-react";
import { getSignedInUser } from "@/lib/blog/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSignedInUser();
  if (!user) redirect(`/admin/login?returnTo=${encodeURIComponent("/blog/account")}`);

  return <main className="min-h-screen bg-background px-6 pb-20 pt-10 text-foreground">
    <div className="mx-auto max-w-3xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Blog</Link>
      <div className="mt-10 rounded-2xl border border-border bg-card p-7">
        <p className="font-mono text-sm text-primary">~/account</p>
        <h1 className="mt-2 font-mono text-3xl font-bold">Your account</h1>
        <div className="mt-6 flex items-center gap-4">
          {user.image ? <img src={user.image} alt="" className="h-14 w-14 rounded-full border border-border object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><BookOpen /></div>}
          <div><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}{user.emailVerified ? " · verified" : " · unverified"}</p></div>
        </div>
        <section className="mt-8 border-t border-border pt-6">
          <h2 className="font-mono text-lg font-semibold">Purchases &amp; access</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A place for future paid article access and purchases. No payments or paid access are enabled yet.</p>
        </section>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary"><BookOpen size={16} /> Browse articles</Link>
          <form action="/api/auth/logout" method="post"><button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut size={16} /> Sign out</button></form>
        </div>
      </div>
    </div>
  </main>;
}
