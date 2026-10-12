import Link from "next/link";
import { getAdminEmail } from "@/lib/blog/auth";

export async function AdminLink() {
  const authenticated = Boolean(await getAdminEmail());
  return <Link href={authenticated ? "/admin" : "/login?returnTo=%2Fadmin"} className="font-mono text-xs text-muted-foreground/60 transition-colors hover:text-primary">{authenticated ? "Admin dashboard" : "Admin"}</Link>;
}
