import type { RenameManifest } from "@pfxamd/rename-x";
import type { ExecutionPlan, ExecutionSummary } from "./types.js";

function triggerDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  try {
    triggerDownload(url, filename);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function downloadExecutionPlan(plan: ExecutionPlan): ExecutionSummary {
  if (!plan.ready) {
    throw new Error("Execution plan is not ready.");
  }

  let downloaded = 0;

  for (const item of plan.items) {
    const url = URL.createObjectURL(item.source.file);

    try {
      triggerDownload(url, item.to);
      downloaded += 1;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }

  return {
    requested: plan.items.length,
    downloaded,
  };
}

export function downloadManifest(manifest: RenameManifest): void {
  const blob = new Blob(
    [JSON.stringify(manifest, null, 2)],
    { type: "application/json;charset=utf-8" },
  );

  downloadBlob(blob, "pfx-rename-x-manifest.json");
}
