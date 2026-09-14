/**
 * Test de `DescargarReporteAction`.
 *
 * Ref: tasks.md T080 (depende de T078), spec.md FR-019.
 *
 * Cubre que la acción de descarga se habilita únicamente cuando la exportación síncrona fue
 * exitosa (`ExportacionReporte.estaListoParaDescargar()`), y que no se renderiza cuando falló o
 * cuando aún no hay `urlDescarga` disponible.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DescargarReporteAction } from "@/presentation/reportes/DescargarReporteAction";
import { ExportacionReporte } from "@/domain/ExportacionReporte";

describe("DescargarReporteAction", () => {
  it("se renderiza con el enlace de descarga cuando la exportación fue exitosa (FR-019)", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: true,
      urlDescarga: "https://ejemplo.com/reporte-1.csv",
      mensajeError: null,
    });

    render(<DescargarReporteAction exportacion={exportacion} />);

    const enlace = screen.getByTestId("descargar-reporte-action");
    expect(enlace).toBeInTheDocument();
    expect(enlace).toHaveAttribute("href", "https://ejemplo.com/reporte-1.csv");
    expect(screen.getByText("Descargar reporte")).toBeInTheDocument();
  });

  it("no se renderiza cuando la exportación falló (FR-019)", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: false,
      urlDescarga: null,
      mensajeError: "motivo interno del backend",
    });

    const { container } = render(<DescargarReporteAction exportacion={exportacion} />);

    expect(screen.queryByTestId("descargar-reporte-action")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("no se renderiza si exitoso es true pero aún no hay urlDescarga disponible (FR-019)", () => {
    const exportacion = new ExportacionReporte({
      reporteAnaliticaId: "reporte-1",
      exitoso: true,
      urlDescarga: null,
      mensajeError: null,
    });

    render(<DescargarReporteAction exportacion={exportacion} />);

    expect(screen.queryByTestId("descargar-reporte-action")).not.toBeInTheDocument();
  });
});
