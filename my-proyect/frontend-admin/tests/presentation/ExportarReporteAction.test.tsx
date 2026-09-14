/**
 * Test de `ExportarReporteAction`.
 *
 * Ref: tasks.md T079 (depende de T077), spec.md FR-028, Clarifications Session 2026-09-08
 * pregunta 3.
 *
 * Cubre el caso síncrono exitoso (se ofrece el resultado de inmediato, sin estado intermedio: no
 * hay polling ni "exportando" persistente) y el caso síncrono fallido (se muestra el mensaje
 * exacto "Error: Reporte no generado.").
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportarReporteAction } from "@/presentation/reportes/ExportarReporteAction";
import { ExportacionReporte } from "@/domain/ExportacionReporte";

describe("ExportarReporteAction", () => {
  it("caso síncrono exitoso: resuelve de inmediato con el resultado, sin estado intermedio, y lo expone vía onResultado (FR-028)", async () => {
    const resultadoExitoso = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: true,
      urlDescarga: "https://ejemplo.com/reporte-1.csv",
      mensajeError: null,
    });
    const onExportar = vi.fn().mockResolvedValue(resultadoExitoso);
    const onResultado = vi.fn();

    render(
      <ExportarReporteAction
        reporteAnaliticaId="reporte-1"
        onExportar={onExportar}
        onResultado={onResultado}
      />,
    );

    fireEvent.click(screen.getByText("Iniciar exportación"));

    await waitFor(() => {
      expect(onExportar).toHaveBeenCalledWith("reporte-1");
      expect(onResultado).toHaveBeenCalledWith(resultadoExitoso);
    });

    expect(screen.queryByTestId("exportar-reporte-error")).not.toBeInTheDocument();
  });

  it('caso síncrono fallido: muestra el mensaje exacto "Error: Reporte no generado." (FR-028, Clarifications Session 2026-09-08 pregunta 3)', async () => {
    const resultadoFallido = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: false,
      urlDescarga: null,
      mensajeError: "motivo interno del backend",
    });
    const onExportar = vi.fn().mockResolvedValue(resultadoFallido);

    render(<ExportarReporteAction reporteAnaliticaId="reporte-1" onExportar={onExportar} />);

    fireEvent.click(screen.getByText("Iniciar exportación"));

    expect(
      await screen.findByTestId("exportar-reporte-error"),
    ).toHaveTextContent("Error: Reporte no generado.");
  });

  it("si la llamada a onExportar rechaza (error de red), muestra igualmente el mensaje exacto de fallo (FR-028)", async () => {
    const onExportar = vi.fn().mockRejectedValue(new Error("network error"));

    render(<ExportarReporteAction reporteAnaliticaId="reporte-1" onExportar={onExportar} />);

    fireEvent.click(screen.getByText("Iniciar exportación"));

    expect(
      await screen.findByTestId("exportar-reporte-error"),
    ).toHaveTextContent("Error: Reporte no generado.");
  });
});
