import type { Metadata } from "next";
import Link from "next/link";
import { HeroActions } from "@/components/marketing/hero-actions";
import { DeferredMarketingWidget } from "@/components/marketing/deferred-marketing-widget";
import { ExampleExplorerPreview, SampleReviewDemoPreview, StartPickerPreview } from "@/components/marketing/marketing-widget-previews";
import { WorkflowExplorer } from "@/components/marketing/workflow-explorer";
import { HeroSignal } from "@/components/marketing/hero-signal";

export const metadata: Metadata = {
  title: "SkaleAgents | DevOps bots and infrastructure reviews",
  description: "Explore specialist DevOps bots, review code and infrastructure, and connect SkaleAgents to your AI editor with MCP. See examples and choose your workflow.",
};

const features = [
  { number: "01", title: "Find your specialist", label: "Bot directory", description: "Search by task and filter by specialty. Read a bot's instructions, then open them in your assistant with your own project context.", href: "/bots", cta: "Explore bots" },
  { number: "02", title: "Write a review playbook", label: "Creator Studio", description: "Start with a security, reliability, or capacity template. Customize the instructions, save a draft, and publish publicly or keep it private.", href: "/dashboard/studio", cta: "Open Studio" },
  { number: "03", title: "Find it. Copy it. Get to work.", label: "Prompt library", description: "Search prompt text, narrow by topic, and copy the full instructions in one click. Sign in to save your own reusable prompts.", href: "/prompts", cta: "Browse prompts" },
  { number: "04", title: "Choose your review team", label: "Audits & Watchtower", description: "Select specialists for your infrastructure audit and track jobs by status. Open Watchtower to inspect findings and redirect the review.", href: "/dashboard/jobs", cta: "Explore audits" },
  { number: "05", title: "Set a review rhythm", label: "Scheduled audits", description: "Pick an hourly, daily, weekday, or weekly cadence for saved infrastructure text. Set the timezone and send completion or failure alerts to a webhook.", href: "/dashboard/schedules", cta: "View schedules" },
  { number: "06", title: "Stay in your editor", label: "MCP connection", description: "Connect Cursor or Claude Code through browser OAuth. Your assistant can call architecture review tools while you work, with credentials handled automatically.", href: "/mcp-config", cta: "MCP config" },
];

const faqs = [
  { question: "What is SkaleAgents, in plain English?", answer: <>SkaleAgents gives developers reusable specialist prompts and tools for reviewing code and infrastructure. You can take a bot into an AI assistant, call review tools from your editor with MCP, or submit an audit in the web app. It is designed for engineers and small teams who want a more structured DevOps review.</> },
  { question: "How is this different from asking an AI chatbot?", answer: <>You can still use your own AI assistant. SkaleAgents adds reusable specialist instructions, a prompt library, and a tool connection for architecture reviews. The web workflow keeps audit jobs and shared Watchtower reviews in one place. A bot is a set of instructions, not a separately trained model.</> },
  { question: "Can I try it without an account?", answer: <>Yes. Browse the <Link href="/bots">public bot directory</Link> and <Link href="/prompts">community prompts</Link> without signing in. Google sign-in is needed to create or manage your own bots and prompts, authorize an MCP connection, and use account-owned audit workflows.</> },
  { question: "What does it cost?", answer: <>Public bots and community prompts are free to browse. See the proposed organization audit and monitoring plans on our <Link href="/pricing">pricing page</Link>. Paid enrollment is not open yet. Using a prompt in another AI assistant is subject to that provider&apos;s pricing and usage limits; SkaleAgents does not include a subscription to those services.</> },
  { question: "Which AI assistants and editors can I use?", answer: <>Bot pages offer handoffs to Grok, SuperGrok, and Claude. Codex opens separately, and Copy prompt lets you paste the instructions into any assistant. For tool calls, connect Cursor, Claude Code, Claude Desktop, ChatGPT, or Codex to our hosted MCP server through OAuth. See <Link href="/mcp-config">MCP config</Link> for each client&apos;s setup and plan requirements. Opening a prompt in Grok does not link your Grok account.</> },
  { question: "Do I need to connect my cloud account or repository?", answer: <>Not for the text-based workflows shown here. You supply code, infrastructure text, and optional telemetry. The MCP client sends the content included in its tool calls; the web audit uses the text you submit. Review what you share and remove credentials before sending it. A review can only assess the context it receives.</> },
  { question: "Will an agent change my production infrastructure?", answer: <>These workflows produce findings and recommendations for you to review. Submitting an audit or opening a Watchtower session does not itself deploy a change. Validate proposed fixes and apply them through your own development and deployment process.</> },
  { question: "Can I keep my bots private and revoke tool access?", answer: <>Yes. Creator Studio supports public and private bots, with drafts kept out of the public directory. MCP clients are authorized through OAuth and tied to your Google-backed account. Disconnect a client from <Link href="/mcp-config">MCP config</Link> to remove its access.</> },
  { question: "What are the current limits?", answer: <>Reviews depend on the supplied code and context; they are not a guarantee that an application is secure or compliant. Scheduled audits rerun supplied infrastructure text rather than automatically syncing a repository. Cloudploy deployment handoff, Crontinel telemetry integration, and enterprise compliance certification are not promised by the workflows on this page.</> },
];

export default function MarketingHome() {
  return (
    <main className="marketing-home">
      <section className="marketing-hero relative border-b border-line" aria-labelledby="hero-heading">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="motion-enter relative mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
          <p className="marketing-eyebrow mb-8 flex items-center gap-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-accent" /> Built for the work behind the deploy</p>
          <p className="font-display text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-tight">SkaleAgents</p>
          <div className="mt-6 grid items-center gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <h1 id="hero-heading" className="max-w-xl text-2xl font-medium leading-snug sm:text-3xl">Control plane for AI DevOps agents</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">Connect your editor through MCP to review code and infrastructure where you work. Explore specialist bots, reuse prompts, or bring findings into a shared team review.</p>
              <HeroActions />
              <a href="#examples" className="mt-10 inline-flex items-center gap-3 text-sm font-semibold text-ink-muted hover:text-ink">See what a review looks like <span className="hero-scroll-cue" aria-hidden="true">↓</span></a>
            </div>
            <HeroSignal />
          </div>
        </div>
      </section>

      <section id="mcp" className="marketing-section grid gap-8 border-b border-line lg:grid-cols-[1.2fr_1fr]" aria-labelledby="mcp-heading">
        <div><p className="marketing-eyebrow">Built on MCP / Connected to your workflow</p><h2 id="mcp-heading" className="marketing-heading">Your editor is the starting point.</h2><p className="mt-4 max-w-xl leading-relaxed text-ink-muted">MCP is how your AI assistant works with SkaleAgents. Give it the code you want reviewed, call a review tool, and get findings back in the same conversation.</p><Link href="/mcp-config" className="mt-6 inline-flex items-center gap-3 rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-accent-fg">Set up your MCP connection <span aria-hidden="true">↗</span></Link><p className="mt-3 text-sm text-ink-muted">Cursor · Claude Code · Claude Desktop · ChatGPT · Codex</p></div>
        <ol className="divide-y divide-line rounded-xl border border-line bg-canvas-elevated px-6">
          <li className="py-5"><p className="marketing-eyebrow">01 / Configure</p><h3 className="mt-2 font-semibold">Add SkaleAgents to your client</h3><p className="mt-1 text-sm text-ink-muted">Choose your client on the MCP page and add the hosted server URL.</p></li>
          <li className="py-5"><p className="marketing-eyebrow">02 / Authorize</p><h3 className="mt-2 font-semibold">Connect through Google OAuth</h3><p className="mt-1 text-sm text-ink-muted">Connect in your client, sign in if needed, and approve MCP access. Credentials are handled automatically.</p></li>
          <li className="py-5"><p className="marketing-eyebrow">03 / Request</p><h3 className="mt-2 font-semibold">Ask for an architecture review</h3><p className="mt-1 text-sm text-ink-muted">Have your assistant call <code className="break-all">review_architecture</code> with relevant source or infrastructure. Read the findings in the same conversation.</p></li>
        </ol>
      </section>

      <section id="examples" className="marketing-section" aria-labelledby="examples-heading">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="marketing-eyebrow">01 / Put it to work</p><h2 id="examples-heading" className="marketing-heading">What would you like<br className="hidden sm:block" /> a second pair of eyes on?</h2></div>
          <p className="max-w-sm leading-relaxed text-ink-muted">A useful review connects a finding to the code behind it. Pick a focus to see the input, the concern, and a practical next step.</p>
        </div>
        <DeferredMarketingWidget name="examples" fallback={<ExampleExplorerPreview />} />
      </section>

      <section id="sample-demo" className="marketing-section border-t border-line" aria-labelledby="sample-demo-heading">
        <DeferredMarketingWidget name="sample" fallback={<SampleReviewDemoPreview />} />
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
          <div><p className="marketing-eyebrow">04 / Before you start</p><h2 id="questions-heading" className="marketing-heading">Good questions.<br />Straight answers.</h2><p className="mt-4 leading-relaxed text-ink-muted">What you can use, what you share, and where the boundaries are.</p><Link href="/mcp-config" className="mt-6 inline-block text-sm font-semibold underline decoration-line underline-offset-4">Looking for connection details?</Link></div>
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
        <DeferredMarketingWidget name="start" fallback={<StartPickerPreview />} />
      </section>
    </main>
  );
}
