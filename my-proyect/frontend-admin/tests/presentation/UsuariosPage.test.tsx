/**
 * Test de `UsuariosPage`.
 *
 * Ref: tasks.md T060 (depende de T055), spec.md FR-004, FR-024.
 *
 * Cubre que la búsqueda y la paginación se resuelven vía `UsuariosService` (server-side), no en
 * memoria: cada cambio de texto o de página dispara una nueva llamada a
 * `usuariosService.buscarUsuarios` con los parámetros correspondientes, y la pantalla renderiza
 * exactamente el contenido de la página devuelta por el servicio (sin filtrar/paginar localmente).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UsuariosPage } from "@/presentation/usuarios/UsuariosPage";
import { Usuario } from "@/domain/Usuario";
import { RolUsuario } from "@/domain/enums/RolUsuario";
import { EstadoCuentaUsuario } from "@/domain/enums/EstadoCuentaUsuario";

const buscarUsuariosMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    usuariosService: { buscarUsuarios: buscarUsuariosMock },
  }),
}));

function crearUsuario(id: string, nombre: string): Usuario {
  return new Usuario({
    id,
    nombre,
    email: `${id}@example.com`,
    rol: RolUsuario.USER,
    estadoCuenta: EstadoCuentaUsuario.ACTIVO,
    fechaRegistro: new Date("2026-01-01T00:00:00Z"),
  });
}

function paginaDe(usuarios: Usuario[], paginaActual: number, totalPaginas: number) {
  return {
    contenido: usuarios,
    totalElementos: usuarios.length,
    totalPaginas,
    paginaActual,
  };
}

describe("UsuariosPage", () => {
  beforeEach(() => {
    buscarUsuariosMock.mockReset();
  });

  it("resuelve la búsqueda inicial vía el servicio y renderiza el contenido devuelto (FR-004, FR-024)", async () => {
    buscarUsuariosMock.mockResolvedValue(
      paginaDe([crearUsuario("u1", "Ana"), crearUsuario("u2", "Beto")], 1, 3),
    );

    render(<UsuariosPage />);

    await waitFor(() => {
      expect(buscarUsuariosMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        texto: undefined,
      });
    });

    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.getByTestId("usuarios-pagina-actual")).toHaveTextContent("Página 1 de 3");
  });

  it("al escribir en el buscador, consulta al servicio con el texto y reinicia a la página 1 (FR-024)", async () => {
    buscarUsuariosMock.mockResolvedValue(paginaDe([crearUsuario("u1", "Ana")], 1, 1));

    render(<UsuariosPage />);

    await waitFor(() => expect(buscarUsuariosMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "ana" } });

    await waitFor(() => {
      expect(buscarUsuariosMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        texto: "ana",
      });
    });
  });

  it("al avanzar de página, consulta al servicio la página siguiente sin filtrar en memoria (FR-024)", async () => {
    buscarUsuariosMock.mockResolvedValueOnce(
      paginaDe([crearUsuario("u1", "Ana")], 1, 2),
    );
    buscarUsuariosMock.mockResolvedValueOnce(
      paginaDe([crearUsuario("u2", "Beto")], 2, 2),
    );

    render(<UsuariosPage />);

    await screen.findByText("Ana");

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(buscarUsuariosMock).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 20,
        texto: undefined,
      });
    });
    expect(await screen.findByText("Beto")).toBeInTheDocument();
  });

  it("muestra un mensaje de error si la búsqueda falla, sin romper la pantalla", async () => {
    buscarUsuariosMock.mockRejectedValue(new Error("Error de red"));

    render(<UsuariosPage />);

    await waitFor(() => {
      expect(screen.getByTestId("usuarios-error")).toBeInTheDocument();
    });
  });
});
