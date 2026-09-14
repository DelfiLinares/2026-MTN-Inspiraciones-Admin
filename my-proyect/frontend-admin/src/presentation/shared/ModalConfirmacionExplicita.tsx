/**
 * `ModalConfirmacionExplicita`: modal de confirmación reutilizable para toda acción
 * destructiva/sensible.
 *
 * Ref: tasks.md T050 (depende de T001), spec.md FR-021 (confirmación explícita antes de eliminar
 * publicación, eliminar usuario, banear usuario), FR-022 (confirmación explícita antes de
 * promover un usuario a administrador).
 *
 * Componente controlado (sin estado interno de "abierto/cerrado"): la pantalla que lo usa decide
 * cuándo mostrarlo (`abierto`) y qué acción confirma. No ejecuta la acción por sí mismo: delega en
 * `onConfirmar`, que típicamente estará envuelto por `ejecutarAccionSensible` (T043, FR-027) para
 * cancelar la acción si la sesión expira.
 */
import type { ReactNode } from "react";

export interface ModalConfirmacionExplicitaProps {
  /** Controla si el modal se muestra. */
  abierto: boolean;
  /** Título breve de la confirmación (p. ej. "Eliminar publicación"). */
  titulo: string;
  /** Mensaje descriptivo de la consecuencia de la acción (irreversibilidad, alcance, etc.). */
  mensaje: ReactNode;
  /** Texto del botón de confirmación (por defecto "Confirmar"). */
  textoConfirmar?: string;
  /** Texto del botón de cancelación (por defecto "Cancelar"). */
  textoCancelar?: string;
  /** Invocado al confirmar explícitamente la acción sensible. */
  onConfirmar: () => void;
  /** Invocado al cancelar/descartar la confirmación. */
  onCancelar: () => void;
}

/** Ref: FR-021, FR-022 — confirmación explícita antes de ejecutar una acción sensible. */
export function ModalConfirmacionExplicita({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: ModalConfirmacionExplicitaProps): JSX.Element | null {
  if (!abierto) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-confirmacion-explicita-titulo"
      data-testid="modal-confirmacion-explicita"
      className="modal-confirmacion-explicita"
    >
      <h2 id="modal-confirmacion-explicita-titulo">{titulo}</h2>
      <div className="modal-confirmacion-explicita__mensaje">{mensaje}</div>
      <div className="modal-confirmacion-explicita__acciones">
        <button type="button" data-testid="modal-confirmacion-cancelar" onClick={onCancelar}>
          {textoCancelar}
        </button>
        <button type="button" data-testid="modal-confirmacion-confirmar" onClick={onConfirmar}>
          {textoConfirmar}
        </button>
      </div>
    </div>
  );
}
