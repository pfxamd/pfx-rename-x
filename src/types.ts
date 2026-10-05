export interface RenameInput {
  id: string;
  originalName: string;
  size?: number;
  lastModified?: number;
}

export interface FilenameParts {
  basename: string;
  extension: string;
}

export interface RenameState {
  id: string;
  originalName: string;
  original: FilenameParts;
  current: FilenameParts;
  index: number;
  changed: boolean;
  issues: RenameIssue[];
  metadata: {
    size?: number;
    lastModified?: number;
  };
}

export interface RenameContext {
  index: number;
  total: number;
  now: Date;
}

export type RuleType =
  | "prefix"
  | "suffix"
  | "find-replace"
  | "remove"
  | "case"
  | "counter"
  | "date"
  | "extension"
  | "trim"
  | "sanitize"
  | (string & {});

export interface RenameRule<TConfig = unknown> {
  id: string;
  type: RuleType;
  version: number;
  enabled: boolean;
  config: TConfig;
}

export interface RuleValidationResult {
  valid: boolean;
  issues: RenameIssue[];
}

export interface RuleHandler<TConfig = unknown> {
  type: RuleType;
  version: number;
  validate(config: TConfig): RuleValidationResult;
  apply(state: RenameState, config: TConfig, context: RenameContext): RenameState;
}

export type IssueCode =
  | "UNKNOWN_RULE"
  | "INVALID_RULE_CONFIG"
  | "DUPLICATE_OUTPUT"
  | "CASE_COLLISION"
  | "EMPTY_BASENAME"
  | "INVALID_CHARACTER"
  | "INVALID_EXTENSION"
  | "NAME_TOO_LONG"
  | "UNCHANGED"
  | "RESERVED_NAME";

export interface RenameIssue {
  code: IssueCode;
  severity: "error" | "warning";
  message: string;
  fileIds?: string[];
  ruleId?: string;
}

export interface RenamePreviewItem {
  id: string;
  originalName: string;
  newName: string;
  changed: boolean;
  valid: boolean;
  issues: RenameIssue[];
}

export interface RenamePreview {
  items: RenamePreviewItem[];
  valid: boolean;
}

export interface RenameManifestEntry {
  id: string;
  from: string;
  to: string;
}

export interface RenameManifest {
  version: 1;
  createdAt: string;
  entries: RenameManifestEntry[];
}

export interface RenameOptions {
  caseSensitivity?: "sensitive" | "insensitive";
  conflictStrategy?: "error" | "warn";
  unchangedStrategy?: "keep" | "warn";
  extensionPolicy?: "preserve" | "allow-change";
  maxNameLength?: number;
  locale?: string;
  now?: Date;
}

export interface RenameRequest {
  files: RenameInput[];
  rules: RenameRule[];
  options?: RenameOptions;
}

export interface RenameResult {
  preview: RenamePreview;
  manifest: RenameManifest;
  valid: boolean;
  issues: RenameIssue[];
}
