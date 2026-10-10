import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { downloadBlob, downloadExecutionPlan } from "../features/execution/browserDownloads.js";
import { buildExecutionPlan } from "../features/execution/executionPlan.js";
import { createZipArchive } from "../features/execution/zipArchive.js";
import { toAppFiles } from "../features/files/fileAdapter.js";
import { buildPreview } from "../features/preview/previewAdapter.js";
import { buildQuickRules, defaultQuickRenameSettings } from "../features/rules/quickRules.js";
import { useRenameStore } from "../store/renameStore.js";
import { applyTheme, getInitialTheme, type AppTheme } from "./theme.js";
import styles from "./App.module.css";

export function App() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [name, setName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const files = useRenameStore((state) => state.files);
  const appendFiles = useRenameStore((state) => state.appendFiles);
  const removeFile = useRenameStore((state) => state.removeFile);
  const clearFiles = useRenameStore((state) => state.clearFiles);
  const picker = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const hasFiles = files.length > 0;

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { if (hasFiles) nameInput.current?.focus(); }, [hasFiles]);
  useEffect(() => { setFeedback(""); setDownloadError(""); }, [files, name]);

  const rules = useMemo(
    () => buildQuickRules({
      ...defaultQuickRenameSettings,
      name,
      numbering: files.length > 1,
      digits: Math.max(2, String(files.length).length),
    }),
    [name, files.length],
  );
  const result = useMemo(() => buildPreview(files, rules, {}), [files, rules]);
  const plan = useMemo(
    () => buildExecutionPlan(files, result, { includeUnchanged: true }),
    [files, result],
  );
  const canDownload = name.trim().length > 0 && plan.ready && !working;
  const issue = name.trim() && result.issues.length > 0
    ? result.issues[0]?.message
    : "";
  const nextTheme: AppTheme = theme === "dark" ? "light" : "dark";

  const addFiles = (selected: FileList | File[]) => {
    const next = toAppFiles(selected);
    if (next.length > 0) appendFiles(next);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const clearAll = () => {
    clearFiles();
    setName("");
  };

  const removeOne = (id: string) => {
    if (files.length === 1) setName("");
    removeFile(id);
  };

  const download = async () => {
    if (!canDownload) return;
    setWorking(true);
    setFeedback("");
    setDownloadError("");
    try {
      if (files.length === 1) {
        downloadExecutionPlan(plan);
      } else {
        const archive = await createZipArchive(plan, result.manifest, undefined, { includeManifest: false });
        downloadBlob(archive, "renamed-files.zip");
      }
      setFeedback(files.length === 1 ? "File downloaded." : "Files downloaded.");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.logoFrame}><img src={import.meta.env.BASE_URL + "brand/logo.svg"} alt="" /></span>
            <h1>PFx Rename X</h1>
            <span className={styles.alphaBadge} aria-label={"Version " + __PFX_APP_VERSION__}>{__PFX_APP_VERSION__}</span>
          </div>
          <button
            className={styles.themeButton}
            type="button"
            aria-label={"Switch to " + nextTheme + " mode"}
            title={"Switch to " + nextTheme + " mode"}
            onClick={() => setTheme(nextTheme)}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.5 14.1A8.6 8.6 0 0 1 9.9 3.5 8.7 8.7 0 1 0 20.5 14.1Z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <input
        ref={picker}
        className={styles.hiddenPicker}
        type="file"
        multiple
        aria-label="Choose files"
        onChange={onPick}
      />

      <main className={styles.main}>
        {!hasFiles ? (
          <div className={styles.emptyStage}>
            <section
              className={styles.dropZone}
              data-dragging={dragging || undefined}
              aria-label="Add files"
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <button className={styles.dropButton} type="button" onClick={() => picker.current?.click()}>
                <span className={styles.uploadMark} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16.5v2A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-2"/>
                  </svg>
                </span>
                <span className={styles.dropTitle}>Drop files here</span>
                <span className={styles.dropSubtitle}>or click to choose files</span>
              </button>
            </section>
          </div>
        ) : (
          <div className={styles.editorStage}>
            <section className={styles.nameSection} aria-label="Rename">
              <label htmlFor="new-name" className={styles.fieldLabel}>New name</label>
              <input
                id="new-name"
                ref={nameInput}
                className={styles.nameInput}
                type="text"
                value={name}
                autoComplete="off"
                spellCheck={false}
                maxLength={240}
                placeholder="Type the new name"
                onChange={(event) => setName(event.target.value)}
              />
              <span className={styles.nameHint}>
                {files.length > 1 ? "Numbers are added automatically." : "The file extension stays the same."}
              </span>
            </section>

            <section className={styles.fileSection} aria-label="Filename preview">
              <div className={styles.fileToolbar}>
                <h2>Files <span>{files.length}</span></h2>
                <div className={styles.fileTools}>
                  <button className={styles.textButton} type="button" onClick={() => picker.current?.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                    Add files
                  </button>
                  <button className={styles.clearButton} type="button" onClick={clearAll}>Clear all</button>
                </div>
              </div>

              <div className={styles.listHeader} aria-hidden="true">
                <span>Original</span><span>New name</span><span />
              </div>
              <div className={styles.fileList}>
                {result.preview.items.map((item) => (
                  <div className={styles.fileRow} key={item.id}>
                    <span className={styles.original} title={item.originalName}>{item.originalName}</span>
                    <span className={styles.renamed} title={name.trim() ? item.newName : ""}>
                      {name.trim() ? item.newName : <span className={styles.placeholder}>—</span>}
                    </span>
                    <button className={styles.removeButton} type="button" title={"Remove " + item.originalName} aria-label={"Remove " + item.originalName} onClick={() => removeOne(item.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {issue ? <p className={styles.error} role="alert">{issue}</p> : null}
            {downloadError ? <p className={styles.error} role="alert">{downloadError}</p> : null}

            <div className={styles.actionArea}>
              <span className={styles.localNote}>Your original files remain untouched.</span>
              <button className={styles.downloadButton} type="button" disabled={!canDownload} onClick={() => void download()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                {working ? "Preparing…" : files.length > 1 ? "Download files" : "Download file"}
              </button>
            </div>
            {feedback ? <p className={styles.feedback} role="status">{feedback}</p> : null}
          </div>
        )}
      </main>
    </div>
  );
}
