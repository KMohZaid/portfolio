import { NextResponse } from "next/server";
import type { JSONContent } from "@domternal/core";
import { requireAdmin } from "@/lib/blog/auth";
import { deletePost, getPostById, savePost, slugInUse } from "@/lib/blog/posts";
import { postSchema } from "@/lib/blog/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post" }, { status: 400 });
    const old = /^[0-9a-f-]{36}$/i.test(id) ? await getPostById(id) : null;
    if (!old) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (await slugInUse(parsed.data.slug, id)) return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    const now = new Date().toISOString();
    const post = await savePost({ ...parsed.data, visibility: parsed.data.status === "published" ? parsed.data.visibility : "hidden", content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: parsed.data.status === "published" ? old.publishedAt ?? now : undefined }, id);
    return NextResponse.json({ post });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to update post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); const { id } = await params; return await deletePost(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Post not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to delete post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
