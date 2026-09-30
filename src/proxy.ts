import { NextResponse } from "next/server";
import { CONSULTANCY_BOOKING_URL } from "@/lib/consultancy-link";

export function proxy() {
  // A new fixed URL deliberately drops all private path and query data.
  // Use 303 so obsolete form submissions cannot forward their body externally.
  // A fixed fragment prevents inheritance; Next.js normalizes away an empty one.
  const response = NextResponse.redirect(`${CONSULTANCY_BOOKING_URL}#booking`, 303);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/consultancy/:path*",
    "/advisory-bookings/:path*",
    "/dashboard/consultancy/:path*",
    "/dashboard/advisory-bookings/:path*",
    "/me/consultancy/:path*",
    "/me/advisory-bookings/:path*",
    "/org/:workspaceId/consultancy/:path*",
    "/org/:workspaceId/advisory-bookings/:path*",
  ],
};
