import type { RenameIssue, RenameOptions, RenameState } from "../types.js";
import { composeFilename } from "../filename/index.js";

const WINDOWS_RESERVED = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

export function validateState(state: RenameState, options: Required<RenameOptions>): RenameIssue[] {
  const issues: RenameIssue[] = [];
  const { basename, extension } = state.current;
  const full = composeFilename(state.current);

  if (!basename) issues.push({ code: "EMPTY_BASENAME", severity: "error", message: "Filename basename cannot be empty", fileIds: [state.id] });
  if (/[<>:"/\\|?*\u0000-\u001F]/.test(basename)) {
    issues.push({ code: "INVALID_CHARACTER", severity: "error", message: "Filename contains invalid characters", fileIds: [state.id] });
  }
  if (/[<>:"/\\|?*\u0000-\u001F]/.test(extension)) {
    issues.push({ code: "INVALID_EXTENSION", severity: "error", message: "Extension contains invalid characters", fileIds: [state.id] });
  }
  if (full.length > options.maxNameLength) issues.push({ code: "NAME_TOO_LONG", severity: "error", message: `Filename exceeds ${options.maxNameLength} characters`, fileIds: [state.id] });
  if (WINDOWS_RESERVED.has(basename.toUpperCase())) issues.push({ code: "RESERVED_NAME", severity: "error", message: "Filename uses a reserved system name", fileIds: [state.id] });
  if (!state.changed && options.unchangedStrategy === "warn") issues.push({ code: "UNCHANGED", severity: "warning", message: "Filename is unchanged", fileIds: [state.id] });

  return issues;
}
