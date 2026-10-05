import { caseTransform, counter, extension, prefix, rename } from "../src/index.js";

const result = rename({
  files: [
    { id: "1", originalName: "IMG 01.JPG" },
    { id: "2", originalName: "IMG 02.JPG" },
  ],
  rules: [
    caseTransform("lowercase"),
    prefix("trip-"),
    counter({ start: 1, padding: 3 }),
    extension({ mode: "lowercase" }),
  ],
  options: {
    extensionPolicy: "allow-change",
    now: new Date("2026-10-06T12:00:00Z"),
  },
});

console.log(result.preview.items);
