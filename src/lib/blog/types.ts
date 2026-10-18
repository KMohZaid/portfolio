import type { JSONContent } from "@domternal/core";

export type BlogPost = {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  thumbnail: string | null;
  content: JSONContent;
  status: "draft" | "published";
  visibility: "public" | "hidden";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type BlogUpload = {
  _id?: string;
  url: string;
  filename: string;
  mimeType?: string;
  size: number;
  createdAt: string;
  removedAt?: string;
};
