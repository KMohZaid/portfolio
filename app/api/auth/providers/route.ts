import { NextResponse } from "next/server";
import { configuredProviders } from "@/lib/blog/better-auth";

export async function GET() {
  return NextResponse.json(configuredProviders, { headers: { "Cache-Control": "no-store" } });
}
