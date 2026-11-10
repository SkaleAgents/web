import { describe, expect, it } from "vitest";
import { ruleSentence } from "./house-rules";

describe("ruleSentence", () => {
  it("matches the finding titles the audit writes", () => {
    expect(ruleSentence({ kind: "require_tag", resourceType: "aws_s3_bucket", attribute: "owner", value: null })).toBe("aws_s3_bucket must have the tag owner");
    expect(ruleSentence({ kind: "forbid_value", resourceType: "aws_s3_bucket", attribute: "acl", value: "public-read" })).toBe("aws_s3_bucket must not set acl to public-read");
    expect(ruleSentence({ kind: "require_attribute", resourceType: "aws_db_instance", attribute: "deletion_protection", value: null })).toBe("aws_db_instance must set deletion_protection");
  });
});
