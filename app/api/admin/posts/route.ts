import { NextResponse } from "next/server";
import type { JSONContent } from "@domternal/core";
import { requireAdmin } from "@/lib/blog/auth";
import { listPosts, savePost, slugInUse } from "@/lib/blog/posts";
import { postSchema } from "@/lib/blog/validation";
import { createSaveLogger } from "@/lib/blog/admin-save-logging";

export async function GET() {
  try { await requireAdmin(); return NextResponse.json({ posts: await listPosts(true) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message !== "Unauthorized" ? error.message : "Unauthorized" }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function POST(request: Request) {
  const logger = createSaveLogger("create");
  let stage = "authorize";
  try {
    await requireAdmin();
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
    stage = "check-slug";
    if (await slugInUse(parsed.data.slug)) {
      logger.log("operation-conflict", { stage, reason: "slug-already-in-use", slug: parsed.data.slug });
      return NextResponse.json({ error: "That slug is already in use.", requestId: logger.requestId }, { status: 409 });
    }
    stage = "persist-post";
    const now = new Date().toISOString();
    const post = await savePost({ ...parsed.data, content: parsed.data.content as JSONContent, createdAt: now, updatedAt: now, publishedAt: parsed.data.status === "published" ? (parsed.data.publishDateMode === "custom" ? parsed.data.publishedAt ?? now : now) : undefined });
    logger.log("operation-succeeded", { stage, slug: post.slug, status: post.status });
    return NextResponse.json({ post, requestId: logger.requestId }, { status: 201 });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    logger.failed(stage, error);
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to save post.", requestId: logger.requestId }, { status: unauthorized ? 401 : 503 });
  }
}
