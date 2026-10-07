# Weekly blog

Publish at least one new post every week. A week runs Monday through Sunday, Asia/Dhaka. Posts for the weeks of 19 October, 26 October, 2 November, and 9 November 2026 are already written. Each one becomes public on its Monday, at its own minute between 09:10 and 11:00 Asia/Dhaka. Schedule a Monday only when it is within the next five weeks. Do not schedule 30 November 2026. The next post is the week of 16 November, and it waits until 12 October 2026. One post is enough. A second post is fine when you have a second concrete topic.

Posts live in `src/lib/public-posts.ts`. The planning hub keeps a copy of these instructions at `docs/operations/blog-writing.md`.

## Add the post

Put the new record at the start of `publicPosts`, so the index shows it first. Fill every field:

| Field | What to put there |
| --- | --- |
| `slug` | Lowercase words and hyphens. It becomes `/blog/<slug>`. |
| `title` | The search phrase, said like a person. |
| `description` | One sentence for the page metadata. |
| `date` | `YYYY-MM-DD` inside the week you are covering. Same calendar day as `publishAt`. |
| `publishAt` | Monday of that week, `YYYY-MM-DDTHH:MM:00+06:00`, and that Monday has to fall within the next five weeks. Pick a minute between 09:10 and 11:00, and use a different minute from the posts already in the file. Do not use 30 November 2026. The index, the page, the sitemap, `llms.txt`, and the markdown copy stay hidden until that instant. Leave it off only when the post should be public immediately. |
| `summary` | The first thing the reader sees under the title. Say the problem. |
| `sections` | Two sections. Each heading names the move. Two short paragraphs each. |
| `links` | Two or three links to `/resources`, `/checks`, `/prompts`, `/mcp-config`, or another post. |

Sitemap, `llms.txt`, and the `.md` alternate read the posts whose `publishAt` has passed. A future post is a 404. Sitemap and `llms.txt` can take about five minutes to list a post after its `publishAt`. The HTML page updates on the next request. You do not register the URL anywhere else.

## What the post has to do

Teach one move a reviewer can use the same day. A person should be able to land from search, do the thing, and open a checklist or a prompt. Don't write a product announcement. Don't recap the homepage.

Name the file, the flag, the port, or the line. If you can't point at something the reader can paste into an assistant, pick a different topic.

## How to write it

Write like you're talking to another developer. Second person is fine. First person is fine when you actually did the thing. Use contractions.

- Short sentences. One idea each.
- Headings should say the move. "Overview" is not a heading.
- Show the setting. `0.0.0.0/0`, `privileged: true`, `Action "*"`.
- No em dashes.
- No stacks of adjectives, and no "leverage", "seamless", "robust", or "delve".
- No closing "in summary".
- One dry aside in the whole post, or none.
- About 400 to 700 words.

Read it out loud. If a sentence sounds like a launch post, cut it or make it a fact.

## Before you merge

Run the [grill blog post](../.cursor/skills/grill-blog-post/SKILL.md) skill on the draft. Check the claims against the shipped check or checklist first, then take out the model voice. Do not add sentences to reach 400 words.

- The slug is new.
- The title and description are not copied from another post.
- The date falls in a week that does not already have a post, unless you are adding an extra one on purpose.
- At least one link goes to a resource, a check, or the prompt library.
- `pnpm exec vitest run src/lib/public-content.test.ts` still passes.
