/**
 * Test de cobertura de transiciones de estado válidas/inválidas.
 *
 * Ref: tasks.md T083 (depende de T020-T025).
 *
 * Cubre, para cada entidad cuyo comportamiento depende de un estado discreto, todos los valores
 * posibles del enum correspondiente frente al método de dominio que determina si una transición
 * (acción) es válida en ese estado:
 * - `EstadoPublicacion` → `Publicacion.puedeSerEliminada()` (FR-010, FR-011).
 * - `EstadoDesafioPropuesto` → `Desafio.puedeAprobarse()` / `puedeRechazarse()` (FR-014, FR-015,
 *   FR-016).
 * - `EstadoReporte` → `Reporte.puedeResolverseSinEliminar()` (FR-026).
 * - `ExportacionReporte` → `estaListoParaDescargar()` / `fallo()` sobre los resultados válidos e
 *   inválidos de la operación SÍNCRONA de exportación (`exitoso`/`urlDescarga`/`mensajeError`, ya
 *   no un enum de estado con pasos intermedios; Clarifications Session 2026-09-08 pregunta 3).
 *
 * No duplica los tests unitarios por entidad (`Publicacion.test.ts`, `Desafio.test.ts`,
 * `Reporte.test.ts`, `ExportacionReporte.test.ts`): su propósito es verificar, recorriendo
 * exhaustivamente `Object.values(Enum)`, que ningún valor del enum queda sin cubrir por la regla
 * de transición correspondiente (evitando que un nuevo valor de enum agregado a futuro pase
 * desapercibido sin actualizar la regla de negocio asociada).
 */
import { describe, expect, it } from "vitest";
import { Publicacion } from "@/domain/Publicacion";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";
import { Desafio } from "@/domain/Desafio";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";
import { Reporte } from "@/domain/Reporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { ExportacionReporte } from "@/domain/ExportacionReporte";

function crearPublicacion(estado: EstadoPublicacion): Publicacion {
  return new Publicacion({
    id: "p1",
    autorId: "u1",
    titulo: "Publicación de prueba",
    estado,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
  });
}

function crearDesafio(estado: EstadoDesafioPropuesto): Desafio {
  return new Desafio({
    id: "d1",
    autorId: "u1",
    titulo: "Desafío de prueba",
    descripcion: "Descripción",
    estado,
    fechaPropuesta: new Date("2026-01-01T00:00:00Z"),
  });
}

function crearReporte(estado: EstadoReporte): Reporte {
  return new Reporte({
    id: "r1",
    publicacionId: "p1",
    reportanteId: "u2",
    motivo: MotivoReporte.SPAM,
    estado,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
    prioridad: "MEDIA",
  });
}

describe("Transiciones de estado — EstadoPublicacion (FR-010, FR-011)", () => {
  const esperado: Record<EstadoPublicacion, boolean> = {
    [EstadoPublicacion.ACTIVA]: true,
    [EstadoPublicacion.REPORTADA]: true,
    [EstadoPublicacion.ELIMINADA]: false,
  };

  it.each(Object.values(EstadoPublicacion))(
    "puedeSerEliminada() para estado %s",
    (estado) => {
      expect(crearPublicacion(estado).puedeSerEliminada()).toBe(esperado[estado]);
    },
  );

  it("cubre todos los valores del enum sin omisiones", () => {
    expect(Object.keys(esperado).sort()).toEqual(Object.values(EstadoPublicacion).sort());
  });
});

describe("Transiciones de estado — EstadoDesafioPropuesto (FR-014, FR-015, FR-016)", () => {
  const esperado: Record<EstadoDesafioPropuesto, boolean> = {
    [EstadoDesafioPropuesto.PENDIENTE]: true,
    [EstadoDesafioPropuesto.APROBADO]: false,
    [EstadoDesafioPropuesto.RECHAZADO]: false,
  };

  it.each(Object.values(EstadoDesafioPropuesto))(
    "puedeAprobarse() para estado %s",
    (estado) => {
      expect(crearDesafio(estado).puedeAprobarse()).toBe(esperado[estado]);
    },
  );

  it.each(Object.values(EstadoDesafioPropuesto))(
    "puedeRechazarse() para estado %s",
    (estado) => {
      expect(crearDesafio(estado).puedeRechazarse()).toBe(esperado[estado]);
    },
  );

  it("cubre todos los valores del enum sin omisiones", () => {
    expect(Object.keys(esperado).sort()).toEqual(Object.values(EstadoDesafioPropuesto).sort());
  });
});

describe("Transiciones de estado — EstadoReporte (FR-026)", () => {
  const esperado: Record<EstadoReporte, boolean> = {
    [EstadoReporte.PENDIENTE]: true,
    [EstadoReporte.RESUELTO_SIN_ELIMINAR]: false,
    [EstadoReporte.RESUELTO_CON_ELIMINACION]: false,
  };

  it.each(Object.values(EstadoReporte))(
    "puedeResolverseSinEliminar() para estado %s",
    (estado) => {
      expect(crearReporte(estado).puedeResolverseSinEliminar()).toBe(esperado[estado]);
    },
  );

  it("cubre todos los valores del enum sin omisiones", () => {
    expect(Object.keys(esperado).sort()).toEqual(Object.values(EstadoReporte).sort());
  });
});

describe("Resultados de ExportacionReporte — operación síncrona, sin enum de estado (FR-019, FR-028, research.md §4)", () => {
  it("resultado válido exitoso: estaListoParaDescargar() true y fallo() false", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: true,
      urlDescarga: "https://ejemplo.com/reporte-1.csv",
      mensajeError: null,
    });

    expect(exportacion.estaListoParaDescargar()).toBe(true);
    expect(exportacion.fallo()).toBe(false);
  });

  it("resultado válido fallido: estaListoParaDescargar() false y fallo() true", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: false,
      urlDescarga: null,
      mensajeError: "motivo interno del backend",
    });

    expect(exportacion.estaListoParaDescargar()).toBe(false);
    expect(exportacion.fallo()).toBe(true);
  });

  it("resultado inválido/inconsistente: exitoso true pero sin urlDescarga aún no habilita la descarga", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: true,
      urlDescarga: null,
      mensajeError: null,
    });

    expect(exportacion.estaListoParaDescargar()).toBe(false);
    expect(exportacion.fallo()).toBe(false);
  });
});
