import { describe, expect, it } from "vitest";
import { prefix } from "@pfxamd/rename-x";
import type { AppFile } from "../files/types.js";
import { buildPreview } from "./previewAdapter.js";

describe("preview adapter", () => {
  it("delegates rename behavior to the core package", () => {
    const files: AppFile[] = [
      {
        id: "1",
        file: {} as File,
        input: {
          id: "1",
          originalName: "photo.jpg",
          size: 10,
          lastModified: 100,
        },
      },
    ];

    const result = buildPreview(files, [prefix("trip-")], {});

    expect(result.valid).toBe(true);
    expect(result.preview.items[0]?.newName).toBe("trip-photo.jpg");
  });
});
