"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import { currentUserOptions, setSessionUser } from "@/lib/session";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/brand";
import { ProductNavigation } from "@/components/product-navigation";
import { isStaff } from "@/lib/advisory-bookings";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userQuery = useQuery(currentUserOptions);
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try {
      await ensureCsrfCookie();
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
      await setSessionUser(queryClient, null);
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
          <div className="flex items-center gap-3 text-sm">
            {userQuery.isPending ? (
              <span className="text-ink-muted">…</span>
            ) : userQuery.data ? (
              <>
                <span className="text-ink-muted">
                  {userQuery.data.displayName}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-2 py-1"
                  disabled={signingOut}
                  onClick={() => void logout()}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <GoogleSignInButton />
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
