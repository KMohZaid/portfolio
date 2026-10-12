import { NextResponse } from "next/server";
import { auth } from "@/lib/blog/better-auth";

export async function POST(request: Request) {
  await auth.api.signOut({ headers: request.headers });

  const configuredOrigin = process.env.BETTER_AUTH_URL || process.env.APP_URL;
  const allowedOrigins = new Set([
    ...((process.env.BETTER_AUTH_TRUSTED_ORIGINS || configuredOrigin || "").split(",").map((origin) => origin.trim()).filter(Boolean)),
    ...(configuredOrigin ? [configuredOrigin] : []),
  ].flatMap((origin) => {
    try { return [new URL(origin).origin]; } catch { return []; }
  }));

  let redirectOrigin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
  const referrer = request.headers.get("referer");
  if (referrer) {
    try {
      const referrerOrigin = new URL(referrer).origin;
      if (allowedOrigins.has(referrerOrigin)) redirectOrigin = referrerOrigin;
    } catch { /* use the configured canonical origin */ }
  }

  return NextResponse.redirect(new URL("/admin/login", redirectOrigin), { status: 303 });
}
