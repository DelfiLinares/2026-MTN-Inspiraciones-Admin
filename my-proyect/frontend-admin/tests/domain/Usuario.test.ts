/**
 * Test de reglas de dominio de `Usuario`.
 *
 * Ref: tasks.md T013, data-model.md → Entidades → Usuario, spec.md FR-005, FR-006, FR-007,
 * FR-029, US3.
 *
 * TDD: este test se escribe ANTES de la entidad `Usuario` (T019) y debe fallar hasta que esta
 * exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

function crearUsuario(overrides: Partial<ConstructorParameters<typeof Usuario>[0]> = {}): Usuario {
  return new Usuario({
    id: "u1",
    nombre: "Usuario de Prueba",
    email: "usuario@example.com",
    rol: RolUsuario.USER,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: new Date("2026-01-01"),
    ...overrides,
  });
}

describe("Usuario", () => {
  describe("puedeSerPromovidoAAdmin", () => {
    it("es true si rol === USER y estadoCuenta === ACTIVO", () => {
      const usuario = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      expect(usuario.puedeSerPromovidoAAdmin()).toBe(true);
    });

    it("es false si rol === ADMIN", () => {
      const usuario = crearUsuario({ rol: RolUsuario.ADMIN, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      expect(usuario.puedeSerPromovidoAAdmin()).toBe(false);
    });

    it("es false si estadoCuenta !== ACTIVO", () => {
      const baneado = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.BANEADO });
      const eliminado = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.ELIMINADO });
      expect(baneado.puedeSerPromovidoAAdmin()).toBe(false);
      expect(eliminado.puedeSerPromovidoAAdmin()).toBe(false);
    });
  });

  describe("puedeSerBaneado (FR-005, FR-029)", () => {
    it("es true si rol === USER y estadoCuenta === ACTIVO", () => {
      const usuario = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      expect(usuario.puedeSerBaneado()).toBe(true);
    });

    it("es false si rol === ADMIN, sin excepción (ni siquiera por otro ADMIN)", () => {
      const admin = crearUsuario({ rol: RolUsuario.ADMIN, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      expect(admin.puedeSerBaneado()).toBe(false);
    });

    it("es false si estadoCuenta !== ACTIVO", () => {
      const usuario = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.BANEADO });
      expect(usuario.puedeSerBaneado()).toBe(false);
    });
  });

  describe("puedeSerEliminado (FR-006, FR-029)", () => {
    it("es true si rol === USER y estadoCuenta !== ELIMINADO", () => {
      const activo = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      const baneado = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.BANEADO });
      expect(activo.puedeSerEliminado()).toBe(true);
      expect(baneado.puedeSerEliminado()).toBe(true);
    });

    it("es false si rol === ADMIN, sin excepción", () => {
      const admin = crearUsuario({ rol: RolUsuario.ADMIN, estadoCuenta: EstadoCuentaUsuario.ACTIVO });
      expect(admin.puedeSerEliminado()).toBe(false);
    });

    it("es false si estadoCuenta === ELIMINADO", () => {
      const usuario = crearUsuario({ rol: RolUsuario.USER, estadoCuenta: EstadoCuentaUsuario.ELIMINADO });
      expect(usuario.puedeSerEliminado()).toBe(false);
    });
  });

  describe("esElMismoQue", () => {
    it("es true cuando el id coincide con el del otro usuario", () => {
      const usuario = crearUsuario({ id: "u1" });
      expect(usuario.esElMismoQue("u1")).toBe(true);
    });

    it("es false cuando el id no coincide", () => {
      const usuario = crearUsuario({ id: "u1" });
      expect(usuario.esElMismoQue("u2")).toBe(false);
    });
  });
});
