"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ensureCsrfCookie, type ApiUser } from "@/lib/api";
import { setSessionUser } from "@/lib/session";
import { clearWorkspaceInvitation } from "@/lib/workspace-invitations";
import { AccountNavigation } from "@/components/account-navigation";

export function AccountMenu({ user }: { user: ApiUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try {
      await ensureCsrfCookie();
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
      await setSessionUser(queryClient, null);
      clearWorkspaceInvitation();
      toast.success("Signed out");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign out failed");
    } finally {
      setSigningOut(false);
    }
  }

  return <AccountNavigation
    key={`${user.id}:${pathname}`}
    user={user}
    settingsActive={pathname === "/account/settings"}
    inquiriesActive={pathname === "/staff/enterprise-inquiries"}
    signingOut={signingOut}
    onSignOut={() => void logout()}
  />;
}
