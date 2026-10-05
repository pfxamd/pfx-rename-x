import type {
  RenameContext,
  RenameIssue,
  RenameRule,
  RenameState,
  RuleHandler,
  RuleValidationResult,
} from "../types.js";
import { PfxRuleRegistry } from "./registry.js";

function ok(): RuleValidationResult {
  return { valid: true, issues: [] };
}

function invalid(message: string): RuleValidationResult {
  return {
    valid: false,
    issues: [{ code: "INVALID_RULE_CONFIG", severity: "error", message }],
  };
}

function updateBasename(state: RenameState, basename: string): RenameState {
  return { ...state, current: { ...state.current, basename } };
}

function makeRule<T>(type: string, config: T): RenameRule<T> {
  return {
    id: `${type}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    type,
    version: 1,
    enabled: true,
    config,
  };
}

export interface PrefixConfig { value: string }
export const prefix = (value: string | PrefixConfig): RenameRule<PrefixConfig> =>
  makeRule("prefix", typeof value === "string" ? { value } : value);

const prefixHandler: RuleHandler<PrefixConfig> = {
  type: "prefix",
  version: 1,
  validate: (c) => typeof c?.value === "string" ? ok() : invalid("prefix.value must be a string"),
  apply: (s, c) => updateBasename(s, c.value + s.current.basename),
};

export interface SuffixConfig { value: string }
export const suffix = (value: string | SuffixConfig): RenameRule<SuffixConfig> =>
  makeRule("suffix", typeof value === "string" ? { value } : value);

const suffixHandler: RuleHandler<SuffixConfig> = {
  type: "suffix",
  version: 1,
  validate: (c) => typeof c?.value === "string" ? ok() : invalid("suffix.value must be a string"),
  apply: (s, c) => updateBasename(s, s.current.basename + c.value),
};

export interface FindReplaceConfig {
  find: string;
  replace: string;
  matchCase?: boolean;
  replaceAll?: boolean;
}
export const findReplace = (config: FindReplaceConfig): RenameRule<FindReplaceConfig> => makeRule("find-replace", config);

const findReplaceHandler: RuleHandler<FindReplaceConfig> = {
  type: "find-replace",
  version: 1,
  validate: (c) => typeof c?.find === "string" && c.find.length > 0 && typeof c.replace === "string"
    ? ok()
    : invalid("find-replace requires a non-empty find string and a replace string"),
  apply: (s, c) => {
    const flags = `${c.replaceAll === false ? "" : "g"}${c.matchCase ? "" : "i"}`;
    const escaped = c.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return updateBasename(s, s.current.basename.replace(new RegExp(escaped, flags), c.replace));
  },
};

export type RemoveConfig =
  | { mode: "text"; value: string; matchCase?: boolean }
  | { mode: "start" | "end"; count: number }
  | { mode: "range"; start: number; end: number };
export const remove = (config: RemoveConfig): RenameRule<RemoveConfig> => makeRule("remove", config);

const removeHandler: RuleHandler<RemoveConfig> = {
  type: "remove",
  version: 1,
  validate: (c) => {
    if (!c || typeof c !== "object" || !("mode" in c)) return invalid("remove.mode is required");
    if (c.mode === "text") return typeof c.value === "string" && c.value.length > 0 ? ok() : invalid("remove text value must be non-empty");
    if (c.mode === "start" || c.mode === "end") return Number.isInteger(c.count) && c.count >= 0 ? ok() : invalid("remove count must be a non-negative integer");
    if (c.mode === "range") return Number.isInteger(c.start) && Number.isInteger(c.end) && c.start >= 0 && c.end >= c.start ? ok() : invalid("remove range must be valid");
    return invalid("unsupported remove mode");
  },
  apply: (s, c) => {
    const value = s.current.basename;
    if (c.mode === "text") {
      const escaped = c.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, c.matchCase ? "g" : "gi");
      return updateBasename(s, value.replace(re, ""));
    }
    if (c.mode === "start") return updateBasename(s, value.slice(c.count));
    if (c.mode === "end") return updateBasename(s, c.count === 0 ? value : value.slice(0, -c.count));
    if (c.mode === "range") return updateBasename(s, value.slice(0, c.start) + value.slice(c.end));
    return s;
  },
};

export interface CaseConfig { mode: "lowercase" | "uppercase" | "title" | "sentence" }
export const caseTransform = (mode: CaseConfig["mode"] | CaseConfig): RenameRule<CaseConfig> =>
  makeRule("case", typeof mode === "string" ? { mode } : mode);

const caseHandler: RuleHandler<CaseConfig> = {
  type: "case",
  version: 1,
  validate: (c) => ["lowercase", "uppercase", "title", "sentence"].includes(c?.mode) ? ok() : invalid("unsupported case mode"),
  apply: (s, c) => {
    const v = s.current.basename;
    let next = v;
    if (c.mode === "lowercase") next = v.toLocaleLowerCase();
    if (c.mode === "uppercase") next = v.toLocaleUpperCase();
    if (c.mode === "title") next = v.toLocaleLowerCase().replace(/(^|[\s_-])([\p{L}\p{N}])/gu, (_, a: string, b: string) => a + b.toLocaleUpperCase());
    if (c.mode === "sentence") next = v.length ? v[0]!.toLocaleUpperCase() + v.slice(1).toLocaleLowerCase() : v;
    return updateBasename(s, next);
  },
};

export interface CounterConfig { start?: number; step?: number; padding?: number; separator?: string; position?: "prefix" | "suffix" }
export const counter = (config: CounterConfig = {}): RenameRule<CounterConfig> => makeRule("counter", config);

const counterHandler: RuleHandler<CounterConfig> = {
  type: "counter",
  version: 1,
  validate: (c) => {
    const start = c?.start ?? 1;
    const step = c?.step ?? 1;
    const padding = c?.padding ?? 1;
    return Number.isInteger(start) && Number.isInteger(step) && step !== 0 && Number.isInteger(padding) && padding >= 1
      ? ok()
      : invalid("counter requires integer start, non-zero integer step, and padding >= 1");
  },
  apply: (s, c, ctx) => {
    const start = c.start ?? 1;
    const step = c.step ?? 1;
    const padding = c.padding ?? 1;
    const separator = c.separator ?? "-";
    const position = c.position ?? "suffix";
    const token = String(start + ctx.index * step).padStart(padding, "0");
    return updateBasename(s, position === "prefix" ? `${token}${separator}${s.current.basename}` : `${s.current.basename}${separator}${token}`);
  },
};

export interface DateConfig {
  source?: "current" | "lastModified";
  format?: "YYYY-MM-DD" | "YYYYMMDD" | "DD-MM-YYYY";
  position?: "prefix" | "suffix";
  separator?: string;
}
export const date = (config: DateConfig = {}): RenameRule<DateConfig> => makeRule("date", config);

function formatDate(value: Date, format: NonNullable<DateConfig["format"]>): string {
  const y = String(value.getUTCFullYear());
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  if (format === "YYYYMMDD") return `${y}${m}${d}`;
  if (format === "DD-MM-YYYY") return `${d}-${m}-${y}`;
  return `${y}-${m}-${d}`;
}

const dateHandler: RuleHandler<DateConfig> = {
  type: "date",
  version: 1,
  validate: (c) => {
    const source = c?.source ?? "current";
    const format = c?.format ?? "YYYY-MM-DD";
    const position = c?.position ?? "suffix";
    return ["current", "lastModified"].includes(source) && ["YYYY-MM-DD", "YYYYMMDD", "DD-MM-YYYY"].includes(format) && ["prefix", "suffix"].includes(position)
      ? ok()
      : invalid("invalid date rule config");
  },
  apply: (s, c, ctx) => {
    const source = c.source ?? "current";
    const raw = source === "lastModified" && s.metadata.lastModified !== undefined ? new Date(s.metadata.lastModified) : ctx.now;
    const token = formatDate(raw, c.format ?? "YYYY-MM-DD");
    const sep = c.separator ?? "-";
    return updateBasename(s, (c.position ?? "suffix") === "prefix" ? `${token}${sep}${s.current.basename}` : `${s.current.basename}${sep}${token}`);
  },
};

export interface ExtensionConfig { mode: "keep" | "lowercase" | "uppercase" | "replace"; value?: string }
export const extension = (config: ExtensionConfig): RenameRule<ExtensionConfig> => makeRule("extension", config);

const extensionHandler: RuleHandler<ExtensionConfig> = {
  type: "extension",
  version: 1,
  validate: (c) => ["keep", "lowercase", "uppercase", "replace"].includes(c?.mode) && (c.mode !== "replace" || typeof c.value === "string")
    ? ok()
    : invalid("invalid extension rule config"),
  apply: (s, c) => {
    if (c.mode === "keep") return s;
    if (c.mode === "lowercase") return { ...s, current: { ...s.current, extension: s.current.extension.toLocaleLowerCase() } };
    if (c.mode === "uppercase") return { ...s, current: { ...s.current, extension: s.current.extension.toLocaleUpperCase() } };
    return { ...s, current: { ...s.current, extension: (c.value ?? "").replace(/^\./, "") } };
  },
};

export interface TrimConfig { mode?: "spaces" | "dots" | "both" }
export const trim = (config: TrimConfig = {}): RenameRule<TrimConfig> => makeRule("trim", config);

const trimHandler: RuleHandler<TrimConfig> = {
  type: "trim",
  version: 1,
  validate: (c) => ["spaces", "dots", "both"].includes(c?.mode ?? "spaces") ? ok() : invalid("invalid trim mode"),
  apply: (s, c) => {
    const mode = c.mode ?? "spaces";
    let value = s.current.basename;
    if (mode === "spaces" || mode === "both") value = value.trim();
    if (mode === "dots" || mode === "both") value = value.replace(/^\.+|\.+$/g, "");
    return updateBasename(s, value);
  },
};

export interface SanitizeConfig { replacement?: string; collapseRepeated?: boolean }
export const sanitize = (config: SanitizeConfig = {}): RenameRule<SanitizeConfig> => makeRule("sanitize", config);

const sanitizeHandler: RuleHandler<SanitizeConfig> = {
  type: "sanitize",
  version: 1,
  validate: (c) => typeof (c?.replacement ?? "-") === "string" ? ok() : invalid("sanitize replacement must be a string"),
  apply: (s, c) => {
    const replacement = c.replacement ?? "-";
    let value = s.current.basename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, replacement);
    if (c.collapseRepeated !== false && replacement) {
      const escaped = replacement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      value = value.replace(new RegExp(`(?:${escaped}){2,}`, "g"), replacement);
    }
    return updateBasename(s, value);
  },
};

export function createBuiltinRegistry(): PfxRuleRegistry {
  return new PfxRuleRegistry()
    .register(prefixHandler)
    .register(suffixHandler)
    .register(findReplaceHandler)
    .register(removeHandler)
    .register(caseHandler)
    .register(counterHandler)
    .register(dateHandler)
    .register(extensionHandler)
    .register(trimHandler)
    .register(sanitizeHandler);
}
