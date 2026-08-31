"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, type ApiUser, ensureCsrfCookie } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/bots", label: "Directory" },
  { href: "/app/studio", label: "Studio" },
  { href: "/app/prompts", label: "Prompts" },
  { href: "/app/settings", label: "API tokens" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";
      const res = await fetch(`${API_URL}/api/user`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(res.statusText);
      return res.json() as Promise<ApiUser>;
    },
    staleTime: 45_000,
    refetchOnWindowFocus: true,
  });

  async function logout() {
    try {
      await ensureCsrfCookie();
      await apiFetch("/api/auth/logout", { method: "POST", body: "{}" });
      queryClient.setQueryData(["user"], null);
      void queryClient.removeQueries({ queryKey: ["prompts"] });
      toast.success("Signed out");
      router.push("/app/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line border-t-2 border-t-accent bg-canvas-elevated">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/app"
              className="font-display text-lg font-bold tracking-tight text-ink"
            >
              SkaleAgents
            </Link>
            <nav className="flex gap-3 text-sm">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/app" &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "text-ink shadow-[inset_0_-2px_0_0_var(--accent)]"
                        : "text-ink-muted hover:text-ink"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
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
                  onClick={() => void logout()}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <LinkButton href="/app/login" className="px-3 py-1.5">
                Sign in
              </LinkButton>
            )}
          </div>
        </div>
      </header>
      <div className="motion-enter mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </div>
    </div>
  );
}
