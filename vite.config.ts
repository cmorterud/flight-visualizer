import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const githubRepository = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  base:
    process.env.GITHUB_ACTIONS && githubRepository
      ? `/${githubRepository}/`
      : "/",
  plugins: [react()],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  server: {
    watch:
      process.env.CODEX_SANDBOX === "seatbelt"
        ? { usePolling: true }
        : undefined,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
