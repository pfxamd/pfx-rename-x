import { create } from "zustand";
import type { RenameOptions, RenameRule } from "@pfxamd/rename-x";
import type { AppFile } from "../features/files/types.js";

interface RenameAppState {
  files: AppFile[];
  rules: RenameRule[];
  options: RenameOptions;
  appendFiles(files: AppFile[]): void;
  removeFile(id: string): void;
  clearFiles(): void;
  setRules(rules: RenameRule[]): void;
  addRule(rule: RenameRule): void;
  replaceRule(rule: RenameRule): void;
  removeRule(id: string): void;
  toggleRule(id: string): void;
  moveRule(id: string, direction: "up" | "down"): void;
  setOptions(options: Partial<RenameOptions>): void;
}

export const useRenameStore = create<RenameAppState>((set) => ({
  files: [],
  rules: [],
  options: {},

  appendFiles: (files) =>
    set((state) => ({
      files: [...state.files, ...files],
    })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),

  clearFiles: () => set({ files: [] }),

  setRules: (rules) => set({ rules }),

  addRule: (rule) =>
    set((state) => ({
      rules: [...state.rules, rule],
    })),

  replaceRule: (rule) =>
    set((state) => ({
      rules: state.rules.map((current) => (current.id === rule.id ? rule : current)),
    })),

  removeRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((rule) => rule.id !== id),
    })),

  toggleRule: (id) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    })),

  moveRule: (id, direction) =>
    set((state) => {
      const index = state.rules.findIndex((rule) => rule.id === id);
      if (index < 0) return state;

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= state.rules.length) return state;

      const rules = [...state.rules];
      const current = rules[index];
      const target = rules[nextIndex];

      if (!current || !target) return state;

      rules[index] = target;
      rules[nextIndex] = current;

      return { rules };
    }),

  setOptions: (options) =>
    set((state) => ({
      options: { ...state.options, ...options },
    })),
}));
