/**
 * Test de integración de autenticación admin contra contrato.
 *
 * Ref: tasks.md T087 (depende de T044, T086), contracts/openapi.yaml `POST /auth/login`,
 * spec.md FR-001, FR-002.
 *
 * Verifica el circuito end-to-end frontend-admin -> httpClient real (`fetch`) -> mock server de
 * contrato (T086):
 * - Login exitoso para credenciales admin válidas (FR-001), con sesión mapeada a dominio
 *   `SesionAdministrativa`.
 * - Rechazo para credenciales inválidas con código 401 (FR-001).
 * - El resultado exitoso implica rol ADMIN efectivo en sesión (`tienePermisoDeAdministrador`,
 *   FR-002), validando el comportamiento esperado del contrato para este endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { detenerMockServer, iniciarMockServer } from "./mockServer";

const API_BASE_URL_TEST = "http://localhost:8080/api/admin";

describe("AuthAdmin integration — POST /auth/login", () => {
  beforeEach(() => {
    // Ref: T005/T040: `config.apiBaseUrl` se lee al inicializar `httpClient`; se fija antes de
    // importar `serviceFactory` para que la URL construida coincida con el server mock de contrato.
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", API_BASE_URL_TEST);
    iniciarMockServer();
  });

  afterEach(() => {
    detenerMockServer();
    vi.unstubAllEnvs();
  });

  it("autentica correctamente a un administrador y guarda la sesión actual (FR-001, FR-002)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService } = crearServiceFactory();

    const sesion = await authAdminService.login("admin@example.com", "admin123");

    expect(sesion.token).toBe("token-mock-valido");
    expect(sesion.usuario.rol).toBe(RolUsuario.ADMIN);
    expect(sesion.tienePermisoDeAdministrador()).toBe(true);
    expect(sesion.expiraEn).toBeInstanceOf(Date);

    expect(authAdminService.obtenerSesionActual()).toBe(sesion);
  });

  it("rechaza credenciales inválidas devolviendo error HTTP 401 (FR-001)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService } = crearServiceFactory();

    await expect(authAdminService.login("admin@example.com", "password-invalida")).rejects.toMatchObject({
      status: 401,
    });

    expect(authAdminService.obtenerSesionActual()).toBeNull();
  });
});
