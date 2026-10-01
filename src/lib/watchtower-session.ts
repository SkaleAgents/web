export function watchtowerSessionTitle(status: "open" | "closed"): string {
  return status === "open" ? "Live audit session" : "Closed audit session";
}
