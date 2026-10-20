"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountPage } from "@/components/account-page";
import { LinkButton } from "@/components/ui";
import { apiFetch, ensureCsrfCookie, type ApiUser } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";

export default function ConfirmEmailChangePage() {
  return <AccountPage section="Profile" title="Confirm your new email" description="Finishing the email change you asked for.">
    {() => <ConfirmEmailChange />}
  </AccountPage>;
}

function ConfirmEmailChange() {
  const client = useQueryClient();
  // The layout script moved the token out of the URL before any other script ran.
  const [token] = useState(() => typeof window === "undefined" ? undefined : window.__skaleEmailChangeToken);
  // A query, not a mutation, so a remounted page reuses the one request instead of spending the single-use token twice.
  const change = useQuery({
    queryKey: ["email-change", token], enabled: Boolean(token), retry: false, staleTime: Infinity, gcTime: Infinity,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<ApiUser>("/api/account/email/confirm", { method: "POST", body: JSON.stringify({ token }) });
    },
  });
  useEffect(() => { if (change.data) client.setQueryData(currentUserOptions.queryKey, change.data); }, [change.data, client]);

  return <section className="rounded-[10px] border border-line bg-canvas-elevated p-5 space-y-4">
    {!token ? <p role="alert" className="text-sm text-danger">Open the link from your email again.</p>
      : change.isPending ? <p role="status" className="text-sm text-ink-muted">Changing your email…</p>
      : change.isError ? <p role="alert" className="text-sm text-danger">{change.error.message}</p>
      : <p role="status" className="text-sm text-ink">Your email is now <strong className="break-all">{change.data.email}</strong>. Use it to sign in from now on.</p>}
    {(!token || !change.isPending) && <LinkButton href="/account/profile" variant="secondary">Back to your profile</LinkButton>}
  </section>;
}
