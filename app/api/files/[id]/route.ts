import { NextResponse } from "next/server";
import { getUploadById, MAX_UPLOAD_BYTES } from "@/lib/blog/uploads";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "File not found." }, { status: 404 });
  try {
    const stored = await getUploadById(id);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!stored || !token) return NextResponse.json({ error: "File not found." }, { status: 404 });
    const { upload, telegramFileId, mimeType } = stored;
    if (upload.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Telegram file exceeds the supported download limit." }, { status: 502 });
    const fileResponse = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(telegramFileId)}`, { signal: AbortSignal.timeout(15_000) });
    if (!fileResponse.ok) return NextResponse.json({ error: "Unable to retrieve file." }, { status: 502 });
    const filePayload = await fileResponse.json().catch(() => null) as { ok?: boolean; result?: { file_path?: string } } | null;
    const filePath = filePayload?.ok ? filePayload.result?.file_path : undefined;
    if (!filePath || filePath.includes("..") || filePath.startsWith("/")) return NextResponse.json({ error: "Unable to retrieve file." }, { status: 502 });

    const range = request.headers.get("range");
    const telegramFile = await fetch(`https://api.telegram.org/file/bot${token}/${filePath.split("/").map(encodeURIComponent).join("/")}`, {
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(60_000),
    });
    if ((!telegramFile.ok && telegramFile.status !== 416) || (telegramFile.status !== 416 && !telegramFile.body)) return NextResponse.json({ error: "Unable to retrieve file." }, { status: 502 });
    const upstreamLength = telegramFile.headers.get("content-length");
    if ((upstreamLength && Number(upstreamLength) > MAX_UPLOAD_BYTES) || (!upstreamLength && upload.size > MAX_UPLOAD_BYTES)) return NextResponse.json({ error: "Telegram file exceeds the supported download limit." }, { status: 502 });
    const safeName = upload.filename.replace(/[\r\n]/g, "_").slice(0, 255) || "download";
    const filename = safeName.replace(/[^\x20-\x7e]|["\\]/g, "_").slice(0, 180) || "download";
    const inlineType = /^image\/(?:avif|gif|jpeg|png|webp)$/.test(mimeType) || mimeType === "application/pdf" || /^video\/(?:mp4|webm|ogg)$/.test(mimeType);
    const contentType = inlineType ? mimeType : "application/octet-stream";
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `${inlineType ? "inline" : "attachment"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    if (upstreamLength) headers.set("Content-Length", upstreamLength);
    const contentRange = telegramFile.headers.get("content-range");
    if (telegramFile.status === 206) {
      if (!contentRange) return NextResponse.json({ error: "Unable to retrieve file range." }, { status: 502 });
      headers.set("Content-Range", contentRange);
      headers.set("Accept-Ranges", "bytes");
      if (contentRange) { const total = contentRange.match(/\/(\d+)$/)?.[1]; if (total) headers.set("X-File-Size", total); }
    } else if (telegramFile.status === 416) {
      if (contentRange) headers.set("Content-Range", contentRange);
      return new Response(null, { status: 416, headers });
    } else if (!range) {
      headers.set("Content-Length", upstreamLength || String(upload.size));
    }
    return new Response(telegramFile.body, { status: telegramFile.status === 206 ? 206 : 200, headers });
  } catch (error) {
    console.error("[blog-files] proxy failed", { fileId: id, message: error instanceof Error ? error.message : "unknown error" });
    return NextResponse.json({ error: "Unable to retrieve file." }, { status: 502 });
  }
}
