/**
 * `UsuariosTable`: tabla presentacional de usuarios.
 *
 * Ref: tasks.md T056 (depende de T019, T049), spec.md US3, FR-004.
 *
 * Componente puramente presentacional (solo props, sin llamadas a servicios ni estado propio):
 * recibe la lista de entidades `Usuario` (T019) ya resuelta por `UsuariosPage` (T055) y las
 * renderiza en una tabla. No conoce `UsuariosService` ni realiza búsquedas/paginación por sí
 * mismo (esa orquestación vive en `UsuariosPage`).
 *
 * Las acciones administrativas (banear, eliminar, promover — T057, T058, T059, que usan
 * `AccionSensibleButton`/`AccionConsultaButton` de T049) no se implementan aquí: esta tabla expone
 * un slot opcional `renderAcciones` por fila para que esas tareas futuras inyecten sus botones sin
 * modificar este componente ni adelantar su alcance.
 */
import type { ReactNode } from "react";
import type { Usuario } from "../../domain/Usuario";

export interface UsuariosTableProps {
  /** Usuarios a mostrar (ya resueltos/paginados por quien use esta tabla). */
  usuarios: Usuario[];
  /** Slot opcional para renderizar acciones por fila (banear/eliminar/promover, T057–T059). */
  renderAcciones?: (usuario: Usuario) => ReactNode;
}

/** Ref: US3, FR-004 — tabla presentacional de usuarios, sin lógica de acceso a datos. */
export function UsuariosTable({ usuarios, renderAcciones }: UsuariosTableProps): JSX.Element {
  return (
    <table data-testid="usuarios-tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Estado</th>
          {renderAcciones && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) => (
          <tr key={usuario.id} data-testid="usuarios-fila">
            <td>{usuario.nombre}</td>
            <td>{usuario.email}</td>
            <td>{usuario.rol}</td>
            <td>{usuario.estadoCuenta}</td>
            {renderAcciones && <td>{renderAcciones(usuario)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
