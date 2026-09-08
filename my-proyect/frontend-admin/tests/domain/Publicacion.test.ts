/**
 * Test de reglas de dominio de `Publicacion`.
 *
 * Ref: tasks.md T014, data-model.md → Entidades → Publicacion, spec.md FR-010, FR-011, US2.
 *
 * TDD: este test se escribe ANTES de la entidad `Publicacion` (T020) y debe fallar hasta que
 * esta exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { Publicacion } from "@/domain/Publicacion";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";

function crearPublicacion(
  overrides: Partial<ConstructorParameters<typeof Publicacion>[0]> = {},
): Publicacion {
  return new Publicacion({
    id: "p1",
    autorId: "u1",
    titulo: "Publicación de prueba",
    estado: EstadoPublicacion.ACTIVA,
    fechaCreacion: new Date("2026-01-01"),
    ...overrides,
  });
}

describe("Publicacion", () => {
  describe("estaReportada", () => {
    it("es true si estado === REPORTADA", () => {
      const publicacion = crearPublicacion({ estado: EstadoPublicacion.REPORTADA });
      expect(publicacion.estaReportada()).toBe(true);
    });

    it("es false si estado !== REPORTADA", () => {
      const activa = crearPublicacion({ estado: EstadoPublicacion.ACTIVA });
      const eliminada = crearPublicacion({ estado: EstadoPublicacion.ELIMINADA });
      expect(activa.estaReportada()).toBe(false);
      expect(eliminada.estaReportada()).toBe(false);
    });
  });

  describe("puedeSerEliminada (FR-010)", () => {
    it("es true si estado !== ELIMINADA", () => {
      const activa = crearPublicacion({ estado: EstadoPublicacion.ACTIVA });
      const reportada = crearPublicacion({ estado: EstadoPublicacion.REPORTADA });
      expect(activa.puedeSerEliminada()).toBe(true);
      expect(reportada.puedeSerEliminada()).toBe(true);
    });

    it("es false si estado === ELIMINADA", () => {
      const eliminada = crearPublicacion({ estado: EstadoPublicacion.ELIMINADA });
      expect(eliminada.puedeSerEliminada()).toBe(false);
    });
  });

  describe("estaActiva", () => {
    it("es true si estado === ACTIVA", () => {
      const activa = crearPublicacion({ estado: EstadoPublicacion.ACTIVA });
      expect(activa.estaActiva()).toBe(true);
    });

    it("es false si estado !== ACTIVA", () => {
      const reportada = crearPublicacion({ estado: EstadoPublicacion.REPORTADA });
      const eliminada = crearPublicacion({ estado: EstadoPublicacion.ELIMINADA });
      expect(reportada.estaActiva()).toBe(false);
      expect(eliminada.estaActiva()).toBe(false);
    });
  });
});
