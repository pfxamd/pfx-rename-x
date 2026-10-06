import { useMemo } from "react";
import { ExecutionPanel } from "../features/execution/ExecutionPanel.js";
import { FileDropZone } from "../features/files/FileDropZone.js";
import { buildPreview } from "../features/preview/previewAdapter.js";
import { RuleBuilder } from "../features/rules/RuleBuilder.js";
import { useRenameStore } from "../store/renameStore.js";
import styles from "./App.module.css";

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

  return (
    <main className={styles.app}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.mark} aria-hidden="true">
              PX
            </div>
            <div>
              <h1>PFx Rename X</h1>
              <p>Batch rename workspace</p>
            </div>
          </div>

          <div className={styles.topbarMeta}>
            <span className={styles.localBadge}>
              <span className={styles.localDot} />
              Local processing
            </span>
            <span className={styles.version}>Core v0.2.0</span>
          </div>
        </header>

        <section className={styles.ingest} aria-label="Add files">
          <div className={styles.ingestIntro}>
            <span className={styles.step}>01</span>
            <div>
              <h2>Add files</h2>
              <p>Files stay in your browser. Nothing is uploaded.</p>
            </div>
          </div>
          <FileDropZone onFiles={appendFiles} />
        </section>

        <div className={styles.workspace}>
          <div className={styles.rulesPane}>
            <div className={styles.paneLabel}>
              <span className={styles.step}>02</span>
              <span>Build rename pipeline</span>
            </div>
            <RuleBuilder />
          </div>

          <aside className={styles.previewPane}>
            <div className={styles.previewSticky}>
              <section className={styles.previewCard} aria-labelledby="files-heading">
                <div className={styles.previewHeader}>
                  <div>
                    <div className={styles.paneLabel}>
                      <span className={styles.step}>03</span>
                      <span>Review output</span>
                    </div>
                    <h2 id="files-heading">Live preview</h2>
                  </div>

                  <div
                    className={styles.previewStats}
                    aria-label={`Preview summary: ${files.length} files, ${changedCount} changed, ${result.issues.length} issues`}
                  >
                    <span>
                      <strong>{files.length}</strong>
                      files
                    </span>
                    <span>
                      <strong>{changedCount}</strong>
                      changed
                    </span>
                    <span data-status={result.issues.length > 0 ? "issue" : "ready"}>
                      <strong>{result.issues.length}</strong>
                      issues
                    </span>
                  </div>
                </div>

                {result.issues.length > 0 ? (
                  <div className={styles.issues} role="status">
                    {result.issues.map((issue, index) => (
                      <p key={`${issue.code}-${issue.ruleId ?? ""}-${index}`}>
                        <strong>{issue.code}</strong>
                        <span>{issue.message}</span>
                      </p>
                    ))}
                  </div>
                ) : null}

                {files.length === 0 ? (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon} aria-hidden="true">
                      ↗
                    </div>
                    <strong>No files yet</strong>
                    <span>Add files above to start the live preview.</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.tableToolbar}>
                      <span>{readyCount} ready</span>
                      <button type="button" onClick={clearFiles}>
                        Clear files
                      </button>
                    </div>

                    <div className={styles.tableWrap}>
                      <table>
                        <thead>
                          <tr>
                            <th>Original</th>
                            <th>Renamed</th>
                            <th>Status</th>
                            <th aria-label="Actions" />
                          </tr>
                        </thead>
                        <tbody>
                          {result.preview.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <span className={styles.fileName}>{item.originalName}</span>
                              </td>
                              <td>
                                <span className={styles.renamed}>{item.newName}</span>
                              </td>
                              <td>
                                <span
                                  className={styles.status}
                                  data-valid={item.valid || undefined}
                                >
                                  {item.valid ? "Ready" : "Invalid"}
                                </span>
                              </td>
                              <td className={styles.rowAction}>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item.originalName}`}
                                  onClick={() => removeFile(item.id)}
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              <ExecutionPanel files={files} result={result} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
