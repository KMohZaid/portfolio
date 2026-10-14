import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Github, LogOut, ShieldCheck } from "lucide-react";
import { getProviderAccounts, getSignedInUser, getAdminEmail } from "@/lib/blog/auth";
import { AccountConnections } from "@/components/blog/AccountConnections";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const [{ error: authError }, user] = await Promise.all([searchParams, getSignedInUser()]);
  if (!user) redirect(`/login?returnTo=${encodeURIComponent("/account")}`);
  const [accounts, adminEmail] = await Promise.all([getProviderAccounts(), getAdminEmail()]);
  const errorCode = Array.isArray(authError) ? authError[0] : authError;
  const accountError = errorCode === "email_does_not_match" ? "Could not link account: the provider email does not match your account email. Sign in to the provider with the same verified email address." : errorCode ? "Could not link this account. Please check the provider account and try again." : undefined;

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
        {accounts.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>Signed in with</span>{accounts.map((account) => <span key={account.id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-medium text-foreground"><AccountProviderMark provider={account.providerId} />{providerName(account.providerId)}</span>)}</div>}
        {adminEmail && <Link href="/admin" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"><ShieldCheck size={16} /> Admin dashboard</Link>}
        <AccountConnections accounts={accounts} providers={{ google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) }} initialError={accountError} />
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

function providerName(providerId: string) {
  if (providerId === "google") return "Google";
  if (providerId === "github") return "GitHub";
  return providerId;
}

function AccountProviderMark({ provider }: { provider: string }) {
  if (provider === "google") return <GoogleMark />;
  if (provider === "github") return <GithubMark />;
  return null;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.2 11.4-8.2Z"/></svg>;
}

function GithubMark() {
  return <Github aria-hidden="true" className="h-4 w-4" />;
}
