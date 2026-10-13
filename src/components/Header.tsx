import { getAdminEmail, getSignedInUser } from "@/lib/blog/auth";
import { HeaderClient } from "./HeaderClient";

interface HeaderProps { activeSection?: string; onNavigate?: (section: string) => void }

export async function Header({ activeSection, onNavigate }: HeaderProps) {
  const [user, adminEmail] = await Promise.all([getSignedInUser(), getAdminEmail()]);
  return <HeaderClient activeSection={activeSection} onNavigate={onNavigate} initialAuthState={{ signedIn: Boolean(user), authenticated: Boolean(adminEmail) }} />;
}
