"use client";

import { useState } from "react";
import { Domternal, useCurrentEditor } from "@domternal/react";
import { StarterKit, BubbleMenu, type JSONContent } from "@domternal/core";
import { CodeBlockLowlight } from "@domternal/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { BlockContextMenu, BlockHandle, KeyboardReorder, SlashCommand, SmartPaste, FloatingMenu as BlockFloatingMenu } from "@domternal/extension-block-controls";
import { Image } from "@domternal/extension-image";
import { ImagePlus, Blocks, Type } from "lucide-react";
import { VideoEmbed, VideoEmbedInserter } from "./VideoEmbed";
import { DomternalTheme } from "./DomternalTheme";

type Props = { initialContent: JSONContent; onChange: (content: JSONContent) => void; uploadImages: boolean };
type Mode = "classic" | "notion";

const lowlight = createLowlight(common);

async function uploadEditorImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
  const text = await response.text();
  let result: { upload?: { url?: string }; error?: string };
  try { result = JSON.parse(text); } catch { throw new Error("Image upload endpoint returned an invalid response. Please try again."); }
  if (!response.ok || typeof result.upload?.url !== "string") throw new Error(result.error ?? "Image upload failed.");
  return result.upload.url;
}

const classicExtensions = [StarterKit.configure({ link: { openOnClick: false }, codeBlock: false }), CodeBlockLowlight.configure({ lowlight }), VideoEmbed, BubbleMenu, Image.configure({ allowBase64: false, maxFileSize: 4_700_000, uploadHandler: uploadEditorImage })];
const notionExtensions = [...classicExtensions, BlockHandle.configure({ nested: true }), BlockContextMenu, SlashCommand, SmartPaste, KeyboardReorder, BlockFloatingMenu.configure({ requireExplicitTrigger: true })];

function ImageUploader({ uploadImages }: { uploadImages: boolean }) {
  const { editor } = useCurrentEditor();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  if (!uploadImages) return null;
  return <div className="border-t border-border px-4 py-2">
    <div className="mb-2 flex flex-wrap gap-2"><input aria-label="Image URL" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste an image URL" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" /><button type="button" onClick={() => { try { const parsed = new URL(url); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); editor?.chain().focus().setImage({ src: url.trim(), alt: "" }).run(); setUrl(""); setError(""); } catch { setError("Enter a valid HTTP or HTTPS image URL."); } }} className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary">Insert image URL</button></div>
    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ImagePlus size={16} /> Upload image<input className="sr-only" type="file" accept="image/*" onChange={async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const formData = new FormData(); formData.append("image", file);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const text = await response.text();
      let result: { upload?: { url?: string }; error?: string };
      try { result = JSON.parse(text); } catch { throw new Error("Image upload endpoint returned an invalid response. Please try again."); }
      if (!response.ok || typeof result.upload?.url !== "string") throw new Error(result.error ?? "Image upload failed.");
      editor?.chain().focus().setImage({ src: result.upload.url, alt: file.name }).run();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Image upload failed."); }
  }} /></label>
    {error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
  </div>;
}

export function BlogEditor({ initialContent, onChange, uploadImages }: Props) {
  const [mode, setMode] = useState<Mode>("notion");
  const [document, setDocument] = useState(initialContent);
  const [editorTheme, setEditorTheme] = useState<"dark" | "light">("dark");
  const extensions = mode === "notion" ? notionExtensions : classicExtensions;

  return (
    <section className={`dm-theme-${editorTheme} overflow-hidden rounded-xl border border-border bg-card text-foreground`}>
      <DomternalTheme />
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <p className="text-sm font-medium">Domternal editor <span className="text-xs text-muted-foreground">MIT</span></p>
        <div className="flex items-center gap-2">
          <div aria-label="Editor appearance" className="flex rounded-lg bg-muted/60 p-1 text-xs">
            <button type="button" aria-pressed={editorTheme === "dark"} onClick={() => setEditorTheme("dark")} className={`rounded-md px-2.5 py-1.5 ${editorTheme === "dark" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Dark</button>
            <button type="button" aria-pressed={editorTheme === "light"} onClick={() => setEditorTheme("light")} className={`rounded-md px-2.5 py-1.5 ${editorTheme === "light" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Light</button>
          </div>
          <div aria-label="Editor mode" className="flex rounded-lg bg-muted/60 p-1 text-xs">
            <button type="button" aria-pressed={mode === "classic"} onClick={() => setMode("classic")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${mode === "classic" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Type size={14} /> Normal</button>
            <button type="button" aria-pressed={mode === "notion"} onClick={() => setMode("notion")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${mode === "notion" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Blocks size={14} /> Notion style</button>
          </div>
        </div>
      </div>
      <Domternal extensions={extensions} content={document} outputFormat="json" preset={mode === "notion" ? "notion" : undefined} immediatelyRender={false} onUpdate={({ editor }) => { const next = editor.getJSON() as JSONContent; setDocument(next); onChange(next); }}>
        <Domternal.Toolbar />
        <Domternal.Content />
        <Domternal.BubbleMenu />
        {mode === "notion" && <Domternal.FloatingMenu requireExplicitTrigger />}
        <VideoEmbedInserter />
        <ImageUploader uploadImages={uploadImages} />
      </Domternal>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Both modes edit the same JSON document. Classic formatting and images are retained when switching. Notion block handles, menus, and slash commands use MIT/free Domternal packages.</p>
    </section>
  );
}
