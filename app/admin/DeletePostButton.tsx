"use client";

import { Trash2 } from "lucide-react";

export function DeletePostButton({ id }: { id: string }) {
  async function deletePost() {
    if (!window.confirm("Permanently delete this post?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return <button type="button" onClick={() => void deletePost()} aria-label="Delete post" className="rounded p-2 text-muted-foreground hover:text-destructive"><Trash2 size={17} /></button>;
}
