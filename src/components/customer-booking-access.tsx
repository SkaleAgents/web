"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, type ApiUser } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton } from "@/components/ui";

const CustomerUserContext = createContext<ApiUser | null>(null);

export function useCustomerUser(): ApiUser {
  const user = useContext(CustomerUserContext);
  if (!user) throw new Error("Customer advisory pages require CustomerBookingAccess");
  return user;
}

export function CustomerBookingAccess({ children }: { children: React.ReactNode }) {
  const user = useQuery(currentUserOptions);

  if (user.isPending) return <p role="status" className="text-sm text-ink-muted">Checking your account…</p>;
  if (user.isError) return (
    <main className="space-y-4">
      <h1 className="workspace-heading">Unable to check your account</h1>
      <p role="alert" className="text-sm text-danger">{user.error.message}</p>
      <Button onClick={() => void user.refetch()} disabled={user.isFetching}>Try again</Button>
    </main>
  );
  if (!user.data) return (
    <main className="space-y-4">
      <h1 className="workspace-heading">Sign in to view advisory requests</h1>
      <p className="text-sm text-ink-muted">Your advisory requests are private to your account.</p>
      <LinkButton href="/login">Sign in</LinkButton>
    </main>
  );

  return <CustomerUserContext.Provider key={user.data.id} value={user.data}>{children}</CustomerUserContext.Provider>;
}

export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && [401, 403].includes(error.status);
}
