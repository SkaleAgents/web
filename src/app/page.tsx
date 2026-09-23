import type { Metadata } from "next";
import Link from "next/link";
import { HeroActions } from "@/components/marketing/hero-actions";
import { ExampleExplorer } from "@/components/marketing/example-explorer";
import { WorkflowExplorer } from "@/components/marketing/workflow-explorer";
import { StartPicker } from "@/components/marketing/start-picker";
import { MarketingMotion } from "@/components/marketing/marketing-motion";
import { HeroSignal } from "@/components/marketing/hero-signal";
import { SampleReviewDemo } from "@/components/marketing/sample-review-demo";

export const metadata: Metadata = {
  title: "SkaleAgents | DevOps bots and infrastructure reviews",
  description: "Explore specialist DevOps bots, review code and infrastructure, and connect SkaleAgents to your AI editor with MCP. See examples and choose your workflow.",
};

const features = [
  { number: "01", title: "Find your specialist", label: "Bot directory", description: "Browse reusable bots for DevOps, security, and scaling. Read the instructions before bringing one into your assistant.", href: "/bots", cta: "Explore bots" },
  { number: "02", title: "Make the workflow yours", label: "Creator Studio", description: "Write a bot's instructions, choose its specialty, and publish it publicly or keep it private. Start as a draft and refine it.", href: "/studio", cta: "Open Studio" },
  { number: "03", title: "Skip the blank prompt", label: "Prompt library", description: "Reuse community prompts for common engineering tasks. Sign in to save your own prompts for the next review.", href: "/prompts", cta: "Browse prompts" },
  { number: "04", title: "Review with context", label: "Audits & Watchtower", description: "Submit infrastructure text to selected specialists. Open a shared review session to inspect findings and redirect the work.", href: "/jobs", cta: "Explore audits" },
  { number: "05", title: "Put reviews on a schedule", label: "Scheduled audits", description: "Rerun a supplied infrastructure scope on a cron schedule. Choose a timezone and an optional webhook for completion or failure alerts.", href: "/schedules", cta: "View schedules" },
  { number: "06", title: "Stay in your editor", label: "MCP connection", description: "Create a revocable API token and connect a compatible client. Request architecture reviews without switching to a browser for each call.", href: "/settings", cta: "Connect MCP" },
];

const faqs = [
  { question: "What is SkaleAgents, in plain English?", answer: <>SkaleAgents gives developers reusable specialist prompts and tools for reviewing code and infrastructure. You can take a bot into an AI assistant, call review tools from your editor with MCP, or submit an audit in the web app. It is designed for engineers and small teams who want a more structured DevOps review.</> },
  { question: "How is this different from asking an AI chatbot?", answer: <>You can still use your own AI assistant. SkaleAgents adds reusable specialist instructions, a prompt library, and a tool connection for architecture reviews. The web workflow keeps audit jobs and shared Watchtower reviews in one place. A bot is a set of instructions, not a separately trained model.</> },
  { question: "Can I try it without an account?", answer: <>Yes. Browse the <Link href="/bots">public bot directory</Link> and <Link href="/prompts">community prompts</Link> without signing in. Google sign-in is needed to create or manage your own bots and prompts, issue API tokens, and use account-owned audit workflows.</> },
  { question: "What does it cost?", answer: <>Public bots and community prompts are free to browse. This site does not currently publish paid plan prices. Using a prompt in another AI assistant is subject to that provider&apos;s pricing and usage limits; SkaleAgents does not include a subscription to those services.</> },
  { question: "Which AI assistants and editors can I use?", answer: <>Bot pages offer handoffs to Grok, SuperGrok, and Claude. Codex opens separately, and Copy prompt lets you paste the instructions into any assistant. For tool calls, use Cursor, Claude Code, or another MCP client that supports local stdio servers. See <Link href="/settings">MCP settings</Link> for the configuration. Opening a prompt in Grok does not link your Grok account.</> },
  { question: "Do I need to connect my cloud account or repository?", answer: <>Not for the text-based workflows shown here. You supply code, infrastructure text, and optional telemetry. The MCP client sends the content included in its tool calls; the web audit uses the text you submit. Review what you share and remove credentials before sending it. A review can only assess the context it receives.</> },
  { question: "Will an agent change my production infrastructure?", answer: <>These workflows produce findings and recommendations for you to review. Submitting an audit or opening a Watchtower session does not itself deploy a change. Validate proposed fixes and apply them through your own development and deployment process.</> },
  { question: "Can I keep my bots private and revoke tool access?", answer: <>Yes. Creator Studio supports public and private bots, with drafts kept out of the public directory. API tokens are tied to your user account and can be revoked in <Link href="/settings">settings</Link>. Workspace-wide roles and enterprise identity should not be assumed from user-scoped access.</> },
  { question: "What are the current limits?", answer: <>Reviews depend on the supplied code and context; they are not a guarantee that an application is secure or compliant. Scheduled audits rerun supplied infrastructure text rather than automatically syncing a repository. Cloudploy deployment handoff, Crontinel telemetry integration, and enterprise compliance certification are not promised by the workflows on this page.</> },
];

export default function MarketingHome() {
  return (
    <MarketingMotion>
      <section className="marketing-hero relative border-b border-line" aria-labelledby="hero-heading">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="motion-enter relative mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
          <p className="marketing-eyebrow mb-8 flex items-center gap-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Built for the work behind the deploy</p>
          <p className="font-display text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tight">SkaleAgents</p>
          <div className="mt-6 grid items-center gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h1 id="hero-heading" className="max-w-xl text-2xl font-medium leading-snug sm:text-3xl">Control plane for AI DevOps agents</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">Find a specialist bot. Review the code and infrastructure behind your app. Bring the findings into your editor or a shared team review.</p>
              <HeroActions />
              <a href="#examples" className="mt-10 inline-flex items-center gap-3 text-sm font-semibold text-ink-muted hover:text-ink">See what a review looks like <span className="hero-scroll-cue" aria-hidden="true">↓</span></a>
            </div>
            <HeroSignal />
          </div>
        </div>
      </section>

      <section id="examples" className="marketing-section" aria-labelledby="examples-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="marketing-eyebrow">01 / Put it to work</p><h2 id="examples-heading" className="marketing-heading">What would you like<br className="hidden sm:block" /> a second pair of eyes on?</h2></div>
          <p className="max-w-sm leading-relaxed text-ink-muted">A useful review connects a finding to the code behind it. Pick a focus to see the input, the concern, and a practical next step.</p>
        </div>
        <ExampleExplorer />
      </section>

      <section id="sample-demo" className="marketing-section border-t border-line" aria-labelledby="sample-demo-heading">
        <SampleReviewDemo />
      </section>

      <div className="border-y border-line bg-accent-soft/30">
        <section id="how-it-works" className="marketing-section" aria-labelledby="workflow-heading">
          <p className="marketing-eyebrow">02 / Your tools, your workflow</p>
          <h2 id="workflow-heading" className="marketing-heading">Start where you already work.</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">Use a prompt in chat, connect a tool in your editor, or review an audit with your team. Choose the setup that fits the task.</p>
          <WorkflowExplorer />
        </section>
      </div>

      <section id="toolkit" className="marketing-section" aria-labelledby="toolkit-heading">
        <p className="marketing-eyebrow">03 / Inside SkaleAgents</p>
        <h2 id="toolkit-heading" className="marketing-heading">From the first question<br className="hidden sm:block" /> to a repeatable review.</h2>
        <div className="mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.href} className="marketing-feature flex flex-col border-t border-line py-7">
              <p className="marketing-eyebrow flex justify-between gap-3"><span>{feature.label}</span><span className="opacity-60">{feature.number}</span></p>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{feature.description}</p>
              <Link href={feature.href} className="mt-5 inline-flex w-fit items-center gap-3 text-sm font-semibold hover:underline">{feature.cta}<span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </section>

      <div className="border-y border-line bg-canvas-elevated">
        <section id="questions" className="marketing-section grid gap-10 lg:grid-cols-[1fr_1.7fr]" aria-labelledby="questions-heading">
          <div><p className="marketing-eyebrow">04 / Before you start</p><h2 id="questions-heading" className="marketing-heading">Good questions.<br />Straight answers.</h2><p className="mt-4 leading-relaxed text-ink-muted">What you can use, what you share, and where the boundaries are.</p><Link href="/settings" className="mt-6 inline-block text-sm font-semibold underline decoration-line underline-offset-4">Looking for connection details?</Link></div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.question} className="marketing-faq group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-semibold"><span>{faq.question}</span><span aria-hidden="true" className="shrink-0 font-mono text-lg font-normal text-ink-muted group-open:hidden">+</span><span aria-hidden="true" className="hidden shrink-0 font-mono text-lg font-normal text-ink-muted group-open:block">−</span></summary>
                <div className="marketing-answer pb-6 pr-6 text-sm leading-relaxed text-ink-muted">{faq.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <section className="marketing-section" aria-labelledby="next-step-heading">
        <StartPicker />
      </section>
    </MarketingMotion>
  );
}
