/**
 * Servicio de aplicación `ModeracionService`.
 *
 * Ref: tasks.md T030, contracts/openapi.yaml `GET /publicaciones/reportadas`,
 * `GET /reportes/{id}`, `DELETE /publicaciones/{id}`, `POST /reportes/{id}/resolver-sin-eliminar`,
 * spec.md FR-008..FR-011, FR-024..FR-026.
 *
 * Orquesta el listado/filtrado de publicaciones reportadas, el detalle de un reporte, la
 * eliminación de una publicación y la resolución de un reporte sin eliminar la publicación,
 * delegando el acceso a datos a `HttpClient`.
 */
import type { HttpClient } from "./ports/HttpClient";
import { Publicacion } from "../domain/Publicacion";
import { Reporte, type PrioridadReporte } from "../domain/Reporte";
import { Usuario } from "../domain/Usuario";
import { MotivoReporte } from "../domain/enums/MotivoReporte";
import { EstadoReporte } from "../domain/enums/EstadoReporte";
import { EstadoPublicacion } from "../domain/enums/EstadoPublicacion";
import type { UsuarioResponseDto } from "./AuthAdminService";

export interface ReporteResponseDto {
  id: string;
  publicacionId: string;
  reportanteId: string;
  motivo: MotivoReporte;
  estado: EstadoReporte;
  fechaCreacion: string;
  prioridad: PrioridadReporte;
}

export interface PublicacionResponseDto {
  id: string;
  autorId: string;
  titulo: string;
  estado: EstadoPublicacion;
  fechaCreacion: string;
}

export interface ReporteDetalleResponseDto extends ReporteResponseDto {
  publicacion: PublicacionResponseDto;
  reportante: UsuarioResponseDto;
}

export interface PaginaReportesDto {
  contenido: ReporteResponseDto[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface BuscarPublicacionesReportadasParams {
  page?: number;
  pageSize?: number;
  motivo?: MotivoReporte;
  estadoReporte?: EstadoReporte;
  ordenarPor?: "antiguedad" | "prioridad";
}

export interface PaginaReportes {
  contenido: Reporte[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface ReporteDetalle {
  reporte: Reporte;
  publicacion: Publicacion;
  reportante: Usuario;
}

function mapearReporte(dto: ReporteResponseDto): Reporte {
  return new Reporte({
    id: dto.id,
    publicacionId: dto.publicacionId,
    reportanteId: dto.reportanteId,
    motivo: dto.motivo,
    estado: dto.estado,
    fechaCreacion: new Date(dto.fechaCreacion),
    prioridad: dto.prioridad,
  });
}

function mapearPublicacion(dto: PublicacionResponseDto): Publicacion {
  return new Publicacion({
    id: dto.id,
    autorId: dto.autorId,
    titulo: dto.titulo,
    estado: dto.estado,
    fechaCreacion: new Date(dto.fechaCreacion),
  });
}

function mapearUsuario(dto: UsuarioResponseDto): Usuario {
  return new Usuario({
    id: dto.id,
    nombre: dto.nombre,
    email: dto.email,
    rol: dto.rol,
    estadoCuenta: dto.estadoCuenta,
    fechaRegistro: new Date(dto.fechaRegistro),
  });
}

export class ModeracionService {
  constructor(private readonly httpClient: HttpClient) {}

  /** Ref: `GET /publicaciones/reportadas`, FR-008, FR-024, FR-025. */
  async listarPublicacionesReportadas(
    params: BuscarPublicacionesReportadasParams = {},
  ): Promise<PaginaReportes> {
    const dto = await this.httpClient.get<PaginaReportesDto>("/publicaciones/reportadas", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        motivo: params.motivo,
        estadoReporte: params.estadoReporte,
        ordenarPor: params.ordenarPor,
      },
    });
    return {
      contenido: dto.contenido.map(mapearReporte),
      totalElementos: dto.totalElementos,
      totalPaginas: dto.totalPaginas,
      paginaActual: dto.paginaActual,
    };
  }

  /** Ref: `GET /reportes/{reporteId}`, FR-009. */
  async obtenerDetalleReporte(reporteId: string): Promise<ReporteDetalle> {
    const dto = await this.httpClient.get<ReporteDetalleResponseDto>(`/reportes/${reporteId}`);
    return {
      reporte: mapearReporte(dto),
      publicacion: mapearPublicacion(dto.publicacion),
      reportante: mapearUsuario(dto.reportante),
    };
  }

  /** Ref: `DELETE /publicaciones/{publicacionId}`, FR-010. */
  async eliminarPublicacion(publicacionId: string): Promise<void> {
    await this.httpClient.delete<void>(`/publicaciones/${publicacionId}`);
  }

  /** Ref: `POST /reportes/{reporteId}/resolver-sin-eliminar`, research.md §6, FR-026. */
  async resolverReporteSinEliminar(reporteId: string): Promise<ReporteDetalle> {
    const dto = await this.httpClient.post<ReporteDetalleResponseDto>(
      `/reportes/${reporteId}/resolver-sin-eliminar`,
    );
    return {
      reporte: mapearReporte(dto),
      publicacion: mapearPublicacion(dto.publicacion),
      reportante: mapearUsuario(dto.reportante),
    };
  }
}
