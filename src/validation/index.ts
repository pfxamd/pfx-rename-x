import type { RenameInput, RenameIssue, RenameOptions, RenameState } from "../types.js";
import { composeFilename } from "../filename/index.js";

const WINDOWS_RESERVED = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

export function validateOptions(options: Required<RenameOptions>, nowIsValid: boolean): RenameIssue[] {
  const issues: RenameIssue[] = [];

  if (!nowIsValid) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.now must be a valid Date" });
  }
  if (!["sensitive", "insensitive"].includes(options.caseSensitivity)) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.caseSensitivity is invalid" });
  }
  if (!["error", "warn"].includes(options.conflictStrategy)) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.conflictStrategy is invalid" });
  }
  if (!["keep", "warn"].includes(options.unchangedStrategy)) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.unchangedStrategy is invalid" });
  }
  if (!["preserve", "allow-change"].includes(options.extensionPolicy)) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.extensionPolicy is invalid" });
  }
  if (!Number.isInteger(options.maxNameLength) || options.maxNameLength < 1) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.maxNameLength must be an integer >= 1" });
  }
  try {
    if (typeof options.locale !== "string" || options.locale.length === 0) throw new RangeError("invalid locale");
    Intl.getCanonicalLocales(options.locale);
  } catch {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.locale must be a valid locale" });
  }
  if (!["none", "NFC", "NFD"].includes(options.unicodeNormalization)) {
    issues.push({ code: "INVALID_OPTIONS", severity: "error", message: "options.unicodeNormalization is invalid" });
  }

  return issues;
}

export function validateInputs(files: RenameInput[]): RenameIssue[] {
  const issues: RenameIssue[] = [];
  const seenIds = new Map<string, number>();

  for (const file of files) {
    if (typeof file.id !== "string" || file.id.length === 0) {
      issues.push({ code: "INVALID_INPUT", severity: "error", message: "Every file requires a non-empty string id" });
    } else {
      seenIds.set(file.id, (seenIds.get(file.id) ?? 0) + 1);
    }

    if (typeof file.originalName !== "string" || file.originalName.length === 0) {
      issues.push({ code: "INVALID_INPUT", severity: "error", message: "Every file requires a non-empty originalName", ...(file.id ? { fileIds: [file.id] } : {}) });
      continue;
    }

    if (/[\\/]/.test(file.originalName)) {
      issues.push({ code: "INVALID_INPUT", severity: "error", message: "originalName must be a filename, not a path", ...(file.id ? { fileIds: [file.id] } : {}) });
    }

    if (file.size !== undefined && (!Number.isFinite(file.size) || file.size < 0)) {
      issues.push({ code: "INVALID_INPUT", severity: "error", message: "size must be a finite non-negative number", ...(file.id ? { fileIds: [file.id] } : {}) });
    }

    if (file.lastModified !== undefined && (!Number.isFinite(file.lastModified) || Number.isNaN(new Date(file.lastModified).getTime()))) {
      issues.push({ code: "INVALID_INPUT", severity: "error", message: "lastModified must be a valid timestamp", ...(file.id ? { fileIds: [file.id] } : {}) });
    }
  }

  for (const [id, count] of seenIds) {
    if (count > 1) {
      issues.push({ code: "DUPLICATE_INPUT_ID", severity: "error", message: `Duplicate input id: ${id}`, fileIds: [id] });
    }
  }

  return issues;
}

export function validateState(state: RenameState, options: Required<RenameOptions>): RenameIssue[] {
  const issues: RenameIssue[] = [];
  const { basename, extension } = state.current;
  const full = composeFilename(state.current);

  if (!basename) issues.push({ code: "EMPTY_BASENAME", severity: "error", message: "Filename basename cannot be empty", fileIds: [state.id] });
  if (/[<>:"/\\|?*\u0000-\u001F]/.test(basename) || /[ .]$/.test(full)) {
    issues.push({ code: "INVALID_CHARACTER", severity: "error", message: "Filename contains invalid or non-portable characters", fileIds: [state.id] });
  }
  if (/[<>:"/\\|?*\u0000-\u001F]/.test(extension)) {
    issues.push({ code: "INVALID_EXTENSION", severity: "error", message: "Extension contains invalid characters", fileIds: [state.id] });
  }
  if (Array.from(full).length > options.maxNameLength) {
    issues.push({ code: "NAME_TOO_LONG", severity: "error", message: `Filename exceeds ${options.maxNameLength} characters`, fileIds: [state.id] });
  }
  if (basename === "." || basename === ".." || WINDOWS_RESERVED.has(basename.toUpperCase())) {
    issues.push({ code: "RESERVED_NAME", severity: "error", message: "Filename uses a reserved system name", fileIds: [state.id] });
  }
  if (!state.changed && options.unchangedStrategy === "warn") {
    issues.push({ code: "UNCHANGED", severity: "warning", message: "Filename is unchanged", fileIds: [state.id] });
  }

  return issues;
}
