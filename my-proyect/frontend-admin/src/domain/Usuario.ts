/**
 * Entidad de dominio de UI `Usuario`.
 *
 * Ref: data-model.md → Entidades → Usuario, spec.md FR-005, FR-006, FR-007, FR-029, US3.
 * Ref: tasks.md T019 (hace pasar tests/domain/Usuario.test.ts, T013).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos): esta clase encapsula las
 * reglas de negocio del usuario administrado, evitando un modelo anémico.
 */
import { RolUsuario } from "./enums/RolUsuario";
import { EstadoCuentaUsuario } from "./enums/EstadoCuentaUsuario";

export interface UsuarioProps {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  estadoCuenta: EstadoCuentaUsuario;
  fechaRegistro: Date;
}

export class Usuario {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: RolUsuario;
  readonly estadoCuenta: EstadoCuentaUsuario;
  readonly fechaRegistro: Date;

  constructor(props: UsuarioProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.email = props.email;
    this.rol = props.rol;
    this.estadoCuenta = props.estadoCuenta;
    this.fechaRegistro = props.fechaRegistro;
  }

  /**
   * Ref: FR-007, US3.
   * true si rol === USER y estadoCuenta === ACTIVO.
   */
  puedeSerPromovidoAAdmin(): boolean {
    return this.rol === RolUsuario.USER && this.estadoCuenta === EstadoCuentaUsuario.ACTIVO;
  }

  /**
   * Ref: FR-005, FR-029 (Clarifications Session 2026-09-08).
   * true si rol === USER y estadoCuenta === ACTIVO. Un usuario con rol === ADMIN nunca puede
   * ser baneado desde este módulo, sin excepción (ni siquiera por otro ADMIN).
   */
  puedeSerBaneado(): boolean {
    return this.rol === RolUsuario.USER && this.estadoCuenta === EstadoCuentaUsuario.ACTIVO;
  }

  /**
   * Ref: FR-006, FR-029 (Clarifications Session 2026-09-08).
   * true si rol === USER y estadoCuenta !== ELIMINADO. Un usuario con rol === ADMIN nunca puede
   * ser eliminado desde este módulo, sin excepción.
   */
  puedeSerEliminado(): boolean {
    return this.rol === RolUsuario.USER && this.estadoCuenta !== EstadoCuentaUsuario.ELIMINADO;
  }

  /**
   * Método auxiliar de comparación de identidad. Ya no es la única defensa contra
   * auto-baneo/auto-eliminación (ver puedeSerBaneado/puedeSerEliminado); se mantiene disponible
   * para trazas de auditoría o mensajes de UI más específicos.
   */
  esElMismoQue(otroUsuarioId: string): boolean {
    return this.id === otroUsuarioId;
  }
}
