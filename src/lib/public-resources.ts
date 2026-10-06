export type PublicResource = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  outcome: string;
  checklist: readonly string[];
  promptTitle: string;
  prompt: string;
};

export const publicResources: readonly PublicResource[] = [
  {
    slug: "public-exposure-review",
    title: "Public exposure review",
    summary: "A checklist for Terraform, security groups, and buckets that are reachable from the internet.",
    audience: "You are about to merge a network or storage change and want a second pass before it ships.",
    outcome: "A short list of resources that accept traffic you did not mean to publish, each with the line that opens it.",
    checklist: [
      "A security group, firewall, or network ACL allows 0.0.0.0/0 or ::/0.",
      "A management port (22, 3389, 3306, 5432, 6379, 9200, 27017) is reachable from the internet.",
      "A bucket, blob container, or object ACL grants public read or public write.",
      "A database sets publicly_accessible, or a data store has a public IP.",
      "A load balancer or ingress has no source restriction on a private app.",
      "A comment says the opening is temporary, and the rule is still in the file.",
    ],
    promptTitle: "Public exposure review",
    prompt: `Review the infrastructure I paste for public exposure.

Use only the files I give you. If a security group, bucket policy, or database setting is missing, ask for it before you name a finding.

For each finding:
- Quote the resource and the line.
- Say which port, principal, or ACL is open, and from where.
- Say what breaks if that path is closed.
- Give one change and how to check it after apply.

Skip style nits. Skip anything you cannot point at in the text.`,
  },
  {
    slug: "wildcard-iam-review",
    title: "Wildcard IAM review",
    summary: "A checklist for IAM, resource policies, and roles that grant more than the job needs.",
    audience: "You are reading a policy change and want to see which statement is wider than the task.",
    outcome: "The statements that use a wildcard action, resource, or principal, with a narrower replacement when the file shows the real API calls.",
    checklist: [
      "An action is * or a whole service, such as s3:* or iam:*.",
      "The resource is * when the file already names the bucket, queue, or table.",
      "A principal is * on a policy that is not meant to be public.",
      "iam:PassRole or a role assumption is paired with a wildcard action.",
      "A condition is commented out, so the statement is wider than the note beside it.",
      "The same permission shows up in a managed policy and again inline.",
    ],
    promptTitle: "Wildcard IAM review",
    prompt: `Review the IAM or resource policy I paste for wildcard access.

Use only the policy text I give you. If the calling code or the list of real API actions is missing, ask for it before you propose a narrower action list.

For each finding:
- Quote the statement.
- Say whether the wildcard is the action, the resource, or the principal.
- Say what that statement can reach beyond the task described in the file.
- Propose a narrower statement only when the file shows the specific actions or ARNs. Otherwise say what you still need.

Do not invent account IDs or resource names.`,
  },
  {
    slug: "container-privilege-review",
    title: "Container privilege review",
    summary: "A checklist for pods, Compose files, and Dockerfiles that run with more privilege than the process needs.",
    audience: "You are looking at a container spec before it lands on a shared cluster or a laptop that mounts the host.",
    outcome: "The containers that run as root, mount the Docker socket, or turn on host access, with the line that does it.",
    checklist: [
      "privileged is true, or the container adds SYS_ADMIN, NET_ADMIN, or SYS_PTRACE.",
      "The Docker socket or another host runtime socket is mounted in.",
      "The process runs as root, or the image never sets USER.",
      "hostNetwork, hostPID, or hostIPC is set.",
      "No memory limit is set on a container that can be driven by outside input.",
      "A volume mounts a host path that includes credentials, the Docker config, or /.",
    ],
    promptTitle: "Container privilege review",
    prompt: `Review the container spec I paste for extra privilege.

Use only the Dockerfile, Compose file, or Kubernetes manifest I give you. If the runtime flags live in another file, ask for that file before you call the container safe.

For each finding:
- Quote the container name and the line.
- Say what the setting lets the process do on the host or the cluster.
- Give one change, such as dropping the capability, setting a user, or removing the mount.
- Say how to confirm the new spec still starts.

Skip formatting. Skip findings you cannot point at in the text.`,
  },
];

export function publicResourcePath(resource: Pick<PublicResource, "slug">): string {
  return `/resources/${resource.slug}`;
}

export function publicResourceBySlug(slug: string): PublicResource | undefined {
  return publicResources.find((resource) => resource.slug === slug);
}

export function resourcesIndexMarkdown(): string {
  return [
    "# Free resources",
    "",
    "Checklists and prompts for a review you run in your own assistant. Reading a page does not start an audit.",
    "",
    ...publicResources.map((resource) => `- [${resource.title}](https://skaleagents.com${publicResourcePath(resource)}.md): ${resource.summary}`),
    "",
  ].join("\n");
}

export function resourceMarkdown(slug: string): string | null {
  const resource = publicResourceBySlug(slug);
  if (!resource) return null;
  return [
    `# ${resource.title}`,
    "",
    resource.summary,
    "",
    resource.audience,
    "",
    "## What you should get",
    "",
    resource.outcome,
    "",
    "## Checklist",
    "",
    ...resource.checklist.map((item) => `- ${item}`),
    "",
    `## ${resource.promptTitle}`,
    "",
    resource.prompt,
    "",
    `The HTML page is https://skaleagents.com${publicResourcePath(resource)}. Use Actions there to copy the prompt or open it in an assistant.`,
    "",
  ].join("\n");
}
