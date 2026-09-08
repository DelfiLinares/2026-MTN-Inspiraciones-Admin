/**
 * Enum EstadoPublicacion.
 *
 * Ref: data-model.md → Enums / Value Objects → EstadoPublicacion
 * Ref: tasks.md T008, spec.md FR-010, FR-011, US2
 *
 * Representa el estado de una publicación y determina qué acciones de moderación están
 * disponibles sobre ella.
 */
export enum EstadoPublicacion {
  ACTIVA = "ACTIVA",
  REPORTADA = "REPORTADA",
  ELIMINADA = "ELIMINADA",
}
