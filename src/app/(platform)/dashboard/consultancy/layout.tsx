import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultancy bookings | SkaleAgents",
  robots: { index: false, follow: false },
};

export default function ConsultancyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
