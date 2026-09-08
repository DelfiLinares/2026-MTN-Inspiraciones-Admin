/**
 * Servicio de aplicación `ReportesAnaliticaService`.
 *
 * Ref: tasks.md T032, contracts/openapi.yaml `GET /reportes-analiticas`,
 * `POST /reportes-analiticas/exportaciones`,
 * `GET /reportes-analiticas/exportaciones/{id}/descarga`, spec.md FR-017..FR-019, FR-028.
 *
 * `iniciarExportacion` es SÍNCRONO: devuelve directamente el resultado final
 * (`ExportacionReporte { exitoso, urlDescarga, mensajeError }`), sin método de consulta de
 * estado intermedio (Clarifications Session 2026-09-08, pregunta 3).
 */
import type { HttpClient } from "./ports/HttpClient";
import { ReporteAnalitica } from "../domain/ReporteAnalitica";
import { ExportacionReporte } from "../domain/ExportacionReporte";

export interface ReporteAnaliticaResponseDto {
  id: string;
  tipo: string;
  datosAgregados: Record<string, number>;
}

export interface ExportacionReporteResponseDto {
  reporteAnaliticaId: string;
  exitoso: boolean;
  urlDescarga: string | null;
  mensajeError: string | null;
}

function mapearReporteAnalitica(dto: ReporteAnaliticaResponseDto): ReporteAnalitica {
  return new ReporteAnalitica({
    id: dto.id,
    tipo: dto.tipo,
    datosAgregados: dto.datosAgregados,
  });
}

function mapearExportacion(dto: ExportacionReporteResponseDto): ExportacionReporte {
  return new ExportacionReporte({
    reporteAnaliticaId: dto.reporteAnaliticaId,
    exitoso: dto.exitoso,
    urlDescarga: dto.urlDescarga,
    mensajeError: dto.mensajeError,
  });
}

export class ReportesAnaliticaService {
  constructor(private readonly httpClient: HttpClient) {}

  /** Ref: `GET /reportes-analiticas`, FR-017. */
  async listarReportesAnaliticas(): Promise<ReporteAnalitica[]> {
    const dto = await this.httpClient.get<ReporteAnaliticaResponseDto[]>("/reportes-analiticas");
    return dto.map(mapearReporteAnalitica);
  }

  /**
   * Ref: `POST /reportes-analiticas/exportaciones`, FR-018, FR-028, research.md §4,
   * Clarifications Session 2026-09-08 pregunta 3. Operación síncrona: la respuesta ya trae el
   * resultado final (éxito con urlDescarga, o fallo con mensajeError).
   */
  async iniciarExportacion(reporteAnaliticaId: string): Promise<ExportacionReporte> {
    const dto = await this.httpClient.post<ExportacionReporteResponseDto>(
      "/reportes-analiticas/exportaciones",
      { reporteAnaliticaId },
    );
    return mapearExportacion(dto);
  }

  /** Ref: `GET /reportes-analiticas/exportaciones/{exportacionId}/descarga`, FR-019. */
  async descargarExportacion(exportacionId: string): Promise<Blob> {
    return this.httpClient.get<Blob>(
      `/reportes-analiticas/exportaciones/${exportacionId}/descarga`,
    );
  }
}
