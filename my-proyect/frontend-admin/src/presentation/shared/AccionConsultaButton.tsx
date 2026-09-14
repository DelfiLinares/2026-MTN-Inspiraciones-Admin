/**
 * `AccionConsultaButton`: botón para acciones de solo consulta/lectura (ver detalle, listar,
 * descargar, etc.).
 *
 * Ref: tasks.md T049 (depende de T001), spec.md FR-023 (diferenciación visual de acciones
 * sensibles respecto de acciones de solo consulta/lectura).
 *
 * Estilo neutro (sin color de advertencia ni ícono de alerta), para que se distinga claramente de
 * `AccionSensibleButton` en toda la interfaz.
 */
import type { ButtonHTMLAttributes } from "react";

export interface AccionConsultaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto del botón (p. ej. "Ver detalle", "Descargar", "Actualizar listado"). */
  children: React.ReactNode;
}

/** Ref: FR-023 — estilo neutro para acciones de solo consulta/lectura. */
export function AccionConsultaButton({
  children,
  className,
  ...props
}: AccionConsultaButtonProps): JSX.Element {
  const clases = ["accion-consulta-button", className].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      data-testid="accion-consulta-button"
      aria-label={typeof children === "string" ? children : undefined}
      className={clases}
      {...props}
    >
      <span className="accion-consulta-button__texto">{children}</span>
    </button>
  );
}
