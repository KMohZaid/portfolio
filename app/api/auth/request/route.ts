import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { allowedEmails, createLoginToken } from "@/lib/blog/auth";
import { sendLoginCode } from "@/lib/blog/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const genericResponse = () => NextResponse.json({ message: "If this address is authorized, a sign-in link will be sent." });
    if (!allowedEmails().includes(email)) return genericResponse();
    const throttleKey = createHash("sha256").update(email).digest("hex");
    const db = await (await import("@/lib/blog/db")).getDb();
    const limits = db.collection("blog_login_rate_limits");
    const now = new Date();
    const existing = await limits.findOne({ key: throttleKey });
    if (existing) {
      if (new Date(existing.nextAllowedAt) > now) return genericResponse();
      await limits.updateOne({ key: throttleKey }, { $set: { nextAllowedAt: new Date(Date.now() + 60_000) }, $inc: { requests: 1 } });
    } else {
      try { await limits.insertOne({ key: throttleKey, nextAllowedAt: new Date(Date.now() + 60_000), requests: 1 }); }
      catch { return genericResponse(); }
    }
    const token = await createLoginToken(email);
    try { await sendLoginCode(email, token); } catch (error) {
      const { jwtVerify } = await import("jose");
      const secret = process.env.AUTH_SECRET;
      if (secret) { try { const { payload } = await jwtVerify(token, new TextEncoder().encode(secret)); if (typeof payload.jti === "string") await (await import("@/lib/blog/db")).getDb().then((db) => db.collection("blog_login_tokens").deleteOne({ jti: payload.jti })); } catch { /* token expires naturally if cleanup is unavailable */ } }
      throw error;
    }
    return NextResponse.json({ message: "If this address is authorized, a sign-in link will be sent." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to request sign-in." }, { status: 503 });
  }
}
