/**
 * Test de `BanearUsuarioAction` / `EliminarUsuarioAction`.
 *
 * Ref: tasks.md T062 (depende de T057, T058), spec.md FR-021, FR-029, SC-004, Clarifications
 * Session 2026-09-08 preguntas 2.1/2.2.
 *
 * Cubre:
 * (a) confirmación explícita antes de invocar el servicio: el callback (`onBanear`/`onEliminar`)
 *     NO se invoca solo al hacer click en el botón sensible, solo tras confirmar en el modal.
 * (b) la acción está deshabilitada/oculta para CUALQUIER usuario objetivo con rol ADMIN, incluido
 *     el propio actor autenticado (no solo autobaneo/autoeliminación clásicos) — FR-029.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BanearUsuarioAction } from "@/presentation/usuarios/BanearUsuarioAction";
import { EliminarUsuarioAction } from "@/presentation/usuarios/EliminarUsuarioAction";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

function crearUsuario(
  id: string,
  rol: RolUsuario,
  estadoCuenta: EstadoCuentaUsuario = EstadoCuentaUsuario.ACTIVO,
): Usuario {
  return new Usuario({
    id,
    nombre: `Usuario ${id}`,
    email: `${id}@example.com`,
    rol,
    estadoCuenta,
    fechaRegistro: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("BanearUsuarioAction", () => {
  it("(a) no invoca onBanear solo con el click inicial; requiere confirmación explícita (FR-021)", () => {
    const onBanear = vi.fn();
    const usuario = crearUsuario("u1", RolUsuario.USER);

    render(<BanearUsuarioAction usuario={usuario} onBanear={onBanear} />);

    fireEvent.click(screen.getByText("Banear"));
    expect(onBanear).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));
    expect(onBanear).toHaveBeenCalledWith("u1");
  });

  it("no invoca onBanear si se cancela la confirmación", () => {
    const onBanear = vi.fn();
    const usuario = crearUsuario("u1", RolUsuario.USER);

    render(<BanearUsuarioAction usuario={usuario} onBanear={onBanear} />);

    fireEvent.click(screen.getByText("Banear"));
    fireEvent.click(screen.getByTestId("modal-confirmacion-cancelar"));

    expect(onBanear).not.toHaveBeenCalled();
  });

  it("(b) no se renderiza para un usuario objetivo con rol ADMIN (incluido el propio actor autenticado, FR-029)", () => {
    // El "propio actor autenticado" también es, en este contexto, un `Usuario` con rol ADMIN: la
    // regla de dominio `puedeSerBaneado()` no distingue identidad, por lo que cualquier ADMIN
    // (sea el actor o un tercero) queda cubierto por el mismo caso.
    const usuarioAdmin = crearUsuario("actor-o-tercero-admin", RolUsuario.ADMIN);

    render(<BanearUsuarioAction usuario={usuarioAdmin} onBanear={vi.fn()} />);

    expect(screen.queryByText("Banear")).not.toBeInTheDocument();
  });

  it("no se renderiza para un usuario con cuenta no ACTIVA", () => {
    const usuarioBaneado = crearUsuario("u2", RolUsuario.USER, EstadoCuentaUsuario.BANEADO);

    render(<BanearUsuarioAction usuario={usuarioBaneado} onBanear={vi.fn()} />);

    expect(screen.queryByText("Banear")).not.toBeInTheDocument();
  });
});

describe("EliminarUsuarioAction", () => {
  it("(a) no invoca onEliminar solo con el click inicial; requiere confirmación explícita (FR-021)", () => {
    const onEliminar = vi.fn();
    const usuario = crearUsuario("u1", RolUsuario.USER);

    render(<EliminarUsuarioAction usuario={usuario} onEliminar={onEliminar} />);

    fireEvent.click(screen.getByText("Eliminar"));
    expect(onEliminar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));
    expect(onEliminar).toHaveBeenCalledWith("u1");
  });

  it("no invoca onEliminar si se cancela la confirmación", () => {
    const onEliminar = vi.fn();
    const usuario = crearUsuario("u1", RolUsuario.USER);

    render(<EliminarUsuarioAction usuario={usuario} onEliminar={onEliminar} />);

    fireEvent.click(screen.getByText("Eliminar"));
    fireEvent.click(screen.getByTestId("modal-confirmacion-cancelar"));

    expect(onEliminar).not.toHaveBeenCalled();
  });

  it("(b) no se renderiza para un usuario objetivo con rol ADMIN (incluido el propio actor autenticado, FR-029)", () => {
    const usuarioAdmin = crearUsuario("actor-o-tercero-admin", RolUsuario.ADMIN);

    render(<EliminarUsuarioAction usuario={usuarioAdmin} onEliminar={vi.fn()} />);

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  it("no se renderiza para un usuario con cuenta ya ELIMINADO", () => {
    const usuarioEliminado = crearUsuario("u2", RolUsuario.USER, EstadoCuentaUsuario.ELIMINADO);

    render(<EliminarUsuarioAction usuario={usuarioEliminado} onEliminar={vi.fn()} />);

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });
});
