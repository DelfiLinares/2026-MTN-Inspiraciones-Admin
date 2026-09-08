/**
 * Servicio de aplicación `DesafiosService`.
 *
 * Ref: tasks.md T031, contracts/openapi.yaml `GET /desafios`, `GET /desafios/{id}`,
 * `POST /desafios/{id}/aprobar`, `POST /desafios/{id}/rechazar`, spec.md FR-012..FR-016.
 *
 * Orquesta el listado/filtrado de desafíos propuestos, su detalle y las acciones de
 * aprobar/rechazar, delegando el acceso a datos a `HttpClient`.
 */
import type { HttpClient } from "./ports/HttpClient";
import { Desafio } from "../domain/Desafio";
import { EstadoDesafioPropuesto } from "../domain/enums/EstadoDesafioPropuesto";

export interface DesafioResponseDto {
  id: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  estado: EstadoDesafioPropuesto;
  fechaPropuesta: string;
}

export interface PaginaDesafiosDto {
  contenido: DesafioResponseDto[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface ListarDesafiosParams {
  page?: number;
  pageSize?: number;
  estado?: EstadoDesafioPropuesto;
}

export interface PaginaDesafios {
  contenido: Desafio[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

function mapearDesafio(dto: DesafioResponseDto): Desafio {
  return new Desafio({
    id: dto.id,
    autorId: dto.autorId,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    estado: dto.estado,
    fechaPropuesta: new Date(dto.fechaPropuesta),
  });
}

export class DesafiosService {
  constructor(private readonly httpClient: HttpClient) {}

  /** Ref: `GET /desafios`, FR-012. */
  async listarDesafios(params: ListarDesafiosParams = {}): Promise<PaginaDesafios> {
    const dto = await this.httpClient.get<PaginaDesafiosDto>("/desafios", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        estado: params.estado,
      },
    });
    return {
      contenido: dto.contenido.map(mapearDesafio),
      totalElementos: dto.totalElementos,
      totalPaginas: dto.totalPaginas,
      paginaActual: dto.paginaActual,
    };
  }

  /** Ref: `GET /desafios/{desafioId}`, FR-013. */
  async obtenerDetalle(desafioId: string): Promise<Desafio> {
    const dto = await this.httpClient.get<DesafioResponseDto>(`/desafios/${desafioId}`);
    return mapearDesafio(dto);
  }

  /**
   * Ref: `POST /desafios/{desafioId}/aprobar`, FR-014. El backend rechaza (409) si el desafío ya
   * no está en estado PENDIENTE (decisión irreversible).
   */
  async aprobar(desafioId: string): Promise<Desafio> {
    const dto = await this.httpClient.post<DesafioResponseDto>(`/desafios/${desafioId}/aprobar`);
    return mapearDesafio(dto);
  }

  /**
   * Ref: `POST /desafios/{desafioId}/rechazar`, FR-015. El backend rechaza (409) si el desafío ya
   * no está en estado PENDIENTE (decisión irreversible).
   */
  async rechazar(desafioId: string): Promise<Desafio> {
    const dto = await this.httpClient.post<DesafioResponseDto>(`/desafios/${desafioId}/rechazar`);
    return mapearDesafio(dto);
  }
}
