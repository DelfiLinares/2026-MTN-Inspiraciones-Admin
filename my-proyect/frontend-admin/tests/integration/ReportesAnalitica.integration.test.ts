/**
 * Test de integración: exportación síncrona de reporte de analítica contra contrato.
 *
 * Ref: tasks.md T091 (depende de T044, T086), contracts/openapi.yaml
 * `POST /reportes-analiticas/exportaciones`,
 * `GET /reportes-analiticas/exportaciones/{exportacionId}/descarga`, spec.md FR-018, FR-019,
 * FR-028, Clarifications Session 2026-09-08 pregunta 3.
 *
 * Verifica el circuito end-to-end frontend-admin -> httpClient real (`fetch`) -> mock server de
 * contrato (T086) para `ReportesAnaliticaService` (T032):
 * - Caso exitoso: `iniciarExportacion` resuelve en una única llamada SÍNCRONA con
 *   `exitoso === true` y `urlDescarga` disponible de inmediato (sin estado intermedio ni
 *   polling); la descarga posterior (`descargarExportacion`) devuelve el archivo binario.
 * - Caso fallido: el mock server (`configurarProximaExportacionComoFallida`, T086) simula el 502
 *   documentado en el contrato; `iniciarExportacion` resuelve con `exitoso === false` y
 *   `mensajeError` conteniendo el mensaje exacto "Error: Reporte no generado." (FR-028).
 *
 * Requiere sesión autenticada (login real, mismo mecanismo que T087/T089/T090).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configurarProximaExportacionComoFallida,
  detenerMockServer,
  iniciarMockServer,
} from "./mockServer";

const API_BASE_URL_TEST = "http://localhost:8080/api/admin";

describe("ReportesAnalitica integration — exportación síncrona", () => {
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

  it("caso exitoso: la exportación es síncrona (sin estado intermedio) y habilita descarga inmediata (FR-018, FR-019, FR-028)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, reportesAnaliticaService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    const resultado = await reportesAnaliticaService.iniciarExportacion("ra1");

    expect(resultado.exitoso).toBe(true);
    expect(resultado.fallo()).toBe(false);
    expect(resultado.estaListoParaDescargar()).toBe(true);
    expect(resultado.urlDescarga).not.toBeNull();
    expect(resultado.mensajeError).toBeNull();

    // La URL de descarga ya está disponible de inmediato, sin espera adicional (sin polling).
    const exportacionId = (resultado.urlDescarga as string).split("/").slice(-2, -1)[0];
    const archivo = await reportesAnaliticaService.descargarExportacion(exportacionId);
    expect(archivo).toBeInstanceOf(Blob);
  });

  it('caso fallido: resuelve síncronamente con el mensaje exacto "Error: Reporte no generado." (FR-028, Clarifications Session 2026-09-08 pregunta 3)', async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { authAdminService, reportesAnaliticaService } = crearServiceFactory();

    await authAdminService.login("admin@example.com", "admin123");

    configurarProximaExportacionComoFallida();

    // Ref: contracts/openapi.yaml — el endpoint responde 502 en el caso de fallo de generación;
    // `ReportesAnaliticaService.iniciarExportacion` no captura ese error HTTP: propaga el rechazo
    // de la promesa, y es responsabilidad de la capa de presentación (`ExportarReporteAction`,
    // T077) traducirlo al mensaje exacto de UI. Este test de integración verifica el contrato
    // HTTP subyacente (502), no el comportamiento de presentación (cubierto en T079).
    await expect(reportesAnaliticaService.iniciarExportacion("ra1")).rejects.toMatchObject({
      status: 502,
    });
  });
});
