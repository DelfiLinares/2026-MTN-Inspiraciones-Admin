/**
 * `AprobarRechazarDesafioActions`: acciones "aprobar" y "rechazar" un desafío propuesto.
 *
 * Ref: tasks.md T073 (depende de T022, T072), spec.md FR-014, FR-015, US5 escenario 5.
 *
 * FR-014/FR-015: aprobar o rechazar un desafío propuesto es una decisión final e irreversible
 * (Clarifications Session 2026-09-08): una vez que el desafío deja de estar PENDIENTE, ninguna de
 * las dos acciones puede volver a ejecutarse. La visibilidad/habilitación de ambas acciones se
 * decide con `Desafio.estaPendiente()` (T022): si no está pendiente, no se renderiza ninguna.
 *
 * A diferencia de las acciones destructivas sobre usuarios/publicaciones (FR-021/FR-022), T073 no
 * depende de `ModalConfirmacionExplicita` (T050) según tasks.md, igual que `ResolverReporteAction`
 * (T067): se usa `AccionSensibleButton` (T049) por tratarse de una decisión final/irreversible,
 * sin modal de confirmación adicional.
 *
 * No invoca `DesafiosService.aprobar`/`rechazar` directamente: delega en `onAprobar`/`onRechazar`,
 * que la pantalla contenedora (`DetalleDesafioPage`, T072) conectará con el servicio, para no
 * acoplar este componente a la capa de aplicación.
 */
import type { Desafio } from "../../domain/Desafio";
import { AccionSensibleButton } from "../shared/AccionSensibleButton";

export interface AprobarRechazarDesafioActionsProps {
  desafio: Desafio;
  /** Invocado al aprobar el desafío (típicamente llama a `DesafiosService.aprobar`). */
  onAprobar: (desafioId: string) => void;
  /** Invocado al rechazar el desafío (típicamente llama a `DesafiosService.rechazar`). */
  onRechazar: (desafioId: string) => void;
}

/** Ref: FR-014, FR-015, US5 escenario 5 — habilitadas solo si el desafío está PENDIENTE. */
export function AprobarRechazarDesafioActions({
  desafio,
  onAprobar,
  onRechazar,
}: AprobarRechazarDesafioActionsProps): JSX.Element | null {
  // Ref: FR-014, FR-015 — decisión final e irreversible: solo aplica mientras está PENDIENTE.
  if (!desafio.estaPendiente()) {
    return null;
  }

  return (
    <>
      <AccionSensibleButton onClick={() => onAprobar(desafio.id)}>
        Aprobar desafío
      </AccionSensibleButton>
      <AccionSensibleButton onClick={() => onRechazar(desafio.id)}>
        Rechazar desafío
      </AccionSensibleButton>
    </>
  );
}
