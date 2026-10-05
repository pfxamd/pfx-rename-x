import type { RenameManifest, RenamePreview } from "../types.js";

const BLOCKING_CONFLICTS = new Set(["DUPLICATE_OUTPUT", "CASE_COLLISION", "UNICODE_COLLISION"]);

export function createManifest(preview: RenamePreview, now: Date): RenameManifest {
  const hasUnsafeConflict = preview.items.some((item) => item.issues.some((issue) => BLOCKING_CONFLICTS.has(issue.code)));

  return {
    version: 1,
    createdAt: now.toISOString(),
    entries: preview.valid && !hasUnsafeConflict
      ? preview.items
          .filter((item) => item.changed)
          .map((item) => ({ id: item.id, from: item.originalName, to: item.newName }))
      : [],
  };
}
