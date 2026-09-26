"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, ApiError, type ApiUser } from "@/lib/api";
import { isStaff } from "@/lib/advisory-bookings";
import { Button, LinkButton } from "@/components/ui";

const StaffUserContext = createContext<string | null>(null);

export function useStaffUserId(): string {
  const id = useContext(StaffUserContext);
  if (!id) throw new Error("Staff pages require StaffAccess");
  return id;
}

export function StaffAccess({ children }: { children: React.ReactNode }) {
  const user = useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiUser | null> => {
      try {
        return await apiFetch<ApiUser>("/api/user");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 0,
    retry: false,
  });

  if (user.isPending) return <p role="status" className="text-sm text-ink-muted">Checking staff access…</p>;
  if (user.isError) return (
    <main className="space-y-4">
      <h1 className="workspace-heading">Unable to check access</h1>
      <p role="alert" className="text-sm text-danger">{user.error.message}</p>
      <Button onClick={() => void user.refetch()} disabled={user.isFetching}>Try again</Button>
    </main>
  );
  if (!user.data) return (
    <main className="space-y-4">
      <h1 className="workspace-heading">Sign in to manage bookings</h1>
      <p className="text-sm text-ink-muted">This area is for staff and operators.</p>
      <LinkButton href="/login">Sign in</LinkButton>
    </main>
  );
  if (!isStaff(user.data)) return (
    <main className="space-y-4">
      <h1 className="workspace-heading">Staff access required</h1>
      <p className="text-sm text-ink-muted">Your account does not have access to advisory booking operations.</p>
      <LinkButton href="/dashboard/jobs" variant="secondary">Back to audits</LinkButton>
    </main>
  );

  return <StaffUserContext.Provider key={user.data.id} value={user.data.id}>{children}</StaffUserContext.Provider>;
}
