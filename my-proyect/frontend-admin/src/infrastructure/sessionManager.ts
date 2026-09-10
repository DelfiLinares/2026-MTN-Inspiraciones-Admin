/**
 * `sessionManager`: almacenamiento seguro de la sesión administrativa y su token.
 *
 * Ref: tasks.md T041 (depende de T023), spec.md FR-002, FR-020, FR-027, research.md §2.
 *
 * Responsabilidades (capa `infrastructure/`, Principio III de la constitución):
 * - Persistir la `SesionAdministrativa` actual (token, expiración, usuario) usando
 *   `sessionStorage` (se limpia automáticamente al cerrar la pestaña/navegador, a diferencia de
 *   `localStorage`, reduciendo la ventana de exposición del token — FR-020).
 * - Exponer `esValida()` delegando en la regla de dominio `SesionAdministrativa.esValida()`
 *   (Principio II: la regla de expiración vive en el dominio, no se reimplementa aquí).
 * - Mantener sincronizado el token Bearer que usa `httpClient` (T040) en cada operación de
 *   guardado/limpieza, para que toda request saliente lleve (o deje de llevar) el header
 *   `Authorization` automáticamente.
 *
 * El vencimiento durante una acción sensible (FR-027) es responsabilidad de `sessionGuard`
 * (T043), que consumirá `esValida()`/`limpiarSesion()` de este módulo.
 */
import { SesionAdministrativa } from "../domain/SesionAdministrativa";
import { Usuario } from "../domain/Usuario";
import type { RolUsuario } from "../domain/enums/RolUsuario";
import type { EstadoCuentaUsuario } from "../domain/enums/EstadoCuentaUsuario";
import { setAuthToken } from "./httpClient";

const CLAVE_ALMACENAMIENTO = "inspiraciones-admin.sesion";

interface SesionAlmacenadaDto {
  token: string;
  expiraEn: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
    estadoCuenta: EstadoCuentaUsuario;
    fechaRegistro: string;
  };
}

function serializar(sesion: SesionAdministrativa): string {
  const dto: SesionAlmacenadaDto = {
    token: sesion.token,
    expiraEn: sesion.expiraEn.toISOString(),
    usuario: {
      id: sesion.usuario.id,
      nombre: sesion.usuario.nombre,
      email: sesion.usuario.email,
      rol: sesion.usuario.rol,
      estadoCuenta: sesion.usuario.estadoCuenta,
      fechaRegistro: sesion.usuario.fechaRegistro.toISOString(),
    },
  };
  return JSON.stringify(dto);
}

function deserializar(json: string): SesionAdministrativa | null {
  try {
    const dto = JSON.parse(json) as SesionAlmacenadaDto;
    return new SesionAdministrativa({
      token: dto.token,
      expiraEn: new Date(dto.expiraEn),
      usuario: new Usuario({
        id: dto.usuario.id,
        nombre: dto.usuario.nombre,
        email: dto.usuario.email,
        rol: dto.usuario.rol,
        estadoCuenta: dto.usuario.estadoCuenta,
        fechaRegistro: new Date(dto.usuario.fechaRegistro),
      }),
    });
  } catch {
    return null;
  }
}

/** Persiste la sesión administrativa y sincroniza el token usado por `httpClient` (T040). */
export function guardarSesion(sesion: SesionAdministrativa): void {
  sessionStorage.setItem(CLAVE_ALMACENAMIENTO, serializar(sesion));
  setAuthToken(sesion.token);
}

/** Recupera la sesión almacenada, o `null` si no hay ninguna o está corrupta. */
export function obtenerSesion(): SesionAdministrativa | null {
  const almacenado = sessionStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (!almacenado) {
    return null;
  }
  return deserializar(almacenado);
}

/**
 * Indica si hay una sesión almacenada y, de haberla, si sigue vigente respecto de `fechaActual`.
 * Ref: `SesionAdministrativa.esValida()` (regla de dominio, T023).
 */
export function esValida(fechaActual: Date = new Date()): boolean {
  const sesion = obtenerSesion();
  return sesion !== null && sesion.esValida(fechaActual);
}

/** Elimina la sesión almacenada y limpia el token usado por `httpClient` (T040). Ref: FR-027. */
export function limpiarSesion(): void {
  sessionStorage.removeItem(CLAVE_ALMACENAMIENTO);
  setAuthToken(null);
}
