"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LinkButton } from "@/components/ui";
import { AccountMenu } from "@/components/account-menu";
import { BrandLogo } from "@/components/brand";
import { ProductNavigation } from "@/components/product-navigation";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";

export function AppShell({ children, publicFooter }: { children: React.ReactNode; publicFooter: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const userQuery = useQuery(currentUserOptions);

  useEffect(() => {
    if (
      userQuery.data &&
      pathname !== WORKSPACE_INVITATION_PATH &&
      hasWorkspaceInvitation()
    ) {
      router.replace(WORKSPACE_INVITATION_PATH);
    }
  }, [pathname, router, userQuery.data]);

  const dashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const invitation = pathname === WORKSPACE_INVITATION_PATH;
  const authentication = pathname === "/login" || pathname.startsWith("/auth/") || invitation;

  if (dashboard) return <div key={userQuery.data?.id ?? "guest"} className="flex min-h-0 flex-1 flex-col">{children}</div>;

  if (authentication) return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-canvas-elevated">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <BrandLogo />
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="text-sm text-ink-muted hover:text-ink">Back to public site</Link>
            {invitation && userQuery.data && <AccountMenu key={userQuery.data.id} user={userQuery.data} />}
          </div>
        </div>
      </header>
      <div key={userQuery.data?.id ?? "guest"} className={invitation
        ? "mx-auto w-full max-w-5xl flex-1 px-6 py-8"
        : "flex flex-1 flex-col"}>{children}</div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line border-t-2 border-t-accent bg-canvas-elevated">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="contents">
            <BrandLogo />
            <ProductNavigation key={pathname} />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm sm:ml-0">
            <LinkButton href="/dashboard" variant="ghost" className="px-3 py-1.5">Dashboard</LinkButton>
            {userQuery.isPending ? (
              <span className="text-ink-muted">…</span>
            ) : userQuery.data ? (
              <AccountMenu key={userQuery.data.id} user={userQuery.data} />
            ) : (
              process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true" ? <GoogleSignInButton /> : <LinkButton href="/login" className="px-3 py-1.5">Sign in</LinkButton>
            )}
          </div>
        </div>
      </header>
      <div key={userQuery.data?.id ?? "guest"} className={
        pathname === "/"
          ? "flex flex-1 flex-col"
          : "motion-enter mx-auto w-full max-w-5xl flex-1 px-6 py-8"
      }>
        {children}
      </div>
      {publicFooter}
    </div>
  );
}
