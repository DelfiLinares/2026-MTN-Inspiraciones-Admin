/**
 * Test consolidado de reglas de permisos administrativos (matriz rol × acción).
 *
 * Ref: tasks.md T081 (depende de T019-T025), spec.md SC-006.
 *
 * Consolida en un único test suite la matriz de reglas de negocio que gobiernan qué acciones
 * administrativas están disponibles según el rol/estado del usuario objetivo (y, en el caso de
 * promoción, del actor autenticado): banear, eliminar, promover (Usuario, T019); eliminar
 * publicación (Publicacion, T020); resolver reporte sin eliminar (Reporte, T021); aprobar/rechazar
 * desafío propuesto (Desafio, T022). No duplica los tests unitarios por entidad
 * (`Usuario.test.ts`, `Publicacion.test.ts`, `Reporte.test.ts`, `Desafio.test.ts`): su propósito es
 * verificar de forma consolidada, en una única matriz legible, el cumplimiento de SC-006
 * ("ninguna acción administrativa sensible carece de regla de permiso verificable").
 *
 * Nota sobre promoción a administrador (FR-007): la regla `puedeSerPromovidoAAdmin()` de
 * `Usuario` solo evalúa al usuario **objetivo** (rol USER + estadoCuenta ACTIVO); la restricción
 * adicional de que el **actor** autenticado también deba ser ADMIN se aplica en la capa de
 * presentación (`PromoverUsuarioAction`, T059/T061), no en la entidad de dominio. Este test
 * documenta explícitamente ese límite de responsabilidad.
 */
import { describe, expect, it } from "vitest";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";
import { Publicacion } from "@/domain/Publicacion";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";
import { Reporte } from "@/domain/Reporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { Desafio } from "@/domain/Desafio";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";

function crearUsuario(rol: RolUsuario, estadoCuenta: EstadoCuentaUsuario): Usuario {
  return new Usuario({
    id: "u1",
    nombre: "Usuario de prueba",
    email: "usuario@example.com",
    rol,
    estadoCuenta,
    fechaRegistro: new Date("2026-01-01T00:00:00Z"),
  });
}

function crearPublicacion(estado: EstadoPublicacion): Publicacion {
  return new Publicacion({
    id: "p1",
    autorId: "u1",
    titulo: "Publicación de prueba",
    estado,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
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

describe("Permisos administrativos — matriz rol × acción (SC-006)", () => {
  describe("Usuario.puedeSerBaneado() — FR-005, FR-029", () => {
    it("USER ACTIVO → true", () => {
      expect(crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO).puedeSerBaneado()).toBe(
        true,
      );
    });

    it("USER BANEADO → false (ya está baneado)", () => {
      expect(crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.BANEADO).puedeSerBaneado()).toBe(
        false,
      );
    });

    it("USER ELIMINADO → false", () => {
      expect(crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.ELIMINADO).puedeSerBaneado()).toBe(
        false,
      );
    });

    it("ADMIN ACTIVO → false (un ADMIN nunca puede ser baneado, sin excepción)", () => {
      expect(crearUsuario(RolUsuario.ADMIN, EstadoCuentaUsuario.ACTIVO).puedeSerBaneado()).toBe(
        false,
      );
    });
  });

  describe("Usuario.puedeSerEliminado() — FR-006, FR-029", () => {
    it("USER ACTIVO → true", () => {
      expect(crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO).puedeSerEliminado()).toBe(
        true,
      );
    });

    it("USER BANEADO → true", () => {
      expect(crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.BANEADO).puedeSerEliminado()).toBe(
        true,
      );
    });

    it("USER ELIMINADO → false (ya está eliminado)", () => {
      expect(
        crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.ELIMINADO).puedeSerEliminado(),
      ).toBe(false);
    });

    it("ADMIN ACTIVO → false (un ADMIN nunca puede ser eliminado, sin excepción)", () => {
      expect(crearUsuario(RolUsuario.ADMIN, EstadoCuentaUsuario.ACTIVO).puedeSerEliminado()).toBe(
        false,
      );
    });
  });

  describe("Usuario.puedeSerPromovidoAAdmin() — FR-007 (solo regla sobre el objetivo; el actor ADMIN se valida en presentación)", () => {
    it("USER ACTIVO → true", () => {
      expect(
        crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO).puedeSerPromovidoAAdmin(),
      ).toBe(true);
    });

    it("USER BANEADO → false", () => {
      expect(
        crearUsuario(RolUsuario.USER, EstadoCuentaUsuario.BANEADO).puedeSerPromovidoAAdmin(),
      ).toBe(false);
    });

    it("ADMIN ACTIVO → false (ya es administrador)", () => {
      expect(
        crearUsuario(RolUsuario.ADMIN, EstadoCuentaUsuario.ACTIVO).puedeSerPromovidoAAdmin(),
      ).toBe(false);
    });
  });

  describe("Publicacion.puedeSerEliminada() — FR-010", () => {
    it("ACTIVA → true", () => {
      expect(crearPublicacion(EstadoPublicacion.ACTIVA).puedeSerEliminada()).toBe(true);
    });

    it("REPORTADA → true", () => {
      expect(crearPublicacion(EstadoPublicacion.REPORTADA).puedeSerEliminada()).toBe(true);
    });

    it("ELIMINADA → false (ya está eliminada)", () => {
      expect(crearPublicacion(EstadoPublicacion.ELIMINADA).puedeSerEliminada()).toBe(false);
    });
  });

  describe("Reporte.puedeResolverseSinEliminar() — FR-026, research.md §6", () => {
    it("PENDIENTE → true", () => {
      expect(crearReporte(EstadoReporte.PENDIENTE).puedeResolverseSinEliminar()).toBe(true);
    });

    it("RESUELTO_SIN_ELIMINAR → false (ya no está pendiente)", () => {
      expect(
        crearReporte(EstadoReporte.RESUELTO_SIN_ELIMINAR).puedeResolverseSinEliminar(),
      ).toBe(false);
    });

    it("RESUELTO_CON_ELIMINACION → false (ya no está pendiente)", () => {
      expect(
        crearReporte(EstadoReporte.RESUELTO_CON_ELIMINACION).puedeResolverseSinEliminar(),
      ).toBe(false);
    });
  });

  describe("Desafio.puedeAprobarse() / puedeRechazarse() — FR-014, FR-015 (decisión final e irreversible)", () => {
    it("PENDIENTE → puedeAprobarse() true y puedeRechazarse() true", () => {
      const desafio = crearDesafio(EstadoDesafioPropuesto.PENDIENTE);
      expect(desafio.puedeAprobarse()).toBe(true);
      expect(desafio.puedeRechazarse()).toBe(true);
    });

    it("APROBADO → puedeAprobarse() false y puedeRechazarse() false", () => {
      const desafio = crearDesafio(EstadoDesafioPropuesto.APROBADO);
      expect(desafio.puedeAprobarse()).toBe(false);
      expect(desafio.puedeRechazarse()).toBe(false);
    });

    it("RECHAZADO → puedeAprobarse() false y puedeRechazarse() false", () => {
      const desafio = crearDesafio(EstadoDesafioPropuesto.RECHAZADO);
      expect(desafio.puedeAprobarse()).toBe(false);
      expect(desafio.puedeRechazarse()).toBe(false);
    });
  });
});
