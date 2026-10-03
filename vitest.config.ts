import path from "node:path";
import { defineConfig } from "vitest/config";

// Solo resuelve el alias `@/*` igual que Next; los tests corren en node.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
  test: {
    environment: "node",
  },
});
