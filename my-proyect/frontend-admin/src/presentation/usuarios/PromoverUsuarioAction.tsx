/**
 * `PromoverUsuarioAction`: acción "promover a administrador" con confirmación explícita.
 *
 * Ref: tasks.md T059 (depende de T019, T033, T050, T055), spec.md FR-007, FR-022,
 * "la opción no debe existir para roles USER".
 *
 * FR-007: permite promover un usuario a administrador. FR-022: exige confirmación explícita antes
 * de ejecutar la acción (vía `ModalConfirmacionExplicita`, T050). La acción es visible únicamente
 * si se cumplen DOS condiciones independientes:
 * - El actor autenticado (obtenido de `AuthAdminService.obtenerSesionActual()`, T027, a través de
 *   `serviceFactory`, T044) tiene rol ADMIN (`tienePermisoDeAdministrador()`, T023) — "la opción
 *   no debe existir para roles USER".
 * - El usuario objetivo `puedeSerPromovidoAAdmin()` (T019: rol USER y cuenta ACTIVA).
 *
 * Si cualquiera de las dos condiciones no se cumple, el componente no renderiza nada. La
 * verificación de permiso del actor se repite también en `UsuariosService.promover` (T033) como
 * defensa en profundidad; este componente evita además mostrar una opción inalcanzable en la UI.
 */
import { useState } from "react";
import type { Usuario } from "../../domain/Usuario";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import { AccionSensibleButton } from "../shared/AccionSensibleButton";
import { ModalConfirmacionExplicita } from "../shared/ModalConfirmacionExplicita";

export interface PromoverUsuarioActionProps {
  usuario: Usuario;
  /** Invocado tras confirmar explícitamente la promoción (típicamente llama a `UsuariosService.promover`). */
  onPromover: (usuarioId: string) => void;
}

/**
 * Ref: FR-007, FR-022 — promover a administrador, visible solo si el actor autenticado es ADMIN y
 * el usuario objetivo puede ser promovido.
 */
export function PromoverUsuarioAction({
  usuario,
  onPromover,
}: PromoverUsuarioActionProps): JSX.Element | null {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { authAdminService } = obtenerServiceFactory();

  const sesionActor = authAdminService.obtenerSesionActual();
  const actorEsAdmin = sesionActor?.tienePermisoDeAdministrador() ?? false;

  // Ref: "la opción no debe existir para roles USER" + FR-007 (usuario.puedeSerPromovidoAAdmin()).
  if (!actorEsAdmin || !usuario.puedeSerPromovidoAAdmin()) {
    return null;
  }

  return (
    <>
      <AccionSensibleButton onClick={() => setModalAbierto(true)}>
        Promover a administrador
      </AccionSensibleButton>
      <ModalConfirmacionExplicita
        abierto={modalAbierto}
        titulo="Promover a administrador"
        mensaje={`¿Confirmás que querés promover a "${usuario.nombre}" a administrador? Obtendrá permisos elevados.`}
        textoConfirmar="Sí, promover"
        onConfirmar={() => {
          setModalAbierto(false);
          onPromover(usuario.id);
        }}
        onCancelar={() => setModalAbierto(false)}
      />
    </>
  );
}
