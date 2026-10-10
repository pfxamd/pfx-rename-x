import { describe, expect, it } from "vitest";
import { prefix, rename, type RenameResult } from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";
import { buildExecutionPlan } from "./executionPlan.js";

function appFile(id: string, name: string): AppFile {
  return {
    id,
    file: {} as File,
    input: {
      id,
      originalName: name,
      size: 10,
      lastModified: 100,
    },
  };
}

describe("execution plan", () => {
  it("maps a valid manifest back to its browser source files", () => {
    const files = [appFile("1", "a.txt"), appFile("2", "b.txt")];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [prefix("new-")],
    });

    const plan = buildExecutionPlan(files, result);

    expect(plan.ready).toBe(true);
    expect(plan.items.map((item) => [item.from, item.to])).toEqual([
      ["a.txt", "new-a.txt"],
      ["b.txt", "new-b.txt"],
    ]);
  });

  it("does not execute invalid previews", () => {
    const files = [appFile("1", "a.txt"), appFile("2", "b.txt")];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [
        {
          id: "broken",
          type: "find-replace",
          version: 1,
          enabled: true,
          config: { find: "", replace: "x" },
        },
      ],
    });

    const plan = buildExecutionPlan(files, result);

    expect(plan.ready).toBe(false);
    expect(plan.issues.some((issue) => issue.code === "INVALID_PREVIEW")).toBe(true);
  });

  it("refuses a manifest when its source file is missing", () => {
    const result: RenameResult = {
      valid: true,
      preview: { valid: true, items: [] },
      issues: [],
      manifest: {
        version: 1,
        createdAt: new Date(0).toISOString(),
        entries: [{ id: "missing", from: "a.txt", to: "b.txt" }],
      },
    };

    const plan = buildExecutionPlan([], result);

    expect(plan.ready).toBe(false);
    expect(plan.issues.some((issue) => issue.code === "MISSING_SOURCE")).toBe(true);
  });

  it("refuses stale manifests whose source name changed", () => {
    const files = [appFile("1", "current.txt")];
    const result: RenameResult = {
      valid: true,
      preview: { valid: true, items: [] },
      issues: [],
      manifest: {
        version: 1,
        createdAt: new Date(0).toISOString(),
        entries: [{ id: "1", from: "old.txt", to: "new.txt" }],
      },
    };

    const plan = buildExecutionPlan(files, result);

    expect(plan.ready).toBe(false);
    expect(plan.issues.some((issue) => issue.code === "SOURCE_MISMATCH")).toBe(true);
  });

  it("reports a valid no-op as having no downloadable changes", () => {
    const files = [appFile("1", "a.txt")];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [],
    });

    const plan = buildExecutionPlan(files, result);

    expect(plan.ready).toBe(false);
    expect(plan.issues).toEqual([
      {
        code: "NO_CHANGES",
        message: "There are no changed filenames to download.",
      },
    ]);
  });
  it("includes unchanged selections in the simple download while preserving manifest-only defaults", () => {
    const files = [appFile("1", "Artwork 01.jpg"), appFile("2", "other.png")];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [
        {
          id: "name",
          type: "template",
          version: 1,
          enabled: true,
          config: { pattern: "Artwork" },
        },
        {
          id: "count",
          type: "counter",
          version: 1,
          enabled: true,
          config: { start: 1, step: 1, padding: 2, separator: " ", position: "suffix" },
        },
      ],
    });
    const defaultPlan = buildExecutionPlan(files, result);
    const simplePlan = buildExecutionPlan(files, result, { includeUnchanged: true });

    expect(result.valid).toBe(true);
    expect(defaultPlan.items.map((item) => item.to)).toEqual(["Artwork 02.png"]);
    expect(simplePlan.ready).toBe(true);
    expect(simplePlan.items.map((item) => item.to)).toEqual(["Artwork 01.jpg", "Artwork 02.png"]);
  });

  it("permits an unchanged single filename as a direct download in the simplified workspace", () => {
    const files = [appFile("1", "Art.png")];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [
        { id: "same", type: "template", version: 1, enabled: true, config: { pattern: "Art" } },
      ],
    });
    expect(result.valid).toBe(true);
    const simplePlan = buildExecutionPlan(files, result, { includeUnchanged: true });
    expect(simplePlan.ready).toBe(true);
    expect(simplePlan.items.map(({ to }) => to)).toEqual(["Art.png"]);
  });

});
