/**
 * `DetalleDesafioPage`: pantalla de detalle de un desafío propuesto.
 *
 * Ref: tasks.md T072 (depende de T031, T044), spec.md FR-013.
 *
 * FR-013: permite visualizar el detalle de un desafío propuesto, incluyendo la información del
 * formulario de propuesta (título, descripción, estado y fecha de propuesta).
 *
 * Usa `DesafiosService.obtenerDetalle` (T031) a través de la instancia compartida de
 * `serviceFactory` (T044); no invoca `fetch`/`axios` directamente (Principio III). El
 * `desafioId` se obtiene del parámetro de ruta homónimo (`useParams`, `react-router-dom`).
 *
 * Las acciones de aprobar/rechazar no se implementan aquí: corresponden a
 * `AprobarRechazarDesafioActions` (T073), que se integrará a esta pantalla en su propia tarea
 * sin adelantar su alcance.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { Desafio } from "../../domain/Desafio";

export function DetalleDesafioPage(): JSX.Element {
  const { desafioId } = useParams<{ desafioId: string }>();
  const { desafiosService } = obtenerServiceFactory();

  const [desafio, setDesafio] = useState<Desafio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!desafioId) {
      setError("No se especificó un desafío a visualizar.");
      return;
    }

    let cancelado = false;

    async function cargar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-013 — detalle del desafío propuesto.
        const resultado = await desafiosService.obtenerDetalle(desafioId as string);
        if (!cancelado) {
          setDesafio(resultado);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el detalle del desafío.");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    void cargar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desafioId]);

  if (cargando) {
    return <p data-testid="detalle-desafio-cargando">Cargando…</p>;
  }

  if (error) {
    return (
      <p role="alert" data-testid="detalle-desafio-error">
        {error}
      </p>
    );
  }

  if (!desafio) {
    return <></>;
  }

  return (
    <section aria-label="Detalle de desafío propuesto" data-testid="detalle-desafio">
      <h1>Detalle del desafío propuesto</h1>

      <dl>
        <dt>Título</dt>
        <dd data-testid="detalle-desafio-titulo">{desafio.titulo}</dd>

        <dt>Descripción</dt>
        <dd data-testid="detalle-desafio-descripcion">{desafio.descripcion}</dd>

        <dt>Estado</dt>
        <dd data-testid="detalle-desafio-estado">{desafio.estado}</dd>

        <dt>Fecha de propuesta</dt>
        <dd data-testid="detalle-desafio-fecha-propuesta">
          {desafio.fechaPropuesta.toISOString()}
        </dd>
      </dl>
    </section>
  );
}
