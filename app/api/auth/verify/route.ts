import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { allowedEmails, consumeLoginToken, createSession } from "@/lib/blog/auth";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  try {
    if (!token) throw new Error("Missing token");
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("Authentication is not configured.");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (payload.purpose !== "login" || typeof payload.jti !== "string" || !allowedEmails().includes(email) || !(await consumeLoginToken(payload.jti, email))) throw new Error("Not authorized");
    await createSession(email);
    return NextResponse.redirect(new URL("/admin", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }
}
