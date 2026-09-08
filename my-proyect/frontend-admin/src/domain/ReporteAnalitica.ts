/**
 * Entidad de dominio de UI `ReporteAnalitica` (Reporte/Analítica Exportable).
 *
 * Ref: data-model.md → Entidades → ReporteAnalitica, spec.md FR-017.
 * Ref: tasks.md T024 (sin reglas complejas; datos ya agregados por el backend).
 *
 * Principio II de la constitución (Dominio de UI Orientado a Objetos): esta entidad no contiene
 * lógica de cálculo, ya que los datos vienen agregados por el backend.
 */
export interface ReporteAnaliticaProps {
  id: string;
  tipo: string;
  datosAgregados: Record<string, number>;
}

export class ReporteAnalitica {
  readonly id: string;
  readonly tipo: string;
  readonly datosAgregados: Record<string, number>;

  constructor(props: ReporteAnaliticaProps) {
    this.id = props.id;
    this.tipo = props.tipo;
    this.datosAgregados = props.datosAgregados;
  }

  /** Ref: FR-017. Método de presentación trivial (sin cálculo). */
  tieneDatos(): boolean {
    return Object.keys(this.datosAgregados).length > 0;
  }
}
