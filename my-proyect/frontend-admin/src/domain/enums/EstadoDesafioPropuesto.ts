/**
 * Enum EstadoDesafioPropuesto.
 *
 * Ref: data-model.md → Enums / Value Objects → EstadoDesafioPropuesto
 * Ref: tasks.md T009, spec.md FR-014, FR-015, FR-016, US5
 *
 * Representa el estado de un desafío propuesto y determina si las acciones
 * aprobar/rechazar están habilitadas.
 */
export enum EstadoDesafioPropuesto {
  PENDIENTE = "PENDIENTE",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
}
