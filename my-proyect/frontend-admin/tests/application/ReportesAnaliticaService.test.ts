/**
 * Test de `ReportesAnaliticaService`.
 *
 * Ref: tasks.md T039, contracts/openapi.yaml `GET /reportes-analiticas`,
 * `POST /reportes-analiticas/exportaciones`,
 * `GET /reportes-analiticas/exportaciones/{id}/descarga`, spec.md FR-017..FR-019, FR-028.
 *
 * `iniciarExportacion` es SÍNCRONO (Clarifications Session 2026-09-08, pregunta 3): cubre el
 * resultado exitoso y el resultado fallido (mensaje "Error: Reporte no generado."), además de
 * listar y descargar.
 */
import { describe, expect, it, vi } from "vitest";
import { ReportesAnaliticaService } from "@/application/ReportesAnaliticaService";
import type { HttpClient } from "@/application/ports/HttpClient";

function crearHttpClientMock(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function crearReporteAnaliticaDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "r1",
    tipo: "REPORTES_PENDIENTES",
    datosAgregados: { total: 5 },
    ...overrides,
  };
}

describe("ReportesAnaliticaService", () => {
  describe("listarReportesAnaliticas (FR-017)", () => {
    it("resuelve el listado contra GET /reportes-analiticas", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue([crearReporteAnaliticaDto()]),
      });
      const service = new ReportesAnaliticaService(httpClient);

      const resultado = await service.listarReportesAnaliticas();

      expect(httpClient.get).toHaveBeenCalledWith("/reportes-analiticas");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].tieneDatos()).toBe(true);
    });
  });

  describe("iniciarExportacion (FR-018, FR-028, exportación síncrona)", () => {
    it("devuelve un resultado síncrono exitoso con urlDescarga", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue({
          reporteAnaliticaId: "r1",
          exitoso: true,
          urlDescarga: "https://example.com/descargas/r1.csv",
          mensajeError: null,
        }),
      });
      const service = new ReportesAnaliticaService(httpClient);

      const exportacion = await service.iniciarExportacion("r1");

      expect(httpClient.post).toHaveBeenCalledWith("/reportes-analiticas/exportaciones", {
        reporteAnaliticaId: "r1",
      });
      expect(exportacion.estaListoParaDescargar()).toBe(true);
      expect(exportacion.fallo()).toBe(false);
      expect(exportacion.urlDescarga).toBe("https://example.com/descargas/r1.csv");
    });

    it("devuelve un resultado síncrono fallido con el mensaje 'Error: Reporte no generado.'", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue({
          reporteAnaliticaId: "r1",
          exitoso: false,
          urlDescarga: null,
          mensajeError: "Error: Reporte no generado.",
        }),
      });
      const service = new ReportesAnaliticaService(httpClient);

      const exportacion = await service.iniciarExportacion("r1");

      expect(httpClient.post).toHaveBeenCalledWith("/reportes-analiticas/exportaciones", {
        reporteAnaliticaId: "r1",
      });
      expect(exportacion.fallo()).toBe(true);
      expect(exportacion.estaListoParaDescargar()).toBe(false);
      expect(exportacion.mensajeError).toBe("Error: Reporte no generado.");
    });
  });

  describe("descargarExportacion (FR-019)", () => {
    it("obtiene el archivo contra GET /reportes-analiticas/exportaciones/{id}/descarga", async () => {
      const blobEsperado = new Blob(["contenido"], { type: "text/csv" });
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue(blobEsperado),
      });
      const service = new ReportesAnaliticaService(httpClient);

      const resultado = await service.descargarExportacion("e1");

      expect(httpClient.get).toHaveBeenCalledWith(
        "/reportes-analiticas/exportaciones/e1/descarga",
      );
      expect(resultado).toBe(blobEsperado);
    });
  });
});
