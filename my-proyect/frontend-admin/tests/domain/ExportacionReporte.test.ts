/**
 * Test de reglas de dominio de `ExportacionReporte`.
 *
 * Ref: tasks.md T018, data-model.md → Entidades → ExportacionReporte, spec.md FR-019, FR-028,
 * Clarifications Session 2026-09-08 pregunta 3, research.md §4.
 *
 * TDD: este test se escribe ANTES de la entidad `ExportacionReporte` (T025) y debe fallar hasta
 * que esta exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { ExportacionReporte } from "@/domain/ExportacionReporte";

function crearExportacionExitosa(
  overrides: Partial<ConstructorParameters<typeof ExportacionReporte>[0]> = {},
): ExportacionReporte {
  return new ExportacionReporte({
    reporteAnaliticaId: "ra1",
    exitoso: true,
    urlDescarga: "https://example.com/descargas/reporte.xlsx",
    mensajeError: null,
    ...overrides,
  });
}

function crearExportacionFallida(
  overrides: Partial<ConstructorParameters<typeof ExportacionReporte>[0]> = {},
): ExportacionReporte {
  return new ExportacionReporte({
    reporteAnaliticaId: "ra1",
    exitoso: false,
    urlDescarga: null,
    mensajeError: "Error: Reporte no generado.",
    ...overrides,
  });
}

describe("ExportacionReporte", () => {
  describe("estaListoParaDescargar (FR-019)", () => {
    it("es true cuando exitoso === true y urlDescarga !== null", () => {
      const exportacion = crearExportacionExitosa();
      expect(exportacion.estaListoParaDescargar()).toBe(true);
    });

    it("es false cuando exitoso === false", () => {
      const exportacion = crearExportacionFallida();
      expect(exportacion.estaListoParaDescargar()).toBe(false);
    });

    it("es false cuando exitoso === true pero urlDescarga es null", () => {
      const exportacion = crearExportacionExitosa({ urlDescarga: null });
      expect(exportacion.estaListoParaDescargar()).toBe(false);
    });
  });

  describe("fallo (FR-028)", () => {
    it("es true cuando exitoso === false", () => {
      const exportacion = crearExportacionFallida();
      expect(exportacion.fallo()).toBe(true);
    });

    it("es false cuando exitoso === true", () => {
      const exportacion = crearExportacionExitosa();
      expect(exportacion.fallo()).toBe(false);
    });

    it("expone el mensaje de error por defecto exacto \"Error: Reporte no generado.\"", () => {
      const exportacion = crearExportacionFallida();
      expect(exportacion.mensajeError).toBe("Error: Reporte no generado.");
    });
  });
});
