import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
