import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/pfx-rename-x/" : "/",
  plugins: [react()],
  build: {
    sourcemap: true,
  },
}));
