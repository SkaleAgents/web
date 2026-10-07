// Weekly posts: docs/blog-writing.md. At least one new post per week.
export type PublicPostSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type PublicPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Monday morning Asia/Dhaka, ISO-8601 with +06:00. A minute between 09:10 and 11:00. Absent means already public. */
  publishAt?: string;
  summary: string;
  sections: readonly PublicPostSection[];
  links: readonly { href: string; label: string }[];
};

export const publicPosts: readonly PublicPost[] = [
  {
    slug: "pull-request-target-checks-out-the-pr",
    title: "pull_request_target should not check out the pull request",
    description: "Why a pull_request_target job that checks out the head SHA runs untrusted code with the base repository's secrets.",
    date: "2026-11-09",
    publishAt: "2026-11-09T10:47:00+06:00",
    summary: "pull_request_target runs in the base repo and can read that repo's secrets. Checking out the pull request head runs the pull request's code in that job.",
    sections: [
      {
        heading: "The trigger and the checkout are one finding",
        paragraphs: [
          "A workflow with `on: pull_request_target` runs in the base repository. It can read that repository's secrets. The workflow that matters is the one on the base branch, which is why a fork can hit it before anyone merges the fork's workflow change.",
          "The checkout this check is written for is `ref: ${{ github.event.pull_request.head.sha }}`, or the same idea with `head.ref`. The pull-request-target check looks for `pull_request_target` together with a checkout of the head ref or head sha. It reads the workflow YAML. It does not open the pull request. A `pull_request` workflow is not this finding. A `pull_request_target` job that checks out only the base repository is not this finding either. Both halves have to be in the file you paste.",
        ],
      },
      {
        heading: "Read the diff without running it",
        paragraphs: [
          "If the job only needs the diff, fetch the diff and print the paths. Don't `actions/checkout` the head, and don't `run` a script from the pull request. If the job has to build the pull request, use `pull_request`. A `pull_request` from a fork does not receive the base repository's secrets. A `pull_request` from a branch in the same repository can.",
          "Paste the workflow. Quote the `on:` block and the checkout `ref`. `permissions: contents: write` is a different line. This check does not read it. `uses: actions/checkout@main` is the action-pin check.",
        ],
      },
    ],
    links: [
      { href: "/checks/pull-request-target-checkout", label: "Pull request target check" },
      { href: "/checks/action-pinned-to-main", label: "Action pinned to @main" },
      { href: "/blog/pin-the-action-to-a-commit", label: "Pin the action to a commit" },
    ],
  },
  {
    slug: "pin-the-action-to-a-commit",
    title: "Pin the GitHub Action to a commit",
    description: "Why actions/checkout@main is a moving build, and what to put on the uses line instead.",
    date: "2026-11-02",
    publishAt: "2026-11-02T09:32:00+06:00",
    summary: "uses: actions/checkout@main builds whatever that branch points at today. A SHA names the commit you read. A tag can still move.",
    sections: [
      {
        heading: "A branch name is not a version",
        paragraphs: [
          "The line `- uses: actions/checkout@main` names a branch. `main` moves. So does `master`. The next push to that action changes your workflow, and you will not get a diff in your own pull request when that happens. The action-pinned-to-main check looks for `@main` and `@master`. Its example is `actions/checkout@main`. It does not look up the action repository, and it does not invent a SHA when the workflow only names a branch. It does not flag `@v4`.",
          "A release tag can still be moved by whoever owns the tag. A 40-character commit SHA names one commit. Moving the branch does not change that commit. The check accepts a release tag or a full SHA. I still want the SHA on the `uses` line, because the tag can move. That is the review bar.",
        ],
      },
      {
        heading: "Copy the SHA you actually read",
        paragraphs: [
          "Open the commit you read and copy that SHA onto the `uses` line: `actions/checkout@` followed by the 40 hex characters. A comment can keep the tag name. A local action, `uses: ./actions/build`, is your code. This check is about someone else's action.",
          "Paste the workflow and ask for the `uses` line. If it still says `@main` or `@master`, that is the comment. A `pull_request_target` checkout of the pull request head is a different check. Pinning the SHA does not make that checkout safe.",
        ],
      },
    ],
    links: [
      { href: "/checks/action-pinned-to-main", label: "Action pinned to @main" },
      { href: "/checks/pull-request-target-checkout", label: "Pull request target check" },
      { href: "/blog/dockerfile-user-is-not-root", label: "End the Dockerfile on a user" },
    ],
  },
  {
    slug: "dockerfile-user-is-not-root",
    title: "End the Dockerfile on a user that is not root",
    description: "The last USER instruction is the user the container starts as. USER root, USER 0, or no USER at all leaves it as root.",
    date: "2026-10-26",
    publishAt: "2026-10-26T10:15:00+06:00",
    summary: "The last USER line wins. If that line is root or 0, or if the Dockerfile has no USER, the check flags it.",
    sections: [
      {
        heading: "The last USER is the one that runs",
        paragraphs: [
          "The container-runs-as-root check reads the Dockerfile text. It flags a last `USER` of `root` or `0`, or a file with no `USER` instruction. It does not build the image. A comment is not a `USER` line. A name that shows up only in `CMD` is not one either. No finding does not prove the container that is running is unprivileged.",
          "Each Docker stage has its own user, and the last stage is the image you ship. A `USER` in an earlier stage does not apply to the last stage. If the last stage has no `USER` line, say so in review. The check is written for the last `USER` in the file, or for no `USER` at all.",
        ],
      },
      {
        heading: "Name a user the image already has",
        paragraphs: [
          "End the last stage on a user the image already has: `USER node`, `USER nginx`, or a user you created with `useradd` in that file. That is the check's suggested next step. `USER 1000` is not this finding. The check does not build the image, so a passing file still does not prove that user exists when the container starts. If the process must bind to port 80, move it above 1024 or name the capability you mean. `USER root` is not the fix for a low port.",
          "Paste the Dockerfile and ask for the last `USER` line. If there is no `USER` line, that is the finding.",
        ],
      },
    ],
    links: [
      { href: "/checks/container-runs-as-root", label: "Container runs as root" },
      { href: "/resources/container-privilege-review", label: "Container privilege review" },
      { href: "/blog/set-a-memory-limit", label: "Set a memory limit" },
    ],
  },
  {
    slug: "set-a-memory-limit",
    title: "Set a memory limit on the container",
    description: "mem_limit: 0 and a missing Kubernetes memory limit let one container consume the host.",
    date: "2026-10-19",
    publishAt: "2026-10-19T09:23:00+06:00",
    summary: "A container with no memory limit, or with mem_limit set to 0, can grow until the host runs out of memory.",
    sections: [
      {
        heading: "Zero is not a limit",
        paragraphs: [
          "In Compose, `mem_limit: 0` means no cap. Leaving `mem_limit` out means the same thing. `mem_reservation` is not a cap. In a Pod, a container with no `resources.limits.memory` has no memory limit in that file. `resources.requests.memory` does not set one.",
          "The missing-memory-limit check looks for a container with no memory limit, or a Compose memory limit of 0. It reads the workload text. It does not measure live memory use. A limit that exists only as a cluster policy, outside the file, is not visible to it. When the host runs out of memory, the kernel does not have to kill the container that grew.",
        ],
      },
      {
        heading: "Write the number on the container",
        paragraphs: [
          "Delete `mem_limit: 0`. Don't lower it and call that a limit. Put a number you can explain on that container: `mem_limit: 512m` in Compose, or `resources.limits.memory: 512Mi` in the Pod. A limit on a sibling container does not cover this one.",
          "Paste the Compose file or the manifest and ask for the limit line, with the container name. If the line is missing, say so. Don't assume the cluster adds one later.",
        ],
      },
    ],
    links: [
      { href: "/checks/missing-memory-limit", label: "Missing memory limit" },
      { href: "/resources/container-privilege-review", label: "Container privilege review" },
      { href: "/blog/docker-socket-is-host-root", label: "The Docker socket is root on the host" },
    ],
  },
  {
    slug: "docker-socket-is-host-root",
    title: "The Docker socket is root on the host",
    description: "Why a Compose volume for /var/run/docker.sock hands the container the machine that runs Docker.",
    date: "2026-10-12",
    summary: "A Compose volume for /var/run/docker.sock lets that container talk to the Docker API on the host.",
    sections: [
      {
        heading: "The socket is the Docker API",
        paragraphs: [
          "The usual Compose line is `/var/run/docker.sock:/var/run/docker.sock`. The socket is the Docker API. A process that can write to it can create a container, mount the host filesystem, and start that container as root. The mount does not drop that privilege.",
          "A Kubernetes `hostPath` of `/var/run/docker.sock` is the same kind of mount. The Docker socket check looks for a socket mount or another host path, including that Compose volume. It reads the manifest or Compose file. It does not inspect a running host. A socket mounted only at runtime, outside the file, is outside the check. `privileged: true` on a Kubernetes container is a different check.",
        ],
      },
      {
        heading: "Mount the directory the job needs",
        paragraphs: [
          "Ask for the directory the job writes, such as `./artifacts:/work`, or a named volume. Those cannot start a container on the host. If the job must build an image, keep the builder outside the app container and give it a credential for one repository.",
          "Paste the file and quote the volume line. If a tool's setup says to mount the socket, that sentence is the thing to question.",
        ],
      },
    ],
    links: [
      { href: "/resources/container-privilege-review", label: "Container privilege review" },
      { href: "/checks/docker-socket", label: "Docker socket check" },
      { href: "/checks/elevated-container-privileges", label: "Elevated container check" },
    ],
  },
  {
    slug: "review-terraform-before-you-merge",
    title: "Review Terraform before you merge",
    description: "What to look for in a Terraform diff before it opens a port or a policy you cannot take back.",
    date: "2026-10-06",
    summary: "A merge is a bad time to discover that a security group allows the internet. Read reachability in the diff before you read the IAM.",
    sections: [
      {
        heading: "Read the diff for reachability, then for identity",
        paragraphs: [
          "Start with who can connect. Look for cidr_blocks, an ingress block, publicly_accessible, or a bucket ACL. If the diff adds 0.0.0.0/0, name the port. The public-network-access check reads that text. It looks for 0.0.0.0/0 or ::/0 used as a source outside an explicit egress rule. A public range that appears only in a comment is not an ingress rule. The check does not connect to a cloud account.",
          "Then read the IAM. actions = [\"*\"] is the pattern the wildcard-IAM check is written for. A Resource of \"*\" in the same statement is still worth a comment in review. The network line gets the comments. The policy line is the one that ships.",
        ],
      },
      {
        heading: "Paste the file, not a summary of the file",
        paragraphs: [
          "An assistant will invent a resource name if you only describe the change. Paste the .tf file, or the plan snippet that shows the address. Ask it to quote the line.",
          "The public exposure checklist and the wildcard IAM checklist are written for that paste.",
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
          "A finding means the text contains the pattern. It does not mean the account is safe. No finding does not prove the setting is absent outside that file.",
        ],
      },
      {
        heading: "Use a checklist when you are not ready to submit a job",
        paragraphs: [
          "The free resources are the same questions, written so you can run them in the assistant you already use. I use the container privilege review on a manifest before it goes to a cluster.",
          "When you want those questions saved on a job, the review checks page lists what each check looks for.",
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
    summary: "The prompt is only useful if it lands in the chat you already have open. Actions copies it, or opens the assistant with the text filled in.",
    sections: [
      {
        heading: "Open it, or copy the shape you need",
        paragraphs: [
          "On a prompt, a bot, or a free resource, Actions lists Claude, ChatGPT, Grok, Grokbot, Codex, Perplexity, and Gemini. Claude, ChatGPT, Grok, Grokbot, and Perplexity get the prompt in the link when the encoded body is at most 1800 characters. Codex opens the Codex page and does not put the prompt in the link.",
          "Copy plain text for the body alone. Copy as markdown when you want a heading above the body. Copy for an agent when the next assistant needs the task name and the rule: use only the context you provide, and ask if a file, log, or config is missing.",
        ],
      },
      {
        heading: "Gemini and long prompts",
        paragraphs: [
          "Gemini always copies that agent handoff and opens Gemini. The notice says to paste it. The same copy happens for a prefilled assistant when the encoded body is longer than 1800 characters. The notice then says the link was too long to prefill.",
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

export function isPostPublished(post: Pick<PublicPost, "publishAt">, now = new Date()): boolean {
  if (!post.publishAt) return true;
  const publishAt = Date.parse(post.publishAt);
  return Number.isFinite(publishAt) && now.getTime() >= publishAt;
}

export function publishedPosts(now = new Date()): readonly PublicPost[] {
  return publicPosts.filter((post) => isPostPublished(post, now));
}

export function publicPostBySlug(slug: string, now = new Date()): PublicPost | undefined {
  return publishedPosts(now).find((post) => post.slug === slug);
}

export function blogIndexMarkdown(now = new Date()): string {
  return [
    "# Blog",
    "",
    "Short notes on reviewing infrastructure and handing a prompt to an assistant.",
    "",
    ...publishedPosts(now).map((post) => `- [${post.title}](https://skaleagents.com${publicPostPath(post)}.md): ${post.summary}`),
    "",
  ].join("\n");
}

export function postMarkdown(slug: string, now = new Date()): string | null {
  const post = publicPostBySlug(slug, now);
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
