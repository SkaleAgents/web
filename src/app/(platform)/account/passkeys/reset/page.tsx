"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountPage } from "@/components/account-page";
import { LinkButton } from "@/components/ui";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";
import type { PasskeySettings } from "@/lib/email-auth";

export default function PasskeyResetPage() {
  return <AccountPage section="Passkeys" title="Reset your passkeys" description="Confirming the passkey reset you asked for.">
    {(accountId) => <ConfirmPasskeyReset accountId={accountId} />}
  </AccountPage>;
}

function ConfirmPasskeyReset({ accountId }: { accountId: string }) {
  const client = useQueryClient();
  // The layout script moved the token out of the URL before any other script ran.
  const [token] = useState(() => typeof window === "undefined" ? undefined : window.__skalePasskeyResetToken);
  // A query, not a mutation, so a remounted page does not spend the single-use token twice.
  const reset = useQuery({
    queryKey: ["passkey-reset", token], enabled: Boolean(token), retry: false, staleTime: Infinity, gcTime: Infinity,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
    queryFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<PasskeySettings>("/api/account/passkey-reset/confirm", { method: "POST", body: JSON.stringify({ token }) });
    },
  });
  useEffect(() => { if (reset.data?.accountId === accountId) client.setQueryData(["account-security", accountId], reset.data); }, [reset.data, accountId, client]);

  return <section className="rounded-[10px] border border-line bg-canvas-elevated p-5 space-y-4">
    {!token ? <p role="alert" className="text-sm text-danger">Open the link from your email again.</p>
      : reset.isPending ? <p role="status" className="text-sm text-ink-muted">Scheduling your passkey reset…</p>
      : reset.isError ? <p role="alert" className="text-sm text-danger">{reset.error.message}</p>
      : <p role="status" className="text-sm text-ink">Every passkey will be removed on {reset.data.resetAt ? new Date(reset.data.resetAt).toLocaleString() : "the next check"}. Other browsers were signed out. You can cancel in Settings until then.</p>}
    {(!token || !reset.isPending) && <LinkButton href="/account/passkeys" variant="secondary">Back to passkeys</LinkButton>}
  </section>;
}
