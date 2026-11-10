import type { HouseRule } from "@/lib/api";

const verbs: Record<HouseRule["kind"], string> = { require_attribute: "must set", require_tag: "must have the tag", forbid_value: "must not set" };

// Same wording the audit uses in finding titles, after "House rule: ".
export function ruleSentence(rule: Pick<HouseRule, "kind" | "resourceType" | "attribute" | "value">): string {
  return `${rule.resourceType} ${verbs[rule.kind]} ${rule.attribute}${rule.kind === "forbid_value" ? ` to ${rule.value}` : ""}`;
}
