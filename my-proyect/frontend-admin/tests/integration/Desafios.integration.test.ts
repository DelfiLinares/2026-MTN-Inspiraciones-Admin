/**
 * Test de integración: ciclo completo aprobar/rechazar desafío contra contrato.
 *
 * Ref: tasks.md T090 (depende de T044, T086), contracts/openapi.yaml
 * `POST /desafios/{desafioId}/aprobar`, `POST /desafios/{desafioId}/rechazar`, spec.md FR-014,
 * FR-015.
 *
 * Verifica el circuito end-to-end frontend-admin -> httpClient real (`fetch`) -> mock server de
 * contrato (T086) para `DesafiosService` (T031):
 * - Aprobar un desafío PENDIENTE cambia su estado a APROBADO (FR-014).
 * - Una vez APROBADO, un segundo intento de aprobar o de rechazar es rechazado con 409 (decisión
 *   final e irreversible, Clarifications Session 2026-09-08).
 * - Rechazar un desafío PENDIENTE cambia su estado a RECHAZADO (FR-015).
 * - Una vez RECHAZADO, un segundo intento de rechazar o de aprobar es rechazado con 409.
 *
 * Requiere sesión autenticada (login real, mismo mecanismo que T087/T089), ya que todas las
 * rutas de desafíos exigen `Authorization: Bearer <token>` según el contrato.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";
import { detenerMockServer, iniciarMockServer } from "./mockServer";

const API_BASE_URL_TEST = "http://localhost:8080/api/admin";

describe("Desafios integration — aprobar/rechazar", () => {
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

  it("aprueba un desafío PENDIENTE, y una segunda aprobación o un rechazo posterior son rechazados con 409 (FR-014, decisión irreversible)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, desafiosService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    const desafioAprobado = await desafiosService.aprobar("d1");
    expect(desafioAprobado.estado).toBe(EstadoDesafioPropuesto.APROBADO);

    await expect(desafiosService.aprobar("d1")).rejects.toMatchObject({ status: 409 });
    await expect(desafiosService.rechazar("d1")).rejects.toMatchObject({ status: 409 });

    const desafioActual = await desafiosService.obtenerDetalle("d1");
    expect(desafioActual.estado).toBe(EstadoDesafioPropuesto.APROBADO);
  });

  it("rechaza un desafío PENDIENTE, y un rechazo o aprobación posterior son rechazados con 409 (FR-015, decisión irreversible)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, desafiosService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    const desafioRechazado = await desafiosService.rechazar("d1");
    expect(desafioRechazado.estado).toBe(EstadoDesafioPropuesto.RECHAZADO);

    await expect(desafiosService.rechazar("d1")).rejects.toMatchObject({ status: 409 });
    await expect(desafiosService.aprobar("d1")).rejects.toMatchObject({ status: 409 });

    const desafioActual = await desafiosService.obtenerDetalle("d1");
    expect(desafioActual.estado).toBe(EstadoDesafioPropuesto.RECHAZADO);
  });
});
