/**
 * `ReportesTable`: vista presentacional de reportes con indicadores de prioridad/antigüedad.
 *
 * Ref: tasks.md T064 (depende de T021, T049), spec.md FR-025.
 *
 * FR-025: muestra indicadores de prioridad y/o antigüedad en los listados de reportes pendientes,
 * para facilitar su identificación y resolución rápida. Usa `Reporte.antiguedadEnDias()` (T021)
 * para calcular la antigüedad respecto de una fecha de referencia (inyectable para tests), y
 * `reporte.prioridad` (`PrioridadReporte`: "ALTA" | "MEDIA" | "BAJA") para el indicador de
 * prioridad, ambos representados con clases y texto visualmente distinguibles (no solo color, por
 * accesibilidad).
 *
 * Componente puramente presentacional (solo props, sin llamadas a servicios): recibe la lista de
 * `Reporte` ya resuelta por `ModeracionContainer` (T063). Las acciones (`EliminarPublicacionAction`
 * T066, `ResolverReporteAction` T067) no se implementan aquí: se expone un slot opcional
 * `renderAcciones` por fila para que esas tareas futuras las inyecten sin modificar este
 * componente.
 */
import type { ReactNode } from "react";
import type { Reporte } from "../../domain/Reporte";

export interface ReportesTableProps {
  /** Reportes a mostrar (ya resueltos/paginados/filtrados por quien use esta tabla). */
  reportes: Reporte[];
  /** Fecha de referencia para calcular la antigüedad (por defecto `new Date()`). */
  fechaActual?: Date;
  /** Slot opcional para renderizar acciones por fila (eliminar/resolver, T066–T067). */
  renderAcciones?: (reporte: Reporte) => ReactNode;
}

const ETIQUETA_PRIORIDAD: Record<Reporte["prioridad"], string> = {
  ALTA: "Prioridad alta",
  MEDIA: "Prioridad media",
  BAJA: "Prioridad baja",
};

/** Ref: FR-025 — indicadores de prioridad y antigüedad, visualmente distinguibles. */
export function ReportesTable({
  reportes,
  fechaActual = new Date(),
  renderAcciones,
}: ReportesTableProps): JSX.Element {
  return (
    <table data-testid="reportes-tabla">
      <thead>
        <tr>
          <th>Motivo</th>
          <th>Prioridad</th>
          <th>Antigüedad</th>
          <th>Estado</th>
          {renderAcciones && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {reportes.map((reporte) => {
          const antiguedad = reporte.antiguedadEnDias(fechaActual);
          return (
            <tr key={reporte.id} data-testid="reportes-fila">
              <td>{reporte.motivo}</td>
              <td>
                <span
                  data-testid={`reporte-prioridad-${reporte.id}`}
                  className={`reporte-prioridad reporte-prioridad--${reporte.prioridad.toLowerCase()}`}
                >
                  {ETIQUETA_PRIORIDAD[reporte.prioridad]}
                </span>
              </td>
              <td>
                <span data-testid={`reporte-antiguedad-${reporte.id}`} className="reporte-antiguedad">
                  {antiguedad === 0 ? "Hoy" : `${antiguedad} día(s)`}
                </span>
              </td>
              <td>{reporte.estado}</td>
              {renderAcciones && <td>{renderAcciones(reporte)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
