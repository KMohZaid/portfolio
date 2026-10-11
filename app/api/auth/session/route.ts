import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/blog/auth";

export async function GET() {
  return NextResponse.json({ authenticated: Boolean(await getAdminEmail()) }, { headers: { "Cache-Control": "no-store" } });
}
