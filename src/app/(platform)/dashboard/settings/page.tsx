"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ensureCsrfCookie, type EmailPreferences, type NotificationSettings } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { Button, LinkButton } from "@/components/ui";
import { RetentionNotice } from "@/components/retention-notice";
import { AccountSecurity } from "@/components/account-security";

const preferences: Array<{ key: keyof EmailPreferences; label: string; detail: string }> = [
  { key: "auditCompleted", label: "Completed audits", detail: "A link to your results when a manual or scheduled audit finishes, including partial results." },
  { key: "auditFailed", label: "Failed audits", detail: "A notice when a manual or scheduled audit fails." },
];

export default function SettingsPage() {
  const user = useQuery(currentUserOptions);

  return (
    <main className="space-y-8">
      <div className="workspace-intro">
        <p className="workspace-kicker">Account / Notifications</p>
        <h1 className="workspace-heading">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">Choose which updates arrive at your account email.</p>
      </div>
      {user.isError ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-danger">Could not load your account.</p>
          <Button variant="secondary" onClick={() => void user.refetch()}>Retry</Button>
        </div>
      ) : user.isPending ? (
        <p className="text-sm text-ink-muted">Loading your account…</p>
      ) : user.data ? (
        <div key={user.data.id} className="space-y-8"><AccountSecurity accountId={user.data.id} /><EmailSettings accountId={user.data.id} /><RetentionNotice accountId={user.data.id} /></div>
      ) : (
        <LinkButton href="/login">Sign in to manage your account</LinkButton>
      )}
    </main>
  );
}

function EmailSettings({ accountId }: { accountId: string }) {
  const client = useQueryClient();
  const queryKey = ["notification-settings", accountId];
  const settings = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const result = await apiFetch<NotificationSettings>("/api/account/notifications", { signal });
      if (result.accountId !== accountId) throw new Error("Your account changed. Reload settings before saving.");
      return result;
    },
  });
  const update = useMutation({
    mutationFn: async (change: Partial<EmailPreferences>) => {
      await ensureCsrfCookie();
      return apiFetch<NotificationSettings>("/api/account/notifications", {
        method: "PATCH",
        body: JSON.stringify({ accountId, ...change }),
      });
    },
    onSuccess: (result) => {
      if (client.getQueryData(currentUserOptions.queryKey)?.id !== accountId || result.accountId !== accountId) return;
      client.setQueryData(queryKey, result);
    },
  });

  if (settings.isError) return (
    <div role="alert" className="space-y-3">
      <p className="text-sm text-danger">{settings.error.message}</p>
      <Button variant="secondary" onClick={() => void settings.refetch()}>Retry</Button>
    </div>
  );
  if (settings.isPending) return <p className="text-sm text-ink-muted">Loading email preferences…</p>;

  return (
    <section className="rounded-[10px] border border-line bg-canvas-elevated p-5">
      <h2 className="text-lg font-semibold text-ink">Email notifications</h2>
      <p className="mt-2 text-sm text-ink-muted">Send updates to <span className="break-all font-medium text-ink">{settings.data.email}</span>, the email on your account.</p>
      {!settings.data.deliveryEnabled && (
        <p role="status" className="mt-4 rounded-lg border border-line bg-canvas p-3 text-sm text-ink-muted">Email delivery is being configured. You can save your preferences now; messages are not being sent yet.</p>
      )}
      {!settings.data.emailVerified && <p role="status" className="mt-4 text-sm text-ink-muted">Your email must be verified before notifications can be sent.</p>}
      <fieldset disabled={update.isPending} className="mt-5 divide-y divide-line">
        <legend className="sr-only">Email preferences</legend>
        {preferences.map(({ key, label, detail }) => (
          <label key={key} className="flex cursor-pointer items-start gap-3 py-4">
            <input type="checkbox" className="mt-1 size-4 shrink-0 accent-accent" checked={(update.isPending ? update.variables?.[key] : undefined) ?? settings.data.preferences[key]}
              onChange={(event) => update.mutate({ [key]: event.target.checked })} aria-describedby={`preference-${key}`} />
            <span>
              <span className="block text-sm font-semibold text-ink">{label}</span>
              <span id={`preference-${key}`} className="mt-1 block text-sm text-ink-muted">{detail}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div aria-live="polite" className="min-h-6 text-sm text-ink-muted">
        {update.isPending ? "Saving…" : update.isError ? <span role="alert" className="text-danger">Could not save preferences. {update.error.message}</span> : update.isSuccess ? "Preferences saved." : "Changes save automatically."}
      </div>
      <p className="mt-4 text-sm text-ink-muted">Emails include a status update and a sign-in link. Source code and review details stay in your account.</p>
      <div className="mt-4"><LinkButton href="/me/schedules" variant="secondary">Manage optional schedule webhooks</LinkButton></div>
    </section>
  );
}
