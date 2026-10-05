import type { FilenameParts } from "../types.js";

export function parseFilename(name: string): FilenameParts {
  if (name === "." || name === "..") return { basename: name, extension: "" };

  const lastSlash = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  const leaf = lastSlash >= 0 ? name.slice(lastSlash + 1) : name;
  const dot = leaf.lastIndexOf(".");

  if (dot <= 0 || dot === leaf.length - 1) {
    return { basename: leaf, extension: "" };
  }

  return {
    basename: leaf.slice(0, dot),
    extension: leaf.slice(dot + 1),
  };
}

export function composeFilename(parts: FilenameParts): string {
  return parts.extension ? `${parts.basename}.${parts.extension}` : parts.basename;
}
