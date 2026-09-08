/**
 * Enum EstadoReporte.
 *
 * Ref: data-model.md → Enums / Value Objects → EstadoReporte
 * Ref: tasks.md T011, spec.md FR-026, research.md §6
 *
 * Introducido para soportar la decisión confirmada en research.md §6 (descartar reporte sin
 * eliminar publicación). Permite calcular "reportes pendientes" en el dashboard (US4) sin
 * depender únicamente del estado de la publicación.
 */
export enum EstadoReporte {
  PENDIENTE = "PENDIENTE",
  RESUELTO_SIN_ELIMINAR = "RESUELTO_SIN_ELIMINAR",
  RESUELTO_CON_ELIMINACION = "RESUELTO_CON_ELIMINACION",
}
