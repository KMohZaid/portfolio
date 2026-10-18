import { Node } from "@domternal/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@domternal/react";
import { FileEmbedPreview } from "./AttachmentPreview";

function FileEmbedView({ node }: ReactNodeViewProps) {
  const file = {
    src: String(node.attrs.src ?? ""),
    name: String(node.attrs.name ?? "File"),
    mimeType: String(node.attrs.mimeType ?? "application/octet-stream"),
    size: typeof node.attrs.size === "number" ? node.attrs.size : undefined,
  };
  const display = node.attrs.display === "card" ? "inline" : ["download", "preview", "inline"].includes(String(node.attrs.display)) ? String(node.attrs.display) as "download" | "preview" | "inline" : "link";

  return <NodeViewWrapper className="file-embed-node-view" contentEditable={false}>
    <FileEmbedPreview file={file} display={display} />
  </NodeViewWrapper>;
}

export const FileEmbed = Node.create({
  name: "fileEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() { return { src: { default: "" }, name: { default: "File" }, mimeType: { default: "application/octet-stream" }, size: { default: null }, display: { default: "link" } }; },
  parseHTML() { return [{ tag: "div[data-file-embed]", getAttrs: (element) => { const el = element as HTMLElement; return { src: el.getAttribute("data-src") ?? "", name: el.getAttribute("data-name") ?? "File", mimeType: el.getAttribute("data-mime-type") ?? "application/octet-stream", size: Number(el.getAttribute("data-size")) || null, display: el.getAttribute("data-display") ?? "link" }; } }]; },
  renderHTML({ node }) { return ["div", { "data-file-embed": "", "data-src": node.attrs.src, "data-name": node.attrs.name, "data-mime-type": node.attrs.mimeType, "data-size": node.attrs.size, "data-display": node.attrs.display, class: "file-embed-preview" }, ["a", { href: node.attrs.src, target: "_blank", rel: "noopener noreferrer" }, node.attrs.name]]; },
  addNodeView() { return ReactNodeViewRenderer(FileEmbedView, { className: "file-embed-node-view", contentDOMElement: null }); },
});
