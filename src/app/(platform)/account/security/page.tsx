"use client";

import { AccountPage } from "@/components/account-page";
import { AccountSecurity } from "@/components/account-security";

export default function AccountSecurityPage() {
  return <AccountPage section="Sign-in and security" title="Sign-in and security" description="Passkeys for signing in and for confirming deletes, access changes, and billing.">
    {(accountId) => <AccountSecurity accountId={accountId} />}
  </AccountPage>;
}
