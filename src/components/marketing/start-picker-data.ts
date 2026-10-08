export const goals = [
  {
    id: "explore",
    label: "Try a specialist",
    description: "Start with instructions you can use today.",
    question: "What would help you get going?",
    options: [
      { label: "Find a specialist bot", title: "Start in the bot directory.", description: "Read a specialist's instructions, then open them in your preferred assistant or copy the prompt.", note: "Browse public bots without signing in.", href: "/bot-directory", cta: "Explore the directory" },
      { label: "Grab a ready-made prompt", title: "Start with a community prompt.", description: "Pick a prompt for the task in front of you and adapt it to your project's context.", note: "Read community prompts without signing in.", href: "/prompts", cta: "Open the prompt library" },
    ],
  },
  {
    id: "review",
    label: "Review infrastructure",
    description: "Bring your own code or configuration.",
    question: "Where do you want the review to happen?",
    options: [
      { label: "Inside my editor", title: "Connect your editor with MCP.", description: "Add the client configuration and ask your assistant to call review_architecture with the relevant source. The first call opens your browser to sign in and approve MCP access.", note: "OAuth handles your connection credentials automatically.", href: "/mcp-config", cta: "See MCP setup" },
      { label: "In a shared web review", title: "Start an audit, then open Watchtower.", description: "Paste infrastructure text, select specialists, and inspect the findings in a shared review session.", note: "Sign in to create and manage audit jobs in your dashboard.", href: "/me/jobs", cta: "Open audit jobs" },
      { label: "On a recurring schedule", title: "Give the review a schedule.", description: "Choose saved infrastructure text or a file in a public GitHub repository. Set the time and add a webhook if you want audit alerts.", note: "Sign-in is needed. GitHub files are checked for a new commit on each due run; private repositories aren't connected yet.", href: "/me/schedules", cta: "Explore scheduled audits" },
    ],
  },
  {
    id: "create",
    label: "Build my own bot",
    description: "Turn your review process into reusable instructions.",
    question: "Who should be able to find it?",
    options: [
      { label: "Keep it private", title: "Make a private bot in Studio.", description: "Write your instructions, choose a specialty, and select Private in Creator Studio. Refine the bot as a draft before publishing.", note: "Sign-in is needed. Private bots are available to their owner.", href: "/dashboard/studio", cta: "Open Creator Studio" },
      { label: "Share it publicly", title: "Publish a bot for the community.", description: "Write your specialist's instructions and select Public in Creator Studio. Publish when you're ready for it to appear in the directory.", note: "Sign in to create and publish a bot from your dashboard.", href: "/dashboard/studio", cta: "Open Creator Studio" },
    ],
  },
];
