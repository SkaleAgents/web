import { publicCheckPath, publicChecks } from "@/lib/public-checks";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    name: "SkaleAgents infrastructure review checks",
    accountRequired: false,
    checks: publicChecks.map((check) => ({
      ...check,
      url: `https://skaleagents.com${publicCheckPath(check)}`,
    })),
  }, {
    headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
}
