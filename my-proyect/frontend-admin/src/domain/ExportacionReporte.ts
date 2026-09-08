/**
 * Entidad de dominio de UI `ExportacionReporte`.
 *
 * Ref: data-model.md → Entidades → ExportacionReporte, spec.md FR-019, FR-028,
 * Clarifications Session 2026-09-08 pregunta 3, research.md §4.
 * Ref: tasks.md T025 (forma síncrona; hace pasar tests/domain/ExportacionReporte.test.ts, T018).
 *
 * Representa el resultado inmediato y síncrono de una solicitud de exportación. No modela un
 * trabajo en curso con estados intermedios: es el resultado directo de la operación.
 */
export interface ExportacionReporteProps {
  reporteAnaliticaId: string;
  exitoso: boolean;
  urlDescarga: string | null;
  mensajeError: string | null;
}

export class ExportacionReporte {
  readonly reporteAnaliticaId: string;
  readonly exitoso: boolean;
  readonly urlDescarga: string | null;
  readonly mensajeError: string | null;

  constructor(props: ExportacionReporteProps) {
    this.reporteAnaliticaId = props.reporteAnaliticaId;
    this.exitoso = props.exitoso;
    this.urlDescarga = props.urlDescarga;
    this.mensajeError = props.mensajeError;
  }

  /** Ref: FR-019. */
  estaListoParaDescargar(): boolean {
    return this.exitoso === true && this.urlDescarga !== null;
  }

  /** Ref: FR-028. */
  fallo(): boolean {
    return this.exitoso === false;
  }
}
