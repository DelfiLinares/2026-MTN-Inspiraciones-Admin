/**
 * `AppRouter`: enrutador SPA del frontend-admin.
 *
 * Ref: tasks.md T047 (depende de T002), spec.md US1 (acceso al módulo administrativo), FR-002.
 *
 * Define las rutas de las 6 pantallas del módulo administrativo:
 * `/login`, `/dashboard`, `/usuarios`, `/moderacion`, `/desafios`, `/reportes`.
 *
 * Este componente solo configura el ruteo (capa de presentación). No implementa aún:
 * - El guard de rol "solo ADMIN" (`RequireAdmin`, T048), que se aplicará sobre las rutas
 *   administrativas en una tarea posterior.
 * - Las pantallas concretas (`LoginAdminPage` T051, `DashboardPage` T051bis, y las pantallas de
 *   Usuarios/Moderación/Desafíos/Reportes de las Fases 6–9), que hoy se representan con
 *   placeholders mínimos para no adelantar trabajo de otras tareas.
 */
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";

/** Placeholder temporal de una pantalla aún no implementada (reemplazado en su tarea correspondiente). */
function PantallaPendiente({ nombre }: { nombre: string }): JSX.Element {
  return <div>Pantalla "{nombre}" pendiente de implementación.</div>;
}

export function AppRouter(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PantallaPendiente nombre="Login" />} />
        <Route path="/dashboard" element={<PantallaPendiente nombre="Dashboard" />} />
        <Route path="/usuarios" element={<PantallaPendiente nombre="Usuarios" />} />
        <Route path="/moderacion" element={<PantallaPendiente nombre="Moderación" />} />
        <Route path="/desafios" element={<PantallaPendiente nombre="Desafíos" />} />
        <Route path="/reportes" element={<PantallaPendiente nombre="Reportes" />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
