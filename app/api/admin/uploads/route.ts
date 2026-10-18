import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { addUpload, listUploads, markUploadRemoved, MAX_UPLOAD_BYTES } from "@/lib/blog/uploads";
import { query } from "@/lib/blog/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const uploads = await listUploads();
    const { rows } = await query<{ title: string; content: string; thumbnail: string | null }>("SELECT title, content::text AS content, thumbnail FROM blog_posts UNION ALL SELECT posts.title, drafts.content::text AS content, drafts.thumbnail FROM blog_post_drafts drafts JOIN blog_posts posts ON posts.id=drafts.post_id");
    const references = new Map<string, string[]>();
    for (const upload of uploads) for (const row of rows) if (row.content.includes(upload.url) || row.thumbnail === upload.url) references.set(upload.url, [...(references.get(upload.url) ?? []), row.title]);
    const all = new URL(request.url).searchParams.get("all") === "1";
    const annotated = uploads.map((upload) => ({ ...upload, usedIn: references.get(upload.url) ?? [] }));
    return NextResponse.json({ uploads: all ? annotated : annotated.filter((upload) => upload.usedIn.length === 0), maxBytes: MAX_UPLOAD_BYTES, cleanup: "Unlisting removes public access through this proxy; it does not delete the Telegram message." });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to load uploads." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireAdmin();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_UPLOAD_CHAT_ID;
    if (!token || !chatId) return NextResponse.json({ error: "Telegram uploads are not configured on the server.", requestId }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file") ?? form.get("image");
    const kind = form.get("kind");
    if (kind !== null && !["image", "video", "file", "document"].includes(String(kind))) return NextResponse.json({ error: "Upload kind is invalid." }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (kind === "image" && !file.type.startsWith("image/")) return NextResponse.json({ error: "Choose an image file." }, { status: 415 });
    if (kind === "video" && !file.type.startsWith("video/")) return NextResponse.json({ error: "Choose a video file." }, { status: 415 });
    if (file.size === 0) return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Files must be 20 MB or smaller." }, { status: 413 });

    const body = new FormData();
    body.set("chat_id", chatId);
    const method = kind === "image" ? "sendPhoto" : kind === "video" ? "sendVideo" : "sendDocument";
    body.set(method === "sendPhoto" ? "photo" : method === "sendVideo" ? "video" : "document", file, file.name || "upload");
    console.info(`[blog-upload] telegram ${method}`, { requestId, bytes: file.size, mimeType: file.type || "application/octet-stream" });
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", body, signal: AbortSignal.timeout(60_000) });
    const responseText = await telegramResponse.text();
    let telegramPayload: { ok?: boolean; description?: string; result?: { document?: { file_id?: string; file_unique_id?: string; file_size?: number; mime_type?: string; file_name?: string }; photo?: Array<{ file_id?: string; file_unique_id?: string; file_size?: number; width?: number; height?: number }>; video?: { file_id?: string; file_unique_id?: string; file_size?: number; mime_type?: string; file_name?: string } } } | null = null;
    try { telegramPayload = JSON.parse(responseText); } catch {
      console.error(`[blog-upload] telegram ${method} invalid response`, { requestId, status: telegramResponse.status, contentType: telegramResponse.headers.get("content-type") ?? "unknown", responseBytes: Buffer.byteLength(responseText) });
      return NextResponse.json({ error: "Telegram returned an unexpected response while storing this file.", requestId }, { status: 502 });
    }
    const mediaKind = kind === "image" || kind === "video" ? kind : "file";
    const returnedMedia = mediaKind === "image" ? telegramPayload?.result?.photo?.at(-1) : mediaKind === "video" ? telegramPayload?.result?.video : telegramPayload?.result?.document;
    if (!telegramResponse.ok || !telegramPayload?.ok || !returnedMedia?.file_id || !returnedMedia.file_unique_id) {
      console.error(`[blog-upload] telegram ${method} failed`, { requestId, status: telegramResponse.status, description: telegramPayload?.description ?? "unexpected Telegram response" });
      return NextResponse.json({ error: `Telegram rejected the upload: ${telegramPayload?.description ?? `HTTP ${telegramResponse.status}`}.`, requestId }, { status: 502 });
    }

    if (!returnedMedia?.file_id || !returnedMedia.file_unique_id) throw new Error("Telegram upload did not return a file ID.");
    const returnedName = "file_name" in returnedMedia ? returnedMedia.file_name : undefined;
    const upload = await addUpload({ filename: returnedName || file.name.slice(0, 200) || "download", size: returnedMedia.file_size ?? file.size, createdAt: new Date().toISOString(), telegramFileId: returnedMedia.file_id, telegramFileUniqueId: returnedMedia.file_unique_id, mimeType: ("mime_type" in returnedMedia ? returnedMedia.mime_type : undefined) || file.type || "application/octet-stream" });
    console.info("[blog-upload] telegram indexed", { requestId, uploadId: upload._id, bytes: upload.size });
    return NextResponse.json({ upload, requestId }, { status: 201 });
  } catch (error) {
    console.error("[blog-upload] failed", { requestId, message: error instanceof Error ? error.message : "unknown error" });
    return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to upload file. Check the database and Telegram configuration.", requestId }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 });
  }
}

export async function DELETE(request: Request) {
  try { await requireAdmin(); const { id } = await request.json(); return await markUploadRemoved(String(id)) ? NextResponse.json({ ok: true, note: "Removed from public proxy access. The Telegram message remains stored." }) : NextResponse.json({ error: "Indexed upload not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to update the upload index." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
