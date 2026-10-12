import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/blog/better-auth";

export const runtime = "nodejs";
export const { GET, POST } = toNextJsHandler(auth);
