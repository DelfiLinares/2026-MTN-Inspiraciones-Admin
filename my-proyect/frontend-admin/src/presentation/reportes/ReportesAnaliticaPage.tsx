/**
 * `ReportesAnaliticaPage`: pantalla de reportes/analíticas de la plataforma.
 *
 * Ref: tasks.md T076 (depende de T032, T044), spec.md FR-017.
 *
 * FR-017: permite visualizar reportes y analíticas de la plataforma con datos ya agregados por el
 * backend (`ReporteAnalitica.datosAgregados`), sin recálculo en cliente (Principio de la
 * arquitectura: la agregación es responsabilidad del backend; el frontend solo renderiza).
 *
 * Usa `ReportesAnaliticaService.listarReportesAnaliticas` (T032) a través de la instancia
 * compartida de `serviceFactory` (T044); no invoca `fetch`/`axios` directamente (Principio III).
 *
 * La acción "iniciar exportación" (`ExportarReporteAction`, T077) y la de descarga (T078) no se
 * implementan aquí: se integrarán a esta pantalla en sus propias tareas sin adelantar su alcance.
 */
import { useEffect, useState } from "react";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { ReporteAnalitica } from "../../domain/ReporteAnalitica";

export function ReportesAnaliticaPage(): JSX.Element {
  const { reportesAnaliticaService } = obtenerServiceFactory();

  const [reportes, setReportes] = useState<ReporteAnalitica[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-017 — datos ya agregados por el backend; el frontend no recalcula.
        const resultado = await reportesAnaliticaService.listarReportesAnaliticas();
        if (!cancelado) {
          setReportes(resultado);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el listado de reportes y analíticas.");
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
  }, []);

  if (cargando) {
    return <p data-testid="reportes-analitica-cargando">Cargando…</p>;
  }

  if (error) {
    return (
      <p role="alert" data-testid="reportes-analitica-error">
        {error}
      </p>
    );
  }

  return (
    <section aria-label="Reportes y analíticas" data-testid="reportes-analitica">
      <h1>Reportes y analíticas</h1>

      {reportes.length === 0 ? (
        <p data-testid="reportes-analitica-vacio">No hay reportes/analíticas disponibles.</p>
      ) : (
        <ul>
          {reportes.map((reporte) => (
            <li key={reporte.id} data-testid="reportes-analitica-item">
              <h2>{reporte.tipo}</h2>
              {reporte.tieneDatos() ? (
                <dl>
                  {Object.entries(reporte.datosAgregados).map(([clave, valor]) => (
                    <div key={clave}>
                      <dt>{clave}</dt>
                      <dd data-testid={`reportes-analitica-dato-${clave}`}>{valor}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>Sin datos agregados disponibles.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
