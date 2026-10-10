import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Initial alpha-badge commit. The first verified rollout following it starts
// at alpha 0.1.0; subsequent mainline updates advance the patch number.
// Rebuilding the same commit always reproduces the same version.
const versionBaseline = "ff146923d74f2849590907303f2f84f1bbcc16e8";

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
