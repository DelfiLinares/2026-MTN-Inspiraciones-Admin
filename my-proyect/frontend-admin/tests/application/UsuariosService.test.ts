/**
 * Test de `UsuariosService`.
 *
 * Ref: tasks.md T036, contracts/openapi.yaml `GET /usuarios`, `POST /usuarios/{id}/banear`,
 * `DELETE /usuarios/{id}`, `POST /usuarios/{id}/promover`, spec.md FR-004..FR-007, FR-024, FR-029.
 *
 * Usa un `HttpClient` mockeado (sin red real). Cubre explícitamente el caso de permisos: "un USER
 * no puede promover" (tasks.md T033/T036).
 */
import { describe, expect, it, vi } from "vitest";
import { UsuariosService } from "@/application/UsuariosService";
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

function crearUsuarioDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "u1",
    nombre: "Usuario de Prueba",
    email: "usuario@example.com",
    rol: RolUsuario.USER,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

async function crearAuthAdminServiceConSesion(rol: RolUsuario): Promise<AuthAdminService> {
  const authAdminService = new AuthAdminService(
    crearHttpClientMock({
      post: vi.fn().mockResolvedValue({
        token: "token-opaco",
        expiraEn: "2026-01-01T12:00:00Z",
        usuario: crearUsuarioDto({ id: "actor1", rol }),
      }),
    }),
  );
  await authAdminService.login("actor@example.com", "password123");
  return authAdminService;
}

describe("UsuariosService", () => {
  describe("buscarUsuarios (FR-004, FR-024)", () => {
    it("resuelve la búsqueda paginada/filtrada contra GET /usuarios", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue({
          contenido: [crearUsuarioDto()],
          totalElementos: 1,
          totalPaginas: 1,
          paginaActual: 1,
        }),
      });
      const authAdminService = await crearAuthAdminServiceConSesion(RolUsuario.ADMIN);
      const service = new UsuariosService(httpClient, authAdminService);

      const resultado = await service.buscarUsuarios({ page: 1, pageSize: 20, texto: "prueba" });

      expect(httpClient.get).toHaveBeenCalledWith("/usuarios", {
        params: {
          page: 1,
          pageSize: 20,
          texto: "prueba",
          rol: undefined,
          estadoCuenta: undefined,
        },
      });
      expect(resultado.contenido).toHaveLength(1);
      expect(resultado.totalElementos).toBe(1);
    });
  });

  describe("banear (FR-005, FR-029)", () => {
    it("invoca POST /usuarios/{id}/banear y devuelve el usuario baneado", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue(
          crearUsuarioDto({ estadoCuenta: EstadoCuentaUsuario.BANEADO }),
        ),
      });
      const authAdminService = await crearAuthAdminServiceConSesion(RolUsuario.ADMIN);
      const service = new UsuariosService(httpClient, authAdminService);

      const resultado = await service.banear("u1");

      expect(httpClient.post).toHaveBeenCalledWith("/usuarios/u1/banear");
      expect(resultado.estadoCuenta).toBe(EstadoCuentaUsuario.BANEADO);
    });
  });

  describe("eliminar (FR-006, FR-029)", () => {
    it("invoca DELETE /usuarios/{id}", async () => {
      const httpClient = crearHttpClientMock({ delete: vi.fn().mockResolvedValue(undefined) });
      const authAdminService = await crearAuthAdminServiceConSesion(RolUsuario.ADMIN);
      const service = new UsuariosService(httpClient, authAdminService);

      await service.eliminar("u1");

      expect(httpClient.delete).toHaveBeenCalledWith("/usuarios/u1");
    });
  });

  describe("promover (FR-007)", () => {
    it("invoca POST /usuarios/{id}/promover cuando el actor autenticado tiene rol ADMIN", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue(crearUsuarioDto({ rol: RolUsuario.ADMIN })),
      });
      const authAdminService = await crearAuthAdminServiceConSesion(RolUsuario.ADMIN);
      const service = new UsuariosService(httpClient, authAdminService);

      const resultado = await service.promover("u1");

      expect(httpClient.post).toHaveBeenCalledWith("/usuarios/u1/promover");
      expect(resultado.rol).toBe(RolUsuario.ADMIN);
    });

    it("un USER no puede promover: rechaza sin llamar al backend si el actor no es ADMIN", async () => {
      const httpClient = crearHttpClientMock({ post: vi.fn() });
      const authAdminService = await crearAuthAdminServiceConSesion(RolUsuario.USER);
      const service = new UsuariosService(httpClient, authAdminService);

      await expect(service.promover("u1")).rejects.toThrow(/ADMIN/);
      expect(httpClient.post).not.toHaveBeenCalledWith("/usuarios/u1/promover");
    });

    it("rechaza si no hay sesión autenticada", async () => {
      const httpClient = crearHttpClientMock({ post: vi.fn() });
      const authAdminServiceSinSesion = new AuthAdminService(crearHttpClientMock());
      const service = new UsuariosService(httpClient, authAdminServiceSinSesion);

      await expect(service.promover("u1")).rejects.toThrow(/ADMIN/);
      expect(httpClient.post).not.toHaveBeenCalledWith("/usuarios/u1/promover");
    });
  });
});
