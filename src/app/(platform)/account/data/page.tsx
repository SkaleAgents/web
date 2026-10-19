"use client";

import { AccountPage } from "@/components/account-page";
import { RetentionNotice } from "@/components/retention-notice";
import { DeleteAccount } from "@/components/delete-account";

export default function AccountDataPage() {
  return <AccountPage section="Data and privacy" title="Data and privacy" description="How long your audit data is kept, and your account itself.">
    {(accountId) => <><RetentionNotice accountId={accountId} /><DeleteAccount accountId={accountId} /></>}
  </AccountPage>;
}
