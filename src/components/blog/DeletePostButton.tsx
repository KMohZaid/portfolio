"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DeletePostButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function deletePost() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete this post.");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete this post.");
      setBusy(false);
    }
  }

  return <><button type="button" onClick={() => setOpen(true)} aria-label="Delete post" className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 size={17} /></button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Delete this post?</DialogTitle><DialogDescription>This permanently deletes the post and cannot be undone.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={busy} onClick={() => void deletePost()} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-50">{busy ? "Deleting…" : "Delete post"}</button></DialogFooter></DialogContent></Dialog></>;
}
