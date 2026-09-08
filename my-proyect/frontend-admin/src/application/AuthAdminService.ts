/**
 * Servicio de aplicación `AuthAdminService`.
 *
 * Ref: tasks.md T027, contracts/openapi.yaml `POST /auth/login`, spec.md FR-001, FR-002.
 *
 * Orquesta el login de administrador y la obtención de la sesión actual, delegando el acceso a
 * datos a la interfaz `HttpClient` (sin fetch/axios directo, Principio III de la constitución).
 */
import type { HttpClient } from "./ports/HttpClient";
import { SesionAdministrativa } from "../domain/SesionAdministrativa";
import { Usuario } from "../domain/Usuario";
import { RolUsuario } from "../domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "../domain/enums/EstadoCuentaUsuario";

export interface UsuarioResponseDto {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  estadoCuenta: EstadoCuentaUsuario;
  fechaRegistro: string;
}

export interface SesionAdministrativaResponseDto {
  token: string;
  expiraEn: string;
  usuario: UsuarioResponseDto;
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

function mapearSesion(dto: SesionAdministrativaResponseDto): SesionAdministrativa {
  return new SesionAdministrativa({
    usuario: mapearUsuario(dto.usuario),
    token: dto.token,
    expiraEn: new Date(dto.expiraEn),
  });
}

export class AuthAdminService {
  private sesionActual: SesionAdministrativa | null = null;

  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Ref: `POST /auth/login`, FR-001, FR-002. El backend valida credenciales y rol ADMIN (401/403).
   */
  async login(email: string, password: string): Promise<SesionAdministrativa> {
    const dto = await this.httpClient.post<SesionAdministrativaResponseDto>("/auth/login", {
      email,
      password,
    });
    const sesion = mapearSesion(dto);
    this.sesionActual = sesion;
    return sesion;
  }

  obtenerSesionActual(): SesionAdministrativa | null {
    return this.sesionActual;
  }
}
