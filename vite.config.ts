import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
