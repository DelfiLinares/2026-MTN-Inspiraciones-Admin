/**
 * Test de `PromoverUsuarioAction`.
 *
 * Ref: tasks.md T061 (depende de T059), spec.md FR-007, SC-002, "la opción no debe existir para
 * roles USER".
 *
 * Cubre principalmente que la acción **no se renderiza** cuando el actor autenticado no tiene rol
 * ADMIN (aunque el usuario objetivo sí sea promovible), y adicionalmente los otros casos de
 * visibilidad: actor ADMIN + objetivo promovible (se renderiza), y actor ADMIN + objetivo no
 * promovible (no se renderiza).
 *
 * Mockea `obtenerServiceFactory` (T044) para controlar `authAdminService.obtenerSesionActual()`
 * sin depender de un login real ni de `httpClient`.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PromoverUsuarioAction } from "@/presentation/usuarios/PromoverUsuarioAction";
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
      id: "actor1",
      nombre: "Actor",
      email: "actor@example.com",
      rol,
      estadoCuenta: EstadoCuentaUsuario.ACTIVO,
      fechaRegistro: new Date("2026-01-01T00:00:00Z"),
    }),
  });
}

function crearUsuarioObjetivo(rol: RolUsuario, estadoCuenta: EstadoCuentaUsuario): Usuario {
  return new Usuario({
    id: "u1",
    nombre: "Usuario objetivo",
    email: "objetivo@example.com",
    rol,
    estadoCuenta,
    fechaRegistro: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("PromoverUsuarioAction", () => {
  it("NO renderiza la acción cuando el actor autenticado no tiene rol ADMIN (FR-007, SC-002)", () => {
    obtenerSesionActualMock.mockReturnValue(crearSesion(RolUsuario.USER));
    const usuarioPromovible = crearUsuarioObjetivo(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO);

    render(<PromoverUsuarioAction usuario={usuarioPromovible} onPromover={vi.fn()} />);

    expect(screen.queryByText("Promover a administrador")).not.toBeInTheDocument();
  });

  it("NO renderiza la acción cuando no hay sesión (sin actor autenticado)", () => {
    obtenerSesionActualMock.mockReturnValue(null);
    const usuarioPromovible = crearUsuarioObjetivo(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO);

    render(<PromoverUsuarioAction usuario={usuarioPromovible} onPromover={vi.fn()} />);

    expect(screen.queryByText("Promover a administrador")).not.toBeInTheDocument();
  });

  it("renderiza la acción cuando el actor es ADMIN y el usuario objetivo puede ser promovido", () => {
    obtenerSesionActualMock.mockReturnValue(crearSesion(RolUsuario.ADMIN));
    const usuarioPromovible = crearUsuarioObjetivo(RolUsuario.USER, EstadoCuentaUsuario.ACTIVO);

    render(<PromoverUsuarioAction usuario={usuarioPromovible} onPromover={vi.fn()} />);

    expect(screen.getByText("Promover a administrador")).toBeInTheDocument();
  });

  it("NO renderiza la acción cuando el actor es ADMIN pero el usuario objetivo no puede ser promovido", () => {
    obtenerSesionActualMock.mockReturnValue(crearSesion(RolUsuario.ADMIN));
    const usuarioYaAdmin = crearUsuarioObjetivo(RolUsuario.ADMIN, EstadoCuentaUsuario.ACTIVO);

    render(<PromoverUsuarioAction usuario={usuarioYaAdmin} onPromover={vi.fn()} />);

    expect(screen.queryByText("Promover a administrador")).not.toBeInTheDocument();
  });
});
