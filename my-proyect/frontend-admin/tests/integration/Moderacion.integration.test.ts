/**
 * Test de integración de listado/filtrado de publicaciones reportadas contra contrato.
 *
 * Ref: tasks.md T088 (depende de T044, T086), contracts/openapi.yaml
 * `GET /publicaciones/reportadas`, spec.md FR-008, FR-024, SC-005.
 *
 * Verifica el circuito end-to-end frontend-admin -> httpClient real (`fetch`) -> mock server de
 * contrato (T086), confirmando que:
 * - Los parámetros de paginación (`page`, `pageSize`) y de filtro/orden (`motivo`,
 *   `estadoReporte`, `ordenarPor`) declarados por `ModeracionService.listarPublicacionesReportadas`
 *   (T030) viajan efectivamente como query params en la request HTTP real (FR-024: resolución
 *   server-side, no en memoria).
 * - La respuesta paginada del contrato se mapea correctamente a `Reporte` de dominio.
 *
 * Se espía `globalThis.fetch` DESPUÉS de `iniciarMockServer()` (T086) para inspeccionar la URL
 * real invocada sin modificar el mock server ni su contrato de comportamiento: el spy delega
 * siempre en la implementación mockeada subyacente.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";
import { detenerMockServer, iniciarMockServer } from "./mockServer";

const API_BASE_URL_TEST = "http://localhost:8080/api/admin";

describe("Moderacion integration — GET /publicaciones/reportadas", () => {
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

  it("envía page/pageSize/motivo/estadoReporte/ordenarPor como query params server-side (FR-008, FR-024, SC-005)", async () => {
    const fetchEspiado = vi.spyOn(globalThis, "fetch");

    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { moderacionService } = crearServiceFactory();

    const pagina = await moderacionService.listarPublicacionesReportadas({
      page: 2,
      pageSize: 10,
      motivo: MotivoReporte.SPAM,
      estadoReporte: EstadoReporte.PENDIENTE,
      ordenarPor: "prioridad",
    });

    expect(fetchEspiado).toHaveBeenCalledTimes(1);
    const [urlInvocada] = fetchEspiado.mock.calls[0];
    const url = new URL(String(urlInvocada));

    expect(url.pathname).toBe("/api/admin/publicaciones/reportadas");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("10");
    expect(url.searchParams.get("motivo")).toBe(MotivoReporte.SPAM);
    expect(url.searchParams.get("estadoReporte")).toBe(EstadoReporte.PENDIENTE);
    expect(url.searchParams.get("ordenarPor")).toBe("prioridad");

    // El contenido mapeado corresponde a la página filtrada devuelta por el mock server (no
    // filtrada/paginada en memoria por el cliente): el seed de mockServer.ts define un único
    // reporte PENDIENTE con motivo SPAM, coincidente con el filtro solicitado.
    expect(pagina.contenido).toHaveLength(1);
    expect(pagina.contenido[0].motivo).toBe(MotivoReporte.SPAM);
    expect(pagina.contenido[0].estado).toBe(EstadoReporte.PENDIENTE);
  });

  it("un filtro que no coincide con ningún reporte devuelve una página vacía resuelta server-side (FR-008, FR-024)", async () => {
    const { crearServiceFactory } = await import("@/infrastructure/serviceFactory");
    const { moderacionService } = crearServiceFactory();

    const pagina = await moderacionService.listarPublicacionesReportadas({
      motivo: MotivoReporte.PLAGIO,
    });

    expect(pagina.contenido).toHaveLength(0);
    expect(pagina.totalElementos).toBe(0);
  });
});
