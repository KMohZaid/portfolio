import { NextResponse } from "next/server";
import { getSignedInUser, getAdminEmail } from "@/lib/blog/auth";

export async function GET() {
  const [user, adminEmail] = await Promise.all([getSignedInUser(), getAdminEmail()]);
  return NextResponse.json({ authenticated: Boolean(adminEmail), signedIn: Boolean(user), user: user ? { name: user.name, email: user.email, image: user.image } : null }, { headers: { "Cache-Control": "no-store" } });
}
