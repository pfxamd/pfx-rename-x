import { useMemo } from "react";
import { FileDropZone } from "../features/files/FileDropZone.js";
import { buildPreview } from "../features/preview/previewAdapter.js";
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

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Application foundation</p>
          <h1>PFx Rename X</h1>
        </div>
        <span>{rules.length} rules</span>
      </header>

      <FileDropZone onFiles={appendFiles} />

      <section className={styles.section} aria-labelledby="files-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="files-heading">Files</h2>
            <p>{files.length} selected</p>
          </div>
          {files.length > 0 ? (
            <button type="button" onClick={clearFiles}>
              Clear
            </button>
          ) : null}
        </div>

        {files.length === 0 ? (
          <p className={styles.empty}>No files selected.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Original</th>
                  <th>Preview</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {result.preview.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.originalName}</td>
                    <td>{item.newName}</td>
                    <td>{item.valid ? "Ready" : "Invalid"}</td>
                    <td>
                      <button type="button" onClick={() => removeFile(item.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
