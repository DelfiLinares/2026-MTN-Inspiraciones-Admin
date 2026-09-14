/**
 * `AccionSensibleButton`: botón para acciones sensibles (eliminar, banear, promover).
 *
 * Ref: tasks.md T049 (depende de T001), spec.md FR-023 (diferenciación visual de acciones
 * sensibles respecto de acciones de solo consulta/lectura).
 *
 * Estilo distintivo (color de advertencia + ícono) para que el administrador identifique de un
 * vistazo que la acción es destructiva/irreversible o de alto impacto. No incluye por sí mismo la
 * confirmación explícita (FR-021, FR-022): eso corresponde a `ModalConfirmacionExplicita` (T050),
 * que envuelve el flujo de click de este botón.
 */
import type { ButtonHTMLAttributes } from "react";

export interface AccionSensibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto del botón (p. ej. "Eliminar", "Banear", "Promover a administrador"). */
  children: React.ReactNode;
}

/** Ref: FR-023 — estilo distintivo (color de advertencia) para acciones sensibles. */
export function AccionSensibleButton({
  children,
  className,
  ...props
}: AccionSensibleButtonProps): JSX.Element {
  const clases = ["accion-sensible-button", className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      data-testid="accion-sensible-button"
      aria-label={typeof children === "string" ? children : undefined}
      className={clases}
      {...props}
    >
      <span aria-hidden="true" className="accion-sensible-button__icono">
        ⚠
      </span>
      <span className="accion-sensible-button__texto">{children}</span>
    </button>
  );
}
