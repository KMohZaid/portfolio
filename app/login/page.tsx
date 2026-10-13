"use client";

import Link from "next/link";
import { ArrowLeft, Github, KeyRound } from "lucide-react";
import { useEffect } from "react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/blog/auth-client";

function LoginForm() {
  const searchParams = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo") || "/account";
  let returnTo = "/account";
  try {
    const destination = new URL(requestedReturnTo, window.location.origin);
    if (destination.origin === window.location.origin) returnTo = `${destination.pathname}${destination.search}${destination.hash}`;
  } catch { /* use the account page as the safe fallback */ }
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<{ google: boolean; github: boolean; custom: { id: string; name: string } | null } | null>(null);
  const callbackError = searchParams.get("error");
  const callbackErrorMessage = callbackError === "account_not_linked" || callbackError === "unable_to_link_account" || callbackError === "email_does_not_match" || callbackError === "account_already_linked_to_different_user"
    ? "This email already belongs to an account using another sign-in provider. Sign in with that provider first, then link GitHub or Google from your Account page."
    : callbackError === "email_not_verified"
      ? "GitHub did not confirm that this email address is verified. Verify it in GitHub settings and try again."
      : callbackError === "email_not_found"
        ? "The provider did not share an email address. Add and verify an email with the provider, then try again."
        : callbackError
          ? "Sign-in could not be completed. Try the provider already linked to your account, or contact the site administrator if the problem continues."
          : "";
  useEffect(() => { void fetch("/api/auth/providers", { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error("Unable to load providers"); return response.json(); }).then(setProviders).catch(() => setProviders({ google: false, github: false, custom: null })); }, []);

  async function signIn(provider: string) {
    setBusy(provider);
    setError("");
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: returnTo, errorCallbackURL: `/login?returnTo=${encodeURIComponent(returnTo)}` });
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
          {(error || callbackErrorMessage) && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">{error || callbackErrorMessage}</p>}
          <div className="mt-6 space-y-3">
            {providers?.google && <button disabled={Boolean(busy)} onClick={() => void signIn("google")} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 rounded-full bg-white p-0.5"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.2 11.4-8.2Z"/></svg>{busy === "google" ? "Connecting…" : "Continue with Google"}</button>}
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
