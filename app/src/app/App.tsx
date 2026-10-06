import { useMemo } from "react";
import { ExecutionPanel } from "../features/execution/ExecutionPanel.js";
import { FileDropZone } from "../features/files/FileDropZone.js";
import { buildPreview } from "../features/preview/previewAdapter.js";
import { QuickRenamePanel } from "../features/rules/QuickRenamePanel.js";
import { useRenameStore } from "../store/renameStore.js";
import styles from "./App.module.css";

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function App() {
  const files = useRenameStore((state) => state.files);
  const rules = useRenameStore((state) => state.rules);
  const options = useRenameStore((state) => state.options);
  const appendFiles = useRenameStore((state) => state.appendFiles);
  const removeFile = useRenameStore((state) => state.removeFile);
  const clearFiles = useRenameStore((state) => state.clearFiles);

  const result = useMemo(
    () => buildPreview(files, rules, options),
    [files, rules, options],
  );

  const readyCount = result.preview.items.filter((item) => item.valid).length;
  const changedCount = result.manifest.entries.length;
  const totalSize = files.reduce((sum, item) => sum + (item.input.size ?? 0), 0);

  return (
    <main className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">RX</span>
          <div className={styles.brandCopy}>
            <h1>PFx Rename X</h1>
            <span>Rename files locally</span>
          </div>
        </div>

        <div
          className={styles.session}
          aria-label={`Preview summary: ${files.length} files, ${changedCount} changed, ${result.issues.length} issues`}
        >
          <span><b>{files.length}</b> files</span>
          <span><b>{changedCount}</b> changed</span>
          <span data-state={result.issues.length > 0 ? "issue" : "ready"}>
            <b>{result.issues.length}</b> issues
          </span>
        </div>

        <div className={styles.runtime}>
          <span className={styles.runtimeDot} />
          Browser only
        </div>
      </header>

      <div className={styles.workbench}>
        <section className={styles.filesPane} aria-labelledby="files-panel-title">
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelKicker}>Source</span>
              <h2 id="files-panel-title">Files</h2>
            </div>
            {files.length > 0 ? (
              <button type="button" className={styles.ghostButton} onClick={clearFiles}>
                Clear
              </button>
            ) : null}
          </div>

          <div className={styles.dropSlot}>
            <FileDropZone onFiles={appendFiles} />
          </div>

          <div className={styles.fileMeta}>
            <span>{files.length} selected</span>
            <span>{formatBytes(totalSize)}</span>
          </div>

          <div className={styles.fileList} aria-label="Selected files">
            {files.length === 0 ? (
              <div className={styles.fileEmpty}>
                <span className={styles.fileEmptyGlyph}>↳</span>
                <strong>No files loaded</strong>
                <span>Add files to start renaming.</span>
              </div>
            ) : (
              files.map((item, index) => (
                <div className={styles.fileRow} key={item.id}>
                  <span className={styles.fileIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <div className={styles.fileInfo}>
                    <strong title={item.input.originalName}>{item.input.originalName}</strong>
                    <span>{formatBytes(item.input.size)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFile}
                    aria-label={`Remove ${item.input.originalName}`}
                    onClick={() => removeFile(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.mainPane} aria-label="Rename workspace">
          <div className={styles.settingsArea}>
            <QuickRenamePanel />
          </div>

          <div className={styles.previewHeader}>
            <div>
              <span className={styles.panelKicker}>Preview</span>
              <h2>Before → After</h2>
            </div>
            <div className={styles.previewStats}>
              <span><b>{readyCount}</b> ready</span>
              <span><b>{changedCount}</b> changed</span>
            </div>
          </div>

          {result.issues.length > 0 ? (
            <div className={styles.issueStrip} role="status">
              {result.issues.slice(0, 3).map((issue, index) => (
                <span key={`${issue.code}-${issue.ruleId ?? ""}-${index}`}>
                  <b>{issue.code}</b> {issue.message}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.previewTableRegion}>
            {files.length === 0 ? (
              <div className={styles.previewEmpty}>
                <div className={styles.previewEmptyMark}>A → B</div>
                <strong>Your new filenames will appear here</strong>
                <span>Add files on the left, then type a new name above.</span>
              </div>
            ) : (
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Original</th>
                    <th>New name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.preview.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.originalName} title={item.originalName}>
                          {item.originalName}
                        </span>
                      </td>
                      <td>
                        <span className={styles.newName} title={item.newName}>
                          {item.newName}
                        </span>
                      </td>
                      <td>
                        <span className={styles.stateMark} data-valid={item.valid || undefined}>
                          {item.valid ? "Ready" : "Invalid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <ExecutionPanel files={files} result={result} />
        </section>
      </div>
    </main>
  );
}
