"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, type ApiUser, ensureCsrfCookie } from "@/lib/api";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui";
import { BrandLogo } from "@/components/brand";
import { ProductNavigation } from "@/components/product-navigation";

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
      void queryClient.removeQueries({ queryKey: ["api-tokens"] });
      void queryClient.removeQueries({ queryKey: ["mcp-connections"] });
      toast.success("Signed out");
      router.push("/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line border-t-2 border-t-accent bg-canvas-elevated">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="contents">
            <BrandLogo />
            <ProductNavigation key={pathname} />
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
              <GoogleSignInButton />
            )}
          </div>
        </div>
      </header>
      <div className={
        pathname === "/login" || pathname === "/"
          ? "flex flex-1 flex-col"
          : "motion-enter mx-auto w-full max-w-5xl flex-1 px-6 py-8"
      }>
        {children}
      </div>
    </div>
  );
}
