/**
 * Entidad de dominio de UI `SesionAdministrativa`.
 *
 * Ref: data-model.md → Entidades → SesionAdministrativa, spec.md FR-002, FR-020.
 * Ref: tasks.md T023 (hace pasar tests/domain/SesionAdministrativa.test.ts, T017).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos). El `token` es opaco para
 * el dominio de UI; su manejo real (almacenamiento, renovación) corresponde a
 * `infrastructure/sessionManager` (Fase 4).
 */
import { Usuario } from "./Usuario";
import { RolUsuario } from "./enums/RolUsuario";

export interface SesionAdministrativaProps {
  usuario: Usuario;
  token: string;
  expiraEn: Date;
}

export class SesionAdministrativa {
  readonly usuario: Usuario;
  readonly token: string;
  readonly expiraEn: Date;

  constructor(props: SesionAdministrativaProps) {
    this.usuario = props.usuario;
    this.token = props.token;
    this.expiraEn = props.expiraEn;
  }

  esValida(fechaActual: Date): boolean {
    return this.expiraEn.getTime() > fechaActual.getTime();
  }

  /** Ref: FR-002, FR-020. */
  tienePermisoDeAdministrador(): boolean {
    return this.usuario.rol === RolUsuario.ADMIN;
  }
}
