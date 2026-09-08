/**
 * Entidad de dominio de UI `Desafio` (Desafío Propuesto).
 *
 * Ref: data-model.md → Entidades → Desafio (Desafío Propuesto), spec.md FR-014, FR-015, FR-016,
 * US5.
 * Ref: tasks.md T022 (hace pasar tests/domain/Desafio.test.ts, T016).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos).
 */
import { EstadoDesafioPropuesto } from "./enums/EstadoDesafioPropuesto";

export interface DesafioProps {
  id: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  estado: EstadoDesafioPropuesto;
  fechaPropuesta: Date;
}

export class Desafio {
  readonly id: string;
  readonly autorId: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly estado: EstadoDesafioPropuesto;
  readonly fechaPropuesta: Date;

  constructor(props: DesafioProps) {
    this.id = props.id;
    this.autorId = props.autorId;
    this.titulo = props.titulo;
    this.descripcion = props.descripcion;
    this.estado = props.estado;
    this.fechaPropuesta = props.fechaPropuesta;
  }

  /** Ref: US5. */
  estaPendiente(): boolean {
    return this.estado === EstadoDesafioPropuesto.PENDIENTE;
  }

  /**
   * Ref: FR-014. Confirmado en Clarifications Session 2026-09-08: la decisión de
   * aprobar/rechazar es final e irreversible; una vez que estado !== PENDIENTE, este método
   * devuelve false de forma permanente, sin mecanismo de reversión.
   */
  puedeAprobarse(): boolean {
    return this.estado === EstadoDesafioPropuesto.PENDIENTE;
  }

  /**
   * Ref: FR-015. Mismo carácter irreversible confirmado que puedeAprobarse().
   */
  puedeRechazarse(): boolean {
    return this.estado === EstadoDesafioPropuesto.PENDIENTE;
  }
}
