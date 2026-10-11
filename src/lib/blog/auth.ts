import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "./db";

const COOKIE = "portfolio_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("Set AUTH_SECRET to a random value of at least 32 characters.");
  return new TextEncoder().encode(value);
};

export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function createLoginToken(email: string) {
  const jti = randomUUID();
  await (await getDb()).collection("blog_login_tokens").insertOne({ jti, email, expiresAt: new Date(Date.now() + 10 * 60_000) });
  return new SignJWT({ email, purpose: "login" }).setProtectedHeader({ alg: "HS256" }).setJti(jti).setIssuedAt().setExpirationTime("10m").sign(secret());
}

export async function consumeLoginToken(jti: string, email: string) {
  const result = await (await getDb()).collection("blog_login_tokens").deleteOne({ jti, email, expiresAt: { $gt: new Date() } });
  return result.deletedCount === 1;
}

export async function createSession(email: string) {
  const jti = randomUUID();
  await (await getDb()).collection("blog_admin_sessions").insertOne({ jti, email, expiresAt: new Date(Date.now() + MAX_AGE * 1000) });
  const token = await new SignJWT({ email, purpose: "session" }).setProtectedHeader({ alg: "HS256" }).setJti(jti).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function getAdminEmail(): Promise<string | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (payload.purpose !== "session" || typeof payload.jti !== "string" || !allowedEmails().includes(email)) return null;
    const session = await (await getDb()).collection("blog_admin_sessions").findOne({ jti: payload.jti, email, expiresAt: { $gt: new Date() } }, { projection: { _id: 1 } });
    return session ? email : null;
  } catch { return null; }
}

export async function requireAdmin() {
  const email = await getAdminEmail();
  if (!email) throw new Error("Unauthorized");
  return email;
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    try { const { payload } = await jwtVerify(token, secret()); if (typeof payload.jti === "string") await (await getDb()).collection("blog_admin_sessions").deleteOne({ jti: payload.jti }); } catch { /* always clear even if the session record has expired */ }
  }
  store.delete(COOKIE);
}
