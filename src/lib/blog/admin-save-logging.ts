import { randomUUID } from "node:crypto";
import type { ZodError } from "zod";

export function createSaveLogger(operation: "create" | "update", postId?: string) {
  const requestId = randomUUID();
  const startedAt = Date.now();

  function log(event: string, details: Record<string, unknown> = {}) {
    console.info(JSON.stringify({
      scope: "admin-post-save",
      requestId,
      operation,
      postId,
      event,
      elapsedMs: Date.now() - startedAt,
      ...details,
    }));
  }

  function received(payload: unknown) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      log("request-received", { payloadType: Array.isArray(payload) ? "array" : typeof payload });
      return;
    }
    const body = payload as Record<string, unknown>;
    const content = body.content && typeof body.content === "object" ? body.content as Record<string, unknown> : null;
    const nodes = Array.isArray(content?.content) ? content.content : [];
    log("request-received", {
      fields: Object.keys(body).sort(),
      titleLength: typeof body.title === "string" ? body.title.length : null,
      slugLength: typeof body.slug === "string" ? body.slug.length : null,
      tagCount: Array.isArray(body.tags) ? body.tags.length : null,
      status: typeof body.status === "string" ? body.status : null,
      contentType: content?.type ?? null,
      contentNodeCount: nodes.length,
      contentNodeTypes: [...new Set(nodes.flatMap((node) => node && typeof node === "object" && "type" in node && typeof node.type === "string" ? [node.type] : []))].sort(),
      contentJsonBytes: content ? Buffer.byteLength(JSON.stringify(content)) : null,
    });
  }

  function validationFailed(error: ZodError) {
    log("validation-failed", {
      issueCount: error.issues.length,
      issues: error.issues.map(({ code, path, message }) => ({ code, path: path.map(String), message })),
    });
  }

  function failed(stage: string, error: unknown) {
    const value = error instanceof Error ? error : new Error(String(error));
    console.error(JSON.stringify({
      scope: "admin-post-save",
      requestId,
      operation,
      postId,
      event: "operation-failed",
      stage,
      elapsedMs: Date.now() - startedAt,
      errorName: value.name,
      errorMessage: value.message,
      stack: value.stack,
    }));
  }

  return { requestId, log, received, validationFailed, failed };
}
