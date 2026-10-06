import { describe, expect, it } from "vitest";
import { rename } from "@pfxamd/rename-x";
import {
  buildQuickRules,
  defaultQuickRenameSettings,
  type QuickRenameSettings,
} from "./quickRules.js";

function run(settings: QuickRenameSettings, names: string[]) {
  return rename({
    files: names.map((originalName, index) => ({
      id: String(index + 1),
      originalName,
    })),
    rules: buildQuickRules(settings),
  });
}

describe("quick rename rules", () => {
  it("renames a batch with simple numbering", () => {
    const result = run(
      { ...defaultQuickRenameSettings, name: "Holiday" },
      ["IMG_1.jpg", "IMG_2.jpg"],
    );

    expect(result.preview.items.map((item) => item.newName)).toEqual([
      "Holiday 01.jpg",
      "Holiday 02.jpg",
    ]);
  });

  it("replaces text without exposing advanced settings", () => {
    const result = run(
      {
        ...defaultQuickRenameSettings,
        mode: "replace",
        find: "IMG",
        replace: "Photo",
      },
      ["IMG_001.jpg"],
    );

    expect(result.preview.items[0]?.newName).toBe("Photo_001.jpg");
  });

  it("adds text before or after the current name", () => {
    const before = run(
      {
        ...defaultQuickRenameSettings,
        mode: "add",
        addText: "Trip-",
        addPosition: "before",
      },
      ["001.jpg"],
    );
    const after = run(
      {
        ...defaultQuickRenameSettings,
        mode: "add",
        addText: "-Final",
        addPosition: "after",
      },
      ["001.jpg"],
    );

    expect(before.preview.items[0]?.newName).toBe("Trip-001.jpg");
    expect(after.preview.items[0]?.newName).toBe("001-Final.jpg");
  });

  it("changes filename case with a single choice", () => {
    const result = run(
      {
        ...defaultQuickRenameSettings,
        mode: "case",
        caseMode: "uppercase",
      },
      ["summer trip.jpg"],
    );

    expect(result.preview.items[0]?.newName).toBe("SUMMER TRIP.jpg");
  });
});
