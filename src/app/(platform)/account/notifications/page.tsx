"use client";

import { AccountPage } from "@/components/account-page";
import { EmailSettings } from "@/components/email-settings";

export default function AccountNotificationsPage() {
  return <AccountPage section="Notifications" title="Notifications" description="Choose which updates arrive at your account email.">
    {(accountId) => <EmailSettings accountId={accountId} />}
  </AccountPage>;
}
