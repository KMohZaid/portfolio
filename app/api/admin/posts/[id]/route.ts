import { NextResponse } from "next/server";
import type { JSONContent } from "@domternal/core";
import { requireAdmin } from "@/lib/blog/auth";
import { deletePost, discardPostDraft, getPostById, promoteWorkingDraft, savePost, saveWorkingDraft, slugInUse } from "@/lib/blog/posts";
import { postSchema } from "@/lib/blog/validation";
import { createSaveLogger } from "@/lib/blog/admin-save-logging";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let logger = createSaveLogger("update");
  let stage = "authorize";
  try {
    await requireAdmin();
    stage = "resolve-post";
    const { id } = await params;
    logger = createSaveLogger("update", id);
    stage = "read-request";
    const contentType = request.headers.get("content-type") ?? "";
    logger.log("request-started", { contentType });
    if (!contentType.includes("application/json")) {
      logger.log("request-rejected", { stage, reason: "unsupported-content-type", contentType });
      return NextResponse.json({ error: "Expected application/json.", requestId: logger.requestId }, { status: 415 });
    }
    let body: unknown;
    try { body = await request.json(); } catch {
      logger.log("request-rejected", { stage, reason: "invalid-json" });
      return NextResponse.json({ error: "Invalid JSON request body.", requestId: logger.requestId }, { status: 400 });
    }
    logger.received(body);
    stage = "validate-request";
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      logger.validationFailed(parsed.error);
      const issue = parsed.error.issues[0];
      const field = issue?.path.length ? `${issue.path.map(String).join(".")}: ` : "";
      return NextResponse.json({ error: `${field}${issue?.message ?? "Invalid post"}`, requestId: logger.requestId }, { status: 400 });
    }
    logger.log("validation-passed", { normalizedTagCount: parsed.data.tags.length, status: parsed.data.status, visibility: parsed.data.visibility });
    stage = "load-existing-post";
    const old = /^[0-9a-f-]{36}$/i.test(id) ? await getPostById(id) : null;
    if (!old) {
      logger.log("operation-rejected", { stage, reason: "post-not-found" });
      return NextResponse.json({ error: "Post not found", requestId: logger.requestId }, { status: 404 });
    }
    stage = "check-slug";
    if (await slugInUse(parsed.data.slug, id)) {
      logger.log("operation-conflict", { stage, reason: "slug-already-in-use", slug: parsed.data.slug });
      return NextResponse.json({ error: "That slug is already in use.", requestId: logger.requestId }, { status: 409 });
    }
    const now = new Date().toISOString();
    stage = "save-working-draft";
    if (old.status === "published" && parsed.data.status === "draft" && !parsed.data.unpublish) {
      const post = await saveWorkingDraft(id, { ...parsed.data, content: parsed.data.content as JSONContent, updatedAt: now });
      logger.log("operation-succeeded", { stage, slug: post.slug, status: post.status, draft: true });
      return NextResponse.json({ post, draft: true, requestId: logger.requestId });
    }
    if (old.status === "published" && parsed.data.unpublish) {
      stage = "unpublish-post";
      const post = await savePost({ ...parsed.data, status: "draft", content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: null }, id);
      await discardPostDraft(id);
      logger.log("operation-succeeded", { stage, slug: post.slug, status: post.status, unpublished: true });
      return NextResponse.json({ post, unpublished: true, requestId: logger.requestId });
    }
    if (old.status === "published" && parsed.data.status === "published") {
      stage = "promote-working-draft";
      const draft = await promoteWorkingDraft(id, { ...parsed.data, content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: parsed.data.publishDateMode === "now" ? now : parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : old.publishedAt ?? now });
      if (draft) {
        logger.log("operation-succeeded", { stage, slug: draft.slug, status: draft.status, promotedDraft: true });
        return NextResponse.json({ post: draft, requestId: logger.requestId });
      }
    }
    stage = "persist-post";
    const post = await savePost({ ...parsed.data, content: parsed.data.content as JSONContent, createdAt: old.createdAt, updatedAt: now, publishedAt: parsed.data.status === "published" ? (parsed.data.publishDateMode === "now" ? now : parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : old.publishedAt ?? now) : undefined }, id);
    logger.log("operation-succeeded", { stage, slug: post.slug, status: post.status });
    return NextResponse.json({ post, requestId: logger.requestId });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    logger.failed(stage, error);
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to update post.", requestId: logger.requestId }, { status: unauthorized ? 401 : 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); const { id } = await params; if (new URL(request.url).searchParams.get("draft") === "true") return await discardPostDraft(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Draft not found" }, { status: 404 }); return await deletePost(id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Post not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to delete post." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
