/**
 * `DetalleReportePage`: pantalla de detalle de un reporte sobre una publicación.
 *
 * Ref: tasks.md T065 (depende de T030, T044), spec.md FR-009.
 *
 * FR-009: permite visualizar el detalle de un reporte (motivo, publicación asociada, y demás
 * datos provistos por el backend: reportante, estado, prioridad, antigüedad).
 *
 * Usa `ModeracionService.obtenerDetalleReporte` (T030) a través de la instancia compartida de
 * `serviceFactory` (T044); no invoca `fetch`/`axios` directamente (Principio III). El `reporteId`
 * se obtiene del parámetro de ruta homónimo (`useParams`, `react-router-dom`).
 *
 * Las acciones sobre el reporte/publicación (eliminar publicación, resolver sin eliminar) no se
 * implementan aquí: corresponden a `EliminarPublicacionAction` (T066) y `ResolverReporteAction`
 * (T067), que se integrarán a esta pantalla en sus propias tareas sin adelantar su alcance.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { ReporteDetalle } from "../../application/ModeracionService";

export function DetalleReportePage(): JSX.Element {
  const { reporteId } = useParams<{ reporteId: string }>();
  const { moderacionService } = obtenerServiceFactory();

  const [detalle, setDetalle] = useState<ReporteDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reporteId) {
      setError("No se especificó un reporte a visualizar.");
      return;
    }

    let cancelado = false;

    async function cargar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-009 — detalle del reporte (motivo, publicación asociada, reportante, etc.).
        const resultado = await moderacionService.obtenerDetalleReporte(reporteId as string);
        if (!cancelado) {
          setDetalle(resultado);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el detalle del reporte.");
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
  }, [reporteId]);

  if (cargando) {
    return <p data-testid="detalle-reporte-cargando">Cargando…</p>;
  }

  if (error) {
    return (
      <p role="alert" data-testid="detalle-reporte-error">
        {error}
      </p>
    );
  }

  if (!detalle) {
    return <></>;
  }

  const { reporte, publicacion, reportante } = detalle;

  return (
    <section aria-label="Detalle de reporte" data-testid="detalle-reporte">
      <h1>Detalle del reporte</h1>

      <dl>
        <dt>Motivo</dt>
        <dd data-testid="detalle-reporte-motivo">{reporte.motivo}</dd>

        <dt>Estado</dt>
        <dd data-testid="detalle-reporte-estado">{reporte.estado}</dd>

        <dt>Prioridad</dt>
        <dd data-testid="detalle-reporte-prioridad">{reporte.prioridad}</dd>

        <dt>Publicación reportada</dt>
        <dd data-testid="detalle-reporte-publicacion">{publicacion.titulo}</dd>

        <dt>Estado de la publicación</dt>
        <dd data-testid="detalle-reporte-publicacion-estado">{publicacion.estado}</dd>

        <dt>Reportante</dt>
        <dd data-testid="detalle-reporte-reportante">{reportante.nombre}</dd>
      </dl>
    </section>
  );
}
