import { describe, expect, it } from "vitest";
import { rename } from "@pfxamd/rename-x";
import { ruleDefinitions } from "./ruleCatalog.js";

describe("rule catalog", () => {
  it("contains all 16 supported rules exactly once", () => {
    expect(ruleDefinitions).toHaveLength(16);
    expect(new Set(ruleDefinitions.map((definition) => definition.type)).size).toBe(16);
  });

  it("creates valid default rules", () => {
    for (const definition of ruleDefinitions) {
      const rule = definition.create();
      const result = rename({
        files: [{ id: "1", originalName: "sample file.txt" }],
        rules: [rule],
        options: { extensionPolicy: "allow-change" },
      });

      expect(
        result.issues.filter((issue) => issue.code === "INVALID_RULE_CONFIG"),
        definition.type,
      ).toEqual([]);
    }
  });
});
