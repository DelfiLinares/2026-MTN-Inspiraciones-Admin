/**
 * Test de `RequireAdmin`.
 *
 * Ref: tasks.md T052 (depende de T048), spec.md FR-002, SC-002.
 *
 * Cubre: bloquea el acceso (redirige a `/login`) cuando no hay sesión o el usuario no tiene rol
 * ADMIN, y permite el acceso (renderiza `children`) cuando la sesión es válida y es ADMIN.
 *
 * Mockea `obtenerServiceFactory` (T044) para controlar la sesión devuelta por
 * `authAdminService.obtenerSesionActual()` sin depender de un login real ni de `httpClient`.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "@/presentation/RequireAdmin";
import { SesionAdministrativa } from "@/domain/SesionAdministrativa";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

const obtenerSesionActualMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    authAdminService: { obtenerSesionActual: obtenerSesionActualMock },
  }),
}));

function crearSesion(rol: RolUsuario): SesionAdministrativa {
  return new SesionAdministrativa({
    token: "token-abc",
    expiraEn: new Date("2999-01-01T00:00:00Z"),
    usuario: new Usuario({
      id: "u1",
      nombre: "Usuario de prueba",
      email: "usuario@example.com",
      rol,
      estadoCuenta: EstadoCuentaUsuario.ACTIVO,
      fechaRegistro: new Date("2026-01-01T00:00:00Z"),
    }),
  });
}

function renderizarConRuta(): void {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route
          path="/dashboard"
          element={
            <RequireAdmin>
              <div>Contenido protegido</div>
            </RequireAdmin>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAdmin", () => {
  it("bloquea el acceso y redirige a /login cuando no hay sesión (FR-002, SC-002)", () => {
    obtenerSesionActualMock.mockReturnValue(null);

    renderizarConRuta();

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("bloquea el acceso y redirige a /login cuando el usuario no tiene rol ADMIN", () => {
    obtenerSesionActualMock.mockReturnValue(crearSesion(RolUsuario.USER));

    renderizarConRuta();

    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("permite el acceso y renderiza children cuando el usuario tiene rol ADMIN", () => {
    obtenerSesionActualMock.mockReturnValue(crearSesion(RolUsuario.ADMIN));

    renderizarConRuta();

    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});
