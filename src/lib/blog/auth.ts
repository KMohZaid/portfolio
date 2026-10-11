import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSupabase } from "./db";

const COOKIE = "portfolio_admin";
const MAX_AGE = 60 * 60 * 24 * 7;
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("Set AUTH_SECRET to a random value of at least 32 characters.");
  return new TextEncoder().encode(value);
};

async function tokenHash(value: string) {
  const pepper = process.env.AUTH_SECRET;
  if (!pepper || pepper.length < 32) throw new Error("Set AUTH_SECRET to a random value of at least 32 characters.");
  return createHash("sha256").update(pepper).update(":").update(value).digest("hex");
}

export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function createLoginToken(email: string, code: string) {
  const { error } = await getSupabase().from("blog_login_tokens").insert({
    jti: randomUUID(),
    email,
    code_hash: await tokenHash(code),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
  if (error) throw error;
}

export async function consumeLoginToken(email: string, code: string) {
  const { data, error } = await getSupabase().rpc("consume_blog_login_code", {
    p_email: email,
    p_code_hash: await tokenHash(code),
    p_now: new Date().toISOString(),
  });
  if (error) throw error;
  return data;
}

export async function createSession(email: string) {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000).toISOString();
  const { error } = await getSupabase().from("blog_admin_sessions").insert({ jti, email, expires_at: expiresAt });
  if (error) throw error;
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
    const { data, error } = await getSupabase().from("blog_admin_sessions").select("jti")
      .eq("jti", payload.jti).eq("email", email).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error) return null;
    return data ? email : null;
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
    try {
      const { payload } = await jwtVerify(token, secret());
      if (typeof payload.jti === "string") {
        const { error } = await getSupabase().from("blog_admin_sessions").delete().eq("jti", payload.jti);
        if (error) throw error;
      }
    } catch { /* always clear even if the session record has expired */ }
  }
  store.delete(COOKIE);
}
