import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Commit immediately before the app's first alpha version badge.
// The badge commit itself starts at alpha 0.1.0; each later mainline commit
// advances the patch number without editing a version file or creating commits.
const versionBaseline = "d30f94b4d67f5ba6d101dab2768f277dacfc68d6";

function appVersion(): string {
  const commitsSinceBaseline = Number(
    execFileSync(
      "git",
      ["rev-list", "--first-parent", "--count", versionBaseline + "..HEAD"],
      { encoding: "utf8" },
    ).trim(),
  );

  if (!Number.isSafeInteger(commitsSinceBaseline) || commitsSinceBaseline < 1) {
    throw new Error("Unable to determine the app version from the complete Git history.");
  }

  return "alpha 0.1." + (commitsSinceBaseline - 1);
}

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/pfx-rename-x/" : "/",
  plugins: [react()],
  define: {
    __PFX_APP_VERSION__: JSON.stringify(appVersion()),
  },
  build: {
    sourcemap: true,
  },
}));
