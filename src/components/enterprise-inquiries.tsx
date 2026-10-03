"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch, type ApiUser, type EnterpriseInquiry } from "@/lib/api";
import { currentUserOptions } from "@/lib/session";
import { LinkButton } from "@/components/ui";

function utcInstant(value: string): string {
  return `${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC`;
}

export function canReadEnterpriseInquiries(user: ApiUser | null | undefined): boolean {
  return user?.staffRole === "staff" || user?.staffRole === "operator";
}

export function EnterpriseInquiries() {
  const user = useQuery(currentUserOptions);
  const allowed = canReadEnterpriseInquiries(user.data);
  const inquiries = useQuery({
    queryKey: ["staff-enterprise-inquiries", user.data?.id ?? "guest"],
    enabled: allowed,
    queryFn: async ({ signal }) => (await apiFetch<{ data: EnterpriseInquiry[] }>("/api/staff/enterprise-inquiries", { signal })).data,
  });

  return <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-8">
    <div className="workspace-intro">
      <p className="workspace-kicker">Staff</p>
      <h1 className="workspace-heading">Enterprise inquiries</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">Newest requests from the pricing page. Follow up with the contact directly.</p>
    </div>
    {user.isPending ? <p role="status" className="text-sm text-ink-muted">Checking your account…</p>
      : user.isError ? <p role="alert" className="text-sm text-danger">Could not load your account. Refresh the page and try again.</p>
        : !user.data ? <LinkButton href="/login?next=%2Fstaff%2Fenterprise-inquiries">Sign in</LinkButton>
          : !allowed ? <p role="alert" className="text-sm text-danger">Staff access required.</p>
            : inquiries.isPending ? <p role="status" className="text-sm text-ink-muted">Loading inquiries…</p>
              : inquiries.isError ? <p role="alert" className="text-sm text-danger">{inquiries.error.message}</p>
                : inquiries.data.length === 0 ? <p className="text-sm text-ink-muted">No Enterprise inquiries yet.</p>
                  : <ul className="space-y-4">
                    {inquiries.data.map((inquiry) => <li key={inquiry.id} className="space-y-2 rounded-[10px] border border-line bg-canvas-elevated p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-lg font-semibold text-ink">{inquiry.organizationName}</h2>
                        <p className="text-xs text-ink-muted">{utcInstant(inquiry.receivedAt)}</p>
                      </div>
                      <p className="text-sm text-ink">{inquiry.contactName}</p>
                      <a className="text-sm font-medium text-accent underline underline-offset-4" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                      {inquiry.requirements ? <p className="whitespace-pre-line text-sm leading-6 text-ink">{inquiry.requirements}</p> : null}
                    </li>)}
                  </ul>}
    <LinkButton href="/dashboard" variant="secondary">Back to dashboard</LinkButton>
  </main>;
}
