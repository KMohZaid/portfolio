import { createHash, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { allowedEmails, claimLoginRateLimit, createLoginToken } from "@/lib/blog/auth";
import { sendLoginCode, trustedRequestOrigin } from "@/lib/blog/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!allowedEmails().includes(email)) return NextResponse.json({ error: "This email address is not authorized for admin access." }, { status: 403 });
    const throttleKey = createHash("sha256").update(email).digest("hex");
    const allowed = await claimLoginRateLimit(throttleKey, 60_000);
    if (!allowed) return NextResponse.json({ message: "If this address is authorized, a sign-in code will be sent." });
    const origin = trustedRequestOrigin(request);
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await createLoginToken(email, code);
    await sendLoginCode(email, code, origin);
    return NextResponse.json({ message: "If this address is authorized, a sign-in code will be sent." });
  } catch (error) {
    const diagnostic = error instanceof Error ? error.message : "Unknown sign-in request error";
    const category = /DATABASE_URL|AUTH_SECRET|RESEND|AUTH_FROM_EMAIL|APP_URL|TRUSTED_HOSTS|trusted|origin/i.test(diagnostic) ? diagnostic.replace(/(key|secret|token|password)\s*[:=]\s*\S+/gi, "$1=[redacted]") : "External service request failed";
    console.error("[auth/request] Sign-in request failed:", category);
    return NextResponse.json({ error: "Unable to request sign-in. Check server configuration and logs." }, { status: 503 });
  }
}
