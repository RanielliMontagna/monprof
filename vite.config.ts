import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: "apps/ui",
  build: {
    outDir: join(__dirname, "dist/ui"),
    emptyOutDir: true,
    rollupOptions: {
      input: join(__dirname, "apps/ui/index.html"),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  base: "./",
});
