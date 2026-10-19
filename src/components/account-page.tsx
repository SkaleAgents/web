"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton } from "./ui";

// Shared frame for the personal Account pages; children get the signed-in account id.
export function AccountPage({ section, title, description, children }: { section: string; title: string; description: string; children: (accountId: string) => ReactNode }) {
  const user = useQuery(currentUserOptions);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Account / {section}</p>
        <h1 className="workspace-heading">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>
      </div>
      {user.isError ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-danger">Could not load your account.</p>
          <Button variant="secondary" onClick={() => void user.refetch()}>Retry</Button>
        </div>
      ) : user.isPending ? (
        <p className="text-sm text-ink-muted">Loading your account…</p>
      ) : user.data ? (
        <div key={user.data.id} className="space-y-8">{children(user.data.id)}</div>
      ) : (
        <LinkButton href="/login">Sign in to manage your account</LinkButton>
      )}
    </main>
  );
}
