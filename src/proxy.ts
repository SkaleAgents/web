import { NextResponse, type NextRequest } from "next/server";
import { markdownInternalPath } from "@/lib/markdown-path";
import { CONSULTANCY_BOOKING_URL } from "@/lib/consultancy-link";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/reviews/s/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const internal = markdownInternalPath(request.nextUrl.pathname);
  if (internal) {
    return NextResponse.rewrite(new URL(internal, request.url));
  }
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
    "/:path*.md",
    "/index.md",
    "/consultancy/:path*",
    "/advisory-bookings/:path*",
    "/dashboard/consultancy/:path*",
    "/dashboard/advisory-bookings/:path*",
    "/me/consultancy/:path*",
    "/me/advisory-bookings/:path*",
    "/org/:workspaceId/consultancy/:path*",
    "/org/:workspaceId/advisory-bookings/:path*",
    "/reviews/s/:token",
  ],
};
