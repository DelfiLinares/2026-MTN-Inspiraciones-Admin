/**
 * Test de `sessionManager`.
 *
 * Ref: tasks.md T045 (depende de T041), spec.md FR-002, FR-020, FR-027, research.md §2.
 *
 * Cubre: persistencia/recuperación de la sesión, validez (`esValida`) y expiración respecto de
 * una fecha dada, limpieza de sesión, y sincronización del token Bearer usado por `httpClient`
 * (T040) en cada operación de guardado/limpieza.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  esValida,
  guardarSesion,
  limpiarSesion,
  obtenerSesion,
} from "@/infrastructure/sessionManager";
import { getAuthToken } from "@/infrastructure/httpClient";
import { SesionAdministrativa } from "@/domain/SesionAdministrativa";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

function crearSesion(expiraEn: Date): SesionAdministrativa {
  return new SesionAdministrativa({
    token: "token-abc",
    expiraEn,
    usuario: new Usuario({
      id: "u1",
      nombre: "Admin",
      email: "admin@example.com",
      rol: RolUsuario.ADMIN,
      estadoCuenta: EstadoCuentaUsuario.ACTIVO,
      fechaRegistro: new Date("2026-01-01T00:00:00Z"),
    }),
  });
}

describe("sessionManager", () => {
  beforeEach(() => {
    sessionStorage.clear();
    limpiarSesion();
  });

  describe("guardarSesion / obtenerSesion", () => {
    it("persiste y recupera la sesión con sus datos completos", () => {
      const sesion = crearSesion(new Date("2026-01-01T01:00:00Z"));

      guardarSesion(sesion);
      const recuperada = obtenerSesion();

      expect(recuperada).not.toBeNull();
      expect(recuperada?.token).toBe("token-abc");
      expect(recuperada?.usuario.id).toBe("u1");
      expect(recuperada?.usuario.rol).toBe(RolUsuario.ADMIN);
      expect(recuperada?.expiraEn.toISOString()).toBe("2026-01-01T01:00:00.000Z");
    });

    it("sincroniza el token Bearer usado por httpClient al guardar", () => {
      const sesion = crearSesion(new Date("2026-01-01T01:00:00Z"));

      guardarSesion(sesion);

      expect(getAuthToken()).toBe("token-abc");
    });

    it("devuelve null si no hay sesión almacenada", () => {
      expect(obtenerSesion()).toBeNull();
    });

    it("devuelve null si el contenido almacenado está corrupto", () => {
      sessionStorage.setItem("inspiraciones-admin.sesion", "{json-invalido");

      expect(obtenerSesion()).toBeNull();
    });
  });

  describe("esValida", () => {
    it("es true cuando la fecha actual es anterior a la expiración", () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));

      expect(esValida(new Date("2026-01-01T00:30:00Z"))).toBe(true);
    });

    it("es false cuando la fecha actual es posterior a la expiración (sesión expirada)", () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));

      expect(esValida(new Date("2026-01-01T02:00:00Z"))).toBe(false);
    });

    it("es false cuando no hay sesión almacenada", () => {
      expect(esValida(new Date("2026-01-01T00:30:00Z"))).toBe(false);
    });
  });

  describe("limpiarSesion", () => {
    it("elimina la sesión almacenada y limpia el token de httpClient", () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));

      limpiarSesion();

      expect(obtenerSesion()).toBeNull();
      expect(getAuthToken()).toBeNull();
    });
  });
});
