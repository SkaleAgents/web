"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, type ApiUser, ensureCsrfCookie } from "@/lib/api";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/bots", label: "Bots" },
  { href: "/app/login", label: "Sign in" },
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
      toast.success("Signed out");
      router.push("/app/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-semibold tracking-tight">
              SkaleAgents
            </Link>
            <nav className="flex gap-3 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href ||
                    (item.href !== "/app" &&
                      pathname.startsWith(`${item.href}/`))
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {userQuery.data ? (
              <>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {userQuery.data.displayName}
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/app/login"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
