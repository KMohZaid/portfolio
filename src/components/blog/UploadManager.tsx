"use client";

import { useEffect, useState } from "react";
import type { BlogUpload } from "@/lib/blog/types";

export function UploadManager() {
  const [uploads, setUploads] = useState<BlogUpload[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/admin/uploads").then(async (r) => { const data = await r.json(); if (r.ok) setUploads(data.uploads); else setMessage(data.error); }).catch(() => setMessage("Unable to load upload index.")); }, []);
  async function unlist(id: string) {
    const response = await fetch("/api/admin/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const result = await response.json();
    if (response.ok) { setUploads((items) => items.map((item) => item._id === id ? { ...item, removedAt: new Date().toISOString() } : item)); setMessage(result.note); } else setMessage(result.error);
  }
  return <section className="rounded-xl border border-border bg-card p-5"><h2 className="font-mono text-lg font-semibold">Image uploads</h2><p className="mt-2 text-sm text-muted-foreground">Local index only. Telegraph has no public image listing or deletion API, so unlisting never removes remote image files.</p>{message && <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p>}<div className="mt-4 space-y-3">{uploads.map((upload) => <div key={upload._id} className="flex items-center gap-3 rounded-lg border border-border p-3"><img src={upload.url} alt="" className="h-12 w-16 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm">{upload.filename}</p><a href={upload.url} target="_blank" rel="noreferrer" className="truncate text-xs text-primary">{upload.url}</a></div><span className="text-xs text-muted-foreground">{(upload.size / 1024).toFixed(0)} KB</span>{upload.removedAt ? <span className="text-xs text-muted-foreground">Unlisted</span> : <button onClick={() => void unlist(upload._id!)} className="text-xs text-destructive hover:underline">Unlist</button>}</div>)}{uploads.length === 0 && !message && <p className="text-sm text-muted-foreground">No indexed uploads.</p>}</div></section>;
}
