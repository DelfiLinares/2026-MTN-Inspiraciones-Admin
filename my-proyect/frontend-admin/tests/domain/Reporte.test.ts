/**
 * Test de reglas de dominio de `Reporte`.
 *
 * Ref: tasks.md T015, data-model.md → Entidades → Reporte, spec.md FR-025, FR-026, US2, US4.
 *
 * TDD: este test se escribe ANTES de la entidad `Reporte` (T021) y debe fallar hasta que esta
 * exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { Reporte } from "@/domain/Reporte";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";

function crearReporte(overrides: Partial<ConstructorParameters<typeof Reporte>[0]> = {}): Reporte {
  return new Reporte({
    id: "r1",
    publicacionId: "p1",
    reportanteId: "u2",
    motivo: MotivoReporte.SPAM,
    estado: EstadoReporte.PENDIENTE,
    fechaCreacion: new Date("2026-01-01"),
    prioridad: "MEDIA",
    ...overrides,
  });
}

describe("Reporte", () => {
  describe("estaPendiente", () => {
    it("es true si estado === PENDIENTE", () => {
      const reporte = crearReporte({ estado: EstadoReporte.PENDIENTE });
      expect(reporte.estaPendiente()).toBe(true);
    });

    it("es false si estado !== PENDIENTE", () => {
      const sinEliminar = crearReporte({ estado: EstadoReporte.RESUELTO_SIN_ELIMINAR });
      const conEliminacion = crearReporte({ estado: EstadoReporte.RESUELTO_CON_ELIMINACION });
      expect(sinEliminar.estaPendiente()).toBe(false);
      expect(conEliminacion.estaPendiente()).toBe(false);
    });
  });

  describe("antiguedadEnDias (FR-025)", () => {
    it("calcula la cantidad de días transcurridos desde fechaCreacion hasta fechaActual", () => {
      const reporte = crearReporte({ fechaCreacion: new Date("2026-01-01") });
      const fechaActual = new Date("2026-01-08");
      expect(reporte.antiguedadEnDias(fechaActual)).toBe(7);
    });

    it("devuelve 0 si fechaActual es el mismo día que fechaCreacion", () => {
      const reporte = crearReporte({ fechaCreacion: new Date("2026-01-01") });
      expect(reporte.antiguedadEnDias(new Date("2026-01-01"))).toBe(0);
    });
  });

  describe("puedeResolverseSinEliminar (research.md §6, FR-026)", () => {
    it("es true si estado === PENDIENTE", () => {
      const reporte = crearReporte({ estado: EstadoReporte.PENDIENTE });
      expect(reporte.puedeResolverseSinEliminar()).toBe(true);
    });

    it("es false si estado !== PENDIENTE", () => {
      const reporte = crearReporte({ estado: EstadoReporte.RESUELTO_SIN_ELIMINAR });
      expect(reporte.puedeResolverseSinEliminar()).toBe(false);
    });
  });

  describe("puedeResolverseConEliminacion (FR-010)", () => {
    it("es true si estado === PENDIENTE", () => {
      const reporte = crearReporte({ estado: EstadoReporte.PENDIENTE });
      expect(reporte.puedeResolverseConEliminacion()).toBe(true);
    });

    it("es false si estado !== PENDIENTE", () => {
      const reporte = crearReporte({ estado: EstadoReporte.RESUELTO_CON_ELIMINACION });
      expect(reporte.puedeResolverseConEliminacion()).toBe(false);
    });
  });
});
