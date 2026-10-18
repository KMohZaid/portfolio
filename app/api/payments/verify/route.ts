import { NextResponse } from "next/server";
import { getSignedInUser } from "@/lib/blog/auth";
import { query, withTransaction } from "@/lib/blog/db";
import { razorpayCredentials, verifyCheckoutSignature } from "@/lib/blog/payments";

export async function POST(request: Request) {
  const user = await getSignedInUser();
  if (!user) return NextResponse.json({ error: "Sign in to verify payment." }, { status: 401 });
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected application/json." }, { status: 415 });
    const body = await request.json();
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;
    if ([orderId, paymentId, signature].some((value) => typeof value !== "string" || value.length > 255)) return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
    const { rows } = await query<{ post_id: string; amount_paise: number; status: string; razorpay_payment_id: string | null }>("SELECT post_id, amount_paise, status, razorpay_payment_id FROM blog_purchases WHERE razorpay_order_id=$1 AND user_id=$2 LIMIT 1", [orderId, user.id]);
    const order = rows[0];
    if (!order) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    if (!verifyCheckoutSignature(orderId, paymentId, signature)) return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
    if (order.status === "paid") return order.razorpay_payment_id === paymentId ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Payment is already linked to another transaction." }, { status: 409 });
    const { keyId, keySecret } = razorpayCredentials();
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
      cache: "no-store",
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || payment.order_id !== orderId || payment.status !== "captured" || Number(payment.amount) !== Number(order.amount_paise) || payment.currency !== "INR") {
      return NextResponse.json({ error: "Payment is not captured or does not match this order." }, { status: 409 });
    }
    await withTransaction(async (client) => {
      const updated = await client.query(`UPDATE blog_purchases SET razorpay_payment_id=$1,status='paid',paid_at=now(),
        access_expires_at=CASE WHEN access_duration_seconds IS NULL THEN NULL ELSE now() + access_duration_seconds * interval '1 second' END
        WHERE razorpay_order_id=$2 AND user_id=$3 AND status='created' AND (razorpay_payment_id IS NULL OR razorpay_payment_id=$1)`, [paymentId, orderId, user.id]);
      if (!updated.rowCount) {
        const existing = await client.query("SELECT 1 FROM blog_purchases WHERE razorpay_order_id=$1 AND user_id=$2 AND status='paid' AND razorpay_payment_id=$3", [orderId, user.id, paymentId]);
        if (!existing.rowCount) throw new Error("Payment already linked to another transaction.");
      }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment. If your bank was charged, contact support." }, { status: 503 });
  }
}
