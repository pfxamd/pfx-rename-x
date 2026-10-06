import { useMemo, useState } from "react";
import type { RenameResult } from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";
import { downloadExecutionPlan, downloadManifest } from "./browserDownloads.js";
import { buildExecutionPlan } from "./executionPlan.js";
import styles from "./ExecutionPanel.module.css";

interface ExecutionPanelProps {
  files: AppFile[];
  result: RenameResult;
}

type Status =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function ExecutionPanel({ files, result }: ExecutionPanelProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const plan = useMemo(() => buildExecutionPlan(files, result), [files, result]);

  const downloadFiles = () => {
    try {
      const summary = downloadExecutionPlan(plan);
      setStatus({
        kind: "success",
        message: `${summary.downloaded} renamed file${summary.downloaded === 1 ? "" : "s"} sent to the browser.`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Download failed.",
      });
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="execution-heading">
      <div className={styles.heading}>
        <div>
          <h2 id="execution-heading">Execute</h2>
          <p>
            Downloads renamed copies. Original files on your device are never modified.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            disabled={result.manifest.entries.length === 0}
            onClick={() => downloadManifest(result.manifest)}
          >
            Export manifest
          </button>
          <button
            type="button"
            disabled={!plan.ready}
            onClick={downloadFiles}
          >
            Download renamed copies
          </button>
        </div>
      </div>

      <div className={styles.summary}>
        <span>{plan.items.length} changed</span>
        <span>{plan.issues.length} blocking issue{plan.issues.length === 1 ? "" : "s"}</span>
      </div>

      {plan.issues.length > 0 ? (
        <div className={styles.issues}>
          {plan.issues.map((issue, index) => (
            <p key={`${issue.code}-${issue.fileId ?? ""}-${index}`}>
              <strong>{issue.code}</strong> {issue.message}
            </p>
          ))}
        </div>
      ) : null}

      {status.kind !== "idle" ? (
        <p className={styles.status} data-kind={status.kind} role="status">
          {status.message}
        </p>
      ) : null}

      {plan.items.length > 1 ? (
        <p className={styles.note}>
          Your browser may ask permission before allowing multiple downloads.
        </p>
      ) : null}
    </section>
  );
}
