import type {
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

function makeRule<T>(type: string, config: T): RenameRule<T> {
  return {
    id: `${type}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
    type,
    version: 1,
    enabled: true,
    config,
  };
}

function updateBasename(state: RenameState, basename: string): RenameState {
  return { ...state, current: { ...state.current, basename } };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface RegexReplaceConfig {
  pattern: string;
  replace: string;
  flags?: string;
}

export const regexReplace = (config: RegexReplaceConfig): RenameRule<RegexReplaceConfig> =>
  makeRule("regex-replace", config);

const regexReplaceHandler: RuleHandler<RegexReplaceConfig> = {
  type: "regex-replace",
  version: 1,
  validate: (config) => {
    if (typeof config?.pattern !== "string" || typeof config.replace !== "string") {
      return invalid("regex-replace requires pattern and replace strings");
    }
    try {
      new RegExp(config.pattern, config.flags ?? "g");
      return ok();
    } catch {
      return invalid("regex-replace pattern or flags are invalid");
    }
  },
  apply: (state, config) =>
    updateBasename(
      state,
      state.current.basename.replace(new RegExp(config.pattern, config.flags ?? "g"), config.replace),
    ),
};

export interface SlugifyConfig {
  separator?: string;
  lowercase?: boolean;
  stripDiacritics?: boolean;
}

export const slugify = (config: SlugifyConfig = {}): RenameRule<SlugifyConfig> =>
  makeRule("slugify", config);

const slugifyHandler: RuleHandler<SlugifyConfig> = {
  type: "slugify",
  version: 1,
  validate: (config) => {
    const separator = config?.separator ?? "-";
    if (typeof separator !== "string" || separator.length === 0) {
      return invalid("slugify.separator must be a non-empty string");
    }
    return ok();
  },
  apply: (state, config, context) => {
    const separator = config.separator ?? "-";
    let value = state.current.basename.normalize("NFKD");
    if (config.stripDiacritics !== false) value = value.replace(/\p{M}+/gu, "");
    value = value.replace(/[^\p{L}\p{N}]+/gu, separator);

    const escaped = escapeRegExp(separator);
    value = value
      .replace(new RegExp(`(?:${escaped}){2,}`, "g"), separator)
      .replace(new RegExp(`^(?:${escaped})+|(?:${escaped})+$`, "g"), "");

    if (config.lowercase !== false) value = value.toLocaleLowerCase(context.locale);
    return updateBasename(state, value);
  },
};

export interface InsertConfig {
  value: string;
  position: "start" | "end" | number;
}

export const insert = (config: InsertConfig): RenameRule<InsertConfig> =>
  makeRule("insert", config);

const insertHandler: RuleHandler<InsertConfig> = {
  type: "insert",
  version: 1,
  validate: (config) => {
    if (typeof config?.value !== "string") return invalid("insert.value must be a string");
    if (
      config.position !== "start" &&
      config.position !== "end" &&
      (!Number.isInteger(config.position) || config.position < 0)
    ) {
      return invalid("insert.position must be start, end, or a non-negative integer");
    }
    return ok();
  },
  apply: (state, config) => {
    const chars = Array.from(state.current.basename);
    const index =
      config.position === "start"
        ? 0
        : config.position === "end"
          ? chars.length
          : Math.min(config.position, chars.length);
    chars.splice(index, 0, config.value);
    return updateBasename(state, chars.join(""));
  },
};

export interface CharacterFilterConfig {
  mode: "keep" | "remove";
  characters: string;
  caseSensitive?: boolean;
}

export const characterFilter = (config: CharacterFilterConfig): RenameRule<CharacterFilterConfig> =>
  makeRule("character-filter", config);

const characterFilterHandler: RuleHandler<CharacterFilterConfig> = {
  type: "character-filter",
  version: 1,
  validate: (config) =>
    ["keep", "remove"].includes(config?.mode) &&
    typeof config.characters === "string" &&
    config.characters.length > 0
      ? ok()
      : invalid("character-filter requires keep/remove mode and non-empty characters"),
  apply: (state, config, context) => {
    const normalize = (value: string) =>
      config.caseSensitive === false ? value.toLocaleLowerCase(context.locale) : value;
    const selected = new Set(Array.from(config.characters, normalize));
    const filtered = Array.from(state.current.basename)
      .filter((char) => {
        const match = selected.has(normalize(char));
        return config.mode === "keep" ? match : !match;
      })
      .join("");
    return updateBasename(state, filtered);
  },
};

export interface NumberRangeConfig {
  start: number;
  end: number;
  step?: number;
  padding?: number;
  separator?: string;
  position?: "prefix" | "suffix";
}

export const numberRange = (config: NumberRangeConfig): RenameRule<NumberRangeConfig> =>
  makeRule("number-range", config);

function rangeStep(config: NumberRangeConfig): number {
  return config.step ?? (config.start <= config.end ? 1 : -1);
}

function formatRangeNumber(value: number, padding: number): string {
  const sign = value < 0 ? "-" : "";
  return sign + String(Math.abs(value)).padStart(padding, "0");
}

const numberRangeHandler: RuleHandler<NumberRangeConfig> = {
  type: "number-range",
  version: 1,
  validate: (config) => {
    if (!Number.isInteger(config?.start) || !Number.isInteger(config.end)) {
      return invalid("number-range start and end must be integers");
    }
    const step = rangeStep(config);
    const padding = config.padding ?? 1;
    if (!Number.isInteger(step) || step === 0) return invalid("number-range step must be a non-zero integer");
    if (!Number.isInteger(padding) || padding < 1) return invalid("number-range padding must be >= 1");
    if (config.start < config.end && step < 0) return invalid("number-range step must move toward end");
    if (config.start > config.end && step > 0) return invalid("number-range step must move toward end");
    return ok();
  },
  validateRequest: (config, context) => {
    if (context.total === 0) return ok();
    const step = rangeStep(config);
    const last = config.start + (context.total - 1) * step;
    const min = Math.min(config.start, config.end);
    const max = Math.max(config.start, config.end);
    const fits = last >= min && last <= max;
    return fits ? ok() : invalid("number-range does not contain enough values for this batch");
  },
  apply: (state, config, context) => {
    const step = rangeStep(config);
    const token = formatRangeNumber(config.start + context.index * step, config.padding ?? 1);
    const separator = config.separator ?? "-";
    return updateBasename(
      state,
      (config.position ?? "suffix") === "prefix"
        ? `${token}${separator}${state.current.basename}`
        : `${state.current.basename}${separator}${token}`,
    );
  },
};

export interface TemplateConfig {
  pattern: string;
  padding?: number;
}

export const template = (config: TemplateConfig): RenameRule<TemplateConfig> =>
  makeRule("template", config);

const TEMPLATE_TOKENS = new Set(["name", "original", "index", "index0", "total"]);

const templateHandler: RuleHandler<TemplateConfig> = {
  type: "template",
  version: 1,
  validate: (config) => {
    if (typeof config?.pattern !== "string") return invalid("template.pattern must be a string");
    const padding = config.padding ?? 1;
    if (!Number.isInteger(padding) || padding < 1) return invalid("template.padding must be >= 1");

    for (const match of config.pattern.matchAll(/\{([^{}]+)\}/g)) {
      if (!TEMPLATE_TOKENS.has(match[1]!)) return invalid(`template token is not supported: ${match[1]}`);
    }
    return ok();
  },
  apply: (state, config, context) => {
    const padding = config.padding ?? 1;
    const values: Record<string, string> = {
      name: state.current.basename,
      original: state.original.basename,
      index: String(context.index + 1).padStart(padding, "0"),
      index0: String(context.index).padStart(padding, "0"),
      total: String(context.total).padStart(padding, "0"),
    };
    return updateBasename(
      state,
      config.pattern.replace(/\{([^{}]+)\}/g, (_, token: string) => values[token] ?? ""),
    );
  },
};

export function registerV02Rules(registry: PfxRuleRegistry): PfxRuleRegistry {
  return registry
    .register(regexReplaceHandler)
    .register(slugifyHandler)
    .register(insertHandler)
    .register(characterFilterHandler)
    .register(numberRangeHandler)
    .register(templateHandler);
}
