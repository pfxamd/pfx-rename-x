import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { prefix, rename } from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";
import { buildExecutionPlan } from "./executionPlan.js";
import { createZipArchive } from "./zipArchive.js";

function appFile(id: string, name: string, content: string): AppFile {
  const blob = new Blob([content], { type: "text/plain" });

  return {
    id,
    file: blob as File,
    input: {
      id,
      originalName: name,
      size: blob.size,
      lastModified: 100,
    },
  };
}

describe("ZIP archive adapter", () => {
  it("packages renamed files and the manifest without changing file bytes", async () => {
    const files = [
      appFile("1", "a.txt", "alpha"),
      appFile("2", "b.txt", "beta"),
    ];
    const result = rename({
      files: files.map((item) => item.input),
      rules: [prefix("new-")],
    });
    const plan = buildExecutionPlan(files, result);
    const progress: string[] = [];

    const blob = await createZipArchive(plan, result.manifest, (event) => {
      progress.push(`${event.completed}/${event.total}:${event.currentName}`);
    });

    const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()));

    expect(strFromU8(archive["new-a.txt"]!)).toBe("alpha");
    expect(strFromU8(archive["new-b.txt"]!)).toBe("beta");
    expect(JSON.parse(strFromU8(archive["pfx-rename-x-manifest.json"]!))).toEqual(
      result.manifest,
    );
    expect(progress).toEqual([
      "1/2:new-a.txt",
      "2/2:new-b.txt",
    ]);
  });

  it("refuses to archive a blocked execution plan", async () => {
    await expect(
      createZipArchive(
        { ready: false, items: [], issues: [] },
        { version: 1, createdAt: new Date(0).toISOString(), entries: [] },
      ),
    ).rejects.toThrow("Execution plan is not ready.");
  });
});
