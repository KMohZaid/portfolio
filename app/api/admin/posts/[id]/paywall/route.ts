import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { getPostById } from "@/lib/blog/posts";
import { getPaywall, savePaywall } from "@/lib/blog/payments";

const validSettings = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const settings = value as Record<string, unknown>;
  return typeof settings.enabled === "boolean"
    && Number.isSafeInteger(settings.pricePaise)
    && Number(settings.pricePaise) >= 0
    && (settings.enabled ? Number(settings.pricePaise) > 0 : true)
    && (settings.accessDurationSeconds === null || (Number.isSafeInteger(settings.accessDurationSeconds) && Number(settings.accessDurationSeconds) > 0))
    && typeof settings.showExcerpt === "boolean"
    && typeof settings.showThumbnail === "boolean";
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !await getPostById(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ paywall: await getPaywall(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to load paywall settings." }, { status: unauthorized ? 401 : 503 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !await getPostById(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected application/json." }, { status: 415 });
    const body: unknown = await request.json();
    if (!validSettings(body)) return NextResponse.json({ error: "Invalid paywall settings." }, { status: 400 });
    const settings = body as Parameters<typeof savePaywall>[1];
    await savePaywall(id, settings);
    return NextResponse.json({ paywall: settings });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to save paywall settings." }, { status: unauthorized ? 401 : 503 });
  }
}
