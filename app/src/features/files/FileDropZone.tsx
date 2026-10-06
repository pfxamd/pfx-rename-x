import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toAppFiles } from "./fileAdapter.js";
import type { AppFile } from "./types.js";
import styles from "./FileDropZone.module.css";

interface FileDropZoneProps {
  onFiles(files: AppFile[]): void;
}

export function FileDropZone({ onFiles }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const commit = (files: FileList | File[]) => {
    const next = toAppFiles(files);
    if (next.length > 0) onFiles(next);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) commit(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) commit(event.dataTransfer.files);
  };

  return (
    <div
      className={styles.zone}
      data-dragging={dragging || undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        multiple
        onChange={handleInput}
      />

      <button
        className={styles.pick}
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        <span className={styles.pickIcon}>+</span>
        <span>
          <strong>{dragging ? "Drop now" : "Add files"}</strong>
          <small>or drag them here</small>
        </span>
      </button>
    </div>
  );
}
