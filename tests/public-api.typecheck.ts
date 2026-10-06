import {
  PfxRuleRegistry,
  RenameEngine,
  caseTransform,
  characterFilter,
  composeFilename,
  counter,
  createBuiltinRegistry,
  date,
  extension,
  findReplace,
  insert,
  numberRange,
  parseFilename,
  prefix,
  regexReplace,
  remove,
  rename,
  sanitize,
  slugify,
  suffix,
  template,
  trim,
  type CaseConfig,
  type CharacterFilterConfig,
  type CounterConfig,
  type DateConfig,
  type ExtensionConfig,
  type FilenameParts,
  type FindReplaceConfig,
  type InsertConfig,
  type IssueCode,
  type NumberRangeConfig,
  type PrefixConfig,
  type RegexReplaceConfig,
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
  type RulePreflightContext,
  type RuleType,
  type RuleValidationResult,
  type SanitizeConfig,
  type SlugifyConfig,
  type SuffixConfig,
  type TemplateConfig,
  type TrimConfig,
} from "../src/index.js";

void PfxRuleRegistry;
void RenameEngine;
void caseTransform;
void characterFilter;
void composeFilename;
void counter;
void createBuiltinRegistry;
void date;
void extension;
void findReplace;
void insert;
void numberRange;
void parseFilename;
void prefix;
void regexReplace;
void remove;
void rename;
void sanitize;
void slugify;
void suffix;
void template;
void trim;

type PublicTypes =
  | CaseConfig
  | CharacterFilterConfig
  | CounterConfig
  | DateConfig
  | ExtensionConfig
  | FilenameParts
  | FindReplaceConfig
  | InsertConfig
  | IssueCode
  | NumberRangeConfig
  | PrefixConfig
  | RegexReplaceConfig
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
  | RulePreflightContext
  | RuleType
  | RuleValidationResult
  | SanitizeConfig
  | SlugifyConfig
  | SuffixConfig
  | TemplateConfig
  | TrimConfig;

declare const contract: PublicTypes;
void contract;
