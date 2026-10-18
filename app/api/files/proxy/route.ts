import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/blog/uploads";

export const runtime = "nodejs";

function isPublicAddress(address: string) {
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    const [a, b, c] = octets;
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168) ) || (a === 192 && b === 88 && c === 99) || (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0 && c === 113));
  }
  if (version === 6) {
    const normalized = address.toLowerCase().split("%")[0];
    if (normalized.startsWith("::ffff:")) return isPublicAddress(normalized.slice(7));
    return normalized.startsWith("2") || normalized.startsWith("3");
  }
  return false;
}

async function validateRemoteUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash || url.href.length > 2048) throw new Error("Unsupported remote URL.");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new Error("Unsupported remote host.");
  if (isIP(hostname)) {
    if (!isPublicAddress(hostname)) throw new Error("Unsupported remote host.");
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error("Unsupported remote host.");
  }
  return url;
}

async function proxyPdf(request: Request) {
  const incoming = new URL(request.url);
  const requestedUrl = incoming.searchParams.get("url");
  if (!requestedUrl || requestedUrl.length > 2048) return NextResponse.json({ error: "A valid PDF URL is required." }, { status: 400 });
  const requestRange = request.headers.get("range");
  if (requestRange && !/^bytes=\d{1,12}-\d{0,12}$/.test(requestRange)) return NextResponse.json({ error: "Invalid byte range." }, { status: 416 });

  try {
    let url = await validateRemoteUrl(requestedUrl);
    let upstream: Response | undefined;
    for (let redirects = 0; redirects <= 3; redirects++) {
      upstream = await fetch(url, {
        method: request.method,
        headers: requestRange ? { Range: requestRange } : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get("location");
      if (!location || redirects === 3) throw new Error("Remote PDF redirected too many times.");
      url = await validateRemoteUrl(new URL(location, url).toString());
    }

    if (!upstream || (!upstream.ok && upstream.status !== 206 && upstream.status !== 416)) return NextResponse.json({ error: "Unable to retrieve the remote PDF." }, { status: 502 });
    const mimeType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (mimeType !== "application/pdf" && mimeType !== "application/octet-stream") return NextResponse.json({ error: "The remote resource is not a PDF." }, { status: 415 });
    const length = Number(upstream.headers.get("content-length"));
    if (Number.isFinite(length) && length > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Remote PDF exceeds the preview size limit." }, { status: 413 });

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    });
    for (const name of ["content-length", "content-range", "last-modified", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (upstream.status === 416) return new Response(null, { status: 416, headers });
    if (request.method === "HEAD") return new Response(null, { status: upstream.status === 206 ? 206 : 200, headers });
    if (!upstream.body) return NextResponse.json({ error: "Remote PDF response was empty." }, { status: 502 });

    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_UPLOAD_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "Remote PDF exceeds the preview size limit." }, { status: 413 });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    if (!headers.has("content-length")) headers.set("Content-Length", String(body.byteLength));
    return new Response(body, { status: upstream.status === 206 ? 206 : 200, headers });
  } catch (error) {
    console.warn("[blog-files] remote PDF proxy rejected or failed", { message: error instanceof Error ? error.message : "unknown error" });
    return NextResponse.json({ error: "Unable to safely retrieve the remote PDF." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  return proxyPdf(request);
}

export async function HEAD(request: Request) {
  return proxyPdf(request);
}
