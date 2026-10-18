import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSignedInUser } from "@/lib/blog/auth";
import { withTransaction } from "@/lib/blog/db";
import { getPaywall, razorpayCredentials, userHasAccess } from "@/lib/blog/payments";
import { getPostById } from "@/lib/blog/posts";

export async function POST(request: Request) {
  const user = await getSignedInUser();
  if (!user) return NextResponse.json({ error: "Sign in to purchase this article." }, { status: 401 });
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected application/json." }, { status: 415 });
    const body = await request.json();
    const postId = body?.postId;
    if (typeof postId !== "string" || !/^[0-9a-f-]{36}$/i.test(postId)) return NextResponse.json({ error: "Invalid post." }, { status: 400 });
    const post = await getPostById(postId);
    if (!post || post.status !== "published" || post.visibility !== "public") return NextResponse.json({ error: "Article not found." }, { status: 404 });
    const paywall = await getPaywall(postId);
    if (!paywall.enabled) return NextResponse.json({ error: "This article is not for sale." }, { status: 400 });
    if (await userHasAccess(postId, user.id)) return NextResponse.json({ error: "You already have access to this article." }, { status: 409 });

    const { keyId, keySecret } = razorpayCredentials();
    const receipt = randomUUID().replaceAll("-", "");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: paywall.pricePaise, currency: "INR", receipt, notes: { postId, userId: user.id } }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || typeof result.id !== "string") return NextResponse.json({ error: "Unable to start payment. Please try again." }, { status: 502 });
    await withTransaction(async (client) => {
      await client.query(`INSERT INTO blog_purchases (post_id,user_id,user_email,razorpay_order_id,amount_paise,currency,access_duration_seconds,status)
        VALUES ($1,$2,$3,$4,$5,'INR',$6,'created')`, [postId, user.id, user.email, result.id, paywall.pricePaise, paywall.accessDurationSeconds]);
    });
    return NextResponse.json({ orderId: result.id, amount: paywall.pricePaise, currency: "INR", keyId, name: "Portfolio Blog", description: post.title }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.message === "Razorpay is not configured." ? error.message : "Unable to start payment.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
