import Link from "next/link";
import type { ReactNode } from "react";

export type HomeFaq = {
  question: string;
  answerText: string;
  answer: ReactNode;
};

export const homeFaqs: HomeFaq[] = [
  {
    question: "What is SkaleAgents, in plain English?",
    answerText: "SkaleAgents gives developers reusable specialist prompts and tools for reviewing code and infrastructure. You can take a bot into an AI assistant, call review tools from your editor with MCP, or submit an audit in the web app. It is designed for engineers and small teams who want a more structured DevOps review.",
    answer: <>SkaleAgents gives developers reusable specialist prompts and tools for reviewing code and infrastructure. You can take a bot into an AI assistant, call review tools from your editor with MCP, or submit an audit in the web app. It is designed for engineers and small teams who want a more structured DevOps review.</>,
  },
  {
    question: "How is this different from asking an AI chatbot?",
    answerText: "You can still use your own AI assistant. SkaleAgents adds reusable specialist instructions, a prompt library, and a tool connection for architecture reviews. The web workflow keeps audit jobs and shared Watchtower reviews in one place. A bot is a set of instructions, not a separately trained model.",
    answer: <>You can still use your own AI assistant. SkaleAgents adds reusable specialist instructions, a prompt library, and a tool connection for architecture reviews. The web workflow keeps audit jobs and shared Watchtower reviews in one place. A bot is a set of instructions, not a separately trained model.</>,
  },
  {
    question: "Can I try it without an account?",
    answerText: "Yes. Browse the public bot directory, community prompts, free resources, the blog, and review checks without signing in. Google sign-in is needed to create or manage your own bots and prompts, authorize an MCP connection, and use account-owned audit workflows.",
    answer: <>Yes. Browse the <Link href="/bots">public bot directory</Link>, <Link href="/prompts">community prompts</Link>, <Link href="/resources">free resources</Link>, the <Link href="/blog">blog</Link>, and <Link href="/checks">review checks</Link> without signing in. Google sign-in is needed to create or manage your own bots and prompts, authorize an MCP connection, and use account-owned audit workflows.</>,
  },
  {
    question: "What does it cost?",
    answerText: "Public bots, community prompts, and the review checks are free to read. Organization audit and monitoring plans are on the pricing page. An owner chooses Starter, Pro, or Max for an organization they manage. Using a prompt in another AI assistant is subject to that provider's pricing and usage limits. SkaleAgents does not include a subscription to those services.",
    answer: <>Public bots, community prompts, and the <Link href="/checks">review checks</Link> are free to read. Organization audit and monitoring plans are on our <Link href="/pricing">pricing page</Link>. An owner chooses Starter, Pro, or Max for an organization they manage. Using a prompt in another AI assistant is subject to that provider&apos;s pricing and usage limits; SkaleAgents does not include a subscription to those services.</>,
  },
  {
    question: "Which AI assistants and editors can I use?",
    answerText: "Prompt and bot pages can open Claude, ChatGPT, Grok, SuperGrok, Codex, or Perplexity. Gemini copies the text first because that site does not take a prefilled prompt. You can also copy plain text, markdown, or a handoff written for another agent. For tool calls, connect Cursor, Claude Code, Claude Desktop, ChatGPT, or Codex to the hosted MCP server through OAuth. See MCP config for each client's setup and plan requirements. Opening a prompt does not link that assistant to your SkaleAgents account.",
    answer: <>Prompt and bot pages can open Claude, ChatGPT, Grok, SuperGrok, Codex, or Perplexity. Gemini copies the text first because that site does not take a prefilled prompt. You can also copy plain text, markdown, or a handoff written for another agent. For tool calls, connect Cursor, Claude Code, Claude Desktop, ChatGPT, or Codex to the hosted MCP server through OAuth. See <Link href="/mcp-config">MCP config</Link> for each client&apos;s setup and plan requirements. Opening a prompt does not link that assistant to your SkaleAgents account.</>,
  },
  {
    question: "Do I need to connect my cloud account or repository?",
    answerText: "Not for the text-based workflows shown here. You supply code, infrastructure text, and optional telemetry. The MCP client sends the content included in its tool calls; the web audit uses the text you submit. Review what you share and remove credentials before sending it. A review can only assess the context it receives.",
    answer: <>Not for the text-based workflows shown here. You supply code, infrastructure text, and optional telemetry. The MCP client sends the content included in its tool calls; the web audit uses the text you submit. Review what you share and remove credentials before sending it. A review can only assess the context it receives.</>,
  },
  {
    question: "Will an agent change my production infrastructure?",
    answerText: "These workflows produce findings and recommendations for you to review. Submitting an audit or opening a Watchtower session does not itself deploy a change. Validate proposed fixes and apply them through your own development and deployment process.",
    answer: <>These workflows produce findings and recommendations for you to review. Submitting an audit or opening a Watchtower session does not itself deploy a change. Validate proposed fixes and apply them through your own development and deployment process.</>,
  },
  {
    question: "Can I keep my bots private and revoke tool access?",
    answerText: "Yes. Creator Studio supports public and private bots, with drafts kept out of the public directory. MCP clients are authorized through OAuth and tied to your Google-backed account. Disconnect a client from MCP config to remove its access.",
    answer: <>Yes. Creator Studio supports public and private bots, with drafts kept out of the public directory. MCP clients are authorized through OAuth and tied to your Google-backed account. Disconnect a client from <Link href="/mcp-config">MCP config</Link> to remove its access.</>,
  },
  {
    question: "What are the current limits?",
    answerText: "Reviews depend on the supplied code and context; they are not a guarantee that an application is secure or compliant. Schedules can check one file in a public GitHub repository; private repositories and cloud accounts are not connected. Cloudploy deployment handoff, Crontinel telemetry integration, and enterprise compliance certification are not promised by the workflows on this page.",
    answer: <>Reviews depend on the supplied code and context; they are not a guarantee that an application is secure or compliant. Schedules can check one file in a public GitHub repository; private repositories and cloud accounts are not connected. Cloudploy deployment handoff, Crontinel telemetry integration, and enterprise compliance certification are not promised by the workflows on this page.</>,
  },
];

export function homeFaqJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answerText },
    })),
  }).replaceAll("<", "\\u003c");
}
