import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public runtime API", () => {
  it("exports only the supported runtime surface", () => {
    expect(Object.keys(api).sort()).toEqual([
      "PfxRuleRegistry",
      "RenameEngine",
      "caseTransform",
      "characterFilter",
      "composeFilename",
      "counter",
      "createBuiltinRegistry",
      "date",
      "extension",
      "findReplace",
      "insert",
      "numberRange",
      "parseFilename",
      "prefix",
      "regexReplace",
      "remove",
      "rename",
      "sanitize",
      "slugify",
      "suffix",
      "template",
      "trim",
    ]);
  });
});
