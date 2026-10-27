import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Default matches Vite. VITE_CACHE_DIR overrides it when node_modules cannot be renamed.
  cacheDir: process.env.VITE_CACHE_DIR ?? path.join("node_modules", ".vite"),
});
