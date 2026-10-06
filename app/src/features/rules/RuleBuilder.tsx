import { useState, type ChangeEvent, type ReactNode } from "react";
import type { RenameRule } from "@pfxamd/rename-x";
import { useRenameStore } from "../../store/renameStore.js";
import { getRuleDefinition, ruleDefinitions, type AppRuleType } from "./ruleCatalog.js";
import styles from "./RuleBuilder.module.css";

type Config = Record<string, unknown>;

function configOf(rule: RenameRule): Config {
  return rule.config as Config;
}

function patchRule(rule: RenameRule, patch: Config): RenameRule {
  return {
    ...rule,
    config: {
      ...configOf(rule),
      ...patch,
    },
  };
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange(value: number): void;
  min?: number;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function RuleEditor({
  rule,
  onChange,
}: {
  rule: RenameRule;
  onChange(rule: RenameRule): void;
}) {
  const config = configOf(rule);
  const patch = (next: Config) => onChange(patchRule(rule, next));

  switch (rule.type) {
    case "prefix":
    case "suffix":
      return (
        <TextField
          label="Value"
          value={String(config.value ?? "")}
          onChange={(value) => patch({ value })}
        />
      );

    case "find-replace":
      return (
        <>
          <TextField label="Find" value={String(config.find ?? "")} onChange={(find) => patch({ find })} />
          <TextField label="Replace" value={String(config.replace ?? "")} onChange={(replace) => patch({ replace })} />
          <CheckField label="Match case" checked={Boolean(config.matchCase)} onChange={(matchCase) => patch({ matchCase })} />
          <CheckField label="Replace all" checked={config.replaceAll !== false} onChange={(replaceAll) => patch({ replaceAll })} />
        </>
      );

    case "remove": {
      const mode = String(config.mode ?? "text");
      return (
        <>
          <SelectField label="Mode" value={mode} onChange={(nextMode) => {
            if (nextMode === "text") patch({ mode: "text", value: "text", matchCase: false });
            if (nextMode === "start" || nextMode === "end") patch({ mode: nextMode, count: 1 });
            if (nextMode === "range") patch({ mode: "range", start: 0, end: 1 });
          }}>
            <option value="text">Text</option>
            <option value="start">From start</option>
            <option value="end">From end</option>
            <option value="range">Range</option>
          </SelectField>

          {mode === "text" ? (
            <>
              <TextField label="Text" value={String(config.value ?? "")} onChange={(value) => patch({ value })} />
              <CheckField label="Match case" checked={Boolean(config.matchCase)} onChange={(matchCase) => patch({ matchCase })} />
            </>
          ) : null}

          {mode === "start" || mode === "end" ? (
            <NumberField label="Count" value={Number(config.count ?? 1)} min={0} onChange={(count) => patch({ count })} />
          ) : null}

          {mode === "range" ? (
            <>
              <NumberField label="Start" value={Number(config.start ?? 0)} min={0} onChange={(start) => patch({ start })} />
              <NumberField label="End" value={Number(config.end ?? 1)} min={0} onChange={(end) => patch({ end })} />
            </>
          ) : null}
        </>
      );
    }

    case "case":
      return (
        <SelectField label="Mode" value={String(config.mode ?? "lowercase")} onChange={(mode) => patch({ mode })}>
          <option value="lowercase">Lowercase</option>
          <option value="uppercase">Uppercase</option>
          <option value="title">Title case</option>
          <option value="sentence">Sentence case</option>
        </SelectField>
      );

    case "counter":
      return (
        <>
          <NumberField label="Start" value={Number(config.start ?? 1)} onChange={(start) => patch({ start })} />
          <NumberField label="Step" value={Number(config.step ?? 1)} onChange={(step) => patch({ step })} />
          <NumberField label="Padding" value={Number(config.padding ?? 1)} min={1} onChange={(padding) => patch({ padding })} />
          <TextField label="Separator" value={String(config.separator ?? "-")} onChange={(separator) => patch({ separator })} />
          <SelectField label="Position" value={String(config.position ?? "suffix")} onChange={(position) => patch({ position })}>
            <option value="prefix">Prefix</option>
            <option value="suffix">Suffix</option>
          </SelectField>
        </>
      );

    case "date":
      return (
        <>
          <SelectField label="Source" value={String(config.source ?? "current")} onChange={(source) => patch({ source })}>
            <option value="current">Current date</option>
            <option value="lastModified">Last modified</option>
          </SelectField>
          <SelectField label="Format" value={String(config.format ?? "YYYY-MM-DD")} onChange={(format) => patch({ format })}>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="YYYYMMDD">YYYYMMDD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </SelectField>
          <SelectField label="Position" value={String(config.position ?? "suffix")} onChange={(position) => patch({ position })}>
            <option value="prefix">Prefix</option>
            <option value="suffix">Suffix</option>
          </SelectField>
          <TextField label="Separator" value={String(config.separator ?? "-")} onChange={(separator) => patch({ separator })} />
        </>
      );

    case "extension": {
      const mode = String(config.mode ?? "keep");
      return (
        <>
          <SelectField label="Mode" value={mode} onChange={(nextMode) => patch({ mode: nextMode })}>
            <option value="keep">Keep</option>
            <option value="lowercase">Lowercase</option>
            <option value="uppercase">Uppercase</option>
            <option value="replace">Replace</option>
          </SelectField>
          {mode === "replace" ? (
            <TextField label="Extension" value={String(config.value ?? "")} placeholder="jpg" onChange={(value) => patch({ value })} />
          ) : null}
        </>
      );
    }

    case "trim":
      return (
        <SelectField label="Mode" value={String(config.mode ?? "spaces")} onChange={(mode) => patch({ mode })}>
          <option value="spaces">Spaces</option>
          <option value="dots">Dots</option>
          <option value="both">Spaces and dots</option>
        </SelectField>
      );

    case "sanitize":
      return (
        <>
          <TextField label="Replacement" value={String(config.replacement ?? "-")} onChange={(replacement) => patch({ replacement })} />
          <CheckField label="Collapse repeated replacements" checked={config.collapseRepeated !== false} onChange={(collapseRepeated) => patch({ collapseRepeated })} />
        </>
      );

    case "regex-replace":
      return (
        <>
          <TextField label="Pattern" value={String(config.pattern ?? "")} onChange={(pattern) => patch({ pattern })} />
          <TextField label="Replace" value={String(config.replace ?? "")} onChange={(replace) => patch({ replace })} />
          <TextField label="Flags" value={String(config.flags ?? "g")} onChange={(flags) => patch({ flags })} />
        </>
      );

    case "slugify":
      return (
        <>
          <TextField label="Separator" value={String(config.separator ?? "-")} onChange={(separator) => patch({ separator })} />
          <CheckField label="Lowercase" checked={config.lowercase !== false} onChange={(lowercase) => patch({ lowercase })} />
          <CheckField label="Strip diacritics" checked={config.stripDiacritics !== false} onChange={(stripDiacritics) => patch({ stripDiacritics })} />
        </>
      );

    case "insert": {
      const rawPosition = config.position ?? "end";
      const mode = typeof rawPosition === "number" ? "index" : String(rawPosition);
      return (
        <>
          <TextField label="Value" value={String(config.value ?? "")} onChange={(value) => patch({ value })} />
          <SelectField label="Position" value={mode} onChange={(nextMode) => {
            patch({ position: nextMode === "index" ? 0 : nextMode });
          }}>
            <option value="start">Start</option>
            <option value="end">End</option>
            <option value="index">Character index</option>
          </SelectField>
          {mode === "index" ? (
            <NumberField label="Index" value={typeof rawPosition === "number" ? rawPosition : 0} min={0} onChange={(position) => patch({ position })} />
          ) : null}
        </>
      );
    }

    case "character-filter":
      return (
        <>
          <SelectField label="Mode" value={String(config.mode ?? "remove")} onChange={(mode) => patch({ mode })}>
            <option value="remove">Remove selected</option>
            <option value="keep">Keep selected</option>
          </SelectField>
          <TextField label="Characters" value={String(config.characters ?? "")} onChange={(characters) => patch({ characters })} />
          <CheckField label="Case sensitive" checked={config.caseSensitive !== false} onChange={(caseSensitive) => patch({ caseSensitive })} />
        </>
      );

    case "number-range":
      return (
        <>
          <NumberField label="Start" value={Number(config.start ?? 1)} onChange={(start) => patch({ start })} />
          <NumberField label="End" value={Number(config.end ?? 9999)} onChange={(end) => patch({ end })} />
          <NumberField label="Step" value={Number(config.step ?? 1)} onChange={(step) => patch({ step })} />
          <NumberField label="Padding" value={Number(config.padding ?? 1)} min={1} onChange={(padding) => patch({ padding })} />
          <TextField label="Separator" value={String(config.separator ?? "-")} onChange={(separator) => patch({ separator })} />
          <SelectField label="Position" value={String(config.position ?? "suffix")} onChange={(position) => patch({ position })}>
            <option value="prefix">Prefix</option>
            <option value="suffix">Suffix</option>
          </SelectField>
        </>
      );

    case "template":
      return (
        <>
          <TextField label="Pattern" value={String(config.pattern ?? "{index}-{name}")} onChange={(pattern) => patch({ pattern })} />
          <NumberField label="Padding" value={Number(config.padding ?? 1)} min={1} onChange={(padding) => patch({ padding })} />
          <p className={styles.hint}>Tokens: {"{name} {original} {index} {index0} {total}"}</p>
        </>
      );

    default:
      return null;
  }
}

export function RuleBuilder() {
  const [selectedType, setSelectedType] = useState<AppRuleType>("prefix");
  const rules = useRenameStore((state) => state.rules);
  const addRule = useRenameStore((state) => state.addRule);
  const replaceRule = useRenameStore((state) => state.replaceRule);
  const removeRule = useRenameStore((state) => state.removeRule);
  const toggleRule = useRenameStore((state) => state.toggleRule);
  const moveRule = useRenameStore((state) => state.moveRule);
  const setOptions = useRenameStore((state) => state.setOptions);

  const addSelectedRule = () => {
    const definition = getRuleDefinition(selectedType);
    if (!definition) return;
    addRule(definition.create());

    if (selectedType === "extension") {
      setOptions({ extensionPolicy: "allow-change" });
    }
  };

  return (
    <section className={styles.builder} aria-labelledby="rules-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="rules-heading">Rules</h2>
          <p>Rules run from top to bottom. Preview updates immediately.</p>
        </div>

        <div className={styles.addRule}>
          <select
            aria-label="Rule type"
            value={selectedType}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedType(event.target.value as AppRuleType)}
          >
            {ruleDefinitions.map((definition) => (
              <option key={definition.type} value={definition.type}>
                {definition.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={addSelectedRule}>
            Add rule
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <p className={styles.empty}>No rules added.</p>
      ) : (
        <div className={styles.list}>
          {rules.map((rule, index) => {
            const definition = getRuleDefinition(rule.type);
            return (
              <article className={styles.card} key={rule.id} data-disabled={!rule.enabled || undefined}>
                <div className={styles.cardHeader}>
                  <div className={styles.identity}>
                    <span className={styles.order}>{index + 1}</span>
                    <div>
                      <h3>{definition?.label ?? rule.type}</h3>
                      <p>{definition?.description ?? "Custom rule"}</p>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      aria-label="Move rule up"
                      disabled={index === 0}
                      onClick={() => moveRule(rule.id, "up")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move rule down"
                      disabled={index === rules.length - 1}
                      onClick={() => moveRule(rule.id, "down")}
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => toggleRule(rule.id)}>
                      {rule.enabled ? "Disable" : "Enable"}
                    </button>
                    <button type="button" onClick={() => removeRule(rule.id)}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className={styles.editor}>
                  <RuleEditor rule={rule} onChange={replaceRule} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
