import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { getAdminSalesStats } from "@/lib/blog/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const period = new URL(request.url).searchParams.get("period") ?? undefined;
    const stats = await getAdminSalesStats(period);
    return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to load sales analytics." }, { status: unauthorized ? 401 : 503, headers: { "Cache-Control": "no-store" } });
  }
}
