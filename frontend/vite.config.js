import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "pages" ? "/invisible-stories-pilot/" : "/",
  build: { outDir: mode === "pages" ? "dist-pages" : "dist" },
  define: { __PAGES_BUILD__: JSON.stringify(mode === "pages") },
}));
