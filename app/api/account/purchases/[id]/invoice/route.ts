import { NextResponse } from "next/server";
import { getSignedInUser } from "@/lib/blog/auth";
import { query } from "@/lib/blog/db";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSignedInUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const { rows } = await query<{ id: string; title: string; slug: string; amount_paise: number; currency: string; paid_at: Date | string; user_email: string; razorpay_payment_id: string }>(`SELECT bp.id,b.title,b.slug,bp.amount_paise,bp.currency,bp.paid_at,bp.user_email,bp.razorpay_payment_id
      FROM blog_purchases bp JOIN blog_posts b ON b.id=bp.post_id
      WHERE bp.id=$1 AND bp.user_id=$2 AND bp.status='paid' LIMIT 1`, [id, user.id]);
    const purchase = rows[0];
    if (!purchase) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(purchase.id)}</title><style>body{font:16px system-ui,sans-serif;max-width:700px;margin:4rem auto;padding:0 1.5rem;color:#171717}h1{font-size:1.5rem}dl{display:grid;grid-template-columns:12rem 1fr;gap:.8rem}dt{color:#666}.amount{font-size:1.5rem;font-weight:700}@media print{button{display:none}}</style></head><body><h1>Payment receipt</h1><p>Receipt ID: ${escapeHtml(purchase.id)}</p><dl><dt>Article</dt><dd>${escapeHtml(purchase.title)}</dd><dt>Buyer</dt><dd>${escapeHtml(purchase.user_email)}</dd><dt>Payment ID</dt><dd>${escapeHtml(purchase.razorpay_payment_id)}</dd><dt>Paid at</dt><dd>${escapeHtml(new Date(purchase.paid_at).toLocaleString("en-IN", { timeZone: "UTC" }))} UTC</dd></dl><p class="amount">${escapeHtml(purchase.currency)} ${(Number(purchase.amount_paise) / 100).toFixed(2)}</p><button onclick="window.print()">Print / Save as PDF</button></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="receipt-${purchase.id}.html"`, "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to create receipt." }, { status: 503 }); }
}
