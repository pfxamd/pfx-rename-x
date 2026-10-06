import { describe, expect, it } from "vitest";
import {
  characterFilter,
  findReplace,
  insert,
  numberRange,
  regexReplace,
  rename,
  slugify,
  template,
} from "../src/index.js";

describe("v0.2 advanced rules", () => {
  it("supports regex capture replacement", () => {
    const result = rename({
      files: [{ id: "a", originalName: "photo_2026_001.jpg" }],
      rules: [
        regexReplace({
          pattern: "^(.+?)_(\\d{4})_(\\d+)$",
          replace: "$2-$1-$3",
        }),
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.preview.items[0]?.newName).toBe("2026-photo-001.jpg");
  });

  it("rejects invalid regex patterns before processing files", () => {
    const result = rename({
      files: [{ id: "a", originalName: "photo.jpg" }],
      rules: [regexReplace({ pattern: "(", replace: "x" })],
    });

    expect(result.valid).toBe(false);
    expect(result.preview.items).toEqual([]);
    expect(result.issues.some((issue) => issue.code === "INVALID_RULE_CONFIG")).toBe(true);
  });

  it("slugifies Unicode text without losing non-Latin letters", () => {
    const latin = rename({
      files: [{ id: "a", originalName: "Crème Brûlée 2026.jpg" }],
      rules: [slugify()],
    });
    const arabic = rename({
      files: [{ id: "b", originalName: "صورة جديدة 2026.jpg" }],
      rules: [slugify()],
    });

    expect(latin.preview.items[0]?.newName).toBe("creme-brulee-2026.jpg");
    expect(arabic.preview.items[0]?.newName).toBe("صورة-جديدة-2026.jpg");
  });

  it("inserts by Unicode code point position", () => {
    const result = rename({
      files: [{ id: "a", originalName: "😀abc.txt" }],
      rules: [insert({ value: "-", position: 1 })],
    });

    expect(result.preview.items[0]?.newName).toBe("😀-abc.txt");
  });

  it("filters selected characters", () => {
    const removed = rename({
      files: [{ id: "a", originalName: "IMG_2026_001.jpg" }],
      rules: [characterFilter({ mode: "remove", characters: "0123456789" })],
    });
    const kept = rename({
      files: [{ id: "b", originalName: "A1B2C3.txt" }],
      rules: [characterFilter({ mode: "keep", characters: "0123456789" })],
    });

    expect(removed.preview.items[0]?.newName).toBe("IMG__.jpg");
    expect(kept.preview.items[0]?.newName).toBe("123.txt");
  });

  it("supports bounded ascending number ranges", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "one.txt" },
        { id: "b", originalName: "two.txt" },
        { id: "c", originalName: "three.txt" },
      ],
      rules: [numberRange({ start: 8, end: 10, padding: 2, position: "prefix" })],
    });

    expect(result.valid).toBe(true);
    expect(result.preview.items.map((item) => item.newName)).toEqual([
      "08-one.txt",
      "09-two.txt",
      "10-three.txt",
    ]);
  });

  it("supports bounded descending number ranges", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "one.txt" },
        { id: "b", originalName: "two.txt" },
        { id: "c", originalName: "three.txt" },
      ],
      rules: [numberRange({ start: 3, end: 1, padding: 2 })],
    });

    expect(result.valid).toBe(true);
    expect(result.preview.items.map((item) => item.newName)).toEqual([
      "one-03.txt",
      "two-02.txt",
      "three-01.txt",
    ]);
  });

  it("rejects a number range that cannot cover the batch", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "one.txt" },
        { id: "b", originalName: "two.txt" },
        { id: "c", originalName: "three.txt" },
      ],
      rules: [numberRange({ start: 1, end: 2 })],
    });

    expect(result.valid).toBe(false);
    expect(result.preview.items).toEqual([]);
    expect(result.issues.some((issue) => issue.message.includes("does not contain enough values"))).toBe(true);
  });

  it("rejects expansion outside a single-value range", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "one.txt" },
        { id: "b", originalName: "two.txt" },
      ],
      rules: [numberRange({ start: 4, end: 4, step: -1 })],
    });

    expect(result.valid).toBe(false);
  });

  it("builds names from template tokens and current pipeline state", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "IMG_A.jpg" },
        { id: "b", originalName: "IMG_B.jpg" },
      ],
      rules: [
        findReplace({ find: "IMG", replace: "photo" }),
        template({ pattern: "{index}-{name}-{original}-{total}", padding: 2 }),
      ],
    });

    expect(result.preview.items.map((item) => item.newName)).toEqual([
      "01-photo_A-IMG_A-02.jpg",
      "02-photo_B-IMG_B-02.jpg",
    ]);
  });

  it("rejects unsupported template tokens", () => {
    const result = rename({
      files: [{ id: "a", originalName: "photo.jpg" }],
      rules: [template({ pattern: "{unknown}" })],
    });

    expect(result.valid).toBe(false);
    expect(result.preview.items).toEqual([]);
  });
});
