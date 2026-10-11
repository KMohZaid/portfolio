import { Resend } from "resend";

export async function sendLoginCode(email: string, token: string) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_FROM_EMAIL) {
    throw new Error("Email sign-in is not configured. Set RESEND_API_KEY and AUTH_FROM_EMAIL to a verified sender.");
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = `${origin.replace(/\/$/, "")}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.AUTH_FROM_EMAIL, to: email, subject: "Your sign-in link", html: `<p>Use this one-time link to sign in to the portfolio blog admin. It expires in 10 minutes.</p><p><a href="${url}">Sign in</a></p><p>If you did not request this, ignore this email.</p>` });
  if (error) throw new Error("Unable to send sign-in email. Check the Resend sender configuration.");
}
