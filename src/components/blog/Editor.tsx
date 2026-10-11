"use client";

import { useEffect, useMemo, useState } from "react";
import { Domternal, useCurrentEditor } from "@domternal/react";
import { StarterKit, BubbleMenu, type JSONContent } from "@domternal/core";
import { BlockContextMenu, BlockHandle, KeyboardReorder, SlashCommand, SmartPaste, FloatingMenu as BlockFloatingMenu } from "@domternal/extension-block-controls";
import { Image } from "@domternal/extension-image";
import { ImagePlus } from "lucide-react";
import { DomternalTheme } from "./DomternalTheme";

type Props = { initialContent: JSONContent; onChange: (content: JSONContent) => void; uploadImages: boolean };
type Mode = "classic" | "notion";

const classicExtensions = [StarterKit.configure({ link: { openOnClick: false } }), BubbleMenu, Image.configure({ allowBase64: false, maxFileSize: 4_700_000 })];
const notionExtensions = [...classicExtensions, BlockHandle.configure({ nested: true }), BlockContextMenu, SlashCommand, SmartPaste, KeyboardReorder, BlockFloatingMenu.configure({ requireExplicitTrigger: true })];

function ImageUploader({ uploadImages }: { uploadImages: boolean }) {
  const { editor } = useCurrentEditor();
  if (!uploadImages) return null;
  return <label className="flex cursor-pointer items-center gap-2 border-t border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"><ImagePlus size={16} /> Upload image<input className="sr-only" type="file" accept="image/*" onChange={async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const formData = new FormData(); formData.append("image", file);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || typeof result.upload?.url !== "string") throw new Error(result.error ?? "Image upload failed.");
      editor?.chain().focus().setImage({ src: result.upload.url, alt: file.name }).run();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Image upload failed."); }
  }} /></label>;
}

export function BlogEditor({ initialContent, onChange, uploadImages }: Props) {
  const [mode, setMode] = useState<Mode>("classic");
  const extensions = useMemo(() => mode === "notion" ? notionExtensions : classicExtensions, [mode]);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <DomternalTheme />
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <p className="text-sm font-medium">Domternal editor <span className="text-xs text-muted-foreground">MIT</span></p>
        <div aria-label="Editor mode" className="flex rounded-lg bg-muted/60 p-1 text-xs">
          <button type="button" aria-pressed={mode === "classic"} onClick={() => setMode("classic")} className={`rounded-md px-3 py-1.5 ${mode === "classic" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Classic</button>
          <button type="button" aria-pressed={mode === "notion"} onClick={() => setMode("notion")} className={`rounded-md px-3 py-1.5 ${mode === "notion" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Notion style</button>
        </div>
      </div>
      <Domternal key={mode} extensions={extensions} content={initialContent} outputFormat="json" preset={mode === "notion" ? "notion" : undefined} immediatelyRender={false} onUpdate={({ editor }) => onChange(editor.getJSON() as JSONContent)}>
        <Domternal.Toolbar />
        <Domternal.Content />
        <Domternal.BubbleMenu />
        {mode === "notion" && <Domternal.FloatingMenu requireExplicitTrigger />}
        <ImageUploader uploadImages={uploadImages} />
      </Domternal>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Both modes edit the same JSON document. Classic formatting and images are retained when switching. Notion block handles, menus, and slash commands use MIT/free Domternal packages.</p>
    </section>
  );
}
