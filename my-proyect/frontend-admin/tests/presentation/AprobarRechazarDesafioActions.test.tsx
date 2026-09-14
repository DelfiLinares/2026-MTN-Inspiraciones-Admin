/**
 * Test de `AprobarRechazarDesafioActions`.
 *
 * Ref: tasks.md T075 (depende de T073), spec.md FR-014, FR-015, US5 escenario 5.
 *
 * Cubre que las acciones "aprobar"/"rechazar" se ocultan (no se renderizan) cuando el desafío ya
 * no está PENDIENTE (decisión final e irreversible, Clarifications Session 2026-09-08), y que
 * cuando sí está PENDIENTE, ambas acciones se renderizan e invocan los callbacks correspondientes
 * con el id del desafío.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AprobarRechazarDesafioActions } from "@/presentation/desafios/AprobarRechazarDesafioActions";
import { Desafio } from "@/domain/Desafio";
import { EstadoDesafioPropuesto } from "@/domain/enums/EstadoDesafioPropuesto";

function crearDesafio(estado: EstadoDesafioPropuesto): Desafio {
  return new Desafio({
    id: "desafio-1",
    autorId: "autor-1",
    titulo: "Desafío de prueba",
    descripcion: "Descripción de prueba",
    estado,
    fechaPropuesta: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("AprobarRechazarDesafioActions", () => {
  it("renderiza las acciones y las invoca con el id del desafío cuando está PENDIENTE (FR-014, FR-015, US5 escenario 5)", () => {
    const onAprobar = vi.fn();
    const onRechazar = vi.fn();
    const desafio = crearDesafio(EstadoDesafioPropuesto.PENDIENTE);

    render(
      <AprobarRechazarDesafioActions
        desafio={desafio}
        onAprobar={onAprobar}
        onRechazar={onRechazar}
      />,
    );

    fireEvent.click(screen.getByText("Aprobar desafío"));
    expect(onAprobar).toHaveBeenCalledWith("desafio-1");

    fireEvent.click(screen.getByText("Rechazar desafío"));
    expect(onRechazar).toHaveBeenCalledWith("desafio-1");
  });

  it("no renderiza ninguna acción cuando el desafío ya está APROBADO (decisión irreversible, FR-014)", () => {
    const desafio = crearDesafio(EstadoDesafioPropuesto.APROBADO);

    const { container } = render(
      <AprobarRechazarDesafioActions
        desafio={desafio}
        onAprobar={vi.fn()}
        onRechazar={vi.fn()}
      />,
    );

    expect(screen.queryByText("Aprobar desafío")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar desafío")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("no renderiza ninguna acción cuando el desafío ya está RECHAZADO (decisión irreversible, FR-015)", () => {
    const desafio = crearDesafio(EstadoDesafioPropuesto.RECHAZADO);

    render(
      <AprobarRechazarDesafioActions
        desafio={desafio}
        onAprobar={vi.fn()}
        onRechazar={vi.fn()}
      />,
    );

    expect(screen.queryByText("Aprobar desafío")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar desafío")).not.toBeInTheDocument();
  });
});
