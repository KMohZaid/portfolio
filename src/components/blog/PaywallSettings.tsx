"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeIndianRupee, Check, ChevronDown, LoaderCircle, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaywallSettings as Settings } from "@/lib/blog/payments";

const presets: Array<{ label: string; seconds: number | null }> = [
  { label: "1 minute", seconds: 60 }, { label: "5 minutes", seconds: 300 }, { label: "10 minutes", seconds: 600 },
  { label: "1 hour", seconds: 3600 }, { label: "6 hours", seconds: 21600 }, { label: "12 hours", seconds: 43200 },
  { label: "1 day", seconds: 86400 }, { label: "1 week", seconds: 604800 }, { label: "1 year", seconds: 31536000 },
  { label: "Never expires", seconds: null },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${checked ? "bg-primary" : "bg-muted-foreground/40"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>;
}

export function PaywallSettings({ postId, compact = false, onSettingsChange, initialSettings }: { postId?: string; compact?: boolean; onSettingsChange?: (settings: Settings) => void; initialSettings?: Settings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false);
  const [rupees, setRupees] = useState(initialSettings ? String(initialSettings.pricePaise / 100) : "99");
  const [duration, setDuration] = useState(initialSettings ? (initialSettings.accessDurationSeconds === null ? "never" : String(initialSettings.accessDurationSeconds)) : "86400");
  const [customValue, setCustomValue] = useState("");
  const [customUnit, setCustomUnit] = useState("day");
  const [showExcerpt, setShowExcerpt] = useState(initialSettings?.showExcerpt ?? true);
  const [showThumbnail, setShowThumbnail] = useState(initialSettings?.showThumbnail ?? true);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(!postId);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(!postId || Boolean(initialSettings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!postId) { setInitialized(true); setHasLoadedSettings(true); return; }
    if (initialSettings) { setInitialized(true); setHasLoadedSettings(true); return; }
    let active = true;
    setInitialized(false);
    setHasLoadedSettings(false);
    setLoading(true);
    void fetch(`/api/admin/posts/${postId}/paywall`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load paywall settings.");
      const settings = result.paywall as Settings;
      if (!active) return;
      setEnabled(settings.enabled);
      setRupees((settings.pricePaise / 100).toFixed(2).replace(/\.00$/, ""));
      setDuration(settings.accessDurationSeconds === null ? "never" : String(settings.accessDurationSeconds));
      setShowExcerpt(settings.showExcerpt);
      setShowThumbnail(settings.showThumbnail);
      setHasLoadedSettings(true);
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load paywall settings."); }).finally(() => { if (active) { setLoading(false); setInitialized(true); setHasLoadedSettings(true); } });
    return () => { active = false; };
  }, [postId]);

  useEffect(() => {
    if (!postId && initialized) onSettingsChange?.({ enabled, pricePaise: Math.round(Number(rupees) * 100), accessDurationSeconds: duration === "custom" ? Number(customValue) * ({ minute: 60, hour: 3600, day: 86400, week: 604800, year: 31536000 }[customUnit] ?? 86400) : duration === "never" ? null : Number(duration), showExcerpt, showThumbnail });
  }, [postId, initialized, onSettingsChange, enabled, rupees, duration, customValue, customUnit, showExcerpt, showThumbnail]);

  const customSeconds = Number(customValue) * ({ minute: 60, hour: 3600, day: 86400, week: 604800, year: 31536000 }[customUnit] ?? 86400);
  const accessDurationSeconds = duration === "custom" ? customSeconds : duration === "never" ? null : Number(duration);
  const durationLabel = presets.find((preset) => String(preset.seconds ?? "never") === duration)?.label ?? (duration === "custom" ? "Custom duration" : "Select duration");

  async function save() {
    if (!postId) { setError("Payment settings will be saved automatically when you publish this new post."); return; }
    if (enabled && !/^[0-9a-f-]{36}$/i.test(postId)) { setError("Paid articles require a saved database post, not a sample article."); return; }
    const pricePaise = Math.round(Number(rupees) * 100);
    if (enabled && (!Number.isSafeInteger(pricePaise) || pricePaise <= 0)) { setError("Enter a price greater than ₹0."); return; }
    if (!enabled && (!Number.isSafeInteger(pricePaise) || pricePaise < 0)) { setError("Enter a valid price."); return; }
    if (duration === "custom" && (!Number.isSafeInteger(customSeconds) || customSeconds <= 0)) { setError("Enter a valid custom access duration."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const settings: Settings = { enabled, pricePaise, accessDurationSeconds, showExcerpt, showThumbnail };
      if (postId) {
        const response = await fetch(`/api/admin/posts/${postId}/paywall`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to save paywall settings.");
      } else if (onSettingsChange) onSettingsChange(settings);
      else throw new Error("Payment settings will be saved automatically when you publish this new post.");
      setNotice("Paywall settings saved.");
      router.refresh();
      window.dispatchEvent(new CustomEvent("paywall-settings-saved", { detail: { postId, isPaid: enabled, pricePaise } }));
      setConfirmOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save paywall settings."); }
    finally { setSaving(false); }
  }

  const switchRow = (label: string, checked: boolean, onChange: (value: boolean) => void) => <div className="flex items-center justify-between gap-3"><span className="text-sm">{label}</span><Switch checked={checked} onChange={onChange} label={label} /></div>;

  return <>
    <section className={`min-w-0 w-full rounded-xl border border-border ${compact ? "p-3 sm:p-4" : "p-4"}`}>
      {!compact && <div className="flex items-center gap-2"><BadgeIndianRupee size={18} className="text-primary" /><h2 className="font-mono font-semibold">Paid article</h2></div>}
      <div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm font-medium">Enable paid access</span><Switch checked={enabled} onChange={setEnabled} label="Enable paid access" /></div>
      {loading && <LoaderCircle size={16} aria-label="Loading paid article settings" className="mt-4 animate-spin text-muted-foreground" />}
      {initialized && hasLoadedSettings && enabled && <div className="mt-4 min-w-0 space-y-4">
        <div><label htmlFor={compact ? `paywall-price-${postId}` : "paywall-price"} className="mb-1 block text-sm">Price (INR)</label><div className="flex w-full max-w-xs items-center rounded-lg border border-border bg-background px-3"><span className="text-muted-foreground">₹</span><input id={compact ? `paywall-price-${postId}` : "paywall-price"} type="number" min="1" step="0.01" value={rupees} onChange={(event) => setRupees(event.target.value)} className="min-w-0 w-full bg-transparent px-2 py-2 outline-none" /></div></div>
        <div><span className="mb-1 block text-sm">Access duration after payment</span><details className="group relative w-full max-w-sm"><summary className="flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span>{durationLabel}</span><ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" /></summary><div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-xl">{presets.map((preset) => { const value = String(preset.seconds ?? "never"); return <button key={preset.label} type="button" onClick={(event) => { setDuration(value); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{preset.label}{duration === value && <Check size={15} className="text-primary" />}</button>; })}<button type="button" onClick={(event) => { setDuration("custom"); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted">Custom duration…{duration === "custom" && <Check size={15} className="text-primary" />}</button></div></details>{duration === "custom" && <div className="mt-2 flex w-full max-w-sm gap-2"><input type="number" min="1" value={customValue} onChange={(event) => setCustomValue(event.target.value)} aria-label="Custom duration value" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" /><select aria-label="Custom duration unit" value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} className="max-w-[50%] rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="minute">Minutes</option><option value="hour">Hours</option><option value="day">Days</option><option value="week">Weeks</option><option value="year">Years</option></select></div>}</div>
        <div className="space-y-3"><p className="text-sm font-medium">Preview before purchase</p>{switchRow("Hide excerpt/description", !showExcerpt, (hide) => setShowExcerpt(!hide))}{switchRow("Hide thumbnail", !showThumbnail, (hide) => setShowThumbnail(!hide))}<p className="text-xs text-muted-foreground">By default, the excerpt and thumbnail are visible before purchase. Turn these on to hide them. The article title always remains visible, while article content stays private until access is verified.</p></div>
      </div>}
      {!loading && postId && !onSettingsChange && <button type="button" disabled={saving} onClick={() => { if (compact) setConfirmOpen(true); else void save(); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? "Saving…" : compact ? "Save changes" : "Save paid access settings"}</button>}
      {onSettingsChange && !compact && <p className="mt-4 text-xs text-muted-foreground">Payment settings will be saved automatically when you publish this new post.</p>}
      {loading && <LoaderCircle size={16} aria-label="Loading paid article settings" className="mt-4 animate-spin text-muted-foreground" />}
      {notice && <p role="status" className="mt-2 text-sm text-emerald-600">{notice}</p>}{error && <p role="alert" className="mt-2 break-words text-sm text-destructive">{error}</p>}
    </section>
    {compact && <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent className="mx-3 w-[calc(100%-1.5rem)] max-w-lg"><DialogHeader><DialogTitle>Save paid article settings?</DialogTitle><DialogDescription>{enabled ? `This will enable or update the paywall at ₹${(Math.round(Number(rupees) * 100) / 100).toFixed(2)}.` : "This will disable paid access for this article."} Existing successful purchases will not be refunded.</DialogDescription></DialogHeader><DialogFooter><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button><button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Confirm and save</button></DialogFooter></DialogContent></Dialog>}
  </>;
}
