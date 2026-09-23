import { protectedResourceMetadata } from "@skaleagents/swarm/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return protectedResourceMetadata();
}
