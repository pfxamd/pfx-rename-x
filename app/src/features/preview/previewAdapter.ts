import {
  rename,
  type RenameOptions,
  type RenameResult,
  type RenameRule,
} from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";

export function buildPreview(
  files: AppFile[],
  rules: RenameRule[],
  options: RenameOptions,
): RenameResult {
  return rename({
    files: files.map((item) => item.input),
    rules,
    options,
  });
}
