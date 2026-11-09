import { ApiError } from "@/lib/api";

export type GithubInstallation = { connected: boolean; pullRequestReviews?: boolean; accountLogin?: string | null; repositorySelection?: "all" | "selected" | null; suspended?: boolean };
export type GithubRepository = { id: number; fullName: string; private: boolean; defaultBranch: string };
export type GithubRepositoryPage = { repositories: GithubRepository[]; nextPage: number | null };

export const SUSPENDED_MESSAGE = "GitHub suspended the installation; resume it on GitHub.";

/** Short plain text for the API errors this feature can return. */
export function githubErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : "Something went wrong. Try again.";
  if (error.code === "github_suspended") return SUSPENDED_MESSAGE;
  if (error.code === "github_not_connected") return "GitHub is not connected. Connect it and try again.";
  if (error.code === "github_unavailable") return "GitHub is unavailable right now. Try again in a minute.";
  if (error.code === "premium_required") return "Scanning GitHub is on paid plans. Upgrade to use it.";
  if (error.code === "audit_limit_reached" || error.status === 429) return "You've used all your audits this period.";
  return error.message;
}

/** True when the failure should offer the Upgrade link. */
export const needsUpgrade = (error: unknown) => error instanceof ApiError && (error.code === "premium_required" || error.code === "audit_limit_reached" || error.status === 429);

export const githubRef = (fullName: string, branch: string) => `github:${fullName}@${branch}`;

/** Wrapped so tests can observe the hand-off to GitHub. */
export function goTo(url: string) {
  window.location.assign(url);
}

export const SKIP_REASONS: Record<string, string> = {
  too_large: "over 256 KiB",
  over_file_limit: "over the 50-file limit",
  over_total_limit: "over the 2 MiB total",
  unsupported: "not a supported format",
  fetch_failed: "could not be read",
};
