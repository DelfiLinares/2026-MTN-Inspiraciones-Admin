/**
 * Vitest config for frontend-admin/.
 *
 * Ref: tasks.md T004 — Configurar el runner de tests (Jest/Vitest + Testing Library),
 * habilitando las carpetas tests/domain, tests/application, tests/presentation,
 * tests/integration (per plan.md → Technical Context → Testing).
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setupTests.ts"],
    include: [
      "tests/domain/**/*.{test,spec}.{ts,tsx}",
      "tests/application/**/*.{test,spec}.{ts,tsx}",
      "tests/presentation/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
