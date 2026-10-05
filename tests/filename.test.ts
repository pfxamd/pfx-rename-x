import { describe, expect, it } from "vitest";
import { parseFilename } from "../src/index.js";

describe("parseFilename", () => {
  it("keeps dotfiles intact", () => {
    expect(parseFilename(".gitignore")).toEqual({ basename: ".gitignore", extension: "" });
  });

  it("uses the final dot as extension separator", () => {
    expect(parseFilename("archive.tar.gz")).toEqual({ basename: "archive.tar", extension: "gz" });
  });

  it("supports files without extension", () => {
    expect(parseFilename("README")).toEqual({ basename: "README", extension: "" });
  });
});

it("keeps trailing dots in the basename for validation", () => {
  expect(parseFilename("file.")).toEqual({ basename: "file.", extension: "" });
});

it("does not split a single-dot parent token", () => {
  expect(parseFilename("..")).toEqual({ basename: "..", extension: "" });
});
