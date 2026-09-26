export function dashboardDestination(value: string | null): string {
  if (!value) return "/dashboard";
  try {
    const base = "https://skaleagents.com";
    const url = new URL(value, base);
    if (url.origin === base && (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/"))) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch { /* Use the dashboard for invalid destinations. */ }
  return "/dashboard";
}
