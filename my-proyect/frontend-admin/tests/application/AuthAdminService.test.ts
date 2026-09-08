/**
 * Test de `AuthAdminService`.
 *
 * Ref: tasks.md T034, contracts/openapi.yaml `POST /auth/login`, spec.md FR-001, FR-002.
 *
 * Usa un `HttpClient` mockeado (sin red real), según la Fase 3 de tasks.md.
 */
import { describe, expect, it, vi } from "vitest";
import { AuthAdminService } from "@/application/AuthAdminService";
import type { HttpClient } from "@/application/ports/HttpClient";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

function crearHttpClientMock(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("AuthAdminService", () => {
  describe("login", () => {
    it("login exitoso: guarda y devuelve la SesionAdministrativa con rol ADMIN", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue({
          token: "token-opaco",
          expiraEn: "2026-01-01T12:00:00Z",
          usuario: {
            id: "u1",
            nombre: "Admin de Prueba",
            email: "admin@example.com",
            rol: RolUsuario.ADMIN,
            estadoCuenta: EstadoCuentaUsuario.ACTIVO,
            fechaRegistro: "2025-01-01T00:00:00Z",
          },
        }),
      });
      const service = new AuthAdminService(httpClient);

      const sesion = await service.login("admin@example.com", "password123");

      expect(httpClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "admin@example.com",
        password: "password123",
      });
      expect(sesion.usuario.rol).toBe(RolUsuario.ADMIN);
      expect(sesion.tienePermisoDeAdministrador()).toBe(true);
      expect(service.obtenerSesionActual()).toBe(sesion);
    });

    it("rechazo de rol no-ADMIN: el backend responde 403 y el servicio propaga el error", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockRejectedValue(new Error("403: Usuario válido pero sin rol ADMIN")),
      });
      const service = new AuthAdminService(httpClient);

      await expect(service.login("usuario@example.com", "password123")).rejects.toThrow(
        /403/,
      );
      expect(service.obtenerSesionActual()).toBeNull();
    });

    it("credenciales inválidas: el backend responde 401 y el servicio propaga el error", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockRejectedValue(new Error("401: Credenciales inválidas")),
      });
      const service = new AuthAdminService(httpClient);

      await expect(service.login("admin@example.com", "incorrecta")).rejects.toThrow(/401/);
      expect(service.obtenerSesionActual()).toBeNull();
    });
  });

  describe("obtenerSesionActual", () => {
    it("devuelve null si no hubo login previo", () => {
      const service = new AuthAdminService(crearHttpClientMock());
      expect(service.obtenerSesionActual()).toBeNull();
    });
  });
});
