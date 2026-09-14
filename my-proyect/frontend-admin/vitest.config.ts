/**
 * Vitest config for frontend-admin/.
 *
 * Ref: tasks.md T004 — Configurar el runner de tests (Jest/Vitest + Testing Library),
 * habilitando las carpetas tests/domain, tests/application, tests/presentation,
 * tests/integration (per plan.md → Technical Context → Testing).
 *
 * Ref: tasks.md T084 (depende de T004), spec.md SC-006 — el bloque `coverage` se refuerza con
 * umbrales (`thresholds`) exigidos sobre `src/domain/**` (donde viven las reglas de negocio
 * críticas: control de rol para moderación, restricción de promoción a administrador,
 * habilitación de confirmación en acciones destructivas — T019-T025), de forma que `npm run
 * test:coverage` falle si esas reglas quedan sin cobertura de test. `text-summary`/`json-summary`
 * habilitan revisar el cumplimiento de SC-006 tanto en consola como en CI.
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
      reporter: ["text", "text-summary", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      // Ref: SC-006 — las reglas de negocio críticas viven en src/domain/ (entidades T019-T025).
      // Se exige cobertura total en ese subconjunto para verificar de forma automatizada que
      // ninguna regla crítica queda sin test asociado.
      thresholds: {
        "src/domain/**/*.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
