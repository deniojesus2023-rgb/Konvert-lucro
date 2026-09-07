"use client";

import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";

export function AppHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      // Best-effort — the cookie's absence on the next request still redirects to /entrar.
    });
    router.push("/entrar");
  }

  return <SiteHeader context="Painel" actionLabel="Sair" onAction={() => void handleLogout()} />;
}
