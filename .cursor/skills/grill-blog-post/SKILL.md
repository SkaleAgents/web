---
name: grill-blog-post
description: >-
  Fact-check a SkaleAgents blog post against the shipped checks, then rewrite
  it so it does not read like a model. Use when writing or editing
  src/lib/public-posts.ts, docs/blog-writing.md, or when the user asks to
  grill, fact-check, humanize, or remove the AI footprint from a blog post.
---

# Grill a blog post

Facts first. Voice second. A smooth paragraph that overclaims what a check does is a failed post.

The field rules live in `docs/blog-writing.md` (web) and `docs/operations/blog-writing.md` (planning hub). The post body lives only in `SkaleAgents/web` `src/lib/public-posts.ts`.

## Order

1. Read the draft, the linked check or resource, and one sibling post.
2. Grill every factual sentence. Fix or delete before you touch tone.
3. Humanize the corrected draft.
4. Read the result again and reject any new claim the rewrite introduced.
5. Tell the user what was wrong, what you cut, and which AI tells you removed. Do not put that note in the post.

## Grill

Open the source the sentence depends on. For a check, that is the matching record in `src/lib/public-checks.ts` (`looksFor`, `needs`, `finding`, `limit`, `example`). For a checklist, open `src/lib/public-resources.ts`. The record wins over the draft.

- A slug, rule id, severity, or example line that is not in the record does not go in the post.
- "The check flags this" is true only when `looksFor` covers that shape. Stricter advice is allowed when you say it is the review bar, not the check. The action-pin check accepts a release tag or a full SHA. Saying "pin the SHA" is fine. Saying "the check rejects tags" is not.
- "The check does not" must match `needs` or `limit`. Do not invent a blind spot, and do not drop one the record states.
- Separate three layers and do not mix them: what the line does, what this check flags, what you would block in review.
- Docker, Kubernetes, GitHub, and Compose claims that sit outside the check still have to be true. If you are not sure, delete the sentence. Do not launder a guess with "typically" or "usually".
- Every `href` must exist: a check slug, a resource slug, another post slug, or a real app path such as `/prompts`.
- `publishAt` is a Monday in Asia/Dhaka, between 09:10 and 11:00, `+06:00`, and not the same minute as another post. The `date` is that calendar day.
- One move per post. A second finding can be a link. It cannot become a second article inside the first.

Wrong: "The check proves the image does not run as root."
Why: `container-runs-as-root` reads the Dockerfile text. It does not build or run the image.
Fixed: "The check reads the Dockerfile. It does not build the image."

## Humanize

Do this only after the facts are settled. The voice is one developer talking to another. Contractions. Short sentences. A heading names the move.

Remove on sight:

- Em dashes.
- Adjective stacks and triads ("simple, powerful, and seamless").
- `leverage`, `utilize`, `seamless`, `robust`, `delve`, `unlock`, `empower`, `streamline`.
- "It's worth noting", "in essence", "simply put", "at its core", "not just X, but Y".
- A closing "in summary" or a paragraph that restates the post.
- The same ending on every post: "Paste the file. Quote the line. The check will not invent it."
- A summary shaped like "Here is the line to refuse, and the line to ask for instead."

Keep the line, the flag, the path, and the limit. The 400 word note in the writing guide is not a quota. Do not add a sentence to hit it, and do not cut a true limit to sound tighter.

One dry aside in the whole post, or none. If you have to ask whether it lands, cut it.

## Done

The post can merge when:

- Every claim about a check matches the record you opened.
- Every claim outside the check is one you could defend without guessing.
- A read-aloud pass does not sound like a launch post or like the previous post with the nouns swapped.
- `pnpm exec vitest run src/lib/public-content.test.ts` passes when the web repo changed.
