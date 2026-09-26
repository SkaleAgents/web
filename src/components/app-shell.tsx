"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions, setSessionUser } from "@/lib/session";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LinkButton } from "@/components/ui";
import { AccountNavigation } from "@/components/account-navigation";
import { BrandLogo } from "@/components/brand";
import { ProductNavigation } from "@/components/product-navigation";
import { isStaff } from "@/lib/advisory-bookings";
import { clearWorkspaceInvitation, hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userQuery = useQuery(currentUserOptions);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (
      userQuery.data &&
      pathname !== WORKSPACE_INVITATION_PATH &&
      hasWorkspaceInvitation()
    ) {
      router.replace(WORKSPACE_INVITATION_PATH);
    }
  }, [pathname, router, userQuery.data]);

  async function logout() {
    setSigningOut(true);
    try {
      await ensureCsrfCookie();
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
      await setSessionUser(queryClient, null);
      clearWorkspaceInvitation();
      toast.success("Signed out");
      router.push("/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line border-t-2 border-t-accent bg-canvas-elevated">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="contents">
            <BrandLogo />
            <ProductNavigation key={pathname} staff={isStaff(userQuery.data) && !userQuery.isError} />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm sm:ml-0">
            {userQuery.isPending ? (
              <span className="text-ink-muted">…</span>
            ) : userQuery.data ? (
              <AccountNavigation
                key={`${userQuery.data.id}:${pathname}`}
                user={userQuery.data}
                settingsActive={pathname === "/settings"}
                signingOut={signingOut}
                onSignOut={() => void logout()}
              />
            ) : (
              process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true" ? <GoogleSignInButton /> : <LinkButton href="/login" className="px-3 py-1.5">Sign in</LinkButton>
            )}
          </div>
        </div>
      </header>
      <div key={userQuery.data?.id ?? "guest"} className={
        pathname === "/login" || pathname === "/"
          ? "flex flex-1 flex-col"
          : "motion-enter mx-auto w-full max-w-5xl flex-1 px-6 py-8"
      }>
        {children}
      </div>
    </div>
  );
}
