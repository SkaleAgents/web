import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import {
  AI_USER_AGENTS,
  INDEXNOW_KEY,
  PRIVATE_PATHS,
  SITE,
  llmsTxt,
  markdownDocument,
  markdownPath,
  pricingMarkdown,
  robotsPolicy,
  siteJsonLd,
} from "./ai-corpus";
import { homeFaqJsonLd, homeFaqs } from "./home-faq";
import { markdownInternalPath } from "./markdown-path";
import { publicChecks } from "./public-checks";

it("allows named AI crawlers on public pages and blocks account paths", () => {
  const policy = robotsPolicy();
  const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
  expect(policy.sitemap).toBe(`${SITE}/sitemap.xml`);
  for (const agent of ["*", ...AI_USER_AGENTS]) {
    const rule = rules.find((item) => item.userAgent === agent);
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).toEqual([...PRIVATE_PATHS]);
  }
  expect(rules.some((rule) => rule.userAgent === "GPTBot" && rule.disallow?.includes("/"))).toBe(false);
});

it("publishes an llms.txt map that points at markdown and keeps account pages out of the link lists", () => {
  const text = llmsTxt();
  expect(text.startsWith("# SkaleAgents\n")).toBe(true);
  expect(text).toContain("> Public DevOps review reference.");
  expect(text).toContain("](https://skaleagents.com/pricing.md)");
  expect(text).toContain("](https://skaleagents.com/products.md)");
  expect(text).toContain("](https://skaleagents.com/checks/public-network-access.md)");
  expect(text).toContain("https://skaleagents.com/checks.json");
  expect(text).not.toMatch(/\]\(https:\/\/skaleagents\.com\/dashboard/);
  expect(markdownPath("/")).toBe("/index.md");
  expect(markdownPath("/pricing")).toBe("/pricing.md");
  expect(markdownInternalPath("/pricing.md")).toBe("/md/public/pricing");
  expect(markdownInternalPath("/checks/public-network-access.md")).toBe("/md/public/checks/public-network-access");
  expect(markdownInternalPath("/index.md")).toBe("/md/public/index");
  expect(markdownInternalPath("/pricing")).toBeNull();
});

it("renders public markdown and refuses account paths and prompt bodies", () => {
  const home = markdownDocument("/");
  expect(home).toContain("Specialist DevOps bots");
  expect(home).toContain(homeFaqs[0].question);
  const check = markdownDocument("/checks/container-image-scan");
  expect(check).toMatch(/does not scan/i);
  expect(markdownDocument("/products")).toContain("CloudPloy");
  expect(markdownDocument("/privacy")).toContain("Effective October 2, 2026");
  expect(markdownDocument("/privacy")).toContain("Google Analytics 4");
  expect(markdownDocument("/terms")).toContain("Wyoming");
  expect(markdownDocument("/dashboard")).toBeNull();
  expect(markdownDocument("/dashboard/jobs")).toBeNull();
  expect(markdownDocument("/login")).toBeNull();
  expect(markdownDocument("/no-such-page")).toBeNull();

  const bots = markdownDocument("/bots", {
    directory: [{ name: "Queue watcher", href: "/bots/queue-watcher", detail: "Looks at failed jobs." }],
  });
  expect(bots).toContain("Queue watcher");
  expect(bots).not.toContain("promptBody");
  expect(bots).toContain("does not include instruction text");
  expect(bots).not.toContain("Restart the worker");

  const botPage = markdownDocument("/bots/queue-watcher", {
    detail: {
      kind: "bot",
      name: "Queue watcher",
      specialty: "sre",
      description: "Looks at failed jobs.",
      instructions: "Restart the worker after you read the log.",
    },
  });
  expect(botPage).toContain("# Queue watcher");
  expect(botPage).toContain("Restart the worker after you read the log.");
  expect(markdownDocument("/bots/missing", { detail: { kind: "missing" } })).toBeNull();

  const prompts = markdownDocument("/prompts", {
    directory: [{ name: "Deploy note", href: "/prompts/deploy-note.md", detail: "deploy" }],
  });
  expect(prompts).toContain("does not include prompt text");
  expect(prompts).not.toContain("Paste the service name");
  const promptPage = markdownDocument("/prompts/deploy-note", {
    detail: { kind: "prompt", title: "Deploy note", tags: ["deploy"], body: "Paste the service name." },
  });
  expect(promptPage).toContain("Paste the service name.");
  expect(markdownInternalPath("/bots/01a05d3a-1d0e-705d-a273-058a913feb38.md")).toBe("/md/public/bots/01a05d3a-1d0e-705d-a273-058a913feb38");
});

it("does not invent a price when the plan catalog is missing", () => {
  expect(pricingMarkdown(null)).not.toMatch(/\$\d/);
  expect(pricingMarkdown([{ key: "starter", name: "Starter", monthlyUsd: 29, auditLimit: 20, scheduleLimit: 1 }])).toContain("$29 / month");
  expect(publicChecks.length).toBeGreaterThan(0);
});

it("publishes organization structured data and the IndexNow key file", () => {
  const graph = JSON.parse(siteJsonLd()) as { "@graph": { "@type": string; name: string }[] };
  expect(graph["@graph"].map((node) => node["@type"])).toEqual(["Organization", "WebSite"]);
  const faq = JSON.parse(homeFaqJsonLd()) as { mainEntity: { name: string }[] };
  expect(faq.mainEntity.map((item) => item.name)).toEqual(homeFaqs.map((item) => item.question));
  expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
  expect(readFileSync(path.join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`), "utf8").trim()).toBe(INDEXNOW_KEY);
});
