import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/blog/auth";
import { setPostVisibility } from "@/lib/blog/posts";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    if (body.visibility !== "public" && body.visibility !== "hidden") return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
    const post = await setPostVisibility(id, body.visibility);
    return post ? NextResponse.json({ post }) : NextResponse.json({ error: "Post not found" }, { status: 404 });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Unable to update post visibility." }, { status: unauthorized ? 401 : 503 });
  }
}
