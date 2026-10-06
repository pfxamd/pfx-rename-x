import {
  PfxRuleRegistry,
  RenameEngine,
  caseTransform,
  composeFilename,
  counter,
  createBuiltinRegistry,
  date,
  extension,
  findReplace,
  parseFilename,
  prefix,
  remove,
  rename,
  sanitize,
  suffix,
  trim,
  type CaseConfig,
  type CounterConfig,
  type DateConfig,
  type ExtensionConfig,
  type FilenameParts,
  type FindReplaceConfig,
  type IssueCode,
  type PrefixConfig,
  type RemoveConfig,
  type RenameContext,
  type RenameInput,
  type RenameIssue,
  type RenameManifest,
  type RenameManifestEntry,
  type RenameOptions,
  type RenamePreview,
  type RenamePreviewItem,
  type RenameRequest,
  type RenameResult,
  type RenameRule,
  type RenameState,
  type RuleHandler,
  type RuleType,
  type RuleValidationResult,
  type SanitizeConfig,
  type SuffixConfig,
  type TrimConfig,
} from "../src/index.js";

void PfxRuleRegistry;
void RenameEngine;
void caseTransform;
void composeFilename;
void counter;
void createBuiltinRegistry;
void date;
void extension;
void findReplace;
void parseFilename;
void prefix;
void remove;
void rename;
void sanitize;
void suffix;
void trim;

type PublicTypes =
  | CaseConfig
  | CounterConfig
  | DateConfig
  | ExtensionConfig
  | FilenameParts
  | FindReplaceConfig
  | IssueCode
  | PrefixConfig
  | RemoveConfig
  | RenameContext
  | RenameInput
  | RenameIssue
  | RenameManifest
  | RenameManifestEntry
  | RenameOptions
  | RenamePreview
  | RenamePreviewItem
  | RenameRequest
  | RenameResult
  | RenameRule
  | RenameState
  | RuleHandler
  | RuleType
  | RuleValidationResult
  | SanitizeConfig
  | SuffixConfig
  | TrimConfig;

declare const contract: PublicTypes;
void contract;
