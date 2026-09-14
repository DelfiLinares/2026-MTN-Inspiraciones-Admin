/**
 * `ExportarReporteAction`: acción "iniciar exportación" de un reporte/analítica.
 *
 * Ref: tasks.md T077 (depende de T025, T032, T076), spec.md FR-018, FR-028, research.md §4,
 * Clarifications Session 2026-09-08 pregunta 3.
 *
 * Operación SÍNCRONA de un solo paso: no hay polling ni consulta de estado intermedio. El
 * resultado final (`ExportacionReporte { exitoso, urlDescarga, mensajeError }`) se obtiene
 * directamente de la llamada a `onExportar` (que la pantalla contenedora, `ReportesAnaliticaPage`,
 * T076, conectará con `ReportesAnaliticaService.iniciarExportacion`, T032). Este componente no
 * invoca el servicio de aplicación directamente, para no acoplarse a la capa de aplicación.
 *
 * En caso de fallo (`ExportacionReporte.fallo()`, T025), se muestra el mensaje exacto
 * "Error: Reporte no generado." (research.md §4, Clarifications Session 2026-09-08 pregunta 3).
 *
 * El resultado exitoso (`urlDescarga`) se expone vía `onResultado` para que la pantalla
 * contenedora habilite la acción de descarga (`DescargarReporteAction`, T078), sin adelantar su
 * alcance en este componente.
 */
import { useState } from "react";
import type { ExportacionReporte } from "../../domain/ExportacionReporte";
import { AccionConsultaButton } from "../shared/AccionConsultaButton";

export interface ExportarReporteActionProps {
  reporteAnaliticaId: string;
  /** Invocado al iniciar la exportación (típicamente llama a `ReportesAnaliticaService.iniciarExportacion`). */
  onExportar: (reporteAnaliticaId: string) => Promise<ExportacionReporte>;
  /** Invocado con el resultado (éxito o fallo) una vez resuelta la exportación síncrona. */
  onResultado?: (resultado: ExportacionReporte) => void;
}

const MENSAJE_ERROR_FALLO = "Error: Reporte no generado.";

/** Ref: FR-018, FR-028, research.md §4 — exportación síncrona de un solo paso. */
export function ExportarReporteAction({
  reporteAnaliticaId,
  onExportar,
  onResultado,
}: ExportarReporteActionProps): JSX.Element {
  const [enCurso, setEnCurso] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  async function manejarClick(): Promise<void> {
    setEnCurso(true);
    setMensajeError(null);
    try {
      // Ref: FR-028, research.md §4 — operación síncrona: la respuesta ya trae el resultado final.
      const resultado = await onExportar(reporteAnaliticaId);
      if (resultado.fallo()) {
        setMensajeError(MENSAJE_ERROR_FALLO);
      }
      onResultado?.(resultado);
    } catch {
      setMensajeError(MENSAJE_ERROR_FALLO);
    } finally {
      setEnCurso(false);
    }
  }

  return (
    <>
      <AccionConsultaButton onClick={() => void manejarClick()} disabled={enCurso}>
        {enCurso ? "Exportando…" : "Iniciar exportación"}
      </AccionConsultaButton>
      {mensajeError && (
        <p role="alert" data-testid="exportar-reporte-error">
          {mensajeError}
        </p>
      )}
    </>
  );
}
