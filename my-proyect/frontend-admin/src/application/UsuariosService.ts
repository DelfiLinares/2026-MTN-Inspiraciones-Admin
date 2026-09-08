/**
 * Servicio de aplicación `UsuariosService`.
 *
 * Ref: tasks.md T029, T033, contracts/openapi.yaml `GET /usuarios`, `POST /usuarios/{id}/banear`,
 * `DELETE /usuarios/{id}`, `POST /usuarios/{id}/promover`, spec.md FR-004..FR-007, FR-024.
 *
 * Orquesta la búsqueda paginada/filtrada de usuarios y las acciones administrativas
 * banear/eliminar/promover, delegando el acceso a datos a `HttpClient`.
 */
import type { HttpClient } from "./ports/HttpClient";
import { Usuario } from "../domain/Usuario";
import { RolUsuario } from "../domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "../domain/enums/EstadoCuentaUsuario";
import type { UsuarioResponseDto } from "./AuthAdminService";
import type { AuthAdminService } from "./AuthAdminService";

export interface BuscarUsuariosParams {
  page?: number;
  pageSize?: number;
  texto?: string;
  rol?: RolUsuario;
  estadoCuenta?: EstadoCuentaUsuario;
}

export interface PaginaUsuariosDto {
  contenido: UsuarioResponseDto[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface PaginaUsuarios {
  contenido: Usuario[];
  totalElementos: number;
  totalPaginas: number;
  paginaActual: number;
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

export class UsuariosService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authAdminService: AuthAdminService,
  ) {}

  /** Ref: `GET /usuarios`, FR-004, FR-024 (paginación/filtros server-side). */
  async buscarUsuarios(params: BuscarUsuariosParams = {}): Promise<PaginaUsuarios> {
    const dto = await this.httpClient.get<PaginaUsuariosDto>("/usuarios", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        texto: params.texto,
        rol: params.rol,
        estadoCuenta: params.estadoCuenta,
      },
    });
    return {
      contenido: dto.contenido.map(mapearUsuario),
      totalElementos: dto.totalElementos,
      totalPaginas: dto.totalPaginas,
      paginaActual: dto.paginaActual,
    };
  }

  /**
   * Ref: `POST /usuarios/{usuarioId}/banear`, FR-005, FR-029. El backend rechaza (409) si el
   * usuario objetivo tiene rol ADMIN (incluido auto-baneo).
   */
  async banear(usuarioId: string): Promise<Usuario> {
    const dto = await this.httpClient.post<UsuarioResponseDto>(`/usuarios/${usuarioId}/banear`);
    return mapearUsuario(dto);
  }

  /**
   * Ref: `DELETE /usuarios/{usuarioId}`, FR-006, FR-029. El backend rechaza (409) si el usuario
   * objetivo tiene rol ADMIN (incluido auto-eliminación).
   */
  async eliminar(usuarioId: string): Promise<void> {
    await this.httpClient.delete<void>(`/usuarios/${usuarioId}`);
  }

  /**
   * Ref: `POST /usuarios/{usuarioId}/promover`, FR-007. El backend rechaza (409) si el usuario
   * objetivo ya tiene rol ADMIN.
   *
   * Ref: tasks.md T033 — regla de **permiso de ejecución** (no del objeto `Usuario` sino del
   * actor autenticado): solo un `Usuario` cuyo `rol === ADMIN` puede invocar la promoción de
   * otro usuario. Esta verificación se modela aquí porque depende del actor autenticado
   * (`AuthAdminService.obtenerSesionActual()`), no del propio dato del usuario objetivo
   * (data-model.md → Usuario → "Regla de permiso de ejecución").
   */
  async promover(usuarioId: string): Promise<Usuario> {
    const sesion = this.authAdminService.obtenerSesionActual();
    if (!sesion || !sesion.tienePermisoDeAdministrador()) {
      throw new Error(
        "Solo un usuario con rol ADMIN puede promover a otro usuario a administrador.",
      );
    }
    const dto = await this.httpClient.post<UsuarioResponseDto>(`/usuarios/${usuarioId}/promover`);
    return mapearUsuario(dto);
  }
}
