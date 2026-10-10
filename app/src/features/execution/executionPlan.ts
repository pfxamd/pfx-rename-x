import type { RenameResult } from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";
import type { ExecutionIssue, ExecutionItem, ExecutionPlan } from "./types.js";

export function buildExecutionPlan(
  files: AppFile[],
  result: RenameResult,
  options: { includeUnchanged?: boolean } = {},
): ExecutionPlan {
  const issues: ExecutionIssue[] = [];

  if (!result.valid || !result.preview.valid) {
    issues.push({
      code: "INVALID_PREVIEW",
      message: "The rename preview must be valid before files can be downloaded.",
    });
  }

  const filesById = new Map(files.map((file) => [file.id, file]));
  const items: ExecutionItem[] = [];

  // The streamlined workspace downloads every selected file, while other
  // consumers can retain the manifest-only (changed-files) behavior.
  const entries = options.includeUnchanged
    ? result.preview.items.map((item) => ({
        id: item.id,
        from: item.originalName,
        to: item.newName,
      }))
    : result.manifest.entries;

  for (const entry of entries) {
    const source = filesById.get(entry.id);

    if (!source) {
      issues.push({
        code: "MISSING_SOURCE",
        message: `Source file is missing for manifest entry ${entry.id}.`,
        fileId: entry.id,
      });
      continue;
    }

    if (source.input.originalName !== entry.from) {
      issues.push({
        code: "SOURCE_MISMATCH",
        message: `Source filename no longer matches the manifest for ${entry.id}.`,
        fileId: entry.id,
      });
      continue;
    }

    items.push({
      id: entry.id,
      source,
      from: entry.from,
      to: entry.to,
    });
  }

  if (result.valid && entries.length === 0) {
    issues.push({
      code: "NO_CHANGES",
      message: "There are no changed filenames to download.",
    });
  }

  return {
    ready: issues.length === 0 && items.length > 0,
    items,
    issues,
  };
}
