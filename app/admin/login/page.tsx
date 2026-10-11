"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const query = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(query.get("email") ?? "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const verifying = Boolean(message);
      const response = await fetch(verifying ? "/api/auth/verify" : "/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifying ? { email, code } : { email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (verifying) router.push("/admin");
      else {
        setMessage(result.message);
        window.history.replaceState(null, "", `/admin/login?email=${encodeURIComponent(email)}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request sign-in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Portfolio</Link>
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail /></div>
          <p className="font-mono text-sm text-primary">~/admin</p>
          <h1 className="mt-2 font-mono text-3xl font-bold">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Request a six-digit sign-in code by email. Only addresses on the admin allowlist can access the dashboard. If your email is not allowed, you’ll see a clear message.</p>
          {query.get("error") && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">That sign-in code is invalid, expired, or no longer authorized. Request a new one.</p>}
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label htmlFor="email" className="block text-sm font-medium">Email address</label>
            <input id="email" type="email" required autoComplete="email" value={email} readOnly={Boolean(message)} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-3 outline-none focus:border-primary" placeholder="you@example.com" />
            {message && <label htmlFor="code" className="block text-sm font-medium">Six-digit code</label>}
            {message && <input id="code" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="w-full rounded-lg border border-border bg-background px-3 py-3 font-mono tracking-[0.4em] outline-none focus:border-primary" placeholder="000000" />}
            {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{error}</p>}
            {message && <p role="status" className="rounded-lg bg-terminal-green/10 p-3 text-sm text-terminal-green">{message}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Sending…" : message ? "Verify code" : "Email me a sign-in code"}</button>
            {message && <button type="button" onClick={() => { setMessage(""); setCode(""); setError(""); }} className="w-full text-sm text-muted-foreground hover:text-foreground">Use a different email</button>}
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Codes expire after five minutes and can be used once. Admin access is restricted by email allowlist.</p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
