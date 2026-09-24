import type { Metadata } from "next";
import { StaffAccess } from "@/components/staff-access";

export const metadata: Metadata = {
  title: "Staff bookings | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffAccess>{children}</StaffAccess>;
}
