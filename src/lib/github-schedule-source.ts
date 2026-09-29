export type GithubScheduleFormat = "terraform" | "cloudformation" | "kubernetes" | "auto";

export function buildGithubScheduleScope(repository: string, path: string, branch: string, format: GithubScheduleFormat) {
  const location = repository.trim();
  const file = path.trim();
  const target = branch.trim();
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9_.-]{1,100}$/.test(location)
    || [".", ".."].includes(location.split("/")[1])
    || !/^[A-Za-z0-9_./-]{1,255}$/.test(file)
    || !/^[A-Za-z0-9_./-]{1,100}$/.test(target)
    || [file, target].some(value => value.startsWith("/") || value.endsWith("/") || value.includes("//") || value.split("/").some(part => part === "." || part === ".."))) {
    throw new Error("Enter a public repository as owner/repository, a file path, and a branch.");
  }

  return { kind: "repo_ref" as const, format, ref: `github:${location}:${file}@${target}` };
}
