import type { MetadataRoute } from "next";
import { homeFaqs } from "./home-faq";
import { planBlurbs } from "./plan-blurbs";
import { catalogProducts } from "./product-catalog-data";
import { publicCheckPath, publicChecks } from "./public-checks";

export const SITE = "https://skaleagents.com";

export const INDEXNOW_KEY = "7c4e9a1b6d2f48e0a5c3b8d71f06e294";

export const PRIVATE_PATHS = [
  "/dashboard",
  "/me",
  "/org/",
  "/staff/",
  "/login",
  "/auth/",
  "/workspace-invitations/",
  "/md",
] as const;

export const AI_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Bingbot",
  "Googlebot",
  "Google-Extended",
  "Applebot-Extended",
] as const;

export type DirectoryEntry = {
  name: string;
  href: string;
  detail: string;
};

export type PublicPlan = {
  key: string;
  name: string;
  monthlyUsd: number | null;
  auditLimit: number | null;
  scheduleLimit: number | null;
};

const features = [
  ["Bot directory", "/bots", "Search specialist DevOps bots and open their instructions in your own assistant."],
  ["Prompt library", "/prompts", "Search community prompts and copy the instructions. Sign in to save your own."],
  ["Review checks", "/checks", "Read what each built-in check looks for. No account and no payment."],
  ["MCP config", "/mcp-config", "Connect Cursor, Claude Code, Claude Desktop, ChatGPT, or Codex through OAuth."],
  ["Pricing", "/pricing", "Free, Starter, Pro, Max, and Enterprise organization plans."],
  ["Products", "/products", "CloudPloy, Crontinel, Toolblip, AmazingPlugins, Appnary, and harun.dev."],
] as const;

export function markdownPath(path: string): string {
  return path === "/" ? "/index.md" : `${path}.md`;
}

export function absoluteMarkdown(path: string): string {
  return `${SITE}${markdownPath(path)}`;
}

export function robotsPolicy(): MetadataRoute.Robots {
  const rule = { allow: "/" as const, disallow: [...PRIVATE_PATHS] };
  return {
    rules: [
      { userAgent: "*", ...rule },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, ...rule })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}

function link(name: string, path: string, note: string): string {
  return `- [${name}](${absoluteMarkdown(path)}): ${note}`;
}

export function llmsTxt(): string {
  const lines = [
    "# SkaleAgents",
    "",
    "> Public DevOps review reference. Reading it does not run an audit or connect a cloud account.",
    "",
    "SkaleAgents publishes review checks, a bot directory, a prompt library, organization pricing, and an MCP setup guide. Account pages are not public reference.",
    "",
    "## Start here",
    link("Home", "/", "What SkaleAgents is, which assistants it hands off to, and the limits of a review."),
    link("Pricing", "/pricing", "Free, Starter, Pro, Max, and Enterprise. Dollar amounts are loaded from the live plan catalog."),
    link("Products", "/products", "Other products from the same team. Made by Binary Labs LLC."),
    link("Contact", "/contact", "Email info@skaleagents.com about an account, an audit, billing, or a plan."),
    "",
    "## Review checks",
    link("Review checks", "/checks", "What each check looks for, the input it needs, and what a result does not prove."),
    ...publicChecks.map((check) => link(check.title, publicCheckPath(check), check.looksFor)),
    "",
    "## Directories",
    link("Bot directory", "/bots", "Public bot names and descriptions. Instruction text stays on each bot page."),
    link("Prompt library", "/prompts", "Public prompt titles and tags. Prompt text stays on the library page."),
    link("MCP config", "/mcp-config", "How to add SkaleAgents to an AI editor. Credentials are handled by the client."),
    "",
    "## Policies",
    link("Privacy", "/privacy", "Binding privacy text is the HTML page. This markdown copies the current policy."),
    link("Terms", "/terms", "Binding terms are the HTML page. This markdown copies the current terms."),
    "",
    "## Machine-readable catalog",
    `- [JSON catalog](${SITE}/checks.json): the same review checks in JSON. Fetch it occasionally. It is not an account export.`,
    "",
    "Do not treat /dashboard, /me, /org, /staff, /login, /auth, or /workspace-invitations as public reference.",
    "",
  ];
  return lines.join("\n");
}

export function siteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "SkaleAgents",
        url: SITE,
        email: "info@skaleagents.com",
        parentOrganization: {
          "@type": "Organization",
          name: "Binary Labs LLC",
          address: {
            "@type": "PostalAddress",
            streetAddress: "1309 Coffeen Avenue",
            addressLocality: "Sheridan",
            addressRegion: "WY",
            postalCode: "82801",
            addressCountry: "US",
          },
        },
      },
      {
        "@type": "WebSite",
        name: "SkaleAgents",
        url: SITE,
        description: "Specialist DevOps bots, infrastructure review checks, and an MCP connection for AI editors.",
      },
    ],
  }).replaceAll("<", "\\u003c");
}

function document(title: string, body: string[]): string {
  return [`# ${title}`, "", ...body, ""].join("\n");
}

function checkMarkdown(slug: string): string | null {
  const check = publicChecks.find((item) => item.slug === slug);
  if (!check) return null;
  return document(check.title, [
    check.looksFor,
    "",
    `Area: ${check.area}`,
    "",
    "## What you need to supply",
    "",
    check.needs,
    "",
    "## If it reports a finding",
    "",
    check.finding,
    "",
    "## What this does not prove",
    "",
    check.limit,
    "",
    `## ${check.exampleLabel}`,
    "",
    "```",
    check.example,
    "```",
    "",
    "Reading this page does not submit infrastructure. The HTML page is https://skaleagents.com" + publicCheckPath(check) + ".",
  ]);
}

export function pricingMarkdown(plans: PublicPlan[] | null): string {
  const lines = [
    "Organization plans for infrastructure audits and monitoring. Starter, Pro, and Max are chosen by an organization owner.",
    "",
    "Public bots, community prompts, and the review checks are free to read.",
  ];
  if (!plans) {
    lines.push("", "Live prices could not be loaded for this copy. Read https://skaleagents.com/pricing for the current amounts.");
  } else {
    lines.push("");
    for (const plan of plans) {
      const price = plan.monthlyUsd === null ? "Custom quote" : `$${plan.monthlyUsd} / month`;
      const blurb = planBlurbs[plan.key] ?? "Organization plan";
      const limits = plan.auditLimit === null
        ? "Audit and monitoring limits are agreed with the organization."
        : `${plan.auditLimit} audits / month. ${plan.scheduleLimit ?? 0} automatic schedules.`;
      lines.push(`## ${plan.name}`, "", `${price}. ${blurb} ${limits}`, "");
    }
  }
  return document("Organization pricing", lines);
}

export function directoryMarkdown(title: string, intro: string, entries: DirectoryEntry[] | null): string {
  const lines = [intro, ""];
  if (!entries) {
    lines.push("The live list could not be loaded for this copy. Open the HTML page for the current directory.");
  } else if (entries.length === 0) {
    lines.push("No public entries are listed right now. Open the HTML page to check again.");
  } else {
    for (const entry of entries) {
      lines.push(`- [${entry.name}](${SITE}${entry.href}): ${entry.detail}`);
    }
  }
  return document(title, lines);
}

function staticPage(path: string): string | null {
  if (path === "/") {
    return document("SkaleAgents", [
      "Specialist DevOps bots, infrastructure review checks, and an MCP connection for Cursor, Claude Code, Claude Desktop, ChatGPT, and Codex.",
      "",
      "Reading the public pages does not run an audit and does not connect a cloud account.",
      "",
      "## On the site",
      "",
      ...features.map(([label, href, note]) => `- [${label}](${absoluteMarkdown(href)}): ${note}`),
      "",
      "## Questions",
      "",
      ...homeFaqs.flatMap((faq) => [`### ${faq.question}`, "", faq.answerText, ""]),
    ]);
  }
  if (path === "/checks") {
    return document("Infrastructure review checks", [
      "These checks describe what a review looks for. They do not run a review, connect to a cloud account, or prove that infrastructure is secure.",
      "",
      ...publicChecks.map((check) => `- [${check.title}](${absoluteMarkdown(publicCheckPath(check))}): ${check.looksFor}`),
    ]);
  }
  if (path === "/products") {
    return document("Our products", [
      "More from the team behind SkaleAgents. Made by Binary Labs LLC.",
      "",
      ...catalogProducts.map((product) => `- [${product.name}](https://${product.domain}): ${product.headline} ${product.description}${product.status ? ` (${product.status})` : ""}`),
    ]);
  }
  if (path === "/contact") {
    return document("Contact SkaleAgents", [
      "Questions about an account, an audit, billing, or an organization plan: email info@skaleagents.com.",
    ]);
  }
  if (path === "/mcp-config") {
    return document("MCP config", [
      "Add SkaleAgents to Cursor, Claude Code, Claude Desktop, ChatGPT, or Codex, then approve access in the browser. The client handles credentials.",
      "",
      "Connection management for signed-in users is at /dashboard/mcp-config. That page is not public reference.",
    ]);
  }
  if (path === "/privacy") return privacyMarkdown();
  if (path === "/terms") return termsMarkdown();
  return null;
}

function privacyMarkdown(): string {
  return document("SkaleAgents Privacy Policy", [
    "Effective October 1, 2026. Version 2026-10-01. The HTML page is the binding copy.",
    "",
    "Binary Labs LLC, 1309 Coffeen Avenue, Sheridan, WY 82801, USA, operates SkaleAgents. For privacy requests, email info@skaleagents.com. This policy covers the SkaleAgents website, account, dashboards, APIs, and MCP connections.",
    "",
    "## Information we process",
    "",
    "We process account identifiers, email addresses, profile details, sign-in and security records, organization membership, invitations, API tokens, preferences, support messages, and service activity. When you use product features, we process the prompts, bot settings, audit inputs, findings, schedules, and other content you submit. Billing features may add purchase or invoice records. We receive limited identity information from a sign-in provider when you choose that provider.",
    "",
    "## Why we process it",
    "",
    "We use this information to create and secure accounts, provide the features you request, deliver invitations and operational email, manage plans and billing, answer support requests, prevent abuse, and comply with legal duties. Where applicable, our bases are performance of a contract, legitimate interests in operating and securing the service, legal obligations, and consent for optional processing that requires it. Acknowledging this policy is not consent to unrelated marketing.",
    "",
    "## Service providers and transfers",
    "",
    "Our hosting and database services run on Railway. Resend delivers account and invitation email. Google supplies sign-in identity when you choose Google. A payment provider may process checkout when paid plans are available. Connected AI and MCP services may receive the inputs needed for the features you activate. Information may be processed in the United States or other countries where these providers operate.",
    "",
    "## Retention and deletion",
    "",
    "We keep account and organization data while needed to operate your account and meet security, billing, or legal obligations. You can request deletion or use available product controls to purge eligible audit inputs and history. Deletion of active application data does not necessarily remove the same data immediately from backups or provider logs. Automatic audit retention periods apply only when they are enabled for your account and shown in the product.",
    "",
    "## Cookies",
    "",
    "Necessary cookies keep you signed in and protect form submissions. The cookie that remembers your consent choice is also necessary. If you accept optional cookies, this browser can remember a choice such as postponing the audit retention notice for 24 hours. We do not use advertising cookies.",
    "",
    "## Your choices and rights",
    "",
    "You can edit some account and organization information in the dashboard, revoke connections and tokens, and request access, correction, export, or deletion by emailing us. You can contact your local privacy regulator if a concern is unresolved.",
    "",
    "## Security and changes",
    "",
    "We use access controls and operational safeguards to protect information, but no online service can guarantee absolute security. We will post changes on the HTML page with a new effective date.",
  ]);
}

function termsMarkdown(): string {
  return document("SkaleAgents Terms of Service", [
    "Effective September 30, 2026. Version 2026-09-30. The HTML page is the binding copy.",
    "",
    "SkaleAgents is operated by Binary Labs LLC, 1309 Coffeen Avenue, Sheridan, WY 82801, USA. Contact info@skaleagents.com. These terms apply to the SkaleAgents website, accounts, dashboards, APIs, and MCP connections.",
    "",
    "## Accounts and organizations",
    "",
    "You must be able to enter a binding agreement and keep your account information accurate. You are responsible for access to your account, tokens, connected tools, and organizations. Organization owners control membership and should invite only people authorized to see that organization's content.",
    "",
    "## Your content and permitted use",
    "",
    "You keep ownership of code, prompts, configurations, and other material you submit. You grant us permission to host, process, and display that material only as needed to provide and protect the service. Do not use SkaleAgents to break the law, probe systems without permission, interfere with the service, or expose another person's data without authority.",
    "",
    "## Audits, agents, and connected tools",
    "",
    "Audit findings, agent output, and suggested changes can be incomplete or wrong. Review them before relying on them or changing a live system. Connecting an external tool authorizes that tool to act within the access you grant. We do not promise that automated output will detect every issue or safely make changes on your behalf.",
    "",
    "## Plans and payment",
    "",
    "Available features and limits depend on the plan shown when you subscribe. If a paid plan is offered, its checkout will show the price and billing interval before you confirm payment.",
    "",
    "## Availability and suspension",
    "",
    "We may update or pause the service for maintenance, security, or legal reasons. We may restrict access if we reasonably believe an account violates these terms or creates a security risk.",
    "",
    "## Ending use and disputes",
    "",
    "You may stop using SkaleAgents and request account deletion by contacting us. Contact info@skaleagents.com first about a dispute. These terms are governed by the laws of Wyoming, USA, except where mandatory local consumer law applies.",
    "",
    "## Changes",
    "",
    "We will post updated terms with a new effective date. If a material update requires renewed acceptance, we will ask you to agree before continuing to use private features.",
  ]);
}

export function markdownDocument(
  path: string,
  extras?: { plans?: PublicPlan[] | null; directory?: DirectoryEntry[] | null },
): string | null {
  if (PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(prefix))) return null;
  if (path === "/pricing") return pricingMarkdown(extras?.plans ?? null);
  if (path === "/bots") {
    return directoryMarkdown(
      "Bot directory",
      "Public specialist bots. This file lists names and descriptions. It does not include instruction text.",
      extras?.directory ?? null,
    );
  }
  if (path === "/prompts") {
    return directoryMarkdown(
      "Prompt library",
      "Community prompts. This file lists titles and tags. It does not include prompt text.",
      extras?.directory ?? null,
    );
  }
  if (path.startsWith("/checks/")) return checkMarkdown(path.slice("/checks/".length));
  return staticPage(path);
}
