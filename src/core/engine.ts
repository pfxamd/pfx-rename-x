import { detectConflicts } from "../conflicts/index.js";
import { composeFilename, parseFilename } from "../filename/index.js";
import { createManifest } from "../manifest/index.js";
import { createBuiltinRegistry } from "../rules/builtins.js";
import type { PfxRuleRegistry } from "../rules/registry.js";
import type {
  RenameIssue,
  RenameOptions,
  RenamePreviewItem,
  RenameRequest,
  RenameResult,
  RenameState,
} from "../types.js";
import { validateInputs, validateOptions, validateState } from "../validation/index.js";

const DEFAULT_OPTIONS: Omit<Required<RenameOptions>, "now"> = {
  caseSensitivity: "insensitive",
  conflictStrategy: "error",
  unchangedStrategy: "keep",
  extensionPolicy: "preserve",
  maxNameLength: 255,
  locale: "en",
  unicodeNormalization: "NFC",
};

export class RenameEngine {
  readonly #registry: PfxRuleRegistry;

  constructor(registry = createBuiltinRegistry()) {
    this.#registry = registry;
  }

  rename(request: RenameRequest): RenameResult {
    const requestedNow = request.options?.now ? new Date(request.options.now) : new Date();
    const nowIsValid = !Number.isNaN(requestedNow.getTime());
    const options: Required<RenameOptions> = {
      ...DEFAULT_OPTIONS,
      ...request.options,
      now: nowIsValid ? requestedNow : new Date(0),
    };

    const requestIssues: RenameIssue[] = [
      ...validateOptions(options, nowIsValid),
      ...validateInputs(request.files),
    ];
    const ruleIssues: RenameIssue[] = [];
    for (const rule of request.rules) {
      if (!rule.enabled) continue;
      const handler = this.#registry.get(rule);
      if (!handler) {
        ruleIssues.push({ code: "UNKNOWN_RULE", severity: "error", message: `Unknown or unsupported rule: ${rule.type}@${rule.version}`, ruleId: rule.id });
        continue;
      }
      const validation = handler.validate(rule.config);
      for (const issue of validation.issues) ruleIssues.push({ ...issue, ruleId: rule.id });
      const requestValidation = handler.validateRequest?.(rule.config, { total: request.files.length });
      if (requestValidation) {
        for (const issue of requestValidation.issues) ruleIssues.push({ ...issue, ruleId: rule.id });
      }
    }

    const earlyIssues = [...requestIssues, ...ruleIssues];
    if (earlyIssues.some((issue) => issue.severity === "error")) {
      return {
        preview: { items: [], valid: false },
        manifest: { version: 1, createdAt: options.now.toISOString(), entries: [] },
        valid: false,
        issues: earlyIssues,
      };
    }

    const states: RenameState[] = request.files.map((file, index) => {
      const parts = parseFilename(file.originalName);
      return {
        id: file.id,
        originalName: file.originalName,
        original: parts,
        current: { ...parts },
        index,
        changed: false,
        issues: [],
        metadata: {
          ...(file.size !== undefined ? { size: file.size } : {}),
          ...(file.lastModified !== undefined ? { lastModified: file.lastModified } : {}),
        },
      };
    });

    const nextStates = states.map((initial, index) => {
      let state = initial;
      for (const rule of request.rules) {
        if (!rule.enabled) continue;
        const handler = this.#registry.get(rule);
        if (!handler) continue;
        if (options.extensionPolicy === "preserve" && rule.type === "extension") continue;
        state = handler.apply(state, rule.config, { index, total: states.length, now: options.now, locale: options.locale });
      }
      const changed = composeFilename(state.current) !== state.originalName;
      state = { ...state, changed };
      return { ...state, issues: validateState(state, options) };
    });

    const items: RenamePreviewItem[] = nextStates.map((state) => ({
      id: state.id,
      originalName: state.originalName,
      newName: composeFilename(state.current),
      changed: state.changed,
      valid: !state.issues.some((issue) => issue.severity === "error"),
      issues: [...state.issues],
    }));

    const conflictIssues = detectConflicts(items, options);
    for (const issue of conflictIssues) {
      for (const id of issue.fileIds ?? []) {
        const item = items.find((candidate) => candidate.id === id);
        if (item) {
          item.issues.push(issue);
          item.valid = item.valid && issue.severity !== "error";
        }
      }
    }

    const issues = [...earlyIssues, ...items.flatMap((item) => item.issues.filter((issue) => !conflictIssues.includes(issue))), ...conflictIssues];
    const valid = !issues.some((issue) => issue.severity === "error");
    const preview = { items, valid };

    return {
      preview,
      manifest: createManifest(preview, options.now),
      valid,
      issues,
    };
  }
}

export function rename(request: RenameRequest): RenameResult {
  return new RenameEngine().rename(request);
}
