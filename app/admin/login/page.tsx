"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const query = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const response = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setMessage(result.message); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to request sign-in."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background px-6 text-foreground"><div className="mx-auto flex min-h-screen max-w-md flex-col justify-center"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Portfolio</Link><div className="rounded-2xl border border-border bg-card p-7"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail /></div><p className="font-mono text-sm text-primary">~/admin</p><h1 className="mt-2 font-mono text-3xl font-bold">Sign in</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Request a one-time sign-in link. Only verified addresses on the admin allowlist can access the dashboard.</p>{query.get("error") && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">That sign-in link is invalid, expired, or no longer authorized. Request a new one.</p>}<form className="mt-6 space-y-4" onSubmit={submit}><label htmlFor="email" className="block text-sm font-medium">Email address</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-primary" placeholder="you@example.com" />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="rounded-lg bg-terminal-green/10 p-3 text-sm text-terminal-green">{message}</p>}<button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">{busy ? "Sending…" : "Email me a sign-in link"}</button></form></div><p className="mt-5 text-center text-xs text-muted-foreground">Links expire after 10 minutes. Admin access is restricted by email allowlist.</p></div></main>;
}

export default function AdminLoginPage() { return <Suspense><LoginForm /></Suspense>; }
