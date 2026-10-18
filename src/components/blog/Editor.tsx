"use client";

import { useEffect, useRef, useState } from "react";
import { Domternal, useCurrentEditor } from "@domternal/react";
import { StarterKit, BubbleMenu, Extension, Node, Placeholder, Link, LinkPopover, getMarkRange, type JSONContent, type TransactionEventProps } from "@domternal/core";
import { NodeSelection, Plugin, TextSelection } from "@domternal/pm/state";
import { Fragment, Slice } from "@domternal/pm/model";
import { CodeBlockLowlight } from "@domternal/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { BlockContextMenu, BlockHandle, KeyboardReorder, SlashCommand, SmartPaste } from "@domternal/extension-block-controls";
import { Image } from "@domternal/extension-image";
import { MAX_UPLOAD_BYTES } from "@/lib/blog/upload-constants";
import { AlignCenter, AlignLeft, AlignRight, Check, Link2, LoaderCircle, Trash2, Type, Upload, X } from "lucide-react";
import { VideoEmbed } from "./VideoEmbed";
import { FileEmbed } from "./FileEmbed";
import { DomternalTheme } from "./DomternalTheme";

type Props = { initialContent: JSONContent; onChange: (content: JSONContent) => void; uploadImages: boolean };
type MediaFile = { name: string; url: string; mimeType: string };
type UploadKind = "image" | "video" | "file";
type UploadMimeKind = UploadKind | "document";
type UploadResult = { url: string; size?: number; name?: string; mimeType?: string };
type UploadProgress = { loaded: number; total: number };
type EditorHeight = "small" | "medium" | "large";

const lowlight = createLowlight(common);

function uploadEditorFile(file: File, kind: UploadMimeKind = "document", onProgress?: (progress: UploadProgress) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    request.open("POST", "/api/admin/uploads");
    request.upload.onprogress = (event) => onProgress?.({ loaded: event.loaded, total: event.lengthComputable ? event.total : file.size });
    request.onerror = () => reject(new Error("Network error while uploading file."));
    request.onabort = () => reject(new Error("Upload was cancelled."));
    request.onload = () => {
      void readUpload(new Response(request.responseText, { status: request.status, headers: { "content-type": request.getResponseHeader("content-type") ?? "application/json" } })).then(resolve, reject);
    };
    request.send(formData);
  });
}

async function readUpload(response: Response) {
  const text = await response.text();
  let result: { upload?: { url?: string; size?: number; filename?: string; mimeType?: string }; error?: string; requestId?: string };
  try { result = JSON.parse(text); } catch {
    const contentType = response.headers.get("content-type") ?? "unknown content type";
    const hint = response.status === 413 ? "The file or request is too large." : response.status === 401 || response.status === 403 ? "Sign in with an admin account and try again." : "Check the upload endpoint and try again.";
    throw new Error(`File upload failed (HTTP ${response.status}, ${contentType}). ${hint}`);
  }
  if (!response.ok || typeof result.upload?.url !== "string") throw new Error(`${result.error ?? `File upload failed (HTTP ${response.status}).`}${result.requestId ? ` Reference: ${result.requestId}` : ""}`);
  return { url: result.upload.url, size: result.upload.size, name: result.upload.filename, mimeType: result.upload.mimeType };
}

function videoEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (["youtu.be", "youtube.com", "www.youtube.com"].includes(url.hostname)) {
      const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null;
      return id && /^[\w-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (["vimeo.com", "www.vimeo.com"].includes(url.hostname)) {
      const id = url.pathname.split("/").filter(Boolean).at(-1);
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}

function insertUploadCommand(kind: UploadKind, editor: { view: { dom: HTMLElement } }) {
  const root = editor.view.dom.closest(".dm-editor");
  root?.dispatchEvent(new CustomEvent("blog-upload", { bubbles: true, detail: { kind } }));
}

function insertMediaUrl(kind: UploadKind, editor: { view: { dom: HTMLElement } }) {
  editor.view.dom.closest(".dm-editor")?.dispatchEvent(new CustomEvent("blog-media-url", { bubbles: true, detail: { kind } }));
}

const MediaUploadMenuItems = Node.create({
  name: "blogMediaUploadMenuItems",
  addFloatingMenuItems() {
    const icon = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
    return [
      { name: "blog-insert-video-url", label: "Video from URL", description: "Embed a YouTube or Vimeo video", icon: icon("m22 8-6 4 6 4V8ZM2 6h14v12H2z"), group: "Media", priority: 179, keywords: ["video", "embed", "url", "youtube", "vimeo"], command: (editor) => insertMediaUrl("video", editor) },
      { name: "blog-insert-file-url", label: "File from URL", description: "Embed a file using a link", icon: icon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"), group: "Media", priority: 180, keywords: ["file", "embed", "url", "link", "document"], command: (editor) => insertMediaUrl("file", editor) },
      { name: "blog-upload-video", label: "Upload video", description: "Upload a video from your device", icon: icon("m22 8-6 4 6 4V8ZM2 6h14v12H2z"), group: "Media", priority: 182, keywords: ["upload", "video", "movie"], command: (editor) => insertUploadCommand("video", editor) },
      { name: "blog-upload-file", label: "Upload file", description: "Upload a downloadable file", icon: icon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"), group: "Media", priority: 183, keywords: ["upload", "file", "document", "attachment"], command: (editor) => insertUploadCommand("file", editor) },
    ];
  },
});

function pasteTextAsBlocks(editor: NonNullable<ReturnType<typeof useCurrentEditor>["editor"]>, text: string) {
  const blocks = text.replace(/\r\n?/g, "\n").split("\n");
  if (blocks.length < 2) return false;
  const paragraph = editor.schema.nodes.paragraph;
  if (!paragraph) return false;
  const fragment = Fragment.fromArray(blocks.map((block) => paragraph.create(null, block ? editor.schema.text(block) : undefined)));
  const { state, view } = editor;
  const tr = state.tr.replaceSelection(new Slice(fragment, 0, 0));
  const end = tr.selection.from;
  tr.setSelection(TextSelection.near(tr.doc.resolve(end), -1));
  view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
  return true;
}

const TextBlockPaste = Extension.create({
  name: "textBlockPaste",
  priority: 1000,
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [new Plugin({
      props: {
        handleClick(view, position, event) {
          const anchor = (event.target as HTMLElement).closest("a");
          if (!anchor || !view.dom.contains(anchor)) return false;
          const mark = view.state.schema.marks.link;
          if (!mark) return false;
          const range = getMarkRange(view.state.doc.resolve(position), mark);
          if (!range) return false;
          event.preventDefault();
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, range.from, range.to)));
          editor.emit("linkEdit", {});
          return true;
        },
        handlePaste(view, event) {
          if (!view.editable || !event.clipboardData) return false;
          const pasted = event.clipboardData.getData("text/plain");
          if (!pasted.includes("\n")) return false;
          event.preventDefault();
          return pasteTextAsBlocks(editor, pasted);
        },
      },
    })];
  },
});

const editorExtensions = [StarterKit.configure({ link: false, linkPopover: false, codeBlock: false }), Link.configure({ openOnClick: false }), LinkPopover, CodeBlockLowlight.configure({ lowlight }), VideoEmbed, FileEmbed, BubbleMenu, Placeholder.configure({ placeholder: ({ node }) => node.type.name === "heading" ? "Heading" : "Type '/' for commands" }), Image.configure({ allowBase64: false, maxFileSize: MAX_UPLOAD_BYTES, placement: "align", uploadHandler: async (file) => (await uploadEditorFile(file, "image")).url }), MediaUploadMenuItems, TextBlockPaste, BlockHandle.configure({ nested: true }), BlockContextMenu, SlashCommand, SmartPaste, KeyboardReorder];

function BlockHandleTouchSupport() {
  const { editor } = useCurrentEditor();

  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom.closest(".dm-editor");
    const hoverTarget = root?.parentElement;
    if (!root || !hoverTarget) return;
    const onTouchStart = (event: TouchEvent) => {
      if (!window.matchMedia("(pointer: coarse)").matches || (event.target as HTMLElement).closest(".dm-block-handle")) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      hoverTarget.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: touch.clientX, clientY: touch.clientY }));
    };
    const onPointerOver = () => {
      if (window.matchMedia("(pointer: coarse)").matches) {
        root.querySelectorAll(".dm-block-handle").forEach((handle) => handle.setAttribute("data-show", ""));
      }
    };
    hoverTarget.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("pointerover", onPointerOver);
    return () => {
      hoverTarget.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("pointerover", onPointerOver);
    };
  }, [editor]);

  return null;
}

function ImageUploader({ uploadImages, onUploadingChange }: { uploadImages: boolean; onUploadingChange: (uploading: boolean) => void }) {
  const { editor } = useCurrentEditor();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [mediaKind, setMediaKind] = useState<UploadKind>("file");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadKind, setUploadKind] = useState<UploadKind>("file");
  const [uploadedFiles, setUploadedFiles] = useState<Array<MediaFile & { kind: UploadKind }>>([]);
  const [selectedNode, setSelectedNode] = useState<JSONContent | null>(null);
  const [mediaUrlOpen, setMediaUrlOpen] = useState(false);
  const [altTextOpen, setAltTextOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadName, setUploadName] = useState("");
  type ActiveEditor = NonNullable<typeof editor>;
  type SelectionBookmark = ReturnType<ActiveEditor["state"]["selection"]["getBookmark"]>;
  const selectionBookmark = useRef<{ editor: ActiveEditor; bookmark: SelectionBookmark } | null>(null);
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    const openUploadPicker = ({ kind }: { kind: UploadKind }) => {
      if (!uploadImages) return;
      selectionBookmark.current = { editor, bookmark: editor.state.selection.getBookmark() };
      setError("");
      setUploadKind(kind);
      if (fileInputRef.current) {
        fileInputRef.current.accept = kind === "image" ? "image/*" : kind === "video" ? "video/*" : "";
        fileInputRef.current.click();
      } else {
        selectionBookmark.current = null;
        setError("The upload control is unavailable.");
      }
    };
    const update = () => {
      const { selection } = editor.state;
      const node = selection instanceof NodeSelection ? selection.node : null;
      setSelectedNode(node && ["image", "fileEmbed", "videoEmbed"].includes(node.type.name)
        ? { type: node.type.name, attrs: { ...node.attrs } }
        : null);
    };
    const mapBookmark = ({ transaction, appendedTransactions = [] }: TransactionEventProps) => {
      const saved = selectionBookmark.current;
      if (!saved || saved.editor !== editor) return;
      saved.bookmark = [transaction, ...appendedTransactions].reduce(
        (bookmark, applied) => bookmark.map(applied.mapping),
        saved.bookmark,
      );
    };
    const root = editor.view.dom.closest(".dm-editor");
    const onUploadRequest = (event: Event) => openUploadPicker((event as CustomEvent<{ kind: UploadKind }>).detail);
    const onMediaUrlRequest = (event: Event) => { setUrl(""); setError(""); setMediaKind((event as CustomEvent<{ kind: UploadKind }>).detail?.kind ?? "image"); setMediaUrlOpen(true); };
    root?.addEventListener("blog-upload", onUploadRequest);
    root?.addEventListener("blog-media-url", onMediaUrlRequest);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("transaction", mapBookmark);
    update();
    return () => {
      root?.removeEventListener("blog-upload", onUploadRequest);
      root?.removeEventListener("blog-media-url", onMediaUrlRequest);
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.off("transaction", mapBookmark);
    };
  }, [editor]);

  if (!uploadImages) return null;

  function insertAtSelection(content: JSONContent) {
    const saved = selectionBookmark.current;
    selectionBookmark.current = null;
    if (!saved) return false;
    const activeEditor = saved.editor;
    try {
      const selection = saved.bookmark.resolve(activeEditor.state.doc);
      const node = activeEditor.schema.nodeFromJSON(content);
      const transaction = activeEditor.state.tr.setSelection(selection).replaceSelectionWith(node);
      activeEditor.view.dispatch(transaction);
      activeEditor.view.focus();
      return true;
    } catch {
      return false;
    }
  }

  function updateSelectedNode(type: "image" | "fileEmbed", attributes: Record<string, unknown>) {
    const activeEditor = editorRef.current;
    if (!activeEditor) return;
    const { selection } = activeEditor.state;
    if (selection instanceof NodeSelection && selection.node.type.name === type) activeEditor.chain().focus().updateAttributes(type, attributes).run();
  }

  function insertUrl() {
    const activeEditor = editorRef.current;
    if (!activeEditor) return;
    try {
      const parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      const video = videoEmbedUrl(url);
      selectionBookmark.current = { editor: activeEditor, bookmark: activeEditor.state.selection.getBookmark() };
      const fileName = parsed.pathname.split("/").filter(Boolean).at(-1) || "Linked file";
      const extension = fileName.split(".").at(-1)?.toLowerCase();
      const mimeTypes: Record<string, string> = { pdf: "application/pdf", txt: "text/plain", md: "text/markdown", csv: "text/csv", json: "application/json", zip: "application/zip", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", webm: "video/webm" };
      const isImage = mediaKind === "image" && /^image\//.test(mimeTypes[extension ?? ""] ?? "");
      const isFile = mediaKind === "file" || /\.(pdf|txt|md|csv|json|zip|docx?|xlsx?|pptx?)(?:$|[?#])/i.test(parsed.href);
      const inserted = video
        ? insertAtSelection({ type: "videoEmbed", attrs: { src: video, title: "Video" } })
        : isImage
          ? insertAtSelection({ type: "image", attrs: { src: parsed.toString(), alt: "" } })
          : isFile
            ? insertAtSelection({ type: "fileEmbed", attrs: { src: parsed.toString(), name: fileName, mimeType: mimeTypes[extension ?? ""] ?? "application/octet-stream", display: "inline" } })
            : (() => { throw new Error(); })();
      if (!inserted) throw new Error();
      setUrl(""); setError(""); setMediaUrlOpen(false);
    } catch { setError("Enter an HTTP(S) image/file URL or supported YouTube/Vimeo URL."); }
  }

  async function upload(file?: File) {
    if (!file) { selectionBookmark.current = null; return; }
    if (file.size > MAX_UPLOAD_BYTES) { setError("Files must be 20 MB or smaller."); return; }
    const uploadEditor = editorRef.current;
    if (!uploadEditor) { setError("The editor is not ready. Try again."); return; }
    setUploading(true); setUploadName(file.name); onUploadingChange(true); setError("");
    try {
      selectionBookmark.current = { editor: uploadEditor, bookmark: uploadEditor.state.selection.getBookmark() };
      if (uploadKind === "image" && !file.type.startsWith("image/")) throw new Error("Choose an image file for image upload.");
      if (uploadKind === "video" && !file.type.startsWith("video/")) throw new Error("Choose a video file for video upload.");
      setUploadProgress({ loaded: 0, total: file.size });
      const uploaded = await uploadEditorFile(file, uploadKind, setUploadProgress);
      const mimeType = uploaded.mimeType || file.type || "application/octet-stream";
      const inserted = uploadKind === "image"
        ? insertAtSelection({ type: "image", attrs: { src: uploaded.url, alt: "" } })
        : uploadKind === "video"
          ? insertAtSelection({ type: "fileEmbed", attrs: { src: uploaded.url, name: uploaded.name || file.name, mimeType, size: uploaded.size, display: "preview" } })
          : insertAtSelection({ type: "fileEmbed", attrs: { src: uploaded.url, name: uploaded.name || file.name, mimeType, size: uploaded.size, display: "inline" } });
      if (!inserted) throw new Error("Upload succeeded but could not be added to the article.");
      setUploadedFiles((files) => [...files, { name: uploaded.name || file.name, url: uploaded.url, mimeType, kind: uploadKind }]);
    } catch (cause) {
      selectionBookmark.current = null;
      setError(cause instanceof Error ? cause.message : "File upload failed.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return <div className="contents">
    {uploading && <div className="fixed bottom-4 right-4 z-[120] w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-2xl" role="status" aria-live="polite"><div className="mb-2 flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><LoaderCircle size={15} className="shrink-0 animate-spin" /> <span className="truncate">Uploading {uploadName || "file"}</span></span><span>{Math.round(((uploadProgress?.loaded ?? 0) / Math.max(uploadProgress?.total ?? 1, 1)) * 100)}%</span></div><progress className="upload-progress w-full" max={uploadProgress?.total || 1} value={uploadProgress?.loaded ?? 0} /></div>}
    {error && <p role="alert" className="absolute bottom-3 left-3 right-3 z-40 rounded-lg bg-card p-2 text-xs text-destructive shadow">{error}</p>}
    {mediaUrlOpen && <div className="media-url-panel"><input aria-label="Media URL" autoFocus type="url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") insertUrl(); if (event.key === "Escape") setMediaUrlOpen(false); }} placeholder="Paste image, video, or file URL" /><button type="button" aria-label="Insert media URL" onClick={insertUrl} className="rounded-md bg-primary p-2 text-primary-foreground"><Check size={16} /></button><button type="button" aria-label="Upload media file" onClick={() => { setMediaUrlOpen(false); setUploadKind("file"); fileInputRef.current?.click(); }} className="rounded-md border border-border p-2"><Upload size={16} /></button><button type="button" aria-label="Close media URL" onClick={() => setMediaUrlOpen(false)} className="rounded-md border border-border p-2"><X size={16} /></button></div>}
    {uploadImages && <input ref={fileInputRef} className="sr-only" type="file" accept={uploadKind === "image" ? "image/*" : uploadKind === "video" ? "video/*" : undefined} disabled={uploading} onChange={(event) => { void upload(event.currentTarget.files?.[0]); }} />}
    {selectedNode?.type === "image" && <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg" role="toolbar" aria-label="Selected image options"><button type="button" aria-label="Align image left" title="Align left" onClick={() => updateSelectedNode("image", { align: "left" })} className={`rounded-md p-2 ${selectedNode.attrs?.align === "left" ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}><AlignLeft size={16} /></button><button type="button" aria-label="Center image" title="Center" onClick={() => updateSelectedNode("image", { align: "center" })} className={`rounded-md p-2 ${selectedNode.attrs?.align === "center" ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}><AlignCenter size={16} /></button><button type="button" aria-label="Align image right" title="Align right" onClick={() => updateSelectedNode("image", { align: "right" })} className={`rounded-md p-2 ${selectedNode.attrs?.align === "right" ? "bg-primary/20 text-primary" : "hover:bg-muted"}`}><AlignRight size={16} /></button><button type="button" aria-label="Edit alt text" title="Edit alt text" onClick={() => setAltTextOpen((value) => !value)} className={`rounded-md p-2 ${selectedNode.attrs?.alt ? "text-primary" : "hover:bg-muted"}`}><Type size={16} /></button>{altTextOpen && <div className="absolute z-50 flex -translate-y-full items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-xl"><input id="image-alt-text" aria-label="Image alternative text" autoFocus value={String(selectedNode.attrs?.alt ?? "")} onChange={(event) => updateSelectedNode("image", { alt: event.target.value })} placeholder="Describe image" className="w-64 max-w-[70vw] rounded-md border border-border bg-background px-2 py-1.5 text-xs" /><button type="button" aria-label="Save alt text" onClick={() => setAltTextOpen(false)} className="rounded-md bg-primary p-2 text-primary-foreground"><Check size={15} /></button></div>}<button type="button" aria-label="Change image URL" title="Change image URL" onClick={() => { const source = window.prompt("Image URL", String(selectedNode.attrs?.src ?? "")); if (source !== null) updateSelectedNode("image", { src: source }); }} className="rounded-md p-2 text-primary hover:bg-muted"><Link2 size={16} /></button><button type="button" aria-label="Delete image" title="Delete image" onClick={() => editorRef.current?.chain().focus().deleteSelection().run()} className="rounded-md p-2 text-destructive hover:bg-muted"><Trash2 size={16} /></button></div>}
    {selectedNode?.type === "fileEmbed" && <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md bg-muted p-2" role="toolbar" aria-label="Selected media options"><span className="min-w-0 flex-1 truncate text-xs">{String(selectedNode.attrs?.name ?? "File")}</span><button type="button" onClick={() => updateSelectedNode("fileEmbed", { display: "link" })} className="rounded border border-border px-2 py-1 text-xs">File name</button><button type="button" onClick={() => updateSelectedNode("fileEmbed", { display: "download" })} className="rounded border border-border px-2 py-1 text-xs">Download link</button><button type="button" onClick={() => updateSelectedNode("fileEmbed", { display: "preview" })} className="rounded border border-border px-2 py-1 text-xs">Preview</button><button type="button" onClick={() => updateSelectedNode("fileEmbed", { display: "inline" })} className="rounded border border-border px-2 py-1 text-xs">Inline preview</button><a href={String(selectedNode.attrs?.src ?? "")} target="_blank" rel="noreferrer" className="max-w-full truncate text-xs text-primary underline">{String(selectedNode.attrs?.src ?? "")}</a><button type="button" aria-label="Remove media" onClick={() => editorRef.current?.chain().focus().deleteSelection().run()} className="rounded p-2 text-destructive hover:bg-background"><X size={15} /></button></div>}
    {selectedNode?.type === "videoEmbed" && <div className="mb-2 flex items-center gap-2 rounded-md bg-muted p-2" role="toolbar" aria-label="Selected video options"><span className="min-w-0 flex-1 truncate text-xs">Embedded video</span><button type="button" aria-label="Remove video" onClick={() => editorRef.current?.chain().focus().deleteSelection().run()} className="rounded p-2 text-destructive hover:bg-background"><X size={15} /></button></div>}
    {uploadedFiles.length > 0 && <div className="sr-only" aria-live="polite">Uploaded {uploadedFiles.map((file) => file.name).join(", ")}</div>}
  </div>;
}

export function BlogEditor({ initialContent, onChange, uploadImages }: Props) {
  const [document, setDocument] = useState(initialContent);
  const [editorTheme, setEditorTheme] = useState<"dark" | "light">("dark");
  const [editorHeight, setEditorHeight] = useState<EditorHeight>("medium");

  return (
    <section className={`dm-theme-${editorTheme} text-foreground`}>
      <DomternalTheme />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Click a block to edit · type / for commands</p>
        <div className="flex items-center gap-3">
          <label htmlFor="blog-editor-height" className="text-xs text-muted-foreground">Editor height</label>
          <select id="blog-editor-height" value={editorHeight} onChange={(event) => setEditorHeight(event.target.value as EditorHeight)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
            <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
          </select>
          <div aria-label="Editor appearance" className="flex rounded-lg bg-muted/60 p-1 text-xs">
            <button type="button" aria-pressed={editorTheme === "dark"} onClick={() => setEditorTheme("dark")} className={`rounded-md px-2.5 py-1.5 ${editorTheme === "dark" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Dark</button>
            <button type="button" aria-pressed={editorTheme === "light"} onClick={() => setEditorTheme("light")} className={`rounded-md px-2.5 py-1.5 ${editorTheme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Light</button>
          </div>
        </div>
      </div>
      <div className={`blog-editor-shell blog-editor-shell--${editorHeight}`}>
        <Domternal extensions={editorExtensions} content={document} outputFormat="json" preset="notion" immediatelyRender={false} onUpdate={({ editor }) => { const next = editor.getJSON() as JSONContent; setDocument(next); onChange(next); }}>
          <Domternal.Content />
          <BlockHandleTouchSupport />
          <Domternal.BubbleMenu />
          <Domternal.FloatingMenu requireExplicitTrigger />
          <ImageUploader uploadImages={uploadImages} onUploadingChange={() => {}} />
        </Domternal>
      </div>
    </section>
  );
}
