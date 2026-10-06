import { describe, expect, it } from "vitest";
import { toRenameInput } from "./fileAdapter.js";

describe("file adapter", () => {
  it("maps browser file metadata to the core input contract", () => {
    expect(
      toRenameInput(
        {
          name: "photo.jpg",
          size: 2048,
          lastModified: 1_700_000_000_000,
        },
        "file-1",
      ),
    ).toEqual({
      id: "file-1",
      originalName: "photo.jpg",
      size: 2048,
      lastModified: 1_700_000_000_000,
    });
  });
});
