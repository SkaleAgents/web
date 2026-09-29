"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Button, Select, TextInput } from "@/components/ui";
import { apiFetch, ensureCsrfCookie } from "@/lib/api";

type Role = "owner" | "member" | "viewer";
type Organization = { id: string; name: string; role: Role };
type Member = { userId: string; email: string; name: string; role: Role; joinedAt: string };
type Invitation = { id: string; email: string; role: "member" | "viewer"; expiresAt: string; status: "pending" };

export function OrganizationSettingsManager({ organization, accountId }: { organization: Organization; accountId: string }) {
  const client = useQueryClient();
  const workspaceId = organization.id;
  const root = `/api/workspaces/${workspaceId}`;
  const memberKey = ["organization-members", accountId, workspaceId];
  const invitationKey = ["organization-invitations", accountId, workspaceId];
  const owner = organization.role === "owner";
  const [name, setName] = useState(organization.name);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "viewer">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const members = useQuery({
    queryKey: memberKey,
    enabled: owner,
    queryFn: async ({ signal }) => (await apiFetch<{ data: Member[] }>(`${root}/members`, { signal })).data,
  });
  const invitations = useQuery({
    queryKey: invitationKey,
    enabled: owner,
    queryFn: async ({ signal }) => (await apiFetch<{ data: Invitation[] }>(`${root}/invitations`, { signal })).data,
  });

  async function change(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await ensureCsrfCookie();
      await action();
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName.length > 120) {
      setError("Enter an organization name of up to 120 characters.");
      return;
    }
    void change(async () => {
      const response = await apiFetch<{ data: Organization }>(root, { method: "PATCH", body: JSON.stringify({ name: nextName }) });
      if (client.getQueryData<{ id: string }>(["user"])?.id !== accountId) return;
      client.setQueryData(["organization", accountId, workspaceId], response.data);
      client.setQueryData<Organization[]>(["workspaces", accountId], current => current?.map(item => item.id === workspaceId ? { ...item, name: response.data.name } : item));
      setName(response.data.name);
    }, "Organization name saved.");
  }

  function sendInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    void change(async () => {
      const response = await apiFetch<{ data: Invitation }>(`${root}/invitations`, { method: "POST", body: JSON.stringify({ email, role: inviteRole }) });
      if (client.getQueryData<{ id: string }>(["user"])?.id !== accountId) return;
      client.setQueryData<Invitation[]>(invitationKey, current => [...(current ?? []).filter(item => item.email !== response.data.email), response.data]);
      setInviteEmail("");
    }, "Invitation sent.");
  }

  return <>
    <section className="rounded-lg border border-line bg-canvas-elevated p-5" aria-label="Organization details">
      <h2 className="font-semibold">{organization.name}</h2>
      <p className="mt-1 text-sm text-ink-muted">Your role: {organization.role}</p>
      <p className="mt-3 break-all text-xs text-ink-muted">Organization ID: {workspaceId}</p>
      {owner && <form onSubmit={saveName} className="mt-5 max-w-lg">
        <label htmlFor="organization-name" className="block text-sm font-medium">Organization name</label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TextInput id="organization-name" value={name} onChange={event => setName(event.target.value)} maxLength={120} required className="min-w-48 flex-1" />
          <Button type="submit" disabled={busy || !name.trim() || name.trim() === organization.name}>Save name</Button>
        </div>
      </form>}
    </section>
    {owner && <>
      <section className="space-y-4 rounded-lg border border-line bg-canvas-elevated p-5" aria-labelledby="organization-members-heading">
        <h2 id="organization-members-heading" className="font-semibold">Members</h2>
        {members.isPending && <p role="status">Loading members…</p>}
        {members.isError && <p role="alert">Could not load members. <Button type="button" variant="secondary" onClick={() => void members.refetch()}>Retry</Button></p>}
        {members.data && <ul className="divide-y divide-line">{members.data.map(member => <li key={member.userId} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="font-medium">{member.name}</p><p className="break-all text-sm text-ink-muted">{member.email}</p></div>
          {member.role === "owner" ? <span className="text-sm text-ink-muted">Owner</span> : <>
            <label className="sr-only" htmlFor={`member-role-${member.userId}`}>Role for {member.email}</label>
            <Select id={`member-role-${member.userId}`} value={member.role} disabled={busy} onChange={event => {
              const role = event.target.value as "member" | "viewer";
              void change(async () => {
                await apiFetch(`${root}/members/${member.userId}`, { method: "PATCH", body: JSON.stringify({ role }) });
                client.setQueryData<Member[]>(memberKey, current => current?.map(item => item.userId === member.userId ? { ...item, role } : item));
              }, "Member role saved.");
            }}><option value="member">Member</option><option value="viewer">Viewer</option></Select>
            <Button type="button" variant="secondary" disabled={busy} aria-label={`Remove ${member.email}`} onClick={() => void change(async () => {
              await apiFetch(`${root}/members/${member.userId}`, { method: "DELETE" });
              client.setQueryData<Member[]>(memberKey, current => current?.filter(item => item.userId !== member.userId));
            }, "Member removed.")}>Remove</Button>
          </>}
        </li>)}</ul>}
      </section>
      <section className="space-y-4 rounded-lg border border-line bg-canvas-elevated p-5" aria-labelledby="organization-invitations-heading">
        <h2 id="organization-invitations-heading" className="font-semibold">Invitations</h2>
        <form onSubmit={sendInvitation} className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1"><label htmlFor="invite-email" className="block text-sm font-medium">Invite email</label><TextInput id="invite-email" className="mt-2" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} required /></div>
          <div><label htmlFor="invite-role" className="block text-sm font-medium">Invite role</label><Select id="invite-role" className="mt-2" value={inviteRole} onChange={event => setInviteRole(event.target.value as "member" | "viewer")}><option value="member">Member</option><option value="viewer">Viewer</option></Select></div>
          <Button type="submit" disabled={busy || !inviteEmail.trim()}>Send invitation</Button>
        </form>
        {invitations.isPending && <p role="status">Loading invitations…</p>}
        {invitations.isError && <p role="alert">Could not load invitations. <Button type="button" variant="secondary" onClick={() => void invitations.refetch()}>Retry</Button></p>}
        {invitations.data?.length === 0 && <p className="text-sm text-ink-muted">No pending invitations.</p>}
        {invitations.data && <ul className="divide-y divide-line">{invitations.data.map(invitation => <li key={invitation.id} className="flex flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1"><p className="break-all font-medium">{invitation.email}</p><p className="text-sm text-ink-muted">{invitation.role} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div>
          <Button type="button" variant="secondary" disabled={busy} aria-label={`Revoke invitation for ${invitation.email}`} onClick={() => void change(async () => {
            await apiFetch(`${root}/invitations/${invitation.id}`, { method: "DELETE" });
            client.setQueryData<Invitation[]>(invitationKey, current => current?.filter(item => item.id !== invitation.id));
          }, "Invitation revoked.")}>Revoke</Button>
        </li>)}</ul>}
      </section>
    </>}
    {notice && <p role="status" className="text-sm text-success">{notice}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </>;
}
