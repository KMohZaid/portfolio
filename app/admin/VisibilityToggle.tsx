"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/blog/types";

export function VisibilityToggle({ id, visibility }: { id: string; visibility: BlogPost["visibility"] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/posts/${id}/visibility`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: visibility === "public" ? "hidden" : "public" }) });
      if (!response.ok) throw new Error("Unable to change post visibility.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to change post visibility.");
    } finally { setBusy(false); }
  }

  return <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => void toggle()} className="rounded border border-border px-3 py-1.5 text-xs hover:border-primary disabled:opacity-50">{busy ? "Saving…" : visibility === "public" ? "Hide" : "Make public"}</button>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</div>;
}
