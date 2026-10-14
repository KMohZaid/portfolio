import { NextResponse } from "next/server";
import type { JSONContent } from "@domternal/core";
import { requireAdmin } from "@/lib/blog/auth";
import { deletePost, discardPostDraft, getPostById, promoteWorkingDraft, savePost, saveWorkingDraft, slugInUse } from "@/lib/blog/posts";
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
    if (old.status === "published" && parsed.data.status === "draft" && !parsed.data.unpublish) {
      const post = await saveWorkingDraft(id, { ...parsed.data, content: parsed.data.content as JSONContent, updatedAt: now });
      return NextResponse.json({ post, draft: true });
    }
    if (old.status === "published" && parsed.data.unpublish) {
      const post = await savePost({ ...parsed.data, status: "draft", content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: null }, id);
      await discardPostDraft(id);
      return NextResponse.json({ post, unpublished: true });
    }
    if (old.status === "published" && parsed.data.status === "published") {
      const draft = await promoteWorkingDraft(id, { ...parsed.data, content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: parsed.data.publishDateMode === "now" ? now : parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : old.publishedAt ?? now });
      if (draft) return NextResponse.json({ post: draft });
    }
    const post = await savePost({ ...parsed.data, content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: parsed.data.status === "published" ? (parsed.data.publishDateMode === "now" ? now : parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : old.publishedAt ?? now) : undefined }, id);
    return NextResponse.json({ post });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to update post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); const { id } = await params; if (new URL(request.url).searchParams.get("draft") === "true") return await discardPostDraft(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Draft not found" }, { status: 404 }); return await deletePost(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Post not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to delete post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
