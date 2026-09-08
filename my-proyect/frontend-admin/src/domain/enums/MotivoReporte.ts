/**
 * Enum MotivoReporte.
 *
 * Ref: data-model.md → Enums / Value Objects → MotivoReporte
 * Ref: tasks.md T010, spec.md FR-008, FR-009, US2
 *
 * Clasifica el motivo de un reporte sobre una publicación, usado en filtros de la pantalla
 * de moderación. Conjunto adoptado como definitivo para esta versión del módulo.
 */
export enum MotivoReporte {
  CONTENIDO_INAPROPIADO = "CONTENIDO_INAPROPIADO",
  SPAM = "SPAM",
  PLAGIO = "PLAGIO",
  DISCURSO_DE_ODIO = "DISCURSO_DE_ODIO",
  OTRO = "OTRO",
}
