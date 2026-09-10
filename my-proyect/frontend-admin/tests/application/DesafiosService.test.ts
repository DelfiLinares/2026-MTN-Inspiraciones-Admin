/**
 * Test de `DesafiosService`.
 *
 * Ref: tasks.md T038, contracts/openapi.yaml `GET /desafios`, `GET /desafios/{id}`,
 * `POST /desafios/{id}/aprobar`, `POST /desafios/{id}/rechazar`, spec.md FR-012..FR-016.
 *
 * Usa un `HttpClient` mockeado (sin red real). Cubre explícitamente el caso de transición
 * inválida sobre un desafío ya decidido (tasks.md T038).
 */
import { describe, expect, it, vi } from "vitest";
import { DesafiosService } from "@/application/DesafiosService";
import type { HttpClient } from "@/application/ports/HttpClient";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";

function crearHttpClientMock(overrides: Partial<HttpClient> = {}): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function crearDesafioDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "d1",
    autorId: "u1",
    titulo: "Desafío de prueba",
    descripcion: "Descripción del desafío propuesto",
    estado: EstadoDesafioPropuesto.PENDIENTE,
    fechaPropuesta: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("DesafiosService", () => {
  describe("listarDesafios (FR-012)", () => {
    it("resuelve el listado paginado/filtrado por estado contra GET /desafios", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue({
          contenido: [crearDesafioDto()],
          totalElementos: 1,
          totalPaginas: 1,
          paginaActual: 1,
        }),
      });
      const service = new DesafiosService(httpClient);

      const resultado = await service.listarDesafios({
        page: 1,
        pageSize: 20,
        estado: EstadoDesafioPropuesto.PENDIENTE,
      });

      expect(httpClient.get).toHaveBeenCalledWith("/desafios", {
        params: { page: 1, pageSize: 20, estado: EstadoDesafioPropuesto.PENDIENTE },
      });
      expect(resultado.contenido).toHaveLength(1);
      expect(resultado.contenido[0].estaPendiente()).toBe(true);
    });
  });

  describe("obtenerDetalle (FR-013)", () => {
    it("obtiene el detalle del desafío contra GET /desafios/{id}", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue(crearDesafioDto()),
      });
      const service = new DesafiosService(httpClient);

      const desafio = await service.obtenerDetalle("d1");

      expect(httpClient.get).toHaveBeenCalledWith("/desafios/d1");
      expect(desafio.id).toBe("d1");
    });
  });

  describe("aprobar (FR-014)", () => {
    it("invoca POST /desafios/{id}/aprobar y devuelve el desafío aprobado", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue(
          crearDesafioDto({ estado: EstadoDesafioPropuesto.APROBADO }),
        ),
      });
      const service = new DesafiosService(httpClient);

      const desafio = await service.aprobar("d1");

      expect(httpClient.post).toHaveBeenCalledWith("/desafios/d1/aprobar");
      expect(desafio.estado).toBe(EstadoDesafioPropuesto.APROBADO);
      expect(desafio.puedeAprobarse()).toBe(false);
    });

    it("propaga el rechazo (409) del backend ante una transición inválida (desafío ya decidido)", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockRejectedValue(new Error("409: El desafío ya no está en estado PENDIENTE")),
      });
      const service = new DesafiosService(httpClient);

      await expect(service.aprobar("d1")).rejects.toThrow(/409/);
    });
  });

  describe("rechazar (FR-015)", () => {
    it("invoca POST /desafios/{id}/rechazar y devuelve el desafío rechazado", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue(
          crearDesafioDto({ estado: EstadoDesafioPropuesto.RECHAZADO }),
        ),
      });
      const service = new DesafiosService(httpClient);

      const desafio = await service.rechazar("d1");

      expect(httpClient.post).toHaveBeenCalledWith("/desafios/d1/rechazar");
      expect(desafio.estado).toBe(EstadoDesafioPropuesto.RECHAZADO);
      expect(desafio.puedeRechazarse()).toBe(false);
    });

    it("propaga el rechazo (409) del backend ante una transición inválida (desafío ya decidido)", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockRejectedValue(new Error("409: El desafío ya no está en estado PENDIENTE")),
      });
      const service = new DesafiosService(httpClient);

      await expect(service.rechazar("d1")).rejects.toThrow(/409/);
    });
  });
});
