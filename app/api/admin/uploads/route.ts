import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { addUpload, listUploads, markUploadRemoved, MAX_UPLOAD_BYTES } from "@/lib/blog/uploads";

export const runtime = "nodejs";

export async function GET() {
  try { await requireAdmin(); return NextResponse.json({ uploads: await listUploads(), maxBytes: MAX_UPLOAD_BYTES, cleanup: "Graph.org does not offer a public list/delete API; this is a local upload index." }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to load uploads." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireAdmin();
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    if (!image.type.startsWith("image/")) return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    if (image.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image must be smaller than 4.7 MB (under Graph.org's 5 MiB cap)." }, { status: 413 });
    if (image.type === "image/svg+xml") return NextResponse.json({ error: "SVG uploads are not supported. Use PNG, JPEG, WebP, or GIF." }, { status: 415 });
    const providers = [
      { name: "graph.org", endpoint: "https://graph.org/upload" },
      { name: "telegra.ph", endpoint: "https://telegra.ph/upload" },
    ];
    let uploaded: { provider: string; path: string } | null = null;
    for (const provider of providers) {
      console.info("[blog-upload] provider attempt", { requestId, provider: provider.name, filename: image.name.slice(0, 120), bytes: image.size, contentType: image.type });
      const body = new FormData();
      body.append("file", image, image.name);
      let response: Response;
      try { response = await fetch(provider.endpoint, { method: "POST", body, signal: AbortSignal.timeout(20_000) }); }
      catch (error) {
        console.error("[blog-upload] provider request failed", { requestId, provider: provider.name, message: error instanceof Error ? error.message : "unknown error" });
        continue;
      }
      const responseText = await response.text();
      console.info("[blog-upload] provider response", { requestId, provider: provider.name, status: response.status, contentType: response.headers.get("content-type"), responsePreview: responseText.slice(0, 400) });
      if (!response.ok) continue;
      let payload: unknown;
      try { payload = JSON.parse(responseText); } catch { continue; }
      const path = Array.isArray(payload) && payload[0] && typeof payload[0].src === "string" ? payload[0].src : null;
      if (path?.startsWith("/file/")) { uploaded = { provider: provider.name, path }; break; }
    }
    if (!uploaded) return NextResponse.json({ error: "Graph.org and Telegraph rejected the image upload. Check the upload service logs and try a different image.", requestId }, { status: 502 });
    const url = `https://${uploaded.provider}${uploaded.path}`;
    const upload = await addUpload({ url, filename: image.name.slice(0, 200), size: image.size, createdAt: new Date().toISOString() });
    console.info("[blog-upload] indexed", { requestId, uploadId: upload._id, provider: uploaded.provider });
    return NextResponse.json({ upload, requestId }, { status: 201 });
  } catch (error) {
    console.error("[blog-upload] failed", { requestId, message: error instanceof Error ? error.message : "unknown error" });
    return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to upload image. Check the database configuration and try again.", requestId }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 });
  }
}

export async function DELETE(request: Request) {
  try { await requireAdmin(); const { id } = await request.json(); return await markUploadRemoved(String(id)) ? NextResponse.json({ ok: true, note: "Removed from this site's index only. Graph.org does not expose remote file deletion." }) : NextResponse.json({ error: "Indexed upload not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to update the upload index." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
