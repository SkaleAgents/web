<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rule

- Do not use em dash punctuation in code, comments, documentation, or commit messages.

## Delivery default

- The owner reviews changes on the live site. After implementing and verifying a requested change, commit it, ship it to `main`, and deploy production without a separate approval step unless the owner explicitly asks otherwise.
- Verify the deployment at `https://skaleagents.com` before reporting completion. Report blockers if deployment or live verification fails.
