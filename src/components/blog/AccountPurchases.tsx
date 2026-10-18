"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, ReceiptText } from "lucide-react";

type Purchase = { id: string; postId: string; title: string; slug: string; amountPaise: number; paidAt: string; accessExpiresAt: string | null };

export function AccountPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/account/purchases", { cache: "no-store" }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to load purchases."); setPurchases(result.purchases); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load purchases.")); }, []);

  return <div className="mt-4">{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : purchases.length === 0 ? <p className="text-sm text-muted-foreground">Purchased articles will appear here.</p> : <div className="divide-y divide-border rounded-lg border border-border">{purchases.map((purchase) => <article key={purchase.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="font-medium">{purchase.title}</h3><p className="mt-1 text-xs text-muted-foreground">Paid ₹{(purchase.amountPaise / 100).toFixed(2)} · {new Date(purchase.paidAt).toLocaleDateString()}{purchase.accessExpiresAt ? ` · Access until ${new Date(purchase.accessExpiresAt).toLocaleString()}` : " · Lifetime access"}</p></div><div className="flex gap-2"><Link href={`/blog/${purchase.slug}`} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:border-primary">View <ArrowUpRight size={14} /></Link><a href={`/api/account/purchases/${purchase.id}/invoice`} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:border-primary"><ReceiptText size={14} /> Invoice / receipt</a></div></article>)}</div>}</div>;
}
