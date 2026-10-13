"use client";

import { useState } from "react";
import { Github, Link2, Unlink } from "lucide-react";
import { authClient } from "@/lib/blog/auth-client";

type Account = { id: string; providerId: string };

export function AccountConnections({ accounts, providers }: { accounts: Account[]; providers: { google: boolean; github: boolean } }) {
  const [linked, setLinked] = useState(accounts);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function link(provider: "google" | "github") {
    setBusy(provider);
    setError("");
    try {
      const result = await authClient.linkSocial({ provider, callbackURL: "/account" });
      if (result.error) throw new Error(result.error.message || `Could not link ${provider}.`);
      if (result.data?.url) window.location.assign(result.data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to link account.");
      setBusy("");
    }
  }

  async function unlink(accountId: string) {
    setBusy(accountId);
    setError("");
    try {
      const result = await authClient.unlinkAccount({ accountId });
      if (result.error) throw new Error(result.error.message || "Could not unlink account.");
      setLinked((current) => current.filter((account) => account.id !== accountId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to unlink account.");
    } finally {
      setBusy("");
    }
  }

  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="font-mono text-lg font-semibold">Connected accounts</h2>
    <p className="mt-2 text-sm text-muted-foreground">Link another provider while signed in. Linking requires the same verified email; separate accounts are never merged automatically.</p>
    <div className="mt-4 space-y-3">
      {(["google", "github"] as const).map((provider) => {
        const account = linked.find((entry) => entry.providerId === provider);
        if (!providers[provider] && !account) return null;
        return <div key={provider} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">{provider === "github" ? <Github size={18} /> : <GoogleMark />}<span>{provider === "github" ? "GitHub" : "Google"}</span></div>
          {account ? <button type="button" disabled={Boolean(busy)} onClick={() => void unlink(account.id)} className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs hover:border-destructive disabled:opacity-50"><Unlink size={14} />{busy === account.id ? "Unlinking…" : "Unlink"}</button> : <button type="button" disabled={Boolean(busy)} onClick={() => void link(provider)} className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-50"><Link2 size={14} />{busy === provider ? "Connecting…" : `Link ${provider === "github" ? "GitHub" : "Google"}`}</button>}
        </div>;
      })}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.3c1.6-4.8 6.1-8.2 11.4-8.2Z"/></svg>;
}
