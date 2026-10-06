export type PublicPostSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type PublicPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  summary: string;
  sections: readonly PublicPostSection[];
  links: readonly { href: string; label: string }[];
};

export const publicPosts: readonly PublicPost[] = [
  {
    slug: "review-terraform-before-you-merge",
    title: "Review Terraform before you merge",
    description: "What to look for in a Terraform diff before it opens a port or a policy you cannot take back.",
    date: "2026-10-06",
    summary: "A merge is a bad time to discover that a security group allows the internet. Here is the pass I run on the diff first.",
    sections: [
      {
        heading: "Read the diff for reachability, then for identity",
        paragraphs: [
          "Start with anything that changes who can connect. That is a cidr_blocks entry, an ingress block, a publicly_accessible flag, or a bucket ACL. If the diff adds 0.0.0.0/0, stop and name the port.",
          "Then read the IAM. A statement with Action \"*\" or Resource \"*\" is a second change hiding in the same pull request. The network line gets the comments. The policy line ships anyway.",
        ],
      },
      {
        heading: "Paste the file, not a summary of the file",
        paragraphs: [
          "An assistant will invent a resource name if you only describe the change. Paste the .tf file, or the plan snippet that shows the address. Ask it to quote the line.",
          "The public exposure checklist and the wildcard IAM checklist are written for that paste. Each one ends with a prompt you can open in Claude or ChatGPT.",
        ],
      },
    ],
    links: [
      { href: "/resources/public-exposure-review", label: "Public exposure review" },
      { href: "/resources/wildcard-iam-review", label: "Wildcard IAM review" },
      { href: "/prompts", label: "Prompt library" },
    ],
  },
  {
    slug: "what-a-cloud-review-actually-checks",
    title: "What a cloud review actually checks",
    description: "The difference between a checklist you run yourself and a review check that only sees the text you submit.",
    date: "2026-10-06",
    summary: "A review can only talk about the file in front of it. This is what that file is expected to contain, and what a finding does not prove.",
    sections: [
      {
        heading: "The check looks at text you already have",
        paragraphs: [
          "SkaleAgents review checks read infrastructure text: Terraform, CloudFormation, Kubernetes, a Dockerfile, Compose, a workflow. They do not log into the account. If the risky setting is only in the console, the check cannot see it.",
          "That limit is the useful part. A finding means the text contains the pattern. It does not mean the account is safe, and it does not mean the account is owned.",
        ],
      },
      {
        heading: "Use a checklist when you are not ready to submit a job",
        paragraphs: [
          "The free resources are the same kind of question, written so you can run them in the assistant you already pay for. The container privilege review is the one I use on a manifest before it goes to a cluster.",
          "When you want the same questions saved as a job, the review checks page lists what each built-in check looks for.",
        ],
      },
    ],
    links: [
      { href: "/checks", label: "Review checks" },
      { href: "/resources/container-privilege-review", label: "Container privilege review" },
      { href: "/resources", label: "Free resources" },
    ],
  },
  {
    slug: "hand-a-devops-prompt-to-your-assistant",
    title: "Hand a DevOps prompt to Claude or ChatGPT",
    description: "How to open a SkaleAgents prompt in Claude, ChatGPT, or another assistant without retyping it.",
    date: "2026-10-06",
    summary: "The prompt is only useful if it lands in the chat you already have open. The Actions menu does that copy, or opens the assistant with the text filled in.",
    sections: [
      {
        heading: "Open it, or copy the shape you need",
        paragraphs: [
          "On a prompt, a bot, or a free resource, Actions can open Claude, ChatGPT, Grok, SuperGrok, Codex, or Perplexity. Claude, ChatGPT, Grok, and Perplexity get the prompt in the link when it is short enough.",
          "Copy plain text when you want the body alone. Copy as markdown when you want a heading you can drop into notes. Copy for an agent when the next assistant needs the task name and a rule: use only the files you provide, and ask if one is missing.",
        ],
      },
      {
        heading: "Gemini and long prompts",
        paragraphs: [
          "Gemini does not take a reliable prefilled link, so Actions copies the agent handoff and opens Gemini for you to paste. The same copy happens for any assistant when the encoded prompt is longer than 1800 characters. The page says so, instead of opening a chat that silently dropped the text.",
          "After it opens, paste the config or the log under the prompt. The prompt cannot review a file it never received.",
        ],
      },
    ],
    links: [
      { href: "/prompts", label: "Prompt library" },
      { href: "/resources", label: "Free resources" },
      { href: "/mcp-config", label: "MCP config" },
    ],
  },
];

export function publicPostPath(post: Pick<PublicPost, "slug">): string {
  return `/blog/${post.slug}`;
}

export function publicPostBySlug(slug: string): PublicPost | undefined {
  return publicPosts.find((post) => post.slug === slug);
}

export function blogIndexMarkdown(): string {
  return [
    "# Blog",
    "",
    "Short notes on reviewing infrastructure and handing a prompt to an assistant.",
    "",
    ...publicPosts.map((post) => `- [${post.title}](https://skaleagents.com${publicPostPath(post)}.md): ${post.summary}`),
    "",
  ].join("\n");
}

export function postMarkdown(slug: string): string | null {
  const post = publicPostBySlug(slug);
  if (!post) return null;
  return [
    `# ${post.title}`,
    "",
    post.summary,
    "",
    `Published ${post.date}.`,
    "",
    ...post.sections.flatMap((section) => [
      `## ${section.heading}`,
      "",
      ...section.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    ]),
    "## Related",
    "",
    ...post.links.map((link) => `- [${link.label}](https://skaleagents.com${link.href})`),
    "",
  ].join("\n");
}
