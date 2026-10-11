import { z } from "zod";

const safeUrl = z.string().max(2048).refine((value) => { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }, "Image URLs must use HTTP or HTTPS.");
const textNodeSchema = z.object({ type: z.literal("text"), text: z.string().max(50000), marks: z.array(z.object({ type: z.string(), attrs: z.record(z.string(), z.unknown()).optional() }).passthrough()).max(20).optional() }).passthrough();
const contentNodeSchema: z.ZodType<unknown> = z.lazy(() => z.object({ type: z.string().max(40), text: z.string().max(50000).optional(), attrs: z.record(z.string(), z.unknown()).optional(), marks: z.array(z.object({ type: z.string(), attrs: z.record(z.string(), z.unknown()).optional() }).passthrough()).max(20).optional(), content: z.array(z.unknown()).max(5000).optional() }).passthrough().superRefine((node, context) => {
  if (node.type === "text" && typeof node.text !== "string") context.addIssue({ code: "custom", message: "Text nodes must contain text." });
  if (node.type === "image") { const source = node.attrs?.src; if (typeof source !== "string" || !safeUrl.safeParse(source).success) context.addIssue({ code: "custom", message: "Images must use a valid HTTP or HTTPS URL." }); }
  if (node.type === "heading" && ![1, 2, 3].includes(Number(node.attrs?.level))) context.addIssue({ code: "custom", message: "Heading level must be between 1 and 3." });
  for (const child of (node.content ?? []) as unknown[]) { const result = contentNodeSchema.safeParse(child); if (!result.success) context.addIssue({ code: "custom", message: result.error.issues[0]?.message ?? "Invalid document node." }); }
}));

export const postSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500).default(""),
  content: z.object({ type: z.literal("doc"), content: z.array(contentNodeSchema).max(5000) }).passthrough(),
  status: z.enum(["draft", "published"]),
});
