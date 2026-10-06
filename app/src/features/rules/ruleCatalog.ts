import {
  caseTransform,
  characterFilter,
  counter,
  date as dateRule,
  extension,
  findReplace,
  insert,
  numberRange,
  prefix,
  regexReplace,
  remove,
  sanitize,
  slugify,
  suffix,
  template,
  trim,
  type RenameRule,
} from "@pfxamd/rename-x";

export type AppRuleType =
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
  | "regex-replace"
  | "slugify"
  | "insert"
  | "character-filter"
  | "number-range"
  | "template";

export interface RuleDefinition {
  type: AppRuleType;
  label: string;
  description: string;
  create(): RenameRule;
}

export const ruleDefinitions: readonly RuleDefinition[] = [
  {
    type: "prefix",
    label: "Prefix",
    description: "Add text before the filename.",
    create: () => prefix(""),
  },
  {
    type: "suffix",
    label: "Suffix",
    description: "Add text after the filename.",
    create: () => suffix(""),
  },
  {
    type: "find-replace",
    label: "Find / Replace",
    description: "Replace literal text in the filename.",
    create: () => findReplace({ find: "text", replace: "", matchCase: false, replaceAll: true }),
  },
  {
    type: "remove",
    label: "Remove",
    description: "Remove text, a count, or a character range.",
    create: () => remove({ mode: "text", value: "text", matchCase: false }),
  },
  {
    type: "case",
    label: "Case Transform",
    description: "Change filename letter casing.",
    create: () => caseTransform("lowercase"),
  },
  {
    type: "counter",
    label: "Counter",
    description: "Add an incrementing number.",
    create: () => counter({ start: 1, step: 1, padding: 2, separator: "-", position: "suffix" }),
  },
  {
    type: "date",
    label: "Date",
    description: "Add the current or modified date.",
    create: () => dateRule({ source: "current", format: "YYYY-MM-DD", position: "suffix", separator: "-" }),
  },
  {
    type: "extension",
    label: "Extension",
    description: "Keep, change, or normalize the extension.",
    create: () => extension({ mode: "lowercase" }),
  },
  {
    type: "trim",
    label: "Trim",
    description: "Trim spaces or dots at filename edges.",
    create: () => trim({ mode: "spaces" }),
  },
  {
    type: "sanitize",
    label: "Sanitize",
    description: "Replace characters that are unsafe in filenames.",
    create: () => sanitize({ replacement: "-", collapseRepeated: true }),
  },
  {
    type: "regex-replace",
    label: "Regex Replace",
    description: "Replace text using a regular expression.",
    create: () => regexReplace({ pattern: "text", replace: "", flags: "g" }),
  },
  {
    type: "slugify",
    label: "Slugify",
    description: "Create a clean separator-based filename.",
    create: () => slugify({ separator: "-", lowercase: true, stripDiacritics: true }),
  },
  {
    type: "insert",
    label: "Insert",
    description: "Insert text at the start, end, or a character index.",
    create: () => insert({ value: "-", position: "end" }),
  },
  {
    type: "character-filter",
    label: "Character Filter",
    description: "Keep or remove a selected character set.",
    create: () => characterFilter({ mode: "remove", characters: " ", caseSensitive: true }),
  },
  {
    type: "number-range",
    label: "Number Range",
    description: "Number the batch within explicit bounds.",
    create: () => numberRange({ start: 1, end: 9999, step: 1, padding: 2, separator: "-", position: "suffix" }),
  },
  {
    type: "template",
    label: "Template",
    description: "Build names from pipeline and batch tokens.",
    create: () => template({ pattern: "{index}-{name}", padding: 2 }),
  },
];

export function getRuleDefinition(type: string): RuleDefinition | undefined {
  return ruleDefinitions.find((definition) => definition.type === type);
}
