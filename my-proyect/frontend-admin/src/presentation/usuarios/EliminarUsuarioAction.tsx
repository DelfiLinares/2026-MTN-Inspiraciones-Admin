/**
 * `EliminarUsuarioAction`: acción "eliminar usuario" con confirmación explícita.
 *
 * Ref: tasks.md T058 (depende de T019, T050, T055), spec.md FR-006, FR-021, FR-029,
 * Clarifications Session 2026-09-08 preguntas 2.1/2.2.
 *
 * FR-006: permite eliminar a un usuario. FR-021: exige confirmación explícita antes de ejecutar la
 * acción (vía `ModalConfirmacionExplicita`, T050). FR-029 (Clarifications Session 2026-09-08): un
 * usuario con rol ADMIN nunca puede ser eliminado desde este módulo, sin excepción (incluido el
 * propio actor autenticado) — regla ya encapsulada en `Usuario.puedeSerEliminado()` (T019), que
 * este componente usa como única fuente de verdad para decidir si mostrar/habilitar la acción.
 *
 * Usa `AccionSensibleButton` (T049) para la diferenciación visual exigida por FR-023.
 */
import { useState } from "react";
import type { Usuario } from "../../domain/Usuario";
import { AccionSensibleButton } from "../shared/AccionSensibleButton";
import { ModalConfirmacionExplicita } from "../shared/ModalConfirmacionExplicita";

export interface EliminarUsuarioActionProps {
  usuario: Usuario;
  /** Invocado tras confirmar explícitamente la eliminación (típicamente llama a `UsuariosService.eliminar`). */
  onEliminar: (usuarioId: string) => void;
}

/** Ref: FR-006, FR-021, FR-029 — eliminar usuario, deshabilitado/oculto para usuarios con rol ADMIN. */
export function EliminarUsuarioAction({
  usuario,
  onEliminar,
}: EliminarUsuarioActionProps): JSX.Element | null {
  const [modalAbierto, setModalAbierto] = useState(false);

  // Ref: FR-029 — ningún usuario con rol ADMIN puede ser eliminado, sin excepción (ni siquiera por
  // otro ADMIN ni por sí mismo). Si la acción no es aplicable, no se renderiza nada.
  if (!usuario.puedeSerEliminado()) {
    return null;
  }

  return (
    <>
      <AccionSensibleButton onClick={() => setModalAbierto(true)}>Eliminar</AccionSensibleButton>
      <ModalConfirmacionExplicita
        abierto={modalAbierto}
        titulo="Eliminar usuario"
        mensaje={`¿Confirmás que querés eliminar a "${usuario.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar"
        onConfirmar={() => {
          setModalAbierto(false);
          onEliminar(usuario.id);
        }}
        onCancelar={() => setModalAbierto(false)}
      />
    </>
  );
}
