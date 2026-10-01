export const productCategories = ["All products", "Cloud & AI", "Developer tools", "Commerce", "More from us"] as const;

export type CatalogProduct = {
  name: string;
  domain: string;
  category: (typeof productCategories)[number];
  status: string;
  logo: string;
  color: string;
  ink: string;
  headline: string;
  description: string;
};

export const catalogProducts: CatalogProduct[] = [
  {
    name: "CloudPloy", domain: "cloudploy.com", category: "Cloud & AI", status: "Waitlist open",
    logo: "cloudploy.svg", color: "#e0f1f5", ink: "#153d4a",
    headline: "Your cloud. Your next deployment.",
    description: "Deploy to your own cloud through Claude Code, Cursor, or another MCP client. Keep deployment in the workflow you already use.",
  },
  {
    name: "Crontinel", domain: "crontinel.com", category: "Developer tools", status: "",
    logo: "crontinel.png", color: "#e6efda", ink: "#2e4524",
    headline: "Keep an eye on the work behind the scenes.",
    description: "Track scheduled jobs, queues, workers, and AI agent runs with open-source SDKs and a hosted monitoring dashboard.",
  },
  {
    name: "Toolblip", domain: "toolblip.com", category: "Developer tools", status: "",
    logo: "toolblip.svg", color: "#e4eafb", ink: "#283c75",
    headline: "Everyday tasks. A browser tab away.",
    description: "Format JSON, convert files, and work with text using free browser tools. No account needed.",
  },
  {
    name: "AmazingPlugins", domain: "amazingplugins.com", category: "Commerce", status: "",
    logo: "amazingplugins.jpg", color: "#eee5f6", ink: "#57316e",
    headline: "Small improvements for your store.",
    description: "Free WordPress and WooCommerce plugins that solve specific store problems, starting with accessibility.",
  },
  {
    name: "Appnary", domain: "appnary.com", category: "Commerce", status: "Coming soon",
    logo: "appnary.png", color: "#f7e9d7", ink: "#66451c",
    headline: "A helping hand for Shopify merchants.",
    description: "Affordable Shopify apps, including Pixel Tracker for managing Facebook, Google, TikTok, and other tracking pixels together.",
  },
  {
    name: "harun.dev", domain: "harun.dev", category: "More from us", status: "",
    logo: "harun.svg", color: "#e3ecec", ink: "#284747",
    headline: "Meet the engineer behind the products.",
    description: "Engineering notes and consulting from Harun R. Rayhan, covering software, cloud architecture, and DevOps.",
  },
];
