/**
 * Test de `DashboardService`.
 *
 * Ref: tasks.md T035, contracts/openapi.yaml `GET /dashboard`, spec.md FR-003.
 *
 * Usa un `HttpClient` mockeado (sin red real), según la Fase 3 de tasks.md.
 */
import { describe, expect, it, vi } from "vitest";
import { DashboardService } from "@/application/DashboardService";
import type { HttpClient } from "@/application/ports/HttpClient";

function crearHttpClientMock(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

describe("DashboardService", () => {
  describe("obtenerIndicadores", () => {
    it("obtiene y devuelve los 7 indicadores del dashboard desde GET /dashboard", async () => {
      const indicadores = {
        reportesPendientes: 12,
        usuariosActivos: 120,
        desafiosPendientes: 8,
        publicacionesActivas: 450,
        publicacionesEliminadas: 15,
        usuariosBaneados: 5,
        desafiosDecididos: 33,
      };

      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue(indicadores),
      });

      const service = new DashboardService(httpClient);
      const resultado = await service.obtenerIndicadores();

      expect(httpClient.get).toHaveBeenCalledWith("/dashboard");
      expect(resultado).toEqual(indicadores);
    });

    it("propaga errores de infraestructura (por ejemplo 401/403)", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockRejectedValue(new Error("403: Sin permiso")),
      });

      const service = new DashboardService(httpClient);

      await expect(service.obtenerIndicadores()).rejects.toThrow(/403/);
    });
  });
});
