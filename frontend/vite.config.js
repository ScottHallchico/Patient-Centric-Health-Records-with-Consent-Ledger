import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@contracts": path.resolve(__dirname, "src/contracts")
    }
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, "..", "artifacts")]
    }
  },
  test: {
    environment: "node"
  }
});
