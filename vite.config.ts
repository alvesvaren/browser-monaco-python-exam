import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: { exclude: ["pyodide"] },
  plugins: [
    react(),
    {
      name: "vite-plugin-pyodide",
      generateBundle: async () => {
        const assetsDir = "dist/assets";
        await mkdir(assetsDir, { recursive: true });
        const files = ["pyodide-lock.json", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip"];
        const modulePath = fileURLToPath(import.meta.resolve("pyodide"));
        for (const file of files) {
          await copyFile(join(dirname(modulePath), file), join(assetsDir, file));
        }
      },
    },
  ],
  build: {
    sourcemap: true,
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  worker: {
    format: "es",
  },
  // optimizeDeps: {
  //   include: ["react/jsx-runtime"],
  // },
  // resolve: {
  //   alias: {
  //     "react/jsx-runtime": "react/jsx-runtime.js",
  //   },
  // },
});
