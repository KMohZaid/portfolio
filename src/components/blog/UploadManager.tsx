"use client";

import { useEffect, useState } from "react";
import type { BlogUpload } from "@/lib/blog/types";

export function UploadManager() {
  const [uploads, setUploads] = useState<BlogUpload[]>([]);
  const [usedUploads, setUsedUploads] = useState<BlogUpload[]>([]);
  const [showUsed, setShowUsed] = useState(false);
  const [message, setMessage] = useState("");
  const [unlistingId, setUnlistingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function loadUploads() {
    try {
      const response = await fetch("/api/admin/uploads?all=1", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load upload index.");
      const all = data.uploads as BlogUpload[];
      setUploads(all.filter((upload) => !upload.usedIn?.length));
      setUsedUploads(all.filter((upload) => Boolean(upload.usedIn?.length)));
      setMessage("");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to load upload index.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void loadUploads(); }, []);

  async function unlist(id: string) {
    if (unlistingId) return;
    setUnlistingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (response.ok) {
        const removedAt = new Date().toISOString();
        setUploads((items) => items.filter((item) => item._id !== id));
        setUsedUploads((items) => items.map((item) => item._id === id ? { ...item, removedAt } : item));
        setMessage(result.note);
      } else {
        if (Array.isArray(result.usedIn)) {
          const upload = uploads.find((item) => item._id === id);
          setUploads((items) => items.filter((item) => item._id !== id));
          if (upload) setUsedUploads((items) => [...items.filter((item) => item._id !== id), { ...upload, usedIn: result.usedIn }]);
        }
        setMessage(result.error ?? "Unable to unlist upload.");
      }
    } catch {
      setMessage("Unable to unlist upload. Check your connection and retry.");
    } finally {
      setUnlistingId(null);
    }
  }

  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-mono text-lg font-semibold">File uploads</h2><p className="mt-2 text-sm text-muted-foreground">Files are stored in the configured Telegram chat. Unlisting removes access through this site’s proxy but leaves the Telegram message in the chat.</p></div>
      <button type="button" disabled={unlistingId !== null} onClick={() => void loadUploads()} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary disabled:opacity-60">Refresh files</button>
    </div>
    {message && <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p>}
    <div className="mt-4 flex gap-2"><button type="button" onClick={() => setShowUsed(false)} className={`rounded-lg border px-3 py-2 text-sm ${!showUsed ? "border-primary text-primary" : "border-border"}`}>Unused ({uploads.length})</button><button type="button" onClick={() => setShowUsed(true)} className={`rounded-lg border px-3 py-2 text-sm ${showUsed ? "border-primary text-primary" : "border-border"}`}>Used ({usedUploads.length})</button></div>
    <div className="mt-4 space-y-3">{(showUsed ? usedUploads : uploads).map((upload) => <div key={upload._id} className="flex min-w-0 max-w-full flex-wrap items-center gap-3 rounded-lg border border-border p-2 sm:flex-nowrap sm:p-3">{upload.mimeType?.startsWith("image/") ? <img src={upload.url} alt="" className="h-12 w-16 rounded object-cover" /> : <div aria-hidden="true" className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">{upload.mimeType?.startsWith("video/") ? "VIDEO" : upload.mimeType === "application/pdf" ? "PDF" : "FILE"}</div>}<div className="min-w-0 flex-1"><p className="truncate text-sm">{upload.filename}</p><a href={upload.url} target="_blank" rel="noreferrer" className="block max-w-full truncate text-xs text-primary">{upload.url}</a>{showUsed && upload.usedIn && <div className="mt-1 flex flex-wrap gap-1">{upload.usedIn.map((title) => <span key={title} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{title}</span>)}</div>}</div><span className="shrink-0 text-xs text-muted-foreground">{(upload.size / 1024).toFixed(0)} KB</span>{upload.removedAt ? <span className="shrink-0 text-xs text-muted-foreground">Unlisted</span> : !upload.usedIn?.length ? <button type="button" disabled={unlistingId !== null} onClick={() => void unlist(upload._id!)} className="shrink-0 text-xs text-destructive hover:underline disabled:cursor-wait disabled:opacity-60">{unlistingId === upload._id ? "Unlisting…" : "Unlist"}</button> : <span title="Remove this file from all saved posts and drafts first." className="shrink-0 text-xs text-muted-foreground">In use</span>}</div>)}
      {loaded && (showUsed ? usedUploads : uploads).length === 0 && !message && <p className="text-sm text-muted-foreground">{showUsed ? "No uploads are referenced by articles." : "No unused uploads."}</p>}
      {!loaded && <p role="status" className="text-sm text-muted-foreground">Loading uploads…</p>}
    </div>
  </section>;
}
