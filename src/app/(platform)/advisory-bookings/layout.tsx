import type { Metadata } from "next";
import { CustomerBookingAccess } from "@/components/customer-booking-access";

export const metadata: Metadata = {
  title: "Advisory requests | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function AdvisoryBookingsLayout({ children }: { children: React.ReactNode }) {
  return <CustomerBookingAccess>{children}</CustomerBookingAccess>;
}
