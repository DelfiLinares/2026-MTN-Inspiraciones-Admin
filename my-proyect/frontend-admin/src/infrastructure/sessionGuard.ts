/**
 * `sessionGuard`: interceptor/guardia de expiración de sesión durante acciones sensibles.
 *
 * Ref: tasks.md T043 (depende de T041), spec.md FR-027, research.md §2.
 *
 * FR-027: si la sesión del administrador expira durante la ejecución de una acción sensible
 * (eliminar, banear, promover), el sistema MUST cancelar esa acción en curso, descartar la
 * confirmación pendiente y redirigir al login con un mensaje explícito de que la acción no fue
 * aplicada. Decisión confirmada en research.md §2 (Clarifications Session 2026-09-08): no se
 * reintenta automáticamente ni se reautentica en silencio, para no ejecutar una acción
 * destructiva sin confirmación explícita del administrador.
 *
 * `ejecutarAccionSensible` envuelve cualquier acción sensible (llamada a
 * UsuariosService/ModeracionService/DesafiosService) verificando la validez de la sesión antes de
 * invocarla y capturando errores 401/403 (`HttpUnauthorizedError`/`HttpForbiddenError`, T040)
 * emitidos durante su ejecución, tratándolos como expiración/pérdida de sesión: en ambos casos se
 * cancela la acción, se limpia la sesión y se notifica mediante `onSesionExpirada`.
 */
import { esValida, limpiarSesion } from "./sessionManager";
import { HttpForbiddenError, HttpUnauthorizedError } from "./httpClient";

export const MENSAJE_SESION_EXPIRADA =
  "La sesión expiró. La acción no fue aplicada. Iniciá sesión nuevamente.";

/** Error de guardia: la acción sensible fue cancelada por expiración/pérdida de sesión. */
export class SesionExpiradaError extends Error {
  constructor() {
    super(MENSAJE_SESION_EXPIRADA);
    this.name = "SesionExpiradaError";
  }
}

export interface SessionGuardOptions {
  /**
   * Callback invocado cuando la sesión expiró (antes o durante la acción). Aquí la capa de
   * presentación (Fase 5+) debe descartar la confirmación pendiente y redirigir al login
   * mostrando `MENSAJE_SESION_EXPIRADA`.
   */
  onSesionExpirada?: (mensaje: string) => void;
  /** Reloj inyectable para tests; por defecto `new Date()`. */
  ahora?: () => Date;
}

/**
 * Ejecuta una acción sensible (eliminar, banear, promover, aprobar/rechazar desafío, etc.)
 * respetando FR-027: si la sesión ya no es válida antes de ejecutar, o si la acción falla con
 * 401/403 durante su ejecución, la acción se cancela, la sesión se limpia y se notifica
 * `onSesionExpirada` en lugar de propagar el resultado parcial de la acción.
 */
export async function ejecutarAccionSensible<T>(
  accion: () => Promise<T>,
  options: SessionGuardOptions = {},
): Promise<T> {
  const ahora = options.ahora ?? (() => new Date());

  if (!esValida(ahora())) {
    limpiarSesion();
    options.onSesionExpirada?.(MENSAJE_SESION_EXPIRADA);
    throw new SesionExpiradaError();
  }

  try {
    return await accion();
  } catch (error) {
    if (error instanceof HttpUnauthorizedError || error instanceof HttpForbiddenError) {
      limpiarSesion();
      options.onSesionExpirada?.(MENSAJE_SESION_EXPIRADA);
      throw new SesionExpiradaError();
    }
    throw error;
  }
}
