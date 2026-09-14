/**
 * `EliminarPublicacionAction`: acción "eliminar publicación" con confirmación explícita.
 *
 * Ref: tasks.md T066 (depende de T020, T050, T065), spec.md FR-010, FR-021.
 *
 * FR-010: permite eliminar una publicación reportada, requiriendo confirmación explícita antes de
 * ejecutar la acción (vía `ModalConfirmacionExplicita`, T050), y reflejando el cambio de estado a
 * ELIMINADA. La visibilidad de la acción se decide con `Publicacion.puedeSerEliminada()` (T020):
 * si la publicación ya está ELIMINADA, la acción no se renderiza.
 *
 * No invoca `ModeracionService.eliminarPublicacion` directamente: delega en `onEliminar`, que la
 * pantalla contenedora (`DetalleReportePage`, T065) conectará con el servicio, para no acoplar
 * este componente a la capa de aplicación.
 */
import { useState } from "react";
import type { Publicacion } from "../../domain/Publicacion";
import { AccionSensibleButton } from "../shared/AccionSensibleButton";
import { ModalConfirmacionExplicita } from "../shared/ModalConfirmacionExplicita";

export interface EliminarPublicacionActionProps {
  publicacion: Publicacion;
  /** Invocado tras confirmar explícitamente la eliminación (típicamente llama a `ModeracionService.eliminarPublicacion`). */
  onEliminar: (publicacionId: string) => void;
}

/** Ref: FR-010, FR-021 — eliminar publicación, deshabilitado/oculto si ya está ELIMINADA. */
export function EliminarPublicacionAction({
  publicacion,
  onEliminar,
}: EliminarPublicacionActionProps): JSX.Element | null {
  const [modalAbierto, setModalAbierto] = useState(false);

  // Ref: FR-010 — no tiene sentido volver a eliminar una publicación ya ELIMINADA.
  if (!publicacion.puedeSerEliminada()) {
    return null;
  }

  return (
    <>
      <AccionSensibleButton onClick={() => setModalAbierto(true)}>
        Eliminar publicación
      </AccionSensibleButton>
      <ModalConfirmacionExplicita
        abierto={modalAbierto}
        titulo="Eliminar publicación"
        mensaje={`¿Confirmás que querés eliminar la publicación "${publicacion.titulo}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        onConfirmar={() => {
          setModalAbierto(false);
          onEliminar(publicacion.id);
        }}
        onCancelar={() => setModalAbierto(false)}
      />
    </>
  );
}
