import type { RenameIssue, RenameOptions, RenamePreviewItem } from "../types.js";

function normalizeUnicode(name: string, mode: Required<RenameOptions>["unicodeNormalization"]): string {
  return mode === "none" ? name : name.normalize(mode);
}

export function detectConflicts(items: RenamePreviewItem[], options: Required<RenameOptions>): RenameIssue[] {
  const exact = new Map<string, string[]>();
  const normalized = new Map<string, { ids: string[]; spellings: Set<string> }>();
  const folded = new Map<string, { ids: string[]; normalizedSpellings: Set<string> }>();

  for (const item of items) {
    const exactIds = exact.get(item.newName) ?? [];
    exactIds.push(item.id);
    exact.set(item.newName, exactIds);

    const normalizedName = normalizeUnicode(item.newName, options.unicodeNormalization);
    const normalizedGroup = normalized.get(normalizedName) ?? { ids: [], spellings: new Set<string>() };
    normalizedGroup.ids.push(item.id);
    normalizedGroup.spellings.add(item.newName);
    normalized.set(normalizedName, normalizedGroup);

    if (options.caseSensitivity === "insensitive") {
      const key = normalizedName.toLocaleLowerCase(options.locale);
      const foldedGroup = folded.get(key) ?? { ids: [], normalizedSpellings: new Set<string>() };
      foldedGroup.ids.push(item.id);
      foldedGroup.normalizedSpellings.add(normalizedName);
      folded.set(key, foldedGroup);
    }
  }

  const severity = options.conflictStrategy === "warn" ? "warning" as const : "error" as const;
  const issues: RenameIssue[] = [];

  for (const [name, ids] of exact) {
    if (ids.length > 1) issues.push({ code: "DUPLICATE_OUTPUT", severity, message: `Multiple files resolve to ${name}`, fileIds: ids });
  }

  if (options.unicodeNormalization !== "none") {
    for (const group of normalized.values()) {
      if (group.ids.length > 1 && group.spellings.size > 1) {
        issues.push({ code: "UNICODE_COLLISION", severity, message: "Output filenames are canonically equivalent after Unicode normalization", fileIds: group.ids });
      }
    }
  }

  if (options.caseSensitivity === "insensitive") {
    for (const group of folded.values()) {
      if (group.ids.length > 1 && group.normalizedSpellings.size > 1) {
        issues.push({ code: "CASE_COLLISION", severity, message: "Output filenames differ only by letter case", fileIds: group.ids });
      }
    }
  }

  return issues;
}
