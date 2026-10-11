import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { allowedEmails, claimLoginRateLimit, consumeLoginToken, createSession } from "@/lib/blog/auth";
import { trustedRequestOrigin } from "@/lib/blog/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!/^\d{6}$/.test(code) || !allowedEmails().includes(email)) {
      return NextResponse.json({ error: "That code is invalid or expired. Request a new code." }, { status: 400 });
    }

    const key = createHash("sha256").update(`verify:${email}`).digest("hex");
    const allowed = await claimLoginRateLimit(key, 10_000);
    if (!allowed) return NextResponse.json({ error: "Please wait before trying another code." }, { status: 429 });
    if (!(await consumeLoginToken(email, code))) {
      return NextResponse.json({ error: "That code is invalid or expired. Request a new code." }, { status: 400 });
    }

    await createSession(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to verify sign-in." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const origin = trustedRequestOrigin(request);
    return NextResponse.redirect(new URL("/admin/login", origin));
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", url.origin));
  }
}
