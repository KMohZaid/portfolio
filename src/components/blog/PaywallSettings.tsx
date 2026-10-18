"use client";

import { useEffect, useState } from "react";
import { BadgeIndianRupee, LoaderCircle, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaywallSettings as Settings } from "@/lib/blog/payments";

const presets: Array<{ label: string; seconds: number | null }> = [
  { label: "1 minute", seconds: 60 }, { label: "5 minutes", seconds: 300 }, { label: "10 minutes", seconds: 600 },
  { label: "1 hour", seconds: 3600 }, { label: "6 hours", seconds: 21600 }, { label: "12 hours", seconds: 43200 },
  { label: "1 day", seconds: 86400 }, { label: "1 week", seconds: 604800 }, { label: "1 year", seconds: 31536000 },
  { label: "Never expires", seconds: null },
];

export function PaywallSettings({ postId, compact = false }: { postId?: string; compact?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [rupees, setRupees] = useState("99");
  const [duration, setDuration] = useState("86400");
  const [customValue, setCustomValue] = useState("");
  const [customUnit, setCustomUnit] = useState("day");
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!postId) return;
    void fetch(`/api/admin/posts/${postId}/paywall`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load paywall settings.");
      const settings = result.paywall as Settings;
      setEnabled(settings.enabled);
      setRupees((settings.pricePaise / 100).toFixed(2).replace(/\.00$/, ""));
      setDuration(settings.accessDurationSeconds === null ? "never" : String(settings.accessDurationSeconds));
      setShowExcerpt(settings.showExcerpt);
      setShowThumbnail(settings.showThumbnail);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load paywall settings.")).finally(() => setLoading(false));
  }, [postId]);

  const customSeconds = Number(customValue) * ({ minute: 60, hour: 3600, day: 86400, week: 604800, year: 31536000 }[customUnit] ?? 86400);
  const accessDurationSeconds = duration === "custom" ? customSeconds : duration === "never" ? null : Number(duration);

  async function save() {
    if (!postId) { setError("Save this post first, then configure its paywall."); return; }
    if (enabled && !/^[0-9a-f-]{36}$/i.test(postId)) { setError("Paid articles require a saved database post, not a sample article."); return; }
    const pricePaise = Math.round(Number(rupees) * 100);
    if (enabled && (!Number.isSafeInteger(pricePaise) || pricePaise <= 0)) { setError("Enter a price greater than ₹0."); return; }
    if (!enabled && (!Number.isSafeInteger(pricePaise) || pricePaise < 0)) { setError("Enter a valid price."); return; }
    if (duration === "custom" && (!Number.isSafeInteger(customSeconds) || customSeconds <= 0)) { setError("Enter a valid custom access duration."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/posts/${postId}/paywall`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, pricePaise, accessDurationSeconds, showExcerpt, showThumbnail }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save paywall settings.");
      setNotice("Paywall settings saved.");
      window.dispatchEvent(new CustomEvent("paywall-settings-saved", { detail: { postId } }));
      setConfirmOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save paywall settings."); }
    finally { setSaving(false); }
  }

  return <>
    <section className={compact ? "rounded-xl border border-border p-0" : "rounded-xl border border-border p-4"}>{!compact && <div className="flex items-center gap-2"><BadgeIndianRupee size={18} className="text-primary" /><h2 className="font-mono font-semibold">Paid article</h2></div>}<label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Enable paid access</label>{enabled && <div className="mt-4 space-y-4"><div><label htmlFor={compact ? `paywall-price-${postId}` : "paywall-price"} className="mb-1 block text-sm">Price (INR)</label><div className="flex max-w-xs items-center rounded-lg border border-border bg-background px-3"><span className="text-muted-foreground">₹</span><input id={compact ? `paywall-price-${postId}` : "paywall-price"} type="number" min="1" step="0.01" value={rupees} onChange={(event) => setRupees(event.target.value)} className="w-full bg-transparent px-2 py-2 outline-none" /></div></div><div><label htmlFor={compact ? `paywall-duration-${postId}` : "paywall-duration"} className="mb-1 block text-sm">Access duration after payment</label><select id={compact ? `paywall-duration-${postId}` : "paywall-duration"} value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm">{presets.map((preset) => <option key={preset.label} value={preset.seconds ?? "never"}>{preset.label}</option>)}<option value="custom">Custom duration…</option></select>{duration === "custom" && <div className="mt-2 flex max-w-xs gap-2"><input type="number" min="1" value={customValue} onChange={(event) => setCustomValue(event.target.value)} aria-label="Custom duration value" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" /><select aria-label="Custom duration unit" value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="minute">Minutes</option><option value="hour">Hours</option><option value="day">Days</option><option value="week">Weeks</option><option value="year">Years</option></select></div>}</div><div className="space-y-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={showExcerpt} onChange={(event) => setShowExcerpt(event.target.checked)} /> Show excerpt before purchase</label><label className="flex items-center gap-2"><input type="checkbox" checked={showThumbnail} onChange={(event) => setShowThumbnail(event.target.checked)} /> Show thumbnail before purchase</label><p className="text-xs text-muted-foreground">The article title always remains visible. Article content stays private until payment access is verified.</p></div></div>}{loading && <p className="mt-3 text-sm text-muted-foreground">Loading settings…</p>}{!loading && <button type="button" disabled={saving} onClick={() => { if (compact) setConfirmOpen(true); else void save(); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving…" : compact ? "Save changes" : "Save paid access settings"}</button>}{notice && <p role="status" className="mt-2 text-sm text-emerald-600">{notice}</p>}{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</section>
    {compact && <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Save paid article settings?</DialogTitle><DialogDescription>{enabled ? `This will enable or update the paywall at ₹${(Math.round(Number(rupees) * 100) / 100).toFixed(2)}.` : "This will disable paid access for this article."} Existing successful purchases will not be refunded.</DialogDescription></DialogHeader><DialogFooter><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Confirm and save</button></DialogFooter></DialogContent></Dialog>}
  </>;
}
