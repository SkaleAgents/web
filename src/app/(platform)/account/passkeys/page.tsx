"use client";

import { AccountPage } from "@/components/account-page";
import { AccountSecurity } from "@/components/account-security";

export default function AccountPasskeysPage() {
  return <AccountPage section="Passkeys" title="Passkeys" description="Set up passkeys to sign in and to confirm deletes, access changes, and billing.">
    {(accountId) => <AccountSecurity accountId={accountId} />}
  </AccountPage>;
}
