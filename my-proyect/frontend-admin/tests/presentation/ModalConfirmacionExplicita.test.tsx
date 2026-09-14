/**
 * Test de `ModalConfirmacionExplicita`.
 *
 * Ref: tasks.md T053 (depende de T050), spec.md FR-021, FR-022, SC-004.
 *
 * Cubre que la acción sensible NO se ejecuta (`onConfirmar` no se invoca) mientras no haya
 * confirmación explícita del administrador: ni al renderizar cerrado, ni al renderizar abierto sin
 * interacción, ni al cancelar. Solo se invoca `onConfirmar` ante un click explícito en el botón de
 * confirmación.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ModalConfirmacionExplicita } from "@/presentation/shared/ModalConfirmacionExplicita";

describe("ModalConfirmacionExplicita", () => {
  it("no renderiza contenido ni permite confirmar cuando abierto=false", () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <ModalConfirmacionExplicita
        abierto={false}
        titulo="Eliminar publicación"
        mensaje="Esta acción no se puede deshacer."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    expect(screen.queryByTestId("modal-confirmacion-explicita")).not.toBeInTheDocument();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("al abrirse, no ejecuta la acción sin confirmación explícita (FR-021, FR-022)", () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <ModalConfirmacionExplicita
        abierto
        titulo="Banear usuario"
        mensaje="El usuario perderá acceso a la plataforma."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Banear usuario")).toBeInTheDocument();
    expect(screen.getByText("El usuario perderá acceso a la plataforma.")).toBeInTheDocument();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("al cancelar, invoca onCancelar y NO invoca onConfirmar", async () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <ModalConfirmacionExplicita
        abierto
        titulo="Eliminar usuario"
        mensaje="Esta acción es irreversible."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    fireEvent.click(screen.getByTestId("modal-confirmacion-cancelar"));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("solo ejecuta la acción tras un click explícito en el botón de confirmación", async () => {
    const onConfirmar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <ModalConfirmacionExplicita
        abierto
        titulo="Promover a administrador"
        mensaje="El usuario obtendrá permisos elevados."
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    expect(onConfirmar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).not.toHaveBeenCalled();
  });

  it("usa los textos personalizados de los botones cuando se proveen", () => {
    render(
      <ModalConfirmacionExplicita
        abierto
        titulo="Eliminar publicación"
        mensaje="Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar"
        textoCancelar="No, mantener"
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      />,
    );

    expect(screen.getByText("Sí, eliminar")).toBeInTheDocument();
    expect(screen.getByText("No, mantener")).toBeInTheDocument();
  });
});
