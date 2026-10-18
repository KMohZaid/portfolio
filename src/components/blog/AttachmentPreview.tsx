"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Eye } from "lucide-react";
import { TextPreview } from "./TextPreview";

const PdfReader = dynamic(() => import("@embedpdf/react-pdf-viewer").then((module) => module.PDFViewer), { ssr: false });
const FilePreviewModal = dynamic(() => import("@eternalheart/react-file-preview").then((module) => module.FilePreviewModal), { ssr: false });

type PreviewFile = { src: string; name: string; mimeType: string; size?: number };

function formatSize(size?: number) {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPreview({ file, inline = false }: { file: PreviewFile; inline?: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [actualSize, setActualSize] = useState(file.size);
  useEffect(() => {
    const localUploadId = file.src.match(/^\/api\/files\/([0-9a-f-]{36})$/i)?.[1];
    if (actualSize !== undefined || !localUploadId) return;
    const controller = new AbortController();
    fetch(file.src, { headers: { Range: "bytes=0-0" }, signal: controller.signal }).then((response) => {
      const range = response.headers.get("content-range");
      const total = range?.match(/\/(\d+)$/)?.[1];
      const value = Number(total ?? response.headers.get("content-length"));
      if (response.ok && Number.isFinite(value) && value > 0) setActualSize(value);
      void response.body?.cancel();
    }).catch(() => {});
    return () => controller.abort();
  }, [actualSize, file.src]);

  const size = formatSize(actualSize);
  const isPdf = file.mimeType === "application/pdf";
  const sourceUrl = typeof window === "undefined" ? file.src : new URL(file.src, window.location.href).toString();
  const previewUrl = isPdf && typeof window !== "undefined" && new URL(sourceUrl).origin !== window.location.origin
    ? `/api/files/proxy?url=${encodeURIComponent(sourceUrl)}`
    : sourceUrl;
  const previewFile = { name: file.name, type: file.mimeType, url: previewUrl, size: actualSize };
  const isText = file.mimeType.startsWith("text/") || /\.(gitignore|txt|md|csv|json|ya?ml|xml|py|js|ts|tsx|jsx|css|html|sh|sql)$/i.test(file.name);

  return <section className="attachment-inline-preview">
    <header className="attachment-card">
      <div className="attachment-card-info"><strong title={file.name}>{file.name}</strong><span>{[file.mimeType, size].filter(Boolean).join(" · ")}</span></div>
      <div className="attachment-card-actions">
        <button type="button" onClick={() => setModalOpen(true)} className="attachment-button"><Eye size={16} /> Preview</button>
        <a href={file.src} download={file.name} className="attachment-button"><Download size={16} /> Download{size ? ` · ${size}` : ""}</a>
      </div>
    </header>
    {inline && <div className="attachment-inline-content">
      {isPdf
        ? <div className="attachment-pdf-content"><FilePreviewEmbedInline file={previewFile} /></div>
        : isText
          ? <TextPreview src={file.src} filename={file.name} />
          : <FilePreviewEmbedInline file={previewFile} />}
    </div>}
    {!inline && <FilePreviewModal files={[previewFile]} currentIndex={0} isOpen={modalOpen} onClose={() => setModalOpen(false)} locale="en-US" theme="dark" shouldFetchAsBlob={() => new URL(file.src, window.location.href).origin !== window.location.origin} onDownload={() => { window.location.assign(file.src); }} />}
  </section>;
}

function FilePreviewEmbedInline({ file }: { file: { name: string; type: string; url: string; size?: number } }) {
  return <FilePreviewEmbed files={[file]} currentIndex={0} width="100%" height={560} locale="en-US" theme="dark" showDownload={false} showNavigation={false} />;
}

const FilePreviewEmbed = dynamic(
  () => import("@eternalheart/react-file-preview").then((module) => module.FilePreviewEmbed),
  { ssr: false },
);

export function FileEmbedPreview({ file, display }: { file: PreviewFile; display: "link" | "download" | "preview" | "inline" }) {
  if (display === "link") return <a href={file.src} className="file-embed-name">{file.name}</a>;
  if (display === "download") return <a href={file.src} download={file.name} className="attachment-button"><Download size={16} /> {file.name}</a>;
  if (display === "inline") return <AttachmentPreview file={file} inline />;
  return <AttachmentPreview file={file} />;
}
