/**
 * `DescargarReporteAction`: acción de descarga de un reporte exportado.
 *
 * Ref: tasks.md T078 (depende de T025, T077), spec.md FR-019.
 *
 * FR-019: permite descargar un reporte exportado una vez que está disponible. Habilitada
 * únicamente cuando el resultado de la exportación síncrona (`ExportarReporteAction`, T077) fue
 * `exitoso === true` (`ExportacionReporte.estaListoParaDescargar()`, T025): la `urlDescarga` ya
 * está disponible de inmediato, sin espera adicional (no hay estado intermedio, T077).
 *
 * Se renderiza como un enlace de descarga directo a `urlDescarga` (sin invocar servicios de
 * aplicación adicionales): la exportación síncrona ya resolvió el recurso descargable.
 */
import type { ExportacionReporte } from "../../domain/ExportacionReporte";
import { AccionConsultaButton } from "../shared/AccionConsultaButton";

export interface DescargarReporteActionProps {
  exportacion: ExportacionReporte;
}

/** Ref: FR-019 — habilitada solo si la exportación síncrona fue exitosa. */
export function DescargarReporteAction({
  exportacion,
}: DescargarReporteActionProps): JSX.Element | null {
  // Ref: FR-019 — solo tiene sentido descargar si la exportación ya fue exitosa.
  if (!exportacion.estaListoParaDescargar()) {
    return null;
  }

  return (
    <a
      href={exportacion.urlDescarga as string}
      data-testid="descargar-reporte-action"
      download
    >
      <AccionConsultaButton>Descargar reporte</AccionConsultaButton>
    </a>
  );
}
