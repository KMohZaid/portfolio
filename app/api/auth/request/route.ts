import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { allowedEmails, createLoginToken } from "@/lib/blog/auth";
import { sendLoginCode, trustedRequestOrigin } from "@/lib/blog/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const genericResponse = () => NextResponse.json({ message: "If this address is authorized, a sign-in code will be sent." });
    if (!allowedEmails().includes(email)) return genericResponse();
    const throttleKey = createHash("sha256").update(email).digest("hex");
    const { getSupabase } = await import("@/lib/blog/db");
    const { data: allowed, error: throttleError } = await getSupabase().rpc("claim_blog_login_rate_limit", {
      p_key: throttleKey,
      p_now: new Date().toISOString(),
      p_next_allowed_at: new Date(Date.now() + 60_000).toISOString(),
    });
    if (throttleError) throw throttleError;
    if (!allowed) return genericResponse();
    const origin = trustedRequestOrigin(request);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await createLoginToken(email, code);
    await sendLoginCode(email, code, origin);
    return NextResponse.json({ message: "If this address is authorized, a sign-in code will be sent." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to request sign-in." }, { status: 503 });
  }
}
