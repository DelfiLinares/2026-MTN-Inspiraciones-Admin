/**
 * Test de reglas de dominio de `Desafio`.
 *
 * Ref: tasks.md T016, data-model.md → Entidades → Desafio (Desafío Propuesto), spec.md FR-014,
 * FR-015, FR-016, US5.
 *
 * TDD: este test se escribe ANTES de la entidad `Desafio` (T022) y debe fallar hasta que esta
 * exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { Desafio } from "@/domain/Desafio";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";

function crearDesafio(overrides: Partial<ConstructorParameters<typeof Desafio>[0]> = {}): Desafio {
  return new Desafio({
    id: "d1",
    autorId: "u1",
    titulo: "Desafío de prueba",
    descripcion: "Descripción del desafío propuesto",
    estado: EstadoDesafioPropuesto.PENDIENTE,
    fechaPropuesta: new Date("2026-01-01"),
    ...overrides,
  });
}

describe("Desafio", () => {
  describe("estaPendiente", () => {
    it("es true si estado === PENDIENTE", () => {
      const desafio = crearDesafio({ estado: EstadoDesafioPropuesto.PENDIENTE });
      expect(desafio.estaPendiente()).toBe(true);
    });

    it("es false si estado !== PENDIENTE", () => {
      const aprobado = crearDesafio({ estado: EstadoDesafioPropuesto.APROBADO });
      const rechazado = crearDesafio({ estado: EstadoDesafioPropuesto.RECHAZADO });
      expect(aprobado.estaPendiente()).toBe(false);
      expect(rechazado.estaPendiente()).toBe(false);
    });
  });

  describe("puedeAprobarse (FR-014)", () => {
    it("es true si estado === PENDIENTE", () => {
      const desafio = crearDesafio({ estado: EstadoDesafioPropuesto.PENDIENTE });
      expect(desafio.puedeAprobarse()).toBe(true);
    });

    it("es false de forma permanente una vez que estado !== PENDIENTE (decisión irreversible)", () => {
      const aprobado = crearDesafio({ estado: EstadoDesafioPropuesto.APROBADO });
      const rechazado = crearDesafio({ estado: EstadoDesafioPropuesto.RECHAZADO });
      expect(aprobado.puedeAprobarse()).toBe(false);
      expect(rechazado.puedeAprobarse()).toBe(false);
    });
  });

  describe("puedeRechazarse (FR-015)", () => {
    it("es true si estado === PENDIENTE", () => {
      const desafio = crearDesafio({ estado: EstadoDesafioPropuesto.PENDIENTE });
      expect(desafio.puedeRechazarse()).toBe(true);
    });

    it("es false de forma permanente una vez que estado !== PENDIENTE (decisión irreversible)", () => {
      const aprobado = crearDesafio({ estado: EstadoDesafioPropuesto.APROBADO });
      const rechazado = crearDesafio({ estado: EstadoDesafioPropuesto.RECHAZADO });
      expect(aprobado.puedeRechazarse()).toBe(false);
      expect(rechazado.puedeRechazarse()).toBe(false);
    });
  });
});
