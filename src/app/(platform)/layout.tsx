import { PlatformShell } from "@/components/platform-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
