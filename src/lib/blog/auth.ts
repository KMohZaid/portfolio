import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query, withTransaction } from "./db";

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
  const codeHash = await tokenHash(code);
  await query("INSERT INTO blog_login_tokens (jti,email,code_hash,expires_at) VALUES ($1,$2,$3,now()+interval '5 minutes')", [randomUUID(), email, codeHash]);
}

export async function consumeLoginToken(email: string, code: string) {
  const codeHash = await tokenHash(code);
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ jti: string; code_hash: string; attempts: number }>("SELECT jti,code_hash,attempts FROM blog_login_tokens WHERE email=$1 AND expires_at>now() ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [email]);
    const token = rows[0];
    if (!token || token.attempts >= 5) return false;
    if (token.code_hash !== codeHash) {
      await client.query("UPDATE blog_login_tokens SET attempts=attempts+1 WHERE jti=$1", [token.jti]);
      return false;
    }
    await client.query("DELETE FROM blog_login_tokens WHERE jti=$1", [token.jti]);
    return true;
  });
}

export async function claimLoginRateLimit(key: string, cooldownMs: number) {
  const { rows } = await query<{ allowed: boolean }>(`INSERT INTO blog_login_rate_limits AS current(key,next_allowed_at,requests) VALUES($1,now()+($2::int * interval '1 millisecond'),1) ON CONFLICT(key) DO UPDATE SET next_allowed_at=now()+($2::int * interval '1 millisecond'),requests=current.requests+1 WHERE current.next_allowed_at<=now() RETURNING true AS allowed`, [key, cooldownMs]);
  return rows.length > 0;
}

export async function createSession(email: string) {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await query("INSERT INTO blog_admin_sessions (jti,email,expires_at) VALUES ($1,$2,$3)", [jti, email, expiresAt]);
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
    const { rows } = await query("SELECT 1 FROM blog_admin_sessions WHERE jti=$1 AND email=$2 AND expires_at>now()", [payload.jti, email]);
    return rows.length ? email : null;
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
      if (typeof payload.jti === "string") await query("DELETE FROM blog_admin_sessions WHERE jti=$1", [payload.jti]);
    } catch { /* always clear even if the session record has expired */ }
  }
  store.delete(COOKIE);
}
