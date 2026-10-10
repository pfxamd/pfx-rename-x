import { Zip, ZipPassThrough } from "fflate";
import type { RenameManifest } from "@pfxamd/rename-x";
import type { ExecutionPlan } from "./types.js";

export interface ZipProgress {
  completed: number;
  total: number;
  currentName: string;
}

export type ZipProgressHandler = (progress: ZipProgress) => void;

function copyChunk(chunk: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(chunk.byteLength);
  copy.set(chunk);
  return copy.buffer;
}

async function pushFile(entry: ZipPassThrough, file: File): Promise<void> {
  const reader = file.stream().getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        entry.push(new Uint8Array(0), true);
        return;
      }

      entry.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function createZipArchive(
  plan: ExecutionPlan,
  manifest: RenameManifest,
  onProgress?: ZipProgressHandler,
  options: { includeManifest?: boolean } = {},
): Promise<Blob> {
  if (!plan.ready) {
    throw new Error("Execution plan is not ready.");
  }

  const chunks: BlobPart[] = [];
  let resolveArchive!: (blob: Blob) => void;
  let rejectArchive!: (error: Error) => void;

  const archive = new Promise<Blob>((resolve, reject) => {
    resolveArchive = resolve;
    rejectArchive = reject;
  });

  const zip = new Zip((error, chunk, final) => {
    if (error) {
      rejectArchive(error);
      return;
    }

    chunks.push(copyChunk(chunk));

    if (final) {
      resolveArchive(new Blob(chunks, { type: "application/zip" }));
    }
  });

  try {
    const total = plan.items.length;

    for (let index = 0; index < total; index += 1) {
      const item = plan.items[index];
      if (!item) continue;

      const entry = new ZipPassThrough(item.to);
      zip.add(entry);
      await pushFile(entry, item.source.file);

      onProgress?.({
        completed: index + 1,
        total,
        currentName: item.to,
      });
    }

    if (options.includeManifest !== false) {
      const manifestEntry = new ZipPassThrough("pfx-rename-x-manifest.json");
      zip.add(manifestEntry);
      manifestEntry.push(
        new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
        true,
      );
    }

    zip.end();
  } catch (error) {
    const normalized =
      error instanceof Error ? error : new Error("ZIP creation failed.");
    rejectArchive(normalized);
    throw normalized;
  }

  return archive;
}
