import { OrganizationScopeContent } from "@/components/organization-scope-content";

export default function PersonalOrganizationLayout({ children }: { children: React.ReactNode }) {
  return <OrganizationScopeContent personal={children} />;
}
