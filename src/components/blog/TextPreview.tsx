"use client";

import { useEffect, useState } from "react";
import { createCodeHighlighter } from "@domternal/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const highlighter = createCodeHighlighter(createLowlight(common));
const languageByExtension: Record<string, string> = { py: "python", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", sh: "bash", bash: "bash", yml: "yaml", yaml: "yaml", html: "xml", xml: "xml", css: "css", sql: "sql", md: "markdown" };
const tokenClasses: Record<string, string> = { keyword: "text-primary", string: "text-emerald-500", comment: "text-muted-foreground italic", number: "text-amber-500", built_in: "text-amber-500", title: "text-sky-400", function: "text-sky-400", type: "text-violet-400", variable: "text-rose-400", property: "text-rose-400", meta: "text-cyan-400", operator: "text-cyan-400" };

function Highlighted({ markup }: { markup: string }) {
  const tokens = markup.split(/(<span class="hljs-[a-z0-9_ -]+">|<\/span>)/g);
  const classes: string[] = [];
  return <>{tokens.map((token, index) => {
    if (token.startsWith('<span class="hljs-')) {
      const names = token.match(/^<span class="([a-z0-9_ -]+)">$/)?.[1].split(/\s+/).map((name) => name.replace(/^hljs-/, "")) ?? [];
      classes.push(names.map((name) => tokenClasses[name]).filter(Boolean).join(" "));
      return null;
    }
    if (token === "</span>") { classes.pop(); return null; }
    return token ? <span key={index} className={classes.filter(Boolean).join(" ") || undefined}>{token}</span> : null;
  })}</>;
}

export function TextPreview({ src, filename }: { src: string; filename: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch(src, { headers: { Range: "bytes=0-32767" }, signal: controller.signal }).then(async (response) => {
      if (!response.ok || !response.body) throw new Error("Unable to load preview");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (length < 32768) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = value.subarray(0, 32768 - length);
        chunks.push(chunk);
        length += chunk.length;
        if (length >= 32768) { await reader.cancel(); break; }
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      return new TextDecoder().decode(bytes);
    }).then((value) => { if (active) setText(value); }).catch(() => { if (active && !controller.signal.aborted) setError(true); });
    return () => { active = false; controller.abort(); };
  }, [src]);
  if (error) return <p role="alert" className="p-5">Could not load this preview. Download the file to view it.</p>;
  if (text === null) return <p className="p-5">Loading preview…</p>;
  const lines = text.split("\n");
  const snippet = lines.slice(0, 30).join("\n");
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";
  let markup: string | null = null;
  try { markup = highlighter(snippet, languageByExtension[extension] ?? null); } catch {}
  const safeMarkup = markup?.replace(/<(?!\/?span\b)[^>]*>/gi, "");
  return <div className="attachment-text-preview"><pre aria-hidden="true" className="attachment-text-line-numbers">{Array.from({ length: Math.min(lines.length, 30) }, (_, index) => index + 1).join("\n")}</pre><pre className="attachment-text-code"><code>{safeMarkup ? <Highlighted markup={safeMarkup} /> : snippet}{lines.length > 30 || text.length >= 32768 ? "\n… Preview limited to the first 30 lines. Download the file to see the rest." : ""}</code></pre></div>;
}
