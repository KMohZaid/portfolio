"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/blog/types";
import { toast } from "@/components/ui/sonner";

export function VisibilityToggle({ id, visibility }: { id: string; visibility: BlogPost["visibility"] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/posts/${id}/visibility`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: visibility === "public" ? "hidden" : "public" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to change post visibility.");
      toast.success(visibility === "public" ? "Post hidden" : "Post is public");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to change post visibility.");
    } finally { setBusy(false); }
  }

  return visibility === "public" ? <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => void toggle()} className="rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50">{busy ? "Saving…" : "Hide"}</button>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</div> : <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => void toggle()} className="rounded border border-terminal-green/40 px-3 py-1.5 text-xs text-terminal-green hover:bg-terminal-green/10 disabled:opacity-50">{busy ? "Saving…" : "Make public"}</button>{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</div>;
}
