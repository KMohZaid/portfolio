import { NextResponse } from "next/server";
import { auth } from "@/lib/blog/better-auth";

export async function POST(request: Request) {
  await auth.api.signOut({ headers: request.headers });
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
