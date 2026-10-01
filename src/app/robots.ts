import { robotsPolicy } from "@/lib/ai-corpus";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return robotsPolicy();
}
