import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { withTransaction } from "@/lib/blog/db";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  if (!/^[a-f0-9]{64}$/i.test(signature)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  const received = Buffer.from(signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(expected, received)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string } } } };
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!eventId) return NextResponse.json({ error: "Missing event ID." }, { status: 400 });
  if (event.event !== "payment.captured") return NextResponse.json({ ok: true });
  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id || payment.status !== "captured" || payment.currency !== "INR") return NextResponse.json({ error: "Invalid captured payment." }, { status: 400 });
  try {
    await withTransaction(async (client) => {
      const seen = await client.query("INSERT INTO blog_payment_webhook_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id", [eventId]);
      if (!seen.rowCount) return;
      await client.query(`UPDATE blog_purchases SET razorpay_payment_id=$1,status='paid',paid_at=coalesce(paid_at,now()),
        access_expires_at=CASE WHEN access_duration_seconds IS NULL THEN NULL ELSE coalesce(paid_at,now()) + access_duration_seconds * interval '1 second' END
        WHERE razorpay_order_id=$2 AND status='created' AND amount_paise=$3 AND currency=$4
          AND (razorpay_payment_id IS NULL OR razorpay_payment_id=$1)`, [payment.id, payment.order_id, payment.amount, payment.currency]);
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Unable to process payment event." }, { status: 500 }); }
}
