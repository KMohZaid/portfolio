import { NextResponse } from "next/server";
import { clearSession } from "@/lib/blog/auth";

export async function POST(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
}
