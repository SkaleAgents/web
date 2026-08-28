import { NextRequest, NextResponse } from "next/server";

const APP_HOSTS = new Set(
  (process.env.APP_HOSTS ?? "app.localhost,app.skaleagents.com,localhost")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

const MARKETING_HOSTS = new Set(
  (process.env.MARKETING_HOSTS ?? "skaleagents.com,www.skaleagents.com")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

function hostWithoutPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? host.toLowerCase();
}

export function middleware(request: NextRequest) {
  const host = hostWithoutPort(request.headers.get("host") ?? "");
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Already under a site prefix
  if (pathname.startsWith("/app") || pathname.startsWith("/marketing")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (MARKETING_HOSTS.has(host)) {
    url.pathname = pathname === "/" ? "/marketing" : `/marketing${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Default local + app hosts → product UI
  if (APP_HOSTS.has(host) || host.endsWith(".ts.net") || host === "127.0.0.1") {
    url.pathname = pathname === "/" ? "/app" : `/app${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Fallback: marketing for unknown public hosts
  url.pathname = pathname === "/" ? "/marketing" : `/marketing${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
