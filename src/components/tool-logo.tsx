import type { BotIntegration } from "@/lib/api";

// Product marks published by each vendor, used only to identify the tool.
// Slack: slack.com media kit. Linear: linear.app favicon.
// Terraform: developer.hashicorp.com product icon (light #7b42bc, dark #a067da).
// AWS: aws.amazon.com smile touch icon. Kubernetes: CNCF artwork icon.

const box = { "aria-hidden": true as const, width: 16, height: 16, className: "directory-tool-logo" };

function RasterMark({ src }: { src: string }) {
  // Fixed 16px vendor marks, including an SVG the image optimizer will not process.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...box} src={src} alt="" />;
}

export function ToolLogo({ slug }: { slug: BotIntegration }) {
  switch (slug) {
    case "github":
      return (
        <svg {...box} viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5.01 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
        </svg>
      );
    case "slack":
      return <RasterMark src="/tool-logos/slack.png" />;
    case "linear":
      return (
        <svg {...box} viewBox="0 0 16 16">
          <rect width="16" height="16" rx="2" fill="#000" />
          <path
            fill="#fff"
            d="M2.147 9.383c-.027-.114.109-.186.192-.103l4.381 4.38c.083.083.011.219-.103.192a6.02 6.02 0 0 1-4.47-4.47ZM2 7.627a.12.12 0 0 0 .035.091l6.247 6.247a.12.12 0 0 0 .091.035q.428-.027.836-.111a.117.117 0 0 0 .057-.198L2.31 6.734a.117.117 0 0 0-.198.057 6 6 0 0 0-.11.836Zm.505-2.062a.12.12 0 0 0 .025.132l7.773 7.773a.12.12 0 0 0 .132.025q.322-.144.623-.322a.118.118 0 0 0 .022-.185L3.012 4.92a.118.118 0 0 0-.185.022q-.178.3-.322.623m1.014-1.396a.12.12 0 0 1-.005-.163 6.006 6.006 0 1 1 8.48 8.48.12.12 0 0 1-.163-.005z"
          />
        </svg>
      );
    case "terraform":
      return (
        <svg {...box} viewBox="0 0 16 16" className="directory-tool-logo directory-tool-logo-terraform">
          <path fill="currentColor" d="M1 0v5.05l4.349 2.527V2.526L1 0zM10.175 5.344l-4.35-2.525v5.05l4.35 2.527V5.344zM10.651 10.396V5.344L15 2.819v5.05l-4.349 2.527zM10.174 16l-4.349-2.526v-5.05l4.349 2.525V16z" />
        </svg>
      );
    case "aws":
      return <RasterMark src="/tool-logos/aws.png" />;
    case "kubernetes":
      return <RasterMark src="/tool-logos/kubernetes.svg" />;
  }
}
