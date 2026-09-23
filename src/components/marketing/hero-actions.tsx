"use client";

import { useQuery } from "@tanstack/react-query";
import { googleSignInHref, type ApiUser } from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { LinkButton } from "@/components/ui";

export function HeroActions() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";
      const response = await fetch(`${apiUrl}/api/user`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error(response.statusText);
      return response.json() as Promise<ApiUser>;
    },
  });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/bots" className="px-5 py-3">
          Explore the directory <span aria-hidden="true" className="ml-3">↗</span>
        </LinkButton>
        <LinkButton href={user ? "/settings" : googleSignInHref()} variant="secondary" className="px-5 py-3">
          {user ? "Connect MCP" : <GoogleSignInLabel>Get started</GoogleSignInLabel>}
        </LinkButton>
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        {user ? `Welcome back, ${user.displayName}. Pick up a workflow below.` : "Public bots and prompts. No account needed to browse."}
      </p>
    </div>
  );
}
