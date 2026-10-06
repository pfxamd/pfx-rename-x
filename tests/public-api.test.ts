import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public runtime API", () => {
  it("exports only the supported runtime surface", () => {
    expect(Object.keys(api).sort()).toEqual([
      "PfxRuleRegistry",
      "RenameEngine",
      "caseTransform",
      "composeFilename",
      "counter",
      "createBuiltinRegistry",
      "date",
      "extension",
      "findReplace",
      "parseFilename",
      "prefix",
      "remove",
      "rename",
      "sanitize",
      "suffix",
      "trim",
    ]);
  });
});
