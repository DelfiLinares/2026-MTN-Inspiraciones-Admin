/**
 * `RequireAdmin`: guard de ruta "solo ADMIN".
 *
 * Ref: tasks.md T048 (depende de T023, T044), spec.md FR-002, US1.
 *
 * Bloquea el acceso a cualquier ruta administrativa si no hay una `SesionAdministrativa` vigente
 * cuyo `tienePermisoDeAdministrador()` (T023) sea verdadero: en ese caso redirige a `/login` en
 * lugar de renderizar la ruta protegida (defensa en profundidad en el cliente; el backend también
 * rechaza acciones no-ADMIN, research.md §2).
 *
 * Consulta la sesión a través de `AuthAdminService.obtenerSesionActual()` (T027), obtenido de la
 * instancia compartida de `serviceFactory` (T044) para reflejar la misma sesión establecida por el
 * login.
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { obtenerServiceFactory } from "../infrastructure/serviceFactory";

export interface RequireAdminProps {
  children: ReactNode;
}

/** Ref: FR-002, US1 — solo usuarios con rol ADMIN acceden al módulo administrativo. */
export function RequireAdmin({ children }: RequireAdminProps): JSX.Element {
  const { authAdminService } = obtenerServiceFactory();
  const sesion = authAdminService.obtenerSesionActual();

  if (!sesion || !sesion.tienePermisoDeAdministrador()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
