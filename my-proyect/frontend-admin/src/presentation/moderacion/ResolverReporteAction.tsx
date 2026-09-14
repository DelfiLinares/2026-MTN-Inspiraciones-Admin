/**
 * `ResolverReporteAction`: acción "resolver reporte sin eliminar la publicación".
 *
 * Ref: tasks.md T067 (depende de T021, T065), spec.md FR-026, research.md §6.
 *
 * research.md §6 (Clarifications Session 2026-09-08): permite marcar un reporte como resuelto sin
 * eliminar la publicación asociada, cambiando el estado del **reporte** (no de la publicación) a
 * un estado de cierre. Evita forzar al moderador a elegir entre "eliminar" o "no hacer nada" ante
 * un reporte infundado.
 *
 * A diferencia de las acciones destructivas (banear, eliminar, promover — FR-021/FR-022), esta
 * acción no requiere `ModalConfirmacionExplicita` (T067 no depende de T050 en tasks.md): usa
 * `AccionConsultaButton` (T049) por no ser una acción destructiva sobre la publicación. La
 * visibilidad se decide con `Reporte.puedeResolverseSinEliminar()` (T021): solo aplica a reportes
 * `PENDIENTE`.
 *
 * No invoca `ModeracionService.resolverReporteSinEliminar` directamente: delega en `onResolver`,
 * que la pantalla contenedora (`DetalleReportePage`, T065) conectará con el servicio.
 */
import type { Reporte } from "../../domain/Reporte";
import { AccionConsultaButton } from "../shared/AccionConsultaButton";

export interface ResolverReporteActionProps {
  reporte: Reporte;
  /** Invocado al resolver el reporte sin eliminar (típicamente llama a `ModeracionService.resolverReporteSinEliminar`). */
  onResolver: (reporteId: string) => void;
}

/** Ref: FR-026, research.md §6 — resolver reporte sin eliminar, visible solo si está PENDIENTE. */
export function ResolverReporteAction({
  reporte,
  onResolver,
}: ResolverReporteActionProps): JSX.Element | null {
  // Ref: FR-026 — solo tiene sentido resolver un reporte que aún está PENDIENTE.
  if (!reporte.puedeResolverseSinEliminar()) {
    return null;
  }

  return (
    <AccionConsultaButton onClick={() => onResolver(reporte.id)}>
      Resolver sin eliminar
    </AccionConsultaButton>
  );
}
