/**
 * Servicio de aplicación `DashboardService`.
 *
 * Ref: tasks.md T028, contracts/openapi.yaml `GET /dashboard`, spec.md FR-003.
 *
 * Obtiene los 7 indicadores confirmados del dashboard (research.md §7bis), ya agregados por el
 * backend (sin recálculo en cliente), delegando el acceso a datos a `HttpClient`.
 */
import type { HttpClient } from "./ports/HttpClient";

export interface DashboardIndicadoresDto {
  reportesPendientes: number;
  usuariosActivos: number;
  desafiosPendientes: number;
  publicacionesActivas: number;
  publicacionesEliminadas: number;
  usuariosBaneados: number;
  desafiosDecididos: number;
}

export class DashboardService {
  constructor(private readonly httpClient: HttpClient) {}

  /** Ref: `GET /dashboard`, FR-003. */
  async obtenerIndicadores(): Promise<DashboardIndicadoresDto> {
    return this.httpClient.get<DashboardIndicadoresDto>("/dashboard");
  }
}
