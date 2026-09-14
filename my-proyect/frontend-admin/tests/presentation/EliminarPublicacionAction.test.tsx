/**
 * Test de `EliminarPublicacionAction`.
 *
 * Ref: tasks.md T069 (depende de T066), spec.md FR-010, FR-021, SC-004.
 *
 * Cubre: (a) requiere confirmación explícita antes de invocar `onEliminar` (el click inicial no
 * dispara la acción, solo confirmar en el modal lo hace); (b) tras eliminarse, la publicación
 * cambia de estado a ELIMINADA y, en una publicación ya ELIMINADA, la acción deja de renderizarse
 * (ya no tiene sentido volver a eliminarla).
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EliminarPublicacionAction } from "@/presentation/moderacion/EliminarPublicacionAction";
import { Publicacion } from "@/domain/Publicacion";
import { EstadoPublicacion } from "@/domain/enums/EstadoPublicacion";

function crearPublicacion(estado: EstadoPublicacion): Publicacion {
  return new Publicacion({
    id: "pub1",
    autorId: "autor1",
    titulo: "Publicación de prueba",
    estado,
    fechaCreacion: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("EliminarPublicacionAction", () => {
  it("(a) no invoca onEliminar solo con el click inicial; requiere confirmación explícita (FR-021)", () => {
    const onEliminar = vi.fn();
    const publicacion = crearPublicacion(EstadoPublicacion.REPORTADA);

    render(<EliminarPublicacionAction publicacion={publicacion} onEliminar={onEliminar} />);

    fireEvent.click(screen.getByText("Eliminar publicación"));
    expect(onEliminar).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));
    expect(onEliminar).toHaveBeenCalledWith("pub1");
  });

  it("no invoca onEliminar si se cancela la confirmación", () => {
    const onEliminar = vi.fn();
    const publicacion = crearPublicacion(EstadoPublicacion.ACTIVA);

    render(<EliminarPublicacionAction publicacion={publicacion} onEliminar={onEliminar} />);

    fireEvent.click(screen.getByText("Eliminar publicación"));
    fireEvent.click(screen.getByTestId("modal-confirmacion-cancelar"));

    expect(onEliminar).not.toHaveBeenCalled();
  });

  it("(b) tras confirmar la eliminación (estado ELIMINADA), la acción deja de renderizarse", () => {
    const onEliminar = vi.fn();
    const publicacionReportada = crearPublicacion(EstadoPublicacion.REPORTADA);

    const { rerender } = render(
      <EliminarPublicacionAction publicacion={publicacionReportada} onEliminar={onEliminar} />,
    );

    fireEvent.click(screen.getByText("Eliminar publicación"));
    fireEvent.click(screen.getByTestId("modal-confirmacion-confirmar"));
    expect(onEliminar).toHaveBeenCalledWith("pub1");

    // Simula que la pantalla contenedora actualizó la publicación tras la confirmación exitosa
    // del servicio (ModeracionService.eliminarPublicacion), reflejando el nuevo estado ELIMINADA.
    const publicacionEliminada = crearPublicacion(EstadoPublicacion.ELIMINADA);
    rerender(
      <EliminarPublicacionAction publicacion={publicacionEliminada} onEliminar={onEliminar} />,
    );

    expect(screen.queryByText("Eliminar publicación")).not.toBeInTheDocument();
  });

  it("no se renderiza directamente para una publicación ya ELIMINADA", () => {
    const publicacionEliminada = crearPublicacion(EstadoPublicacion.ELIMINADA);

    render(<EliminarPublicacionAction publicacion={publicacionEliminada} onEliminar={vi.fn()} />);

    expect(screen.queryByText("Eliminar publicación")).not.toBeInTheDocument();
  });
});
