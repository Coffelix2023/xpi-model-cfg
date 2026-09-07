import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "docs/references/**",
      "node_modules/**",
    ],
    include: [
      "src/**/*.test.ts",
    ],
  },
});
