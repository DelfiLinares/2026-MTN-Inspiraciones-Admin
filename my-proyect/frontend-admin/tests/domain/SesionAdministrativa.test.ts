/**
 * Test de reglas de dominio de `SesionAdministrativa`.
 *
 * Ref: tasks.md T017, data-model.md → Entidades → SesionAdministrativa, spec.md FR-002, FR-020.
 *
 * TDD: este test se escribe ANTES de la entidad `SesionAdministrativa` (T023) y debe fallar
 * hasta que esta exista con las reglas descriptas en data-model.md.
 */
import { describe, expect, it } from "vitest";
import { SesionAdministrativa } from "@/domain/SesionAdministrativa";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

function crearUsuario(rol: RolUsuario): Usuario {
  return new Usuario({
    id: "u1",
    nombre: "Usuario de Prueba",
    email: "usuario@example.com",
    rol,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: new Date("2026-01-01"),
  });
}

function crearSesion(
  overrides: Partial<ConstructorParameters<typeof SesionAdministrativa>[0]> = {},
): SesionAdministrativa {
  return new SesionAdministrativa({
    usuario: crearUsuario(RolUsuario.ADMIN),
    token: "token-opaco",
    expiraEn: new Date("2026-01-01T12:00:00Z"),
    ...overrides,
  });
}

describe("SesionAdministrativa", () => {
  describe("esValida", () => {
    it("es true si expiraEn > fechaActual", () => {
      const sesion = crearSesion({ expiraEn: new Date("2026-01-01T12:00:00Z") });
      expect(sesion.esValida(new Date("2026-01-01T11:00:00Z"))).toBe(true);
    });

    it("es false si expiraEn <= fechaActual", () => {
      const sesion = crearSesion({ expiraEn: new Date("2026-01-01T12:00:00Z") });
      expect(sesion.esValida(new Date("2026-01-01T12:00:00Z"))).toBe(false);
      expect(sesion.esValida(new Date("2026-01-01T13:00:00Z"))).toBe(false);
    });
  });

  describe("tienePermisoDeAdministrador (FR-002, FR-020)", () => {
    it("es true si usuario.rol === ADMIN", () => {
      const sesion = crearSesion({ usuario: crearUsuario(RolUsuario.ADMIN) });
      expect(sesion.tienePermisoDeAdministrador()).toBe(true);
    });

    it("es false si usuario.rol === USER", () => {
      const sesion = crearSesion({ usuario: crearUsuario(RolUsuario.USER) });
      expect(sesion.tienePermisoDeAdministrador()).toBe(false);
    });
  });
});
