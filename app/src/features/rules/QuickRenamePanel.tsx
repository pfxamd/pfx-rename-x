import { useEffect, useState } from "react";
import { useRenameStore } from "../../store/renameStore.js";
import {
  buildQuickRules,
  defaultQuickRenameSettings,
  type QuickCase,
  type QuickMode,
} from "./quickRules.js";
import styles from "./QuickRenamePanel.module.css";

const modes: Array<{ id: QuickMode; label: string }> = [
  { id: "rename", label: "New name" },
  { id: "replace", label: "Replace" },
  { id: "add", label: "Add text" },
  { id: "case", label: "Case" },
];

export function QuickRenamePanel() {
  const [settings, setSettings] = useState(defaultQuickRenameSettings);
  const setRules = useRenameStore((state) => state.setRules);

  useEffect(() => {
    setRules(buildQuickRules(settings));
  }, [settings, setRules]);

  const setMode = (mode: QuickMode) => {
    setSettings((current) => ({ ...current, mode }));
  };

  return (
    <section className={styles.panel} aria-labelledby="rename-settings-title">
      <div className={styles.heading}>
        <div>
          <h2 id="rename-settings-title">Rename</h2>
          <p>Choose what you want to do. Preview updates instantly.</p>
        </div>
        <button
          type="button"
          className={styles.reset}
          onClick={() => setSettings(defaultQuickRenameSettings)}
        >
          Reset
        </button>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Rename action">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={settings.mode === mode.id}
            data-active={settings.mode === mode.id || undefined}
            onClick={() => setMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        {settings.mode === "rename" ? (
          <>
            <label className={styles.mainField}>
              <span>New name</span>
              <input
                aria-label="New name"
                value={settings.name}
                placeholder="Example: Holiday"
                onChange={(event) =>
                  setSettings((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.numbering}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    numbering: event.target.checked,
                  }))
                }
              />
              <span>Number files</span>
            </label>

            {settings.numbering ? (
              <div className={styles.inlineFields}>
                <label>
                  <span>Start</span>
                  <input
                    aria-label="Start number"
                    type="number"
                    min={0}
                    value={settings.start}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        start: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Digits</span>
                  <select
                    aria-label="Number digits"
                    value={settings.digits}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        digits: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </label>
              </div>
            ) : null}
          </>
        ) : null}

        {settings.mode === "replace" ? (
          <div className={styles.twoFields}>
            <label>
              <span>Find</span>
              <input
                aria-label="Find text"
                value={settings.find}
                placeholder="Text to find"
                onChange={(event) =>
                  setSettings((current) => ({ ...current, find: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Replace with</span>
              <input
                aria-label="Replace with"
                value={settings.replace}
                placeholder="New text"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    replace: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        ) : null}

        {settings.mode === "add" ? (
          <>
            <label className={styles.mainField}>
              <span>Text to add</span>
              <input
                aria-label="Text to add"
                value={settings.addText}
                placeholder="Example: Trip-"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    addText: event.target.value,
                  }))
                }
              />
            </label>
            <div className={styles.segmented} aria-label="Text position">
              <button
                type="button"
                data-active={settings.addPosition === "before" || undefined}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    addPosition: "before",
                  }))
                }
              >
                Before name
              </button>
              <button
                type="button"
                data-active={settings.addPosition === "after" || undefined}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    addPosition: "after",
                  }))
                }
              >
                After name
              </button>
            </div>
          </>
        ) : null}

        {settings.mode === "case" ? (
          <div className={styles.caseChoices}>
            {([
              ["keep", "Keep"],
              ["lowercase", "lowercase"],
              ["uppercase", "UPPERCASE"],
              ["title", "Title Case"],
            ] as Array<[QuickCase, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                data-active={settings.caseMode === value || undefined}
                onClick={() =>
                  setSettings((current) => ({ ...current, caseMode: value }))
                }
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
