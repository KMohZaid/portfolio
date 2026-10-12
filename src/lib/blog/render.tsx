import type { JSONContent } from "@domternal/core";
import { createCodeHighlighter } from "@domternal/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const highlightCode = createCodeHighlighter(createLowlight(common));
const supportedVideoHosts = new Set(["www.youtube-nocookie.com", "player.vimeo.com"]);
const highlightedMarkup = /<span class="hljs-[a-z0-9_-]+">|<\/span>/g;
const highlightTag = /^<span class="(hljs-[a-z0-9_-]+)">$/;

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

function renderNode(node: JSONContent, key: string): React.ReactNode {
  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
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
      if (level === 1) return <h1 key={key}>{children}</h1>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h2 key={key}>{children}</h2>;
    }
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock": {
      const code = (node.content ?? []).map((child) => child.text ?? "").join("");
      const language = typeof node.attrs?.language === "string" ? node.attrs.language : undefined;
      const highlighted = highlightCode(code, language ?? null);
      const segments = highlighted?.split(highlightedMarkup);
      let classStack: string[] = [];
      return <pre key={key}><code className={language ? `language-${language}` : undefined}>{segments ? segments.map((segment, index) => {
        const match = segment.match(highlightTag);
        if (match) { classStack.push(match[1]); return null; }
        if (segment === "</span>") { classStack.pop(); return null; }
        return classStack.length ? <span key={index} className={classStack.join(" ")}>{segment}</span> : <span key={index}>{segment}</span>;
      }) : code}</code></pre>;
    }
    case "videoEmbed": {
      const src = videoEmbedUrl(node.attrs?.src);
      return src ? <figure key={key} className="blog-video"><iframe src={src} title={String(node.attrs?.title ?? "Embedded video")} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></figure> : null;
    }
    case "horizontalRule": return <hr key={key} />;
    case "hardBreak": return <br key={key} />;
    case "image": {
      const src = safeHref(node.attrs?.src);
      return src ? <figure key={key}><img src={src} alt={String(node.attrs?.alt ?? "")} /><figcaption>{String(node.attrs?.title ?? "")}</figcaption></figure> : null;
    }
    default: return <>{children}</>;
  }
}

export function BlogContent({ content }: { content: JSONContent }) {
  return <div className="blog-prose">{renderNode(content, "root")}</div>;
}
