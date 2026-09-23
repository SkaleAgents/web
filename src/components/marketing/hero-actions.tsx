"use client";

import { useQuery } from "@tanstack/react-query";
import { type ApiUser } from "@/lib/api";
import { GetStartedButton } from "@/components/get-started-button";
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
        {user ? <LinkButton href="/settings" variant="secondary" className="px-5 py-3">Connect MCP</LinkButton> : <GetStartedButton variant="secondary" className="px-5 py-3" />}
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        {user ? `Welcome back, ${user.displayName}. Pick up a workflow below.` : "Public bots and prompts. No account needed to browse."}
      </p>
    </div>
  );
}
