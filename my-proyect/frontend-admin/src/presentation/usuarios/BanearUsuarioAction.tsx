/**
 * `BanearUsuarioAction`: acción "banear usuario" con confirmación explícita.
 *
 * Ref: tasks.md T057 (depende de T019, T050, T055), spec.md FR-005, FR-021, FR-029,
 * Clarifications Session 2026-09-08 preguntas 2.1/2.2.
 *
 * FR-005: permite banear a un usuario. FR-021: exige confirmación explícita antes de ejecutar la
 * acción (vía `ModalConfirmacionExplicita`, T050). FR-029 (Clarifications Session 2026-09-08): un
 * usuario con rol ADMIN nunca puede ser baneado desde este módulo, sin excepción (incluido el
 * propio actor autenticado) — regla ya encapsulada en `Usuario.puedeSerBaneado()` (T019), que este
 * componente usa como única fuente de verdad para decidir si mostrar/habilitar la acción.
 *
 * Usa `AccionSensibleButton` (T049) para la diferenciación visual exigida por FR-023.
 */
import { useState } from "react";
import type { Usuario } from "../../domain/Usuario";
import { AccionSensibleButton } from "../shared/AccionSensibleButton";
import { ModalConfirmacionExplicita } from "../shared/ModalConfirmacionExplicita";

export interface BanearUsuarioActionProps {
  usuario: Usuario;
  /** Invocado tras confirmar explícitamente el baneo (típicamente llama a `UsuariosService.banear`). */
  onBanear: (usuarioId: string) => void;
}

/** Ref: FR-005, FR-021, FR-029 — banear usuario, deshabilitado/oculto para usuarios con rol ADMIN. */
export function BanearUsuarioAction({ usuario, onBanear }: BanearUsuarioActionProps): JSX.Element | null {
  const [modalAbierto, setModalAbierto] = useState(false);

  // Ref: FR-029 — ningún usuario con rol ADMIN puede ser baneado, sin excepción (ni siquiera por
  // otro ADMIN ni por sí mismo). Si la acción no es aplicable, no se renderiza nada.
  if (!usuario.puedeSerBaneado()) {
    return null;
  }

  return (
    <>
      <AccionSensibleButton onClick={() => setModalAbierto(true)}>Banear</AccionSensibleButton>
      <ModalConfirmacionExplicita
        abierto={modalAbierto}
        titulo="Banear usuario"
        mensaje={`¿Confirmás que querés banear a "${usuario.nombre}"? El usuario perderá acceso a la plataforma.`}
        textoConfirmar="Sí, banear"
        onConfirmar={() => {
          setModalAbierto(false);
          onBanear(usuario.id);
        }}
        onCancelar={() => setModalAbierto(false)}
      />
    </>
  );
}
