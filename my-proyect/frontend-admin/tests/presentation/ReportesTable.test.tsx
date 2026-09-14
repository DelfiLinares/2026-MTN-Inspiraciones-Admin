/**
 * Test de `ReportesTable`.
 *
 * Ref: tasks.md T070 (depende de T064), spec.md FR-025, SC-003.
 *
 * Cubre que se muestra un indicador de antigüedad/prioridad de forma distinguible: distintas
 * clases CSS y texto legible según el nivel de prioridad (ALTA/MEDIA/BAJA), y un texto de
 * antigüedad calculado con `Reporte.antiguedadEnDias()` respecto de una fecha de referencia
 * inyectada, distinguible por fila (`data-testid` propio).
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportesTable } from "@/presentation/moderacion/ReportesTable";
import { Reporte, type PrioridadReporte } from "@/domain/Reporte";
import { MotivoReporte } from "@/domain/enums/MotivoReporte";
import { EstadoReporte } from "@/domain/enums/EstadoReporte";

function crearReporte(
  id: string,
  prioridad: PrioridadReporte,
  fechaCreacion: Date,
): Reporte {
  return new Reporte({
    id,
    publicacionId: `pub-${id}`,
    reportanteId: "reportante1",
    motivo: MotivoReporte.SPAM,
    estado: EstadoReporte.PENDIENTE,
    fechaCreacion,
    prioridad,
  });
}

const FECHA_ACTUAL = new Date("2026-01-10T00:00:00Z");

describe("ReportesTable", () => {
  it("muestra un indicador de prioridad ALTA visualmente distinguible (FR-025, SC-003)", () => {
    const reporte = crearReporte("r1", "ALTA", FECHA_ACTUAL);

    render(<ReportesTable reportes={[reporte]} fechaActual={FECHA_ACTUAL} />);

    const indicador = screen.getByTestId("reporte-prioridad-r1");
    expect(indicador).toHaveTextContent("Prioridad alta");
    expect(indicador.className).toContain("reporte-prioridad--alta");
  });

  it("distingue visualmente las 3 prioridades con clases distintas", () => {
    const reportes = [
      crearReporte("alta", "ALTA", FECHA_ACTUAL),
      crearReporte("media", "MEDIA", FECHA_ACTUAL),
      crearReporte("baja", "BAJA", FECHA_ACTUAL),
    ];

    render(<ReportesTable reportes={reportes} fechaActual={FECHA_ACTUAL} />);

    expect(screen.getByTestId("reporte-prioridad-alta").className).toContain(
      "reporte-prioridad--alta",
    );
    expect(screen.getByTestId("reporte-prioridad-media").className).toContain(
      "reporte-prioridad--media",
    );
    expect(screen.getByTestId("reporte-prioridad-baja").className).toContain(
      "reporte-prioridad--baja",
    );
  });

  it("muestra la antigüedad calculada en días respecto de la fecha actual (FR-025)", () => {
    const reporte = crearReporte("r1", "MEDIA", new Date("2026-01-05T00:00:00Z"));

    render(<ReportesTable reportes={[reporte]} fechaActual={FECHA_ACTUAL} />);

    expect(screen.getByTestId("reporte-antiguedad-r1")).toHaveTextContent("5 día(s)");
  });

  it('muestra "Hoy" cuando la antigüedad es 0 días', () => {
    const reporte = crearReporte("r1", "BAJA", FECHA_ACTUAL);

    render(<ReportesTable reportes={[reporte]} fechaActual={FECHA_ACTUAL} />);

    expect(screen.getByTestId("reporte-antiguedad-r1")).toHaveTextContent("Hoy");
  });

  it("renderiza una fila por reporte con motivo y estado", () => {
    const reportes = [
      crearReporte("r1", "ALTA", FECHA_ACTUAL),
      crearReporte("r2", "BAJA", FECHA_ACTUAL),
    ];

    render(<ReportesTable reportes={reportes} fechaActual={FECHA_ACTUAL} />);

    expect(screen.getAllByTestId("reportes-fila")).toHaveLength(2);
  });
});
