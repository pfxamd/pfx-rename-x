import {
  caseTransform,
  counter,
  findReplace,
  prefix,
  suffix,
  template,
  type RenameRule,
} from "@pfxamd/rename-x";

export type QuickMode = "rename" | "replace" | "add" | "case";
export type QuickCase = "keep" | "lowercase" | "uppercase" | "title";

export interface QuickRenameSettings {
  mode: QuickMode;
  name: string;
  numbering: boolean;
  start: number;
  digits: number;
  find: string;
  replace: string;
  addText: string;
  addPosition: "before" | "after";
  caseMode: QuickCase;
}

export const defaultQuickRenameSettings: QuickRenameSettings = {
  mode: "rename",
  name: "",
  numbering: true,
  start: 1,
  digits: 2,
  find: "",
  replace: "",
  addText: "",
  addPosition: "before",
  caseMode: "keep",
};

export function buildQuickRules(settings: QuickRenameSettings): RenameRule[] {
  switch (settings.mode) {
    case "rename": {
      const name = settings.name.trim();
      if (!name) return [];

      const rules: RenameRule[] = [template({ pattern: name, padding: 1 })];

      if (settings.numbering) {
        rules.push(
          counter({
            start: Math.max(0, Math.trunc(settings.start) || 0),
            step: 1,
            padding: Math.max(1, Math.trunc(settings.digits) || 1),
            separator: " ",
            position: "suffix",
          }),
        );
      }

      return rules;
    }

    case "replace":
      if (!settings.find) return [];
      return [
        findReplace({
          find: settings.find,
          replace: settings.replace,
          matchCase: false,
          replaceAll: true,
        }),
      ];

    case "add":
      if (!settings.addText) return [];
      return [
        settings.addPosition === "before"
          ? prefix(settings.addText)
          : suffix(settings.addText),
      ];

    case "case":
      if (settings.caseMode === "keep") return [];
      return [caseTransform(settings.caseMode)];
  }
}
