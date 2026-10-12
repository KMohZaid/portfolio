"use client";

import Link from "next/link";
import { ArrowLeft, Github, KeyRound } from "lucide-react";
import { useEffect } from "react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/blog/auth-client";

function LoginForm() {
  const searchParams = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo") || "/blog/account";
  let returnTo = "/blog/account";
  try {
    const destination = new URL(requestedReturnTo, window.location.origin);
    if (destination.origin === window.location.origin) returnTo = `${destination.pathname}${destination.search}${destination.hash}`;
  } catch { /* use the account page as the safe fallback */ }
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<{ google: boolean; github: boolean; custom: { id: string; name: string } | null } | null>(null);
  useEffect(() => { void fetch("/api/auth/providers", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Unable to load providers"); return response.json(); }).then(setProviders).catch(() => setProviders({ google: false, github: false, custom: null })); }, []);

  async function signIn(provider: string) {
    setBusy(provider);
    setError("");
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: returnTo, errorCallbackURL: `/admin/login?error=signin&returnTo=${encodeURIComponent(returnTo)}` });
      if (result.error) {
        setError(result.error.message || "Unable to start sign-in. Check provider configuration.");
        setBusy("");
        return;
      }
      if (result.data?.url) window.location.assign(result.data.url);
    } catch {
      setError("Unable to start sign-in. Check provider configuration and try again.");
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Portfolio</Link>
        <div className="rounded-2xl border border-border bg-card p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><KeyRound /></div>
          <p className="font-mono text-sm text-primary">~/account</p>
          <h1 className="mt-2 font-mono text-3xl font-bold">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sign in to read member-only articles. Blog administration remains restricted to verified addresses on the admin allowlist.</p>
          {(error || searchParams.has("error")) && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{error || "Sign-in could not be completed. Use an administrator account that is allowlisted and has a verified email."}</p>}
          <div className="mt-6 space-y-3">
            {providers?.google && <button disabled={Boolean(busy)} onClick={() => void signIn("google")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50">{busy === "google" ? "Connecting…" : "Continue with Google"}</button>}
            {providers?.github && <button disabled={Boolean(busy)} onClick={() => void signIn("github")} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:border-primary disabled:opacity-50"><Github size={18} />{busy === "github" ? "Connecting…" : "Continue with GitHub"}</button>}
            {providers?.custom && <button disabled={Boolean(busy)} onClick={() => void signIn(providers.custom!.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-medium hover:border-primary disabled:opacity-50">{busy === providers.custom.id ? "Connecting…" : `Continue with ${providers.custom.name}`}</button>}
            {providers && !providers.google && !providers.github && !providers.custom && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Sign-in providers are not configured yet. Set Google, GitHub, or custom OIDC credentials in the server environment, then restart the app.</p>}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Available providers depend on server configuration. Admin access also requires verified email and membership in the server-side admin allowlist.</p>
          <form action="/api/auth/logout" method="post" className="mt-4 text-center"><button className="text-xs text-muted-foreground underline hover:text-foreground">Sign out of another account</button></form>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
