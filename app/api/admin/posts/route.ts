import { NextResponse } from "next/server";
import type { JSONContent } from "@domternal/core";
import { requireAdmin } from "@/lib/blog/auth";
import { listPosts, savePost, slugInUse } from "@/lib/blog/posts";
import { postSchema } from "@/lib/blog/validation";

export async function GET() {
  try { await requireAdmin(); return NextResponse.json({ posts: await listPosts(true) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message !== "Unauthorized" ? error.message : "Unauthorized" }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (!request.headers.get("content-type")?.includes("application/json")) return NextResponse.json({ error: "Expected application/json." }, { status: 415 });
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post" }, { status: 400 });
    if (await slugInUse(parsed.data.slug)) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    const now = new Date().toISOString();
    const post = await savePost({ ...parsed.data, content: parsed.data.content as JSONContent, createdAt: now, updatedAt: now, publishedAt: parsed.data.status === "published" ? (parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : now) : undefined });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to save post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
