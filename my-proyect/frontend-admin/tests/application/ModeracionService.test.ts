/**
 * Test de `ModeracionService`.
 *
 * Ref: tasks.md T037, contracts/openapi.yaml `GET /publicaciones/reportadas`,
 * `GET /reportes/{id}`, `DELETE /publicaciones/{id}`, `POST /reportes/{id}/resolver-sin-eliminar`,
 * spec.md FR-008..FR-011, FR-024..FR-026.
 *
 * Usa un `HttpClient` mockeado (sin red real), según la Fase 3 de tasks.md.
 */
import { describe, expect, it, vi } from "vitest";
import { ModeracionService } from "@/application/ModeracionService";
import type { HttpClient } from "@/application/ports/HttpClient";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";
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

function crearReporteDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "r1",
    publicacionId: "p1",
    reportanteId: "u2",
    motivo: MotivoReporte.SPAM,
    estado: EstadoReporte.PENDIENTE,
    fechaCreacion: "2026-01-01T00:00:00Z",
    prioridad: "MEDIA",
    ...overrides,
  };
}

function crearPublicacionDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "p1",
    autorId: "u1",
    titulo: "Publicación de prueba",
    estado: EstadoPublicacion.REPORTADA,
    fechaCreacion: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function crearReportanteDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "u2",
    nombre: "Reportante de Prueba",
    email: "reportante@example.com",
    rol: RolUsuario.USER,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ModeracionService", () => {
  describe("listarPublicacionesReportadas (FR-008, FR-024, FR-025)", () => {
    it("resuelve el listado paginado/filtrado contra GET /publicaciones/reportadas", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue({
          contenido: [crearReporteDto()],
          totalElementos: 1,
          totalPaginas: 1,
          paginaActual: 1,
        }),
      });
      const service = new ModeracionService(httpClient);

      const resultado = await service.listarPublicacionesReportadas({
        page: 1,
        pageSize: 20,
        motivo: MotivoReporte.SPAM,
        estadoReporte: EstadoReporte.PENDIENTE,
        ordenarPor: "antiguedad",
      });

      expect(httpClient.get).toHaveBeenCalledWith("/publicaciones/reportadas", {
        params: {
          page: 1,
          pageSize: 20,
          motivo: MotivoReporte.SPAM,
          estadoReporte: EstadoReporte.PENDIENTE,
          ordenarPor: "antiguedad",
        },
      });
      expect(resultado.contenido).toHaveLength(1);
      expect(resultado.contenido[0].estaPendiente()).toBe(true);
    });
  });

  describe("obtenerDetalleReporte (FR-009)", () => {
    it("obtiene el detalle del reporte junto a la publicación y el reportante", async () => {
      const httpClient = crearHttpClientMock({
        get: vi.fn().mockResolvedValue({
          ...crearReporteDto(),
          publicacion: crearPublicacionDto(),
          reportante: crearReportanteDto(),
        }),
      });
      const service = new ModeracionService(httpClient);

      const detalle = await service.obtenerDetalleReporte("r1");

      expect(httpClient.get).toHaveBeenCalledWith("/reportes/r1");
      expect(detalle.reporte.id).toBe("r1");
      expect(detalle.publicacion.estaReportada()).toBe(true);
      expect(detalle.reportante.id).toBe("u2");
    });
  });

  describe("eliminarPublicacion (FR-010)", () => {
    it("invoca DELETE /publicaciones/{id}", async () => {
      const httpClient = crearHttpClientMock({ delete: vi.fn().mockResolvedValue(undefined) });
      const service = new ModeracionService(httpClient);

      await service.eliminarPublicacion("p1");

      expect(httpClient.delete).toHaveBeenCalledWith("/publicaciones/p1");
    });
  });

  describe("resolverReporteSinEliminar (research.md §6, FR-026)", () => {
    it("invoca POST /reportes/{id}/resolver-sin-eliminar y devuelve el detalle actualizado", async () => {
      const httpClient = crearHttpClientMock({
        post: vi.fn().mockResolvedValue({
          ...crearReporteDto({ estado: EstadoReporte.RESUELTO_SIN_ELIMINAR }),
          publicacion: crearPublicacionDto({ estado: EstadoPublicacion.ACTIVA }),
          reportante: crearReportanteDto(),
        }),
      });
      const service = new ModeracionService(httpClient);

      const detalle = await service.resolverReporteSinEliminar("r1");

      expect(httpClient.post).toHaveBeenCalledWith("/reportes/r1/resolver-sin-eliminar");
      expect(detalle.reporte.estaPendiente()).toBe(false);
      expect(detalle.publicacion.estaActiva()).toBe(true);
    });
  });
});
