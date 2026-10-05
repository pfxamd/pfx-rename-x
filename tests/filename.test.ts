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
