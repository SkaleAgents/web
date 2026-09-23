# Landing page content plan

## Questions the page needs to answer

- What does SkaleAgents actually do? Explain reusable DevOps bots, code and infrastructure reviews, and the shared review workflow.
- Is it useful for my work? Let visitors explore security, reliability, AI workload, and scaling examples with inputs, findings, and suggested next steps.
- How do I use it? Show separate paths for an AI assistant, an MCP client, and the web audit interface.
- What can I access? Explain public browsing, Google sign-in, private bots, and user-scoped tokens.
- What does it cost? State that public bots and community prompts are free to browse. Don't invent subscription prices or third-party model allowances.
- Does it change production? Distinguish review and recommendations from deployment. Explain the boundaries of the current implementation.

## Page order

1. Existing Signal Deck hero, with concrete supporting copy and an accessible public entry point.
2. Section links for readers who already know what they need.
3. Interactive example explorer with sample input, finding, recommendation, and a copyable starter prompt.
4. Workflow selector: assistant, editor, or team review. Each path has setup steps and a working destination.
5. Product map linking to the directory, Studio, prompts, audits, schedules, and MCP settings.
6. Expandable FAQs covering account access, pricing, data sharing, integrations, and product limits.
7. Final next steps: explore a bot or configure MCP.

## Implementation

Use the existing Signal Deck colors, typography, and button primitives. Render explanatory copy on the server. Keep client state inside the hero account actions and interactive explorers. Examples are local, illustrative content, never simulated live audit results. Use native radio groups and disclosure elements for keyboard support.

The current web app includes audit jobs, Watchtower sessions, and scheduled audits. Describe those routes as implemented workflows. Don't claim verified compliance, autonomous deployment, or working Crontinel/Cloudploy integrations.

## Acceptance checks

- Visitors can read the core information without authentication or a working API.
- All four examples change their input, finding, recommendation, and starter prompt together.
- Copy works, and a clipboard failure offers a visible manual-copy path.
- All three workflow choices show their own steps and route.
- FAQs expand by pointer and keyboard.
- Links point to existing product routes or page anchors.
- Signed-in visitors retain their MCP shortcut.
- Desktop and narrow mobile layouts work in light and dark themes without horizontal page overflow.
- Lint, production build, and browser interaction checks pass.

## Verification

- `pnpm build`: passed, including TypeScript and static page generation.
- `pnpm lint`: no errors; 35 existing image warnings in the shared footer.
- `PLAYWRIGHT_PORT=3117 pnpm exec playwright test e2e/landing-page.spec.ts e2e/smoke.spec.ts`: 16 passed.
- Pre-deployment checks: `pnpm test` passed all 4 unit tests; `PLAYWRIGHT_PORT=3117 pnpm test:e2e` passed all 18 browser tests.
- Browser review: desktop hero, example explorer, and workflow section; narrow mobile dark theme. Automated layout checks cover 320px in both themes.
- Preview runs at `http://127.0.0.1:3117`. Local API CORS is configured for port 3000, so this preview exercises the public experience. Authenticated UI was verified with a mocked user response.
