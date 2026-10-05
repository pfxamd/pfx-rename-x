import { describe, expect, it } from "vitest";
import {
  PfxRuleRegistry,
  RenameEngine,
  caseTransform,
  counter,
  date,
  extension,
  findReplace,
  prefix,
  remove,
  rename,
  sanitize,
  suffix,
  trim,
  type RuleHandler,
} from "../src/index.js";

describe("hardening", () => {
  it("rejects path-like original names instead of silently stripping directories", () => {
    const result = rename({ files: [{ id: "a", originalName: "folder/photo.jpg" }], rules: [] });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "INVALID_INPUT")).toBe(true);
  });

  it("rejects duplicate input ids", () => {
    const result = rename({
      files: [
        { id: "same", originalName: "a.txt" },
        { id: "same", originalName: "b.txt" },
      ],
      rules: [],
    });
    expect(result.issues.some((issue) => issue.code === "DUPLICATE_INPUT_ID")).toBe(true);
  });

  it("rejects invalid timestamps", () => {
    const result = rename({ files: [{ id: "a", originalName: "a.txt", lastModified: Number.NaN }], rules: [] });
    expect(result.issues.some((issue) => issue.code === "INVALID_INPUT")).toBe(true);
  });

  it("rejects invalid engine options without throwing", () => {
    const result = rename({
      files: [{ id: "a", originalName: "a.txt" }],
      rules: [],
      options: { maxNameLength: 0, now: new Date("invalid") },
    });
    expect(result.valid).toBe(false);
    expect(result.issues.filter((issue) => issue.code === "INVALID_OPTIONS").length).toBeGreaterThanOrEqual(2);
  });

  it("uses configured locale for case transforms", () => {
    const result = rename({
      files: [{ id: "a", originalName: "I.TXT" }],
      rules: [caseTransform("lowercase"), extension({ mode: "lowercase" })],
      options: { locale: "tr", extensionPolicy: "allow-change" },
    });
    expect(result.preview.items[0]?.newName).toBe("ı.txt");
  });

  it("treats find/replace replacement strings literally", () => {
    const result = rename({
      files: [{ id: "a", originalName: "A.txt" }],
      rules: [findReplace({ find: "A", replace: "$&" })],
    });
    expect(result.preview.items[0]?.newName).toBe("$&.txt");
  });

  it("treats sanitize replacement strings literally", () => {
    const result = rename({
      files: [{ id: "a", originalName: "a:b.txt" }],
      rules: [sanitize({ replacement: "$&" })],
    });
    expect(result.preview.items[0]?.newName).toBe("a$&b.txt");
  });

  it("detects canonically equivalent Unicode outputs", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "é.txt" },
        { id: "b", originalName: "e\u0301.txt" },
      ],
      rules: [],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "UNICODE_COLLISION")).toBe(true);
  });

  it("can disable Unicode normalization collision checks", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "é.txt" },
        { id: "b", originalName: "e\u0301.txt" },
      ],
      rules: [],
      options: { unicodeNormalization: "none" },
    });
    expect(result.valid).toBe(true);
  });

  it("detects case-insensitive collisions", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "Photo.txt" },
        { id: "b", originalName: "photo.txt" },
      ],
      rules: [],
    });
    expect(result.issues.some((issue) => issue.code === "CASE_COLLISION")).toBe(true);
  });

  it("never emits an unsafe manifest even when conflicts are warnings", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "A.txt" },
        { id: "b", originalName: "B.txt" },
      ],
      rules: [findReplace({ find: "A", replace: "same" }), findReplace({ find: "B", replace: "same" })],
      options: { conflictStrategy: "warn" },
    });
    expect(result.valid).toBe(true);
    expect(result.manifest.entries).toEqual([]);
  });

  it("counts Unicode code points for maxNameLength", () => {
    const result = rename({
      files: [{ id: "a", originalName: "😀.txt" }],
      rules: [],
      options: { maxNameLength: 5 },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects portable trailing dot and reserved names", () => {
    const trailing = rename({ files: [{ id: "a", originalName: "file." }], rules: [] });
    const reserved = rename({ files: [{ id: "b", originalName: "CON.txt" }], rules: [] });
    expect(trailing.issues.some((issue) => issue.code === "INVALID_CHARACTER")).toBe(true);
    expect(reserved.issues.some((issue) => issue.code === "RESERVED_NAME")).toBe(true);
  });

  it("keeps ordinary dotfiles valid", () => {
    const result = rename({ files: [{ id: "a", originalName: ".gitignore" }], rules: [] });
    expect(result.valid).toBe(true);
  });

  it("covers ordered builtin rule combinations", () => {
    const result = rename({
      files: [{ id: "a", originalName: "  Draft_copy.TXT" }],
      rules: [
        trim(),
        remove({ mode: "text", value: "_copy" }),
        prefix("doc-"),
        suffix("-final"),
        counter({ start: 7, padding: 2, separator: "-" }),
        extension({ mode: "lowercase" }),
      ],
      options: { extensionPolicy: "allow-change" },
    });
    expect(result.preview.items[0]?.newName).toBe("doc-Draft-final-07.txt");
  });

  it("uses lastModified deterministically when requested", () => {
    const result = rename({
      files: [{ id: "a", originalName: "photo.jpg", lastModified: Date.UTC(2020, 0, 2) }],
      rules: [date({ source: "lastModified", format: "YYYYMMDD", position: "prefix" })],
      options: { now: new Date("2026-10-06T12:00:00Z") },
    });
    expect(result.preview.items[0]?.newName).toBe("20200102-photo.jpg");
  });

  it("rejects invalid rule configs before processing files", () => {
    const result = rename({
      files: [{ id: "a", originalName: "a.txt" }],
      rules: [counter({ step: 0 })],
    });
    expect(result.preview.items).toEqual([]);
    expect(result.issues.some((issue) => issue.code === "INVALID_RULE_CONFIG")).toBe(true);
  });

  it("supports custom registered rules without modifying the engine", () => {
    const reverseHandler: RuleHandler<{}> = {
      type: "reverse",
      version: 1,
      validate: () => ({ valid: true, issues: [] }),
      apply: (state) => ({
        ...state,
        current: { ...state.current, basename: Array.from(state.current.basename).reverse().join("") },
      }),
    };
    const registry = new PfxRuleRegistry().register(reverseHandler);
    const engine = new RenameEngine(registry);
    const result = engine.rename({
      files: [{ id: "a", originalName: "abc.txt" }],
      rules: [{ id: "reverse-1", type: "reverse", version: 1, enabled: true, config: {} }],
    });
    expect(result.preview.items[0]?.newName).toBe("cba.txt");
  });

  it("handles a 10,000-file batch with unique deterministic outputs", () => {
    const files = Array.from({ length: 10_000 }, (_, index) => ({ id: String(index), originalName: `file-${index}.txt` }));
    const result = rename({ files, rules: [prefix("batch-"), counter({ start: 1, padding: 5 })] });
    expect(result.valid).toBe(true);
    expect(result.preview.items).toHaveLength(10_000);
    expect(result.manifest.entries).toHaveLength(10_000);
    expect(result.preview.items[9_999]?.newName).toBe("batch-file-9999-10000.txt");
  });
});
