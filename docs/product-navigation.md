# Product navigation and workflows

The logo links to `/`. Three disclosure groups replace the flat seven-link menu:

- **Explore:** Bot directory and Prompt library.
- **Review:** Audit jobs and Scheduled audits. Watchtower keeps Review active.
- **Build & connect:** Creator Studio and Connect MCP.

Desktop menus open on hover and stay open while the pointer moves into the panel.
Touch and keyboard activation toggle them. Escape closes the menu and returns focus
to its trigger. Moving the pointer away, leaving keyboard focus, clicking outside,
or choosing a destination closes it. The same groups fit a 320px mobile viewport.
Destination icons describe their tools; SVG chevrons align with the trigger labels.

## What each page does

- `/bots`: search name, description, and specialty; combine search with specialty
  filters; open the existing bot detail and assistant actions.
- `/prompts`: search full prompt text and filter by tag; expand instructions or
  copy the full body. Signed-in users can expand the save form.
- `/jobs`: choose specialists with descriptions, submit the existing audit scope,
  filter jobs by status, and open Watchtower. Active jobs refresh every five seconds.
- `/schedules`: pick a cadence preset or enter custom cron, choose a timezone, and
  save the supplied infrastructure text. Presets show their timing in plain language.
- `/studio`: load a security, reliability, or capacity starter into the draft form.
  Existing save, edit, and publish endpoints remain the source of truth.
- `/settings`: read client-specific setup before signing in. Token creation and
  management still require authentication.

Search and filters operate on the API's returned collection. Scheduled audits
reuse saved text; they don't fetch a repository. Custom cron expressions are
validated by the API. No new API paths or request fields are introduced.

## Acceptance checks

`e2e/product-workflows.spec.ts` covers keyboard/mobile navigation, combined filters,
full-prompt copying, starter draft creation, schedule payloads, audit specialist
payloads, job filters, and guest MCP setup. Existing directory publishing and MCP
token tests cover those end-to-end flows with mocked API responses.
