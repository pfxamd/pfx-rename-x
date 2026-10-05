import { describe, expect, it } from "vitest";
import { caseTransform, counter, date, extension, findReplace, prefix, rename, sanitize } from "../src/index.js";

describe("rename engine", () => {
  it("applies ordered rules and builds a manifest", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "IMG 01.JPG" },
        { id: "b", originalName: "IMG 02.JPG" },
      ],
      rules: [
        findReplace({ find: "IMG", replace: "Photo" }),
        caseTransform("lowercase"),
        prefix("trip-"),
        counter({ start: 1, padding: 3 }),
        extension({ mode: "lowercase" }),
      ],
      options: { extensionPolicy: "allow-change", now: new Date("2026-10-06T12:00:00Z") },
    });

    expect(result.valid).toBe(true);
    expect(result.preview.items.map((x) => x.newName)).toEqual([
      "trip-photo 01-001.jpg",
      "trip-photo 02-002.jpg",
    ]);
    expect(result.manifest.entries).toHaveLength(2);
  });

  it("detects duplicate outputs", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "A.txt" },
        { id: "b", originalName: "B.txt" },
      ],
      rules: [findReplace({ find: "A", replace: "same" }), findReplace({ find: "B", replace: "same" })],
    });

    expect(result.valid).toBe(false);
    expect(result.issues.some((x) => x.code === "DUPLICATE_OUTPUT")).toBe(true);
  });

  it("does not emit a manifest when the preview is invalid", () => {
    const result = rename({
      files: [
        { id: "a", originalName: "A.txt" },
        { id: "b", originalName: "B.txt" },
      ],
      rules: [findReplace({ find: "A", replace: "same" }), findReplace({ find: "B", replace: "same" })],
      options: { now: new Date("2026-10-06T12:00:00Z") },
    });

    expect(result.valid).toBe(false);
    expect(result.manifest.entries).toEqual([]);
  });

  it("supports deterministic dates", () => {
    const result = rename({
      files: [{ id: "a", originalName: "photo.png" }],
      rules: [date({ format: "YYYYMMDD", position: "prefix" })],
      options: { now: new Date("2026-10-06T12:00:00Z") },
    });

    expect(result.preview.items[0]?.newName).toBe("20261006-photo.png");
  });

  it("sanitizes invalid characters only when explicitly requested", () => {
    const result = rename({
      files: [{ id: "a", originalName: "a:b.txt" }],
      rules: [sanitize({ replacement: "-" })],
    });
    expect(result.preview.items[0]?.newName).toBe("a-b.txt");
    expect(result.valid).toBe(true);
  });
});
