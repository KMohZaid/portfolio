import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { allowedEmails, consumeLoginToken, createSession } from "@/lib/blog/auth";
import { trustedRequestOrigin } from "@/lib/blog/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!/^\d{6}$/.test(code) || !allowedEmails().includes(email)) {
      return NextResponse.json({ error: "That code is invalid or expired. Request a new code." }, { status: 400 });
    }

    const { getSupabase } = await import("@/lib/blog/db");
    const key = createHash("sha256").update(`verify:${email}`).digest("hex");
    const { data: allowed, error: rateError } = await getSupabase().rpc("claim_blog_login_rate_limit", {
      p_key: key,
      p_now: new Date().toISOString(),
      p_next_allowed_at: new Date(Date.now() + 10_000).toISOString(),
    });
    if (rateError) throw rateError;
    if (!allowed) return NextResponse.json({ error: "Please wait before trying another code." }, { status: 429 });
    if (!(await consumeLoginToken(email, code))) {
      return NextResponse.json({ error: "That code is invalid or expired. Request a new code." }, { status: 400 });
    }

    await createSession(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify sign-in." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const origin = trustedRequestOrigin(request);
    return NextResponse.redirect(new URL(`/admin/login${url.search}`, origin));
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", url.origin));
  }
}
