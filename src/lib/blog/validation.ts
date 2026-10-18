import { z } from "zod";

const safeUrl = z.string().max(2048).refine((value) => { if (/^\/api\/files\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return true; try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }, "Image URLs must use HTTP or HTTPS.");
const safeVideoUrl = z.string().max(2048).refine((value) => { try { const url = new URL(value); return url.protocol === "https:" && ((url.hostname === "www.youtube-nocookie.com" && /^\/embed\/[\w-]+$/.test(url.pathname)) || (url.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(url.pathname))); } catch { return false; } }, "Video embeds must use a supported YouTube or Vimeo player URL.");
const contentNodeSchema: z.ZodType<unknown> = z.lazy(() => z.object({ type: z.string().max(40), text: z.string().max(50000).optional(), attrs: z.record(z.string(), z.unknown()).optional(), marks: z.array(z.object({ type: z.string(), attrs: z.record(z.string(), z.unknown()).optional() }).passthrough()).max(20).optional(), content: z.array(z.unknown()).max(5000).optional() }).passthrough().superRefine((node, context) => {
  if (node.type === "text" && typeof node.text !== "string") context.addIssue({ code: "custom", message: "Text nodes must contain text." });
  if (node.type === "image") { const source = node.attrs?.src; if (typeof source !== "string" || !safeUrl.safeParse(source).success) context.addIssue({ code: "custom", message: "Images must use a valid HTTP or HTTPS URL." }); if (node.attrs?.align !== undefined && !["none", "left", "center", "right"].includes(String(node.attrs.align))) context.addIssue({ code: "custom", message: "Image alignment is invalid." }); }
  if (node.type === "fileEmbed") { const source = node.attrs?.src; if (typeof source !== "string" || !safeUrl.safeParse(source).success) context.addIssue({ code: "custom", message: "Files must use a valid HTTP or HTTPS URL." }); if (typeof node.attrs?.name !== "string" || node.attrs.name.length > 255) context.addIssue({ code: "custom", message: "File name is invalid." }); if (typeof node.attrs?.mimeType !== "string" || node.attrs.mimeType.length > 128) context.addIssue({ code: "custom", message: "File type is invalid." }); if (node.attrs?.display !== undefined && !["link", "download", "preview", "inline", "card"].includes(String(node.attrs.display))) context.addIssue({ code: "custom", message: "File display mode is invalid." }); if (node.attrs?.size != null && (typeof node.attrs.size !== "number" || !Number.isFinite(node.attrs.size) || node.attrs.size < 0)) context.addIssue({ code: "custom", message: "File size is invalid." }); }
  if (node.type === "videoEmbed" && !safeVideoUrl.safeParse(node.attrs?.src).success) context.addIssue({ code: "custom", message: "Video embeds must use a supported YouTube or Vimeo player URL." });
  if (node.type === "heading" && node.attrs?.level !== undefined && ![1, 2, 3].includes(Number(node.attrs.level))) context.addIssue({ code: "custom", message: "Heading level must be between 1 and 3." });
  if (Array.isArray(node.content)) {
    for (let index = 0; index < node.content.length; index++) {
      const result = contentNodeSchema.safeParse(node.content[index]);
      if (!result.success) {
        context.addIssue({
          code: "custom",
          path: ["content", index, ...(result.error.issues[0]?.path ?? [])],
          message: result.error.issues[0]?.message ?? "Invalid document node.",
        });
      }
    }
  }
}));

export const postSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500).default(""),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(12).default([]),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  publishDateMode: z.enum(["preserve", "now", "custom"]).optional().default("preserve"),
  thumbnail: z.union([safeUrl, z.literal(""), z.null()]).optional().transform((value) => value || null).default(null),
  content: z.object({ type: z.literal("doc"), content: z.array(contentNodeSchema).max(5000) }).passthrough(),
  status: z.enum(["draft", "published"]),
  unpublish: z.boolean().optional().default(false),
  visibility: z.enum(["public", "hidden"]).default("public"),
});
