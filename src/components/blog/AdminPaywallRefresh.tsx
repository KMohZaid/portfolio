"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminPaywallRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { window.setTimeout(() => router.refresh(), 0); };
    window.addEventListener("paywall-settings-saved", refresh);
    return () => window.removeEventListener("paywall-settings-saved", refresh);
  }, [router]);
  return null;
}
