import type { RenameInput } from "@pfxamd/rename-x";
import type { AppFile } from "./types.js";

export interface FileMetadata {
  name: string;
  size: number;
  lastModified: number;
}

export function toRenameInput(file: FileMetadata, id: string): RenameInput {
  return {
    id,
    originalName: file.name,
    size: file.size,
    lastModified: file.lastModified,
  };
}

export function toAppFile(file: File): AppFile {
  const id = globalThis.crypto.randomUUID();

  return {
    id,
    file,
    input: toRenameInput(file, id),
  };
}

export function toAppFiles(files: Iterable<File>): AppFile[] {
  return Array.from(files, toAppFile);
}
