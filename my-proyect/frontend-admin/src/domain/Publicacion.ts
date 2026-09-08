/**
 * Entidad de dominio de UI `Publicacion`.
 *
 * Ref: data-model.md → Entidades → Publicacion, spec.md FR-010, FR-011, US2.
 * Ref: tasks.md T020 (hace pasar tests/domain/Publicacion.test.ts, T014).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos).
 */
import { EstadoPublicacion } from "./enums/EstadoPublicacion";

export interface PublicacionProps {
  id: string;
  autorId: string;
  titulo: string;
  estado: EstadoPublicacion;
  fechaCreacion: Date;
}

export class Publicacion {
  readonly id: string;
  readonly autorId: string;
  readonly titulo: string;
  readonly estado: EstadoPublicacion;
  readonly fechaCreacion: Date;

  constructor(props: PublicacionProps) {
    this.id = props.id;
    this.autorId = props.autorId;
    this.titulo = props.titulo;
    this.estado = props.estado;
    this.fechaCreacion = props.fechaCreacion;
  }

  /** Ref: US2. */
  estaReportada(): boolean {
    return this.estado === EstadoPublicacion.REPORTADA;
  }

  /** Ref: FR-010. */
  puedeSerEliminada(): boolean {
    return this.estado !== EstadoPublicacion.ELIMINADA;
  }

  estaActiva(): boolean {
    return this.estado === EstadoPublicacion.ACTIVA;
  }
}
