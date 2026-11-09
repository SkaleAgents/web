import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "web";
export default defineRailway(() => {
  const web = service("web", {
    source: github("SkaleAgents/web", { branch: "main", checkSuites: false }),
    build: { buildCommand: "pnpm install --frozen-lockfile && pnpm build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "pnpm start",
    healthcheck: "/",
    healthcheckTimeout: 120,
    // railway config migrate drops this setting from railway.toml.
    deploy: { restartPolicyType: "ALWAYS" },
    replicas: { "us-west2": 1 },
    domains: ["skaleagents.com", "www.skaleagents.com"],
  });

  return project("SkaleAgents", {
    variables: { managed: false },
    resources: [web],
  });
});

