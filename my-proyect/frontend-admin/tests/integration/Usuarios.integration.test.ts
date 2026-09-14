/**
 * Test de integración: ciclo completo banear/eliminar/promover usuario contra contrato.
 *
 * Ref: tasks.md T089 (depende de T044, T086), contracts/openapi.yaml
 * `POST /usuarios/{usuarioId}/banear`, `DELETE /usuarios/{usuarioId}`,
 * `POST /usuarios/{usuarioId}/promover`, spec.md FR-005, FR-006, FR-007.
 *
 * Verifica el circuito end-to-end frontend-admin -> httpClient real (`fetch`) -> mock server de
 * contrato (T086) para `UsuariosService` (T029/T033):
 * - Ciclo feliz completo sobre un usuario USER: banear -> promover -> intento de eliminar ya con
 *   rol ADMIN, rechazado 409 (FR-029: un usuario con rol ADMIN nunca puede ser eliminado, sin
 *   excepción, incluso si llegó a ADMIN durante el propio ciclo).
 * - Rechazo 409 al intentar banear/eliminar directamente a un usuario que ya es ADMIN (FR-029).
 * - Rechazo 409 al intentar promover a un usuario que ya tiene rol ADMIN (FR-007).
 *
 * `promover` requiere una sesión ADMIN activa en `AuthAdminService` (T033): se hace login real
 * contra el contrato (mismo mecanismo que T087) antes de ejercitar el ciclo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";
import { detenerMockServer, iniciarMockServer } from "./mockServer";

const API_BASE_URL_TEST = "http://localhost:8080/api/admin";

describe("Usuarios integration — banear/eliminar/promover", () => {
  beforeEach(() => {
    // Ref: T005/T040 — `config.apiBaseUrl` se lee al construir `httpClient`; se fija antes de
    // importar `serviceFactory` para que apunte al mock server de contrato.
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", API_BASE_URL_TEST);
    iniciarMockServer();
  });

  afterEach(() => {
    detenerMockServer();
    vi.unstubAllEnvs();
  });

  it("ciclo completo: banear -> promover -> eliminar rechazado por rol ADMIN sobreviniente (FR-005, FR-006, FR-007, FR-029)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, usuariosService } = crearServiceFactory();

    // Sesión ADMIN requerida por UsuariosService.promover (T033, regla de permiso de ejecución).
    await authAdminService.login("admin@example.com", "admin123");

    const usuarioBaneado = await usuariosService.banear("u2");
    expect(usuarioBaneado.estadoCuenta).toBe(EstadoCuentaUsuario.BANEADO);
    expect(usuarioBaneado.rol).toBe(RolUsuario.USER);

    const usuarioPromovido = await usuariosService.promover("u2");
    expect(usuarioPromovido.rol).toBe(RolUsuario.ADMIN);

    // FR-029: ahora que "u2" es ADMIN, ninguna eliminación puede proceder, sin excepción.
    await expect(usuariosService.eliminar("u2")).rejects.toMatchObject({ status: 409 });
  });

  it("rechaza banear a un usuario que ya tiene rol ADMIN, incluso sin haber sido promovido en este ciclo (FR-005, FR-029)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, usuariosService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    await expect(usuariosService.banear("u1")).rejects.toMatchObject({ status: 409 });
  });

  it("rechaza eliminar a un usuario que ya tiene rol ADMIN (FR-006, FR-029)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, usuariosService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    await expect(usuariosService.eliminar("u1")).rejects.toMatchObject({ status: 409 });
  });

  it("rechaza promover a un usuario que ya tiene rol ADMIN (FR-007)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, usuariosService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    await expect(usuariosService.promover("u1")).rejects.toMatchObject({ status: 409 });
  });
});
