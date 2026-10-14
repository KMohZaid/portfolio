import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { addUpload, listUploads, markUploadRemoved, MAX_UPLOAD_BYTES } from "@/lib/blog/uploads";

export const runtime = "nodejs";

export async function GET() {
  try { await requireAdmin(); return NextResponse.json({ uploads: await listUploads(), maxBytes: MAX_UPLOAD_BYTES, cleanup: "Graph.org does not offer a public list/delete API; this is a local upload index." }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to load uploads." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    if (!image.type.startsWith("image/")) return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    if (image.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Image must be smaller than 4.7 MB (under Graph.org's 5 MiB cap)." }, { status: 413 });
    const body = new FormData();
    body.append("file", image, image.name);
    let response: Response;
    try { response = await fetch("https://graph.org/upload", { method: "POST", body, signal: AbortSignal.timeout(20_000) }); }
    catch { return NextResponse.json({ error: "Graph.org image upload is unreachable from this server. Insert an image URL instead or try again later." }, { status: 502 }); }
    if (!response.ok) return NextResponse.json({ error: `Graph.org rejected the upload (HTTP ${response.status}). Use an external image URL if this continues.` }, { status: 502 });
    let payload: unknown;
    try { payload = await response.json(); } catch { return NextResponse.json({ error: "Graph.org returned an unexpected response. Use an external image URL." }, { status: 502 }); }
    const path = Array.isArray(payload) && payload[0] && typeof payload[0].src === "string" ? payload[0].src : null;
    if (!path || !path.startsWith("/file/")) return NextResponse.json({ error: "Graph.org did not return a usable image path. Use an external image URL." }, { status: 502 });
    const url = `https://graph.org${path}`;
    const upload = await addUpload({ url, filename: image.name.slice(0, 200), size: image.size, createdAt: new Date().toISOString() });
    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to upload image. Check the database configuration and try again." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}

export async function DELETE(request: Request) {
  try { await requireAdmin(); const { id } = await request.json(); return await markUploadRemoved(String(id)) ? NextResponse.json({ ok: true, note: "Removed from this site's index only. Graph.org does not expose remote file deletion." }) : NextResponse.json({ error: "Indexed upload not found" }, { status: 404 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to update the upload index." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 }); }
}
