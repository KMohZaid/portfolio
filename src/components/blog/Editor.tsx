"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { Bold, Heading1, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Undo2 } from "lucide-react";
import type { JSONContent } from "@tiptap/react";

type Props = { initialContent: JSONContent; onChange: (content: JSONContent) => void; uploadImages: boolean };

export function BlogEditor({ initialContent, onChange, uploadImages }: Props) {
  const [mode, setMode] = useState<"normal" | "notion">("normal");
  const editor = useEditor({ extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false }), LinkExtension.configure({ openOnClick: false, autolink: true })], content: initialContent, immediatelyRender: false, onUpdate: ({ editor }) => onChange(editor.getJSON()) });
  useEffect(() => { if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent)) editor.commands.setContent(initialContent);
  }, [editor, initialContent]);
  if (!editor) return <div className="min-h-72 animate-pulse rounded-xl bg-muted/40" />;

  const addImage = async (file: File) => {
    if (!file) return;
    if (uploadImages) {
      const data = new FormData(); data.append("image", file);
      try { const response = await fetch("/api/admin/uploads", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); editor.chain().focus().setImage({ src: result.upload.url, alt: file.name }).run(); }
      catch (error) { window.alert(error instanceof Error ? error.message : "Image upload failed."); }
    } else {
      const url = window.prompt("Paste an image URL (Telegraph upload is only available in the normal editor mode):");
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    }
  };
  const button = (label: string, active: boolean, action: () => void, icon: React.ReactNode) => <button key={label} type="button" title={label} aria-label={label} onClick={action} className={`rounded-md p-2 hover:bg-muted ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{icon}</button>;

  return <div className={`overflow-hidden rounded-xl border border-border bg-card ${mode === "notion" ? "notion-editor" : ""}`}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2"><div className="flex flex-wrap items-center gap-1">{button("Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold size={16} />)}{button("Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic size={16} />)}{button("Heading 1", editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={16} />)}{button("Heading 2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={16} />)}{button("Bulleted list", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List size={16} />)}{button("Numbered list", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={16} />)}{button("Quote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote size={16} />)}{button("Link", editor.isActive("link"), () => { const href = window.prompt("Link URL"); if (href) editor.chain().focus().setLink({ href }).run(); }, <Link2 size={16} />)}<label className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-muted" title="Insert image"><ImagePlus size={16} /><input className="hidden" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addImage(file); event.currentTarget.value = ""; }} /></label>{button("Divider", false, () => editor.chain().focus().setHorizontalRule().run(), <Minus size={16} />)}<span className="mx-1 h-5 border-l border-border" />{button("Undo", false, () => editor.chain().focus().undo().run(), <Undo2 size={16} />)}{button("Redo", false, () => editor.chain().focus().redo().run(), <Redo2 size={16} />)}</div><div className="flex rounded-lg bg-muted/60 p-1 text-xs"><button type="button" onClick={() => setMode("normal")} className={`rounded-md px-3 py-1.5 ${mode === "normal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Normal</button><button type="button" onClick={() => setMode("notion")} className={`rounded-md px-3 py-1.5 ${mode === "notion" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Notion-like</button></div></div><div className="min-h-80 p-5"><EditorContent editor={editor} /></div><div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Both modes edit the same document; switching views never converts or discards content.</div></div>;
}
