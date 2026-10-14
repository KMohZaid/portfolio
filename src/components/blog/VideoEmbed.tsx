"use client";

import { useState } from "react";
import { Node, type JSONContent } from "@domternal/core";
import { useCurrentEditor } from "@domternal/react";

const videoHosts = new Set(["youtu.be", "youtube.com", "www.youtube.com", "vimeo.com", "www.vimeo.com"]);

function normalizeVideoUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !videoHosts.has(url.hostname)) return null;
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null;
      return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.pathname.startsWith("/video/")) {
      const id = url.pathname.split("/")[2];
      return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    const vimeoId = url.pathname.split("/").filter(Boolean)[0];
    return vimeoId && /^\d+$/.test(vimeoId) ? `https://player.vimeo.com/video/${vimeoId}` : null;
  } catch { return null; }
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() { return { src: { default: "" }, title: { default: "" } }; },
  parseHTML() { return [{ tag: "div[data-video-embed]", getAttrs: (element) => ({ src: (element as HTMLElement).getAttribute("data-src") ?? "", title: (element as HTMLElement).getAttribute("data-title") ?? "" }) }]; },
  renderHTML({ node }) { return ["div", { "data-video-embed": "", "data-src": node.attrs.src, "data-title": node.attrs.title, class: "video-embed-preview" }, ["iframe", { src: node.attrs.src, title: node.attrs.title || "Embedded video", loading: "lazy", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", referrerpolicy: "strict-origin-when-cross-origin", allowfullscreen: "true" }]]; },
});

export function VideoEmbedInserter() {
  const { editor } = useCurrentEditor();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  function insertVideo() {
    const src = normalizeVideoUrl(url);
    if (!src) { setError("Enter a supported YouTube or Vimeo video URL over HTTPS."); return; }
    editor?.commands.insertContent({ type: "videoEmbed", attrs: { src, title: "Embedded video demo" } } satisfies JSONContent);
    setUrl(""); setError("");
  }
  return <div contentEditable={false} className="border-t border-border p-3"><div className="flex flex-wrap gap-2"><input aria-label="YouTube or Vimeo video URL" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://youtu.be/… or Vimeo URL" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" /><button type="button" onClick={insertVideo} className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary">Insert video embed</button></div>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}<p className="mt-2 text-xs text-muted-foreground">Embeds YouTube or Vimeo players only. Video uploads are not supported.</p></div>;
}
