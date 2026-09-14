/**
 * Test de `DesafiosPage`.
 *
 * Ref: tasks.md T074 (depende de T071), spec.md FR-012.
 *
 * Cubre que la pantalla filtra por estado PENDIENTE por defecto (caso de uso principal de
 * moderación: desafíos a revisar) y que el filtrado/paginación se resuelve vía
 * `DesafiosService.listarDesafios` (server-side), renderizando exactamente el contenido de la
 * página devuelta por el servicio, sin filtrar en memoria.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DesafiosPage } from "@/presentation/desafios/DesafiosPage";
import { Desafio } from "@/domain/Desafio";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";

const listarDesafiosMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    desafiosService: { listarDesafios: listarDesafiosMock },
  }),
}));

function crearDesafio(id: string, titulo: string, estado: EstadoDesafioPropuesto): Desafio {
  return new Desafio({
    id,
    autorId: "autor-1",
    titulo,
    descripcion: "Descripción de prueba",
    estado,
    fechaPropuesta: new Date("2026-01-01T00:00:00Z"),
  });
}

function paginaDe(desafios: Desafio[], paginaActual: number, totalPaginas: number) {
  return {
    contenido: desafios,
    totalElementos: desafios.length,
    totalPaginas,
    paginaActual,
  };
}

describe("DesafiosPage", () => {
  beforeEach(() => {
    listarDesafiosMock.mockReset();
  });

  it("al cargar, consulta al servicio filtrando por PENDIENTE por defecto y renderiza el contenido devuelto (FR-012)", async () => {
    listarDesafiosMock.mockResolvedValue(
      paginaDe(
        [
          crearDesafio("d1", "Desafío uno", EstadoDesafioPropuesto.PENDIENTE),
          crearDesafio("d2", "Desafío dos", EstadoDesafioPropuesto.PENDIENTE),
        ],
        1,
        1,
      ),
    );

    render(<DesafiosPage />);

    await waitFor(() => {
      expect(listarDesafiosMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        estado: EstadoDesafioPropuesto.PENDIENTE,
      });
    });

    expect(await screen.findByText("Desafío uno")).toBeInTheDocument();
    expect(screen.getByText("Desafío dos")).toBeInTheDocument();
  });

  it("al cambiar el filtro de estado, consulta al servicio con el nuevo estado y reinicia a la página 1 (FR-012)", async () => {
    listarDesafiosMock.mockResolvedValue(
      paginaDe([crearDesafio("d1", "Desafío uno", EstadoDesafioPropuesto.PENDIENTE)], 1, 1),
    );

    render(<DesafiosPage />);

    await waitFor(() => expect(listarDesafiosMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: EstadoDesafioPropuesto.APROBADO },
    });

    await waitFor(() => {
      expect(listarDesafiosMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        estado: EstadoDesafioPropuesto.APROBADO,
      });
    });
  });

  it('al seleccionar "Todos", consulta al servicio sin filtro de estado (FR-012)', async () => {
    listarDesafiosMock.mockResolvedValue(
      paginaDe(
        [
          crearDesafio("d1", "Desafío uno", EstadoDesafioPropuesto.PENDIENTE),
          crearDesafio("d2", "Desafío dos", EstadoDesafioPropuesto.RECHAZADO),
        ],
        1,
        1,
      ),
    );

    render(<DesafiosPage />);

    await waitFor(() => expect(listarDesafiosMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "" } });

    await waitFor(() => {
      expect(listarDesafiosMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        estado: undefined,
      });
    });
  });

  it("al avanzar de página, consulta al servicio la página siguiente sin filtrar en memoria (FR-012)", async () => {
    listarDesafiosMock.mockResolvedValueOnce(
      paginaDe([crearDesafio("d1", "Desafío uno", EstadoDesafioPropuesto.PENDIENTE)], 1, 2),
    );
    listarDesafiosMock.mockResolvedValueOnce(
      paginaDe([crearDesafio("d2", "Desafío dos", EstadoDesafioPropuesto.PENDIENTE)], 2, 2),
    );

    render(<DesafiosPage />);

    await screen.findByText("Desafío uno");

    fireEvent.click(screen.getByText("Siguiente"));

    await waitFor(() => {
      expect(listarDesafiosMock).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 20,
        estado: EstadoDesafioPropuesto.PENDIENTE,
      });
    });

    expect(await screen.findByText("Desafío dos")).toBeInTheDocument();
    expect(screen.getByTestId("desafios-pagina-actual")).toHaveTextContent("Página 2 de 2");
  });
});
