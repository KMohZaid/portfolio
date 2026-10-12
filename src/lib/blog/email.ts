import { Resend } from "resend";

export function trustedRequestOrigin(request: Request): string {
  const configuredOrigin = process.env.APP_URL;
  if (configuredOrigin) return validateOrigin(configuredOrigin);

  const url = new URL(request.url);
  const requestHost = url.host.toLowerCase();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim().toLowerCase();
  const host = forwardedHost ?? requestHost;
  const allowedHosts = (process.env.TRUSTED_HOSTS ?? "localhost:3000,127.0.0.1:3000")
    .split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  if (!allowedHosts.includes(host)) throw new Error("Request host is not configured as a trusted email-link origin.");

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();
  const protocol = forwardedProto ?? url.protocol.replace(/:$/, "");
  if (protocol !== "https" && !(process.env.NODE_ENV !== "production" && protocol === "http")) {
    throw new Error("Trusted production email-link origins must use HTTPS.");
  }
  return `${protocol}://${host}`;
}

function validateOrigin(origin: string): string {
  const parsed = new URL(origin);
  const isLocalHttp = process.env.NODE_ENV !== "production" && parsed.protocol === "http:";
  if (parsed.protocol !== "https:" && !isLocalHttp) throw new Error("APP_URL must use HTTPS in production.");
  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("APP_URL must be a trusted origin without credentials, path, query, or fragment.");
  }
  return parsed.origin;
}

export async function sendLoginCode(email: string, code: string, origin: string) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_FROM_EMAIL) {
    throw new Error("Email sign-in is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL to a verified sender.");
  }
  const url = `${origin.replace(/\/$/, "")}/admin/login`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.AUTH_FROM_EMAIL, to: email, subject: "Your sign-in code", html: `<p>Your one-time code is valid for five minutes.</p><p><strong>${code}</strong></p><p><a href="${url}">Open the secure sign-in form</a>, then enter the code above. The code is not included in the link.</p><p>If you did not request this, ignore this email.</p>` });
  if (error) {
    const details = JSON.stringify(error);
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? error.statusCode : null;
    if (statusCode === 403 || /testing domain|only send|verify.*domain|domain.*verify/i.test(details)) throw new Error("Resend is still in testing mode and can only deliver to the account owner's email. Verify a domain you own and set AUTH_FROM_EMAIL to that domain, or configure ADMIN_EMAILS to the Resend account owner's address for testing.");
    throw new Error("Unable to send sign-in email. Check the Resend sender configuration.");
  }
}
