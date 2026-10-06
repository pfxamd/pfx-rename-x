export { RenameEngine, rename } from "./core/engine.js";
export { parseFilename, composeFilename } from "./filename/index.js";
export { PfxRuleRegistry } from "./rules/registry.js";
export {
  createBuiltinRegistry,
  prefix,
  suffix,
  findReplace,
  remove,
  caseTransform,
  counter,
  date,
  extension,
  trim,
  sanitize,
} from "./rules/builtins.js";

export type {
  CaseConfig,
  CounterConfig,
  DateConfig,
  ExtensionConfig,
  FindReplaceConfig,
  PrefixConfig,
  RemoveConfig,
  SanitizeConfig,
  SuffixConfig,
  TrimConfig,
} from "./rules/builtins.js";

export type {
  FilenameParts,
  IssueCode,
  RenameContext,
  RenameInput,
  RenameIssue,
  RenameManifest,
  RenameManifestEntry,
  RenameOptions,
  RenamePreview,
  RenamePreviewItem,
  RenameRequest,
  RenameResult,
  RenameRule,
  RenameState,
  RuleHandler,
  RuleType,
  RuleValidationResult,
} from "./types.js";
