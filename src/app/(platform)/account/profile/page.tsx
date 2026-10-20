"use client";

import { useQuery } from "@tanstack/react-query";
import { AccountPage } from "@/components/account-page";
import { ProfileSettings } from "@/components/profile-settings";
import { currentUserOptions } from "@/lib/session";

export default function AccountProfilePage() {
  const user = useQuery(currentUserOptions);
  return <AccountPage section="Profile" title="Profile" description="Your name and the email you sign in with.">
    {() => user.data ? <ProfileSettings user={user.data} /> : null}
  </AccountPage>;
}
