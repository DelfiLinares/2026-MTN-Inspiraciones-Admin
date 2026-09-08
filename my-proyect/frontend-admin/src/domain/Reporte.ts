/**
 * Entidad de dominio de UI `Reporte`.
 *
 * Ref: data-model.md → Entidades → Reporte, spec.md FR-025, FR-026, US2, US4.
 * Ref: tasks.md T021 (hace pasar tests/domain/Reporte.test.ts, T015).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos).
 */
import { MotivoReporte } from "./enums/MotivoReporte";
import { EstadoReporte } from "./enums/EstadoReporte";

export type PrioridadReporte = "ALTA" | "MEDIA" | "BAJA";

export interface ReporteProps {
  id: string;
  publicacionId: string;
  reportanteId: string;
  motivo: MotivoReporte;
  estado: EstadoReporte;
  fechaCreacion: Date;
  prioridad: PrioridadReporte;
}

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export class Reporte {
  readonly id: string;
  readonly publicacionId: string;
  readonly reportanteId: string;
  readonly motivo: MotivoReporte;
  readonly estado: EstadoReporte;
  readonly fechaCreacion: Date;
  readonly prioridad: PrioridadReporte;

  constructor(props: ReporteProps) {
    this.id = props.id;
    this.publicacionId = props.publicacionId;
    this.reportanteId = props.reportanteId;
    this.motivo = props.motivo;
    this.estado = props.estado;
    this.fechaCreacion = props.fechaCreacion;
    this.prioridad = props.prioridad;
  }

  /** Ref: US2, dashboard (US4). */
  estaPendiente(): boolean {
    return this.estado === EstadoReporte.PENDIENTE;
  }

  /** Ref: FR-025. */
  antiguedadEnDias(fechaActual: Date): number {
    const diffMs = fechaActual.getTime() - this.fechaCreacion.getTime();
    return Math.floor(diffMs / MILISEGUNDOS_POR_DIA);
  }

  /** Ref: research.md §6, FR-026. */
  puedeResolverseSinEliminar(): boolean {
    return this.estado === EstadoReporte.PENDIENTE;
  }

  /** Ref: FR-010. */
  puedeResolverseConEliminacion(): boolean {
    return this.estado === EstadoReporte.PENDIENTE;
  }
}
