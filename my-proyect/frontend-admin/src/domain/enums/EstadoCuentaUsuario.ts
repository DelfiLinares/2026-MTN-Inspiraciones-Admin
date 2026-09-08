/**
 * Enum EstadoCuentaUsuario.
 *
 * Ref: data-model.md → Enums / Value Objects → EstadoCuentaUsuario
 * Ref: tasks.md T007, spec.md FR-005, FR-006, US3
 *
 * Representa el estado administrativo de la cuenta de un usuario. Se usa también para la
 * definición operativa de "usuario activo" en el dashboard (ACTIVO únicamente; ver
 * research.md §7).
 */
export enum EstadoCuentaUsuario {
  ACTIVO = "ACTIVO",
  BANEADO = "BANEADO",
  ELIMINADO = "ELIMINADO",
}
