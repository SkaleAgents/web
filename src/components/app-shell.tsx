"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { LinkButton } from "@/components/ui";
import { AccountMenu } from "@/components/account-menu";
import { BrandLogo } from "@/components/brand";
import { ProductNavigation } from "@/components/product-navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasWorkspaceInvitation, WORKSPACE_INVITATION_PATH } from "@/lib/workspace-invitations";
import type { ApiUser } from "@/lib/api";

function SessionAccountAction({ user, pending }: { user: ApiUser | null | undefined; pending: boolean }) {
  if (pending) return <span role="status" aria-label="Checking account" className="h-9 w-20 animate-pulse rounded-[10px] bg-canvas" />;
  if (user) return <AccountMenu key={user.id} user={user} />;
  return <LinkButton href="/login" variant="secondary" className="px-3 py-1.5">Sign in</LinkButton>;
}

export function AppShell({ children, publicFooter }: { children: React.ReactNode; publicFooter: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const userQuery = useQuery(currentUserOptions);

  useEffect(() => {
    if (userQuery.data?.agreementRequired && pathname !== "/auth/agreements" &&
      (pathname === "/me" || pathname.startsWith("/me/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/org/") || pathname.startsWith("/staff/") || pathname.startsWith("/account/") || pathname === "/organizations")) {
      router.replace(`/auth/agreements?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (
      userQuery.data &&
      !userQuery.data.agreementRequired &&
      pathname !== WORKSPACE_INVITATION_PATH &&
      hasWorkspaceInvitation()
    ) {
      router.replace(WORKSPACE_INVITATION_PATH);
    }
  }, [pathname, router, userQuery.data]);

  const dashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/me" || pathname.startsWith("/me/") || pathname.startsWith("/org/") || pathname.startsWith("/account/") || pathname === "/organizations" ||
    pathname === "/staff" || pathname.startsWith("/staff/");
  const invitation = pathname === WORKSPACE_INVITATION_PATH;
  const authentication = ["/login", "/signup"].some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname.startsWith("/auth/");

  if (dashboard && userQuery.data?.agreementRequired) return <main className="px-6 py-16 text-center text-sm text-ink-muted" role="status">Opening account agreement…</main>;

  if (dashboard) return <div key={userQuery.data?.id ?? "guest"} className="flex min-h-0 flex-1 flex-col">{children}</div>;

  if (authentication) return (
    <div className="flex flex-1 flex-col">
      <div key={userQuery.data?.id ?? "guest"} className="flex flex-1 flex-col px-5">
        <div className="mx-auto w-full max-w-md pt-8"><BrandLogo /></div>
        {children}
      </div>
      <footer aria-label="Account page links" className="mx-auto w-full max-w-md px-5 pb-8 text-center text-sm text-ink-muted">
        <p>Prefer to look around first?</p>
        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-ink hover:underline underline-offset-4">Back to public site</Link>
          <Link href="/bot-directory" className="hover:text-ink hover:underline underline-offset-4">Browse the directory</Link>
          <Link href="/terms" className="hover:text-ink hover:underline underline-offset-4">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-ink hover:underline underline-offset-4">Privacy Policy</Link>
        </div>
        <div className="mt-5"><ThemeSwitcher side="top" /></div>
      </footer>
    </div>
  );

  if (invitation) return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-canvas-elevated">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <BrandLogo />
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="text-sm text-ink-muted hover:text-ink">Back to public site</Link>
            <ThemeSwitcher />
            <SessionAccountAction user={userQuery.data} pending={userQuery.isPending} />
          </div>
        </div>
      </header>
      <div key={userQuery.data?.id ?? "guest"} className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${pathname === "/" ? "homepage-shell" : ""}`}>
      <header className="border-b border-line border-t-2 border-t-accent bg-canvas-elevated">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="contents">
            <BrandLogo />
            <ProductNavigation key={pathname} />
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3 text-sm sm:ml-0">
            {userQuery.data && <LinkButton href="/me" variant="ghost" className="px-3 py-1.5">Dashboard</LinkButton>}
            <ThemeSwitcher />
            <SessionAccountAction user={userQuery.data} pending={userQuery.isPending} />
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
