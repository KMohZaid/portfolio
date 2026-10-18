import { Node } from "@domternal/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@domternal/react";
import { useState } from "react";

function VideoEmbedView({ node, updateAttributes }: ReactNodeViewProps) {
  const [editing, setEditing] = useState(false);
  const source = String(node.attrs.src ?? "");
  const title = String(node.attrs.title ?? "Embedded video");

  return <NodeViewWrapper className="video-embed-editor-view" contentEditable={false}>
    <div className="video-embed-editor-toolbar">
      <span>{title}</span>
      <button type="button" onClick={() => setEditing((value) => !value)}>{editing ? "Done" : "Edit URL"}</button>
    </div>
    {editing ? <label className="video-embed-editor-url">YouTube or Vimeo embed URL<input type="url" value={source} onChange={(event) => updateAttributes({ src: event.target.value })} /></label> : <iframe src={source} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}
  </NodeViewWrapper>;
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() { return { src: { default: "" }, title: { default: "" } }; },
  selectable: true,
  draggable: true,
  parseHTML() { return [{ tag: "div[data-video-embed]", getAttrs: (element) => ({ src: (element as HTMLElement).getAttribute("data-src") ?? "", title: (element as HTMLElement).getAttribute("data-title") ?? "" }) }]; },
  renderHTML({ node }) { return ["div", { "data-video-embed": "", "data-src": node.attrs.src, "data-title": node.attrs.title, class: "video-embed-preview" }, ["iframe", { src: node.attrs.src, title: node.attrs.title || "Embedded video", loading: "lazy", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", referrerpolicy: "strict-origin-when-cross-origin", allowfullscreen: "true" }]]; },
  addNodeView() { return ReactNodeViewRenderer(VideoEmbedView, { className: "video-embed-node-view", contentDOMElement: null }); },
});
