import type { RenameManifest, RenamePreview } from "../types.js";

export function createManifest(preview: RenamePreview, now: Date): RenameManifest {
  return {
    version: 1,
    createdAt: now.toISOString(),
    entries: preview.valid
      ? preview.items
          .filter((item) => item.changed)
          .map((item) => ({ id: item.id, from: item.originalName, to: item.newName }))
      : [],
  };
}
