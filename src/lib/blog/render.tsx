import type { JSONContent } from "@domternal/core";
import { AttachmentPreview } from "@/components/blog/AttachmentPreview";
import { createCodeHighlighter } from "@domternal/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const highlightCode = createCodeHighlighter(createLowlight(common));
const supportedVideoHosts = new Set(["www.youtube-nocookie.com", "player.vimeo.com"]);
const highlightClasses = new Map<string, string>([
  ["keyword", "text-primary"], ["selector-tag", "text-primary"], ["literal", "text-primary"],
  ["string", "text-emerald-500"], ["attr", "text-emerald-500"], ["comment", "text-muted-foreground italic"],
  ["number", "text-amber-500"], ["built_in", "text-amber-500"], ["title", "text-sky-400"], ["function", "text-sky-400"],
  ["type", "text-violet-400"], ["class", "text-violet-400"], ["variable", "text-rose-400"], ["params", "text-rose-400"],
  ["property", "text-rose-400"], ["meta", "text-cyan-400"], ["operator", "text-cyan-400"], ["punctuation", "text-foreground/70"],
]);
function slugHeading(text: string) {
  return text.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

export type BlogHeading = { id: string; text: string; level: number };

function headingText(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(headingText).join("");
}

export function getBlogHeadings(content: JSONContent): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const used = new Map<string, number>();
  function visit(node: JSONContent) {
    if (node.type === "heading") {
      const text = headingText(node).trim();
      if (text) {
        const base = slugHeading(text);
        const count = (used.get(base) ?? 0) + 1;
        used.set(base, count);
        headings.push({ id: count === 1 ? base : `${base}-${count}`, text, level: Math.max(1, Math.min(3, Number(node.attrs?.level) || 2)) });
      }
    }
    (node.content ?? []).forEach(visit);
  }
  visit(content);
  return headings;
}

function HighlightedCode({ markup }: { markup: string }) {
  const tokens = markup.split(/(<span class="hljs-[a-z0-9_ -]+">|<\/span>)/g);
  const stack: string[] = [];
  return <>{tokens.map((token, index) => {
    if (token.startsWith('<span class="hljs-')) {
      const tokenNames = token.match(/^<span class="([a-z0-9_ -]+)">$/)?.[1].split(/\s+/).map((name) => name.replace(/^hljs-/, "")) ?? [];
      stack.push(tokenNames.map((name) => highlightClasses.get(name) ?? "").filter(Boolean).join(" "));
      return null;
    }
    if (token === "</span>") { stack.pop(); return null; }
    if (!token) return null;
    const classes = stack.filter(Boolean).join(" ");
    return <span key={index} className={classes || undefined}>{token}</span>;
  })}</>;
}

function videoEmbedUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !supportedVideoHosts.has(url.hostname)) return undefined;
    if (url.hostname === "www.youtube-nocookie.com" && /^\/embed\/[\w-]+$/.test(url.pathname)) return url.toString();
    if (url.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(url.pathname)) return url.toString();
  } catch {}
  return undefined;
}

function safeHref(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value, "https://portfolio.invalid");
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}

function renderNode(node: JSONContent, key: string, headingCounts = new Map<string, number>()): React.ReactNode {
  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`, headingCounts));
  switch (node.type) {
    case "doc": return <>{children}</>;
    case "text": {
      let output: React.ReactNode = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") output = <strong key={key}>{output}</strong>;
        else if (mark.type === "italic") output = <em key={key}>{output}</em>;
        else if (mark.type === "strike") output = <s key={key}>{output}</s>;
        else if (mark.type === "code") output = <code key={key}>{output}</code>;
        else if (mark.type === "link") {
          const href = safeHref(mark.attrs?.href);
          output = href ? <a key={key} href={href} rel="nofollow noopener noreferrer">{output}</a> : output;
        }
      }
      return <span key={key}>{output}</span>;
    }
    case "paragraph": return <p key={key}>{children}</p>;
    case "heading": {
      const level = Math.max(1, Math.min(3, Number(node.attrs?.level) || 2));
      const text = headingText(node).trim();
      const base = slugHeading(text);
      const count = text ? (headingCounts.get(base) ?? 0) + 1 : 0;
      if (text) headingCounts.set(base, count);
      const id = count > 1 ? `${base}-${count}` : base;
      if (level === 1) return <h1 key={key} id={id}>{children}</h1>;
      if (level === 3) return <h3 key={key} id={id}>{children}</h3>;
      return <h2 key={key} id={id}>{children}</h2>;
    }
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock": {
      const code = (node.content ?? []).map((child) => child.text ?? "").join("");
      const language = typeof node.attrs?.language === "string" ? node.attrs.language : undefined;
      let highlighted: string | null = null;
      try { highlighted = highlightCode(code, language ?? null); } catch { highlighted = null; }
      const sanitized = highlighted?.replace(/<(?!\/?span\b)[^>]*>/gi, "") ?? null;
      return <pre key={key}><code className={language ? `language-${language}` : undefined}>{sanitized ? <HighlightedCode markup={sanitized} /> : code}</code></pre>;
    }
    case "videoEmbed": {
      const src = videoEmbedUrl(node.attrs?.src);
      return src ? <figure key={key} className="blog-video"><iframe src={src} title={String(node.attrs?.title ?? "Embedded video")} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></figure> : null;
    }
    case "horizontalRule": return <hr key={key} />;
    case "hardBreak": return <br key={key} />;
    case "image": {
      const src = safeHref(node.attrs?.src);
      const align = node.attrs?.align === "center" ? "mx-auto" : node.attrs?.align === "right" ? "ml-auto" : "mr-auto";
      return src ? <figure key={key} className={align}><img src={src} alt={String(node.attrs?.alt ?? "")} /><figcaption>{String(node.attrs?.title ?? "")}</figcaption></figure> : null;
    }
    case "fileEmbed": {
      const src = safeHref(node.attrs?.src);
      const name = String(node.attrs?.name ?? "Download file");
      const mimeType = String(node.attrs?.mimeType ?? "application/octet-stream");
      const display = node.attrs?.display === "card" ? "inline" : ["download", "preview", "inline"].includes(String(node.attrs?.display)) ? String(node.attrs?.display) as "download" | "preview" | "inline" : "link";
      if (!src) return null;
      const file = { src, name, mimeType, size: typeof node.attrs?.size === "number" ? node.attrs.size : undefined };
      if (display === "link") return <a key={key} href={src} className="file-embed-name">{name}</a>;
      if (display === "download") return <a key={key} href={src} download={name} className="attachment-button"><span>Download {name}</span></a>;
      return <AttachmentPreview key={key} file={file} inline={display === "inline"} />;
    }
    default: return <>{children}</>;
  }
}

export function BlogContent({ content }: { content: JSONContent }) {
  return <div className="blog-prose">{renderNode(content, "root", new Map())}</div>;
}
