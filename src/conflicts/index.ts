import type { RenameIssue, RenameOptions, RenamePreviewItem } from "../types.js";

export function detectConflicts(items: RenamePreviewItem[], options: Required<RenameOptions>): RenameIssue[] {
  const exact = new Map<string, string[]>();
  const folded = new Map<string, { name: string; ids: string[] }>();

  for (const item of items) {
    const exactIds = exact.get(item.newName) ?? [];
    exactIds.push(item.id);
    exact.set(item.newName, exactIds);

    if (options.caseSensitivity === "insensitive") {
      const key = item.newName.toLocaleLowerCase(options.locale);
      const group = folded.get(key) ?? { name: item.newName, ids: [] };
      group.ids.push(item.id);
      folded.set(key, group);
    }
  }

  const severity = options.conflictStrategy === "warn" ? "warning" as const : "error" as const;
  const issues: RenameIssue[] = [];

  for (const [name, ids] of exact) {
    if (ids.length > 1) issues.push({ code: "DUPLICATE_OUTPUT", severity, message: `Multiple files resolve to ${name}`, fileIds: ids });
  }

  if (options.caseSensitivity === "insensitive") {
    for (const group of folded.values()) {
      if (group.ids.length <= 1) continue;
      const exactGroup = exact.get(group.name);
      if (exactGroup?.length === group.ids.length) continue;
      issues.push({ code: "CASE_COLLISION", severity, message: "Output filenames differ only by letter case", fileIds: group.ids });
    }
  }

  return issues;
}
