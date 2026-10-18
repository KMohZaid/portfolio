import { NextResponse } from "next/server";
import { getSignedInUser } from "@/lib/blog/auth";
import { query } from "@/lib/blog/db";

export async function GET() {
  const user = await getSignedInUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rows } = await query<{ id: string; post_id: string; title: string; slug: string; amount_paise: number; paid_at: Date | string; access_expires_at: Date | string | null }>(`SELECT p.id,p.post_id,b.title,b.slug,p.amount_paise,p.paid_at,p.access_expires_at
      FROM blog_purchases p JOIN blog_posts b ON b.id=p.post_id
      WHERE p.user_id=$1 AND p.status='paid' ORDER BY p.paid_at DESC`, [user.id]);
    return NextResponse.json({ purchases: rows.map((row) => ({ id: row.id, postId: row.post_id, title: row.title, slug: row.slug, amountPaise: Number(row.amount_paise), paidAt: row.paid_at, accessExpiresAt: row.access_expires_at })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load purchases." }, { status: 503 }); }
}
