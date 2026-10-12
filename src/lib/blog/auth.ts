import { headers } from "next/headers";
import { auth } from "./better-auth";

export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function getSignedInUser() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch {
    return null;
  }
}

export async function getProviderAccounts() {
  try {
    return await auth.api.listUserAccounts({ headers: await headers() });
  } catch {
    return [];
  }
}

export async function getAdminEmail(): Promise<string | null> {
  const user = await getSignedInUser();
  const email = user?.email?.trim().toLowerCase();
  return email && user.emailVerified && allowedEmails().includes(email) ? email : null;
}

export async function requireAdmin() {
  const email = await getAdminEmail();
  if (!email) throw new Error("Unauthorized");
  return email;
}
