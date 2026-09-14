/**
 * Test de `ModeracionContainer`.
 *
 * Ref: tasks.md T068 (depende de T063), spec.md FR-008, FR-024.
 *
 * Cubre que el filtrado (motivo, estado del reporte, orden) y la paginación se resuelven vía
 * `ModeracionService.listarPublicacionesReportadas` (server-side), no en memoria: cada cambio de
 * filtro o de página dispara una nueva llamada al servicio con los parámetros correspondientes.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ModeracionContainer } from "@/presentation/moderacion/ModeracionContainer";
import { Reporte } from "@/domain/Reporte";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";

const listarPublicacionesReportadasMock = vi.fn();

vi.mock("@/infrastructure/serviceFactory", () => ({
  obtenerServiceFactory: () => ({
    moderacionService: { listarPublicacionesReportadas: listarPublicacionesReportadasMock },
  }),
}));

function crearReporte(id: string): Reporte {
  return new Reporte({
    id,
    publicacionId: `pub-${id}`,
    reportanteId: "reportante1",
    motivo: MotivoReporte.SPAM,
    estado: EstadoReporte.PENDIENTE,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
    prioridad: "ALTA",
  });
}

function paginaDe(reportes: Reporte[], paginaActual: number, totalPaginas: number) {
  return {
    contenido: reportes,
    totalElementos: reportes.length,
    totalPaginas,
    paginaActual,
  };
}

describe("ModeracionContainer", () => {
  beforeEach(() => {
    listarPublicacionesReportadasMock.mockReset();
  });

  it("resuelve la búsqueda inicial vía el servicio con filtros por defecto (FR-008, FR-024)", async () => {
    listarPublicacionesReportadasMock.mockResolvedValue(paginaDe([crearReporte("r1")], 1, 2));

    render(<ModeracionContainer />);

    await waitFor(() => {
      expect(listarPublicacionesReportadasMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        motivo: undefined,
        estadoReporte: undefined,
        ordenarPor: "prioridad",
      });
    });

    expect(await screen.findByText("r1")).toBeInTheDocument();
    expect(screen.getByTestId("moderacion-pagina-actual")).toHaveTextContent("Página 1 de 2");
  });

  it("al cambiar el filtro de motivo, consulta al servicio con ese motivo y reinicia a la página 1 (FR-024)", async () => {
    listarPublicacionesReportadasMock.mockResolvedValue(paginaDe([crearReporte("r1")], 1, 1));

    render(<ModeracionContainer />);

    await waitFor(() => expect(listarPublicacionesReportadasMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Motivo"), {
      target: { value: MotivoReporte.SPAM },
    });

    await waitFor(() => {
      expect(listarPublicacionesReportadasMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        motivo: MotivoReporte.SPAM,
        estadoReporte: undefined,
        ordenarPor: "prioridad",
      });
    });
  });

  it("al cambiar el filtro de estado del reporte, consulta al servicio con ese estado (FR-024)", async () => {
    listarPublicacionesReportadasMock.mockResolvedValue(paginaDe([crearReporte("r1")], 1, 1));

    render(<ModeracionContainer />);

    await waitFor(() => expect(listarPublicacionesReportadasMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Estado del reporte"), {
      target: { value: EstadoReporte.PENDIENTE },
    });

    await waitFor(() => {
      expect(listarPublicacionesReportadasMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        motivo: undefined,
        estadoReporte: EstadoReporte.PENDIENTE,
        ordenarPor: "prioridad",
      });
    });
  });

  it("al cambiar el orden, consulta al servicio con el nuevo criterio de orden (FR-024)", async () => {
    listarPublicacionesReportadasMock.mockResolvedValue(paginaDe([crearReporte("r1")], 1, 1));

    render(<ModeracionContainer />);

    await waitFor(() => expect(listarPublicacionesReportadasMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "antiguedad" },
    });

    await waitFor(() => {
      expect(listarPublicacionesReportadasMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        motivo: undefined,
        estadoReporte: undefined,
        ordenarPor: "antiguedad",
      });
    });
  });

  it("al avanzar de página, consulta al servicio la página siguiente sin filtrar en memoria (FR-024)", async () => {
    listarPublicacionesReportadasMock.mockResolvedValueOnce(paginaDe([crearReporte("r1")], 1, 2));
    listarPublicacionesReportadasMock.mockResolvedValueOnce(paginaDe([crearReporte("r2")], 2, 2));

    render(<ModeracionContainer />);

    await screen.findByText("r1");

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    await waitFor(() => {
      expect(listarPublicacionesReportadasMock).toHaveBeenLastCalledWith({
        page: 2,
        pageSize: 20,
        motivo: undefined,
        estadoReporte: undefined,
        ordenarPor: "prioridad",
      });
    });
    expect(await screen.findByText("r2")).toBeInTheDocument();
  });

  it("muestra un mensaje de error si la búsqueda falla, sin romper la pantalla", async () => {
    listarPublicacionesReportadasMock.mockRejectedValue(new Error("Error de red"));

    render(<ModeracionContainer />);

    await waitFor(() => {
      expect(screen.getByTestId("moderacion-error")).toBeInTheDocument();
    });
  });
});
