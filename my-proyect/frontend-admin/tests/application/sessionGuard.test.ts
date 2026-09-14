/**
 * Test de `sessionGuard`.
 *
 * Ref: tasks.md T046 (depende de T043), spec.md FR-027, research.md §2.
 *
 * Cubre la cancelación de una acción sensible (eliminar, banear, promover, aprobar/rechazar
 * desafío) ante sesión expirada: tanto cuando la sesión ya expiró antes de ejecutar la acción,
 * como cuando la acción falla con 401/403 durante su ejecución. En ambos casos se espera que la
 * acción NO se aplique (o su resultado no se propague), que la sesión se limpie y que se notifique
 * `onSesionExpirada` con el mensaje explícito exigido por FR-027.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MENSAJE_SESION_EXPIRADA,
  SesionExpiradaError,
  ejecutarAccionSensible,
} from "@/infrastructure/sessionGuard";
import { HttpForbiddenError, HttpUnauthorizedError, getAuthToken } from "@/infrastructure/httpClient";
import { guardarSesion, limpiarSesion, obtenerSesion } from "@/infrastructure/sessionManager";
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

describe("sessionGuard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    limpiarSesion();
  });

  describe("sesión ya expirada antes de ejecutar la acción", () => {
    it("cancela la acción sin invocarla, limpia la sesión y notifica onSesionExpirada", async () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));
      const accion = vi.fn().mockResolvedValue("resultado");
      const onSesionExpirada = vi.fn();

      await expect(
        ejecutarAccionSensible(accion, {
          onSesionExpirada,
          ahora: () => new Date("2026-01-01T02:00:00Z"),
        }),
      ).rejects.toBeInstanceOf(SesionExpiradaError);

      expect(accion).not.toHaveBeenCalled();
      expect(obtenerSesion()).toBeNull();
      expect(getAuthToken()).toBeNull();
      expect(onSesionExpirada).toHaveBeenCalledWith(MENSAJE_SESION_EXPIRADA);
    });

    it("cancela la acción cuando no hay ninguna sesión almacenada", async () => {
      const accion = vi.fn().mockResolvedValue("resultado");
      const onSesionExpirada = vi.fn();

      await expect(ejecutarAccionSensible(accion, { onSesionExpirada })).rejects.toBeInstanceOf(
        SesionExpiradaError,
      );

      expect(accion).not.toHaveBeenCalled();
      expect(onSesionExpirada).toHaveBeenCalledWith(MENSAJE_SESION_EXPIRADA);
    });
  });

  describe("sesión expira durante la ejecución de la acción (401/403)", () => {
    it("cancela la acción ante HttpUnauthorizedError, limpia la sesión y notifica", async () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));
      const accion = vi.fn().mockRejectedValue(new HttpUnauthorizedError(null));
      const onSesionExpirada = vi.fn();

      await expect(
        ejecutarAccionSensible(accion, {
          onSesionExpirada,
          ahora: () => new Date("2026-01-01T00:30:00Z"),
        }),
      ).rejects.toBeInstanceOf(SesionExpiradaError);

      expect(accion).toHaveBeenCalledTimes(1);
      expect(obtenerSesion()).toBeNull();
      expect(onSesionExpirada).toHaveBeenCalledWith(MENSAJE_SESION_EXPIRADA);
    });

    it("cancela la acción ante HttpForbiddenError, limpia la sesión y notifica", async () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));
      const accion = vi.fn().mockRejectedValue(new HttpForbiddenError(null));
      const onSesionExpirada = vi.fn();

      await expect(
        ejecutarAccionSensible(accion, {
          onSesionExpirada,
          ahora: () => new Date("2026-01-01T00:30:00Z"),
        }),
      ).rejects.toBeInstanceOf(SesionExpiradaError);

      expect(accion).toHaveBeenCalledTimes(1);
      expect(obtenerSesion()).toBeNull();
      expect(onSesionExpirada).toHaveBeenCalledWith(MENSAJE_SESION_EXPIRADA);
    });
  });

  describe("sesión válida durante toda la ejecución", () => {
    it("ejecuta la acción normalmente y propaga su resultado sin tocar la sesión", async () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));
      const accion = vi.fn().mockResolvedValue("resultado-ok");
      const onSesionExpirada = vi.fn();

      const resultado = await ejecutarAccionSensible(accion, {
        onSesionExpirada,
        ahora: () => new Date("2026-01-01T00:30:00Z"),
      });

      expect(resultado).toBe("resultado-ok");
      expect(onSesionExpirada).not.toHaveBeenCalled();
      expect(obtenerSesion()).not.toBeNull();
    });

    it("propaga errores de negocio no relacionados con la sesión (p. ej. 409) sin cancelarlos como expiración", async () => {
      guardarSesion(crearSesion(new Date("2026-01-01T01:00:00Z")));
      const errorDeNegocio = new Error("409: transición inválida");
      const accion = vi.fn().mockRejectedValue(errorDeNegocio);
      const onSesionExpirada = vi.fn();

      await expect(
        ejecutarAccionSensible(accion, {
          onSesionExpirada,
          ahora: () => new Date("2026-01-01T00:30:00Z"),
        }),
      ).rejects.toBe(errorDeNegocio);

      expect(onSesionExpirada).not.toHaveBeenCalled();
      expect(obtenerSesion()).not.toBeNull();
    });
  });
});
