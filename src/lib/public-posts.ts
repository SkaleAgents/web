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
    summary: "pull_request_target runs in the base repo, with the base repo's secrets. Checking out the pull request head runs someone else's code in that job.",
    sections: [
      {
        heading: "The trigger and the checkout are one finding",
        paragraphs: [
          "A workflow with `on: pull_request_target` does not run as the person who opened the pull request. GitHub runs it in the base repository, on the base repository's `GITHUB_TOKEN`, and with the secrets that repository can read. `permissions: contents: write` on that job makes the token able to push. That is useful for a label bot. It is a bad place to run the pull request. The dangerous file is the workflow in the base branch, which is why a fork can hit it before anyone merges the fork's workflow change.",
          "The checkout that turns it into code execution is `ref: ${{ github.event.pull_request.head.sha }}`, or the same idea with `head.ref` and the fork's repository. Checking out `github.event.pull_request.head.repo.full_name` is the same grant. The job then has the pull request's files and the base repository's credentials in one process. A `pull_request` workflow is not this finding. A `pull_request_target` job that checks out the base repository and never the head is not this finding either. The check wants both halves in the same file.",
        ],
      },
      {
        heading: "Read the diff, or drop the secrets",
        paragraphs: [
          "If the job only needs to know what changed, fetch the diff and print the paths. Don't `actions/checkout` the head, and don't `run` a script that came from the pull request. If the job has to build or test the pull request, change the trigger to `pull_request`. That trigger checks out the merge commit and does not hand the job the base repository's secrets.",
          "Paste the workflow. Quote the `on:` block and the checkout `ref`. The pull request target check is written for that pair, and it does not open the pull request to see them. A checkout that exists only in a reusable workflow you didn't paste is outside the file, so the check will not invent it. The action pin check is the next line to read: `uses: actions/checkout@main` is a separate finding, and it often sits in the same job. Leave the workflow unmerged until both lines are gone or you have written down why the job is allowed to keep them.",
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
    summary: "uses: actions/checkout@main builds whatever that branch points at today. Pin the action to the commit you actually read.",
    sections: [
      {
        heading: "A branch name is not a version",
        paragraphs: [
          "The line `- uses: actions/checkout@main` looks pinned because it names a ref. `main` moves. So does `master`. The next push to that action repository changes what your workflow runs, including a workflow that has been green for months. You will not get a diff in your own pull request when that happens. A floating tag such as `@v4` can be moved by the action owner the same way. The check's example is `actions/checkout@main`. Treat `@master` as the same line.",
          "A release tag is better, and it can still move. Whoever owns the tag can point `v4` at a new commit. A full 40-character commit SHA does not move. GitHub rejects a force-push that would reuse a SHA. The check looks for `@main` and `@master`. It does not look up the action repository, and it will not invent a SHA when the workflow only names a branch.",
        ],
      },
      {
        heading: "Paste the uses line you are willing to keep",
        paragraphs: [
          "Open the action repository at the commit you mean, read the changelog since the tag you used to run, and copy that SHA onto the `uses` line: `actions/checkout@` followed by the 40 hex characters. Keep the tag in a comment if you want a human-readable name, but the `uses` value has to be the SHA. Dependabot and similar bots can open a pull request when you want a newer SHA. That pull request is the review. A silent move on `main` is not. A workflow that calls a local action with `uses: ./actions/build` is your own code, and this check is not about that line. Third-party actions are the ones that move underneath you. Pin those.",
          "Paste the workflow, not a description of it. Ask for the `uses` line to be quoted. If the line still says `@main`, that is the comment. The same file is worth a second pass for `pull_request_target` plus a checkout of the pull request head. Those are different findings, and one workflow can have both.",
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
    summary: "The last USER line wins. If that line is root, or if the Dockerfile never switches user, the process starts as root.",
    sections: [
      {
        heading: "The last USER is the one that runs",
        paragraphs: [
          "Docker reads the Dockerfile from top to bottom and keeps the last `USER`. `USER root` and `USER 0` are root. A file with no `USER` instruction at all is also root, because that is the image default. A comment that says the container runs as nginx is not a `USER` instruction, and neither is a name mentioned only in `CMD`. The check reads the text. It does not build the image, and it does not prove what a running host actually launched. A numeric user such as `USER 1000` counts only if that user exists in the image. The check still wants the instruction in the file.",
          "People put `USER root` back at the bottom because a late `apt-get` or `chown` failed once. The install belongs earlier. Switch user after the packages are in the image, and leave the file there. A later stage in a multi-stage build has its own user. The last stage is the one that ships, so that stage is the one that needs the `USER` line.",
        ],
      },
      {
        heading: "Name a user the image already has",
        paragraphs: [
          "End on a user the image already contains: `USER node`, `USER nginx`, or a user you created with `useradd` in that file. Don't invent a name the base image lacks and then discover it at startup. If the process must bind to port 80, give it another port above 1024 and put a proxy in front, or grant the capability you can name. `USER root` is not the fix for a low port.",
          "Paste the Dockerfile. Ask for the last `USER` line to be quoted. If there is no `USER` line, that absence is the finding. The container privilege checklist is the longer pass over the same spec, including a Docker socket mount, which is a different way to get root on the host. A memory limit belongs on the runtime spec even after the user is right. A root user inside a limit can still fill that limit. Fix the user in this file, then set the memory limit in the runtime spec. They are two comments, not one.",
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
    summary: "A container with no memory limit, or with mem_limit set to 0, can grow until the kernel starts killing its neighbors.",
    sections: [
      {
        heading: "Zero is not a limit",
        paragraphs: [
          "In Compose, `mem_limit: 0` means unlimited. Omitting `mem_limit` means the same thing. `mem_reservation` is a request for a share of the host, not a cap, so a file that only sets the reservation still has no limit. In a Kubernetes Pod, a container with no `resources.limits.memory` has no memory cap in that file. `resources.requests.memory` is the same kind of request. The check looks for a missing limit and for `mem_limit: 0`. It does not measure live RSS, and it cannot see a limit that exists only as a namespace policy outside the text you pasted.",
          "When the host runs out of memory, the kernel's OOM killer picks a process. It does not have to pick the container that grew. A sidecar, a daemon, or the node agent can die first. The workload you forgot to cap is still running. That is the outage people file against the wrong service. A limit of `0` is how a Compose file says there is no cap on purpose, so delete it rather than lowering it.",
        ],
      },
      {
        heading: "Write the number on the container",
        paragraphs: [
          "Take the memory the process used the last time it was busy, and add headroom you can explain in the pull request. Put that number on the container that runs the process: `mem_limit: 512m` in Compose, or `resources.limits.memory: 512Mi` on the container in the Pod spec. A limit on a different container in the same file does not cover this one. Compose `mem_limit: 0` is the line to delete, not to tune.",
          "Paste the Compose file or the manifest. Ask for the limit line to be quoted, including the container name. If the line is missing, say so in the review instead of assuming the cluster adds one later. A limit applied by a policy you didn't paste is invisible to the check. Write the number you mean, such as `mem_limit: 512m` or `memory: 512Mi`, next to that container and not on a sibling. The Docker socket post is the other host-level grant in the same kind of file: a memory limit does not make a mounted `docker.sock` safe. Quote the limit in the review comment so the next diff has to change that number on purpose.",
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
    summary: "A volume line that looks like a CI convenience is a root shell on the Docker host. Here is the line to refuse, and the volume to ask for instead.",
    sections: [
      {
        heading: "The line that looks like a helper",
        paragraphs: [
          "The usual Compose snippet is two paths and a colon: `/var/run/docker.sock:/var/run/docker.sock`. People add it so a container can build an image, run a test, or talk to a local registry. The socket is the Docker API. A process that can write to it can create a container, bind-mount `/` from the host, and start that container as root. On the host, `docker.sock` is typically mode 660 and group `docker`. Inside the app container, that same file is just a path. The mount does not drop the privilege. It moves it.",
          "A Kubernetes `hostPath` to `/var/run/docker.sock` is the same grant with a different filename. So is a sidecar that mounts the outer socket so the job can shell out to `docker run`. If the comment above the volume says temporary, read the line anyway. Temporary mounts are how this survives review. `privileged: true` is not the safer replacement. That flag is a different way to get root on the node, and the elevated container check is written for it separately.",
        ],
      },
      {
        heading: "Ask for a directory, not the engine",
        paragraphs: [
          "Ask for the directory the job needs. A bind of `./artifacts:/work` or a named volume cannot start a container on the host. If the job must build an image, keep the builder outside the app container. Give that builder a registry credential for one repository, not the socket. Do not pass `/var/run/docker.sock` through so the app can call Docker. If a tool documents \"mount the socket\" as the setup step, treat that sentence as the finding, then look for the flag that takes a remote builder or a registry instead.",
          "Paste the Compose file or the manifest. Do not describe it. The line to quote is the volume. The container privilege checklist is written for that paste, and the Docker socket check looks for the same path: `volumes`, then `/var/run/docker.sock`. If that line is not in the text you submitted, the check will not invent it. A socket mounted only at runtime, outside the file, is outside the check. Quote the line in the review comment so the next diff has to delete it on purpose.",
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
    summary: "A merge is a bad time to discover that a security group allows the internet. Here is the pass I run on the diff first.",
    sections: [
      {
        heading: "Read the diff for reachability, then for identity",
        paragraphs: [
          "Start with anything that changes who can connect. That is a cidr_blocks entry, an ingress block, a publicly_accessible flag, or a bucket ACL. If the diff adds 0.0.0.0/0, stop and name the port.",
          "Then read the IAM. A statement with Action \"*\" or Resource \"*\" is a second change hiding in the same pull request. The network line gets the comments. The policy line ships anyway.",
        ],
      },
      {
        heading: "Paste the file, not a summary of the file",
        paragraphs: [
          "An assistant will invent a resource name if you only describe the change. Paste the .tf file, or the plan snippet that shows the address. Ask it to quote the line.",
          "The public exposure checklist and the wildcard IAM checklist are written for that paste. Each one ends with a prompt you can open in Claude or ChatGPT.",
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
          "That limit is the useful part. A finding means the text contains the pattern. It does not mean the account is safe, and it does not mean the account is owned.",
        ],
      },
      {
        heading: "Use a checklist when you are not ready to submit a job",
        paragraphs: [
          "The free resources are the same kind of question, written so you can run them in the assistant you already pay for. The container privilege review is the one I use on a manifest before it goes to a cluster.",
          "When you want the same questions saved as a job, the review checks page lists what each built-in check looks for.",
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
    summary: "The prompt is only useful if it lands in the chat you already have open. The Actions menu does that copy, or opens the assistant with the text filled in.",
    sections: [
      {
        heading: "Open it, or copy the shape you need",
        paragraphs: [
          "On a prompt, a bot, or a free resource, Actions can open Claude, ChatGPT, Grok, SuperGrok, Codex, or Perplexity. Claude, ChatGPT, Grok, and Perplexity get the prompt in the link when it is short enough.",
          "Copy plain text when you want the body alone. Copy as markdown when you want a heading you can drop into notes. Copy for an agent when the next assistant needs the task name and a rule: use only the files you provide, and ask if one is missing.",
        ],
      },
      {
        heading: "Gemini and long prompts",
        paragraphs: [
          "Gemini does not take a reliable prefilled link, so Actions copies the agent handoff and opens Gemini for you to paste. The same copy happens for any assistant when the encoded prompt is longer than 1800 characters. The page says so, instead of opening a chat that silently dropped the text.",
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
