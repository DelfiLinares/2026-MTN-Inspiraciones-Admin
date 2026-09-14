/**
 * `ModeracionContainer`: contenedor de moderación de publicaciones y reportes.
 *
 * Ref: tasks.md T063 (depende de T030, T044), spec.md FR-008, FR-024, research.md §8.
 *
 * Aplica el patrón contenedor/presentacional (research.md §8, única pantalla que lo justifica por
 * su complejidad de filtrado/paginación): este componente gestiona el estado de filtros
 * (motivo, estado del reporte, orden), la paginación, y las llamadas a `ModeracionService`
 * (T030), sin renderizar la tabla final por sí mismo — eso corresponde al componente
 * presentacional `ReportesTable` (T064, no implementado aún), que recibirá los `Reporte` ya
 * resueltos como props.
 *
 * FR-008: listar publicaciones reportadas. FR-024: filtrado y paginación resueltos server-side vía
 * `ModeracionService.listarPublicacionesReportadas`, sin cargar el conjunto completo para filtrar
 * en el cliente.
 */
import { useEffect, useState } from "react";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { Reporte } from "../../domain/Reporte";
import { MotivoReporte } from "../../domain/enums/MotivoReporte";
import { EstadoReporte } from "../../domain/enums/EstadoReporte";

const TAMANIO_PAGINA = 20;

export function ModeracionContainer(): JSX.Element {
  const { moderacionService } = obtenerServiceFactory();

  const [motivo, setMotivo] = useState<MotivoReporte | "">("");
  const [estadoReporte, setEstadoReporte] = useState<EstadoReporte | "">("");
  const [ordenarPor, setOrdenarPor] = useState<"antiguedad" | "prioridad">("prioridad");
  const [pagina, setPagina] = useState(1);

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-024 — filtrado/paginación resuelto server-side vía ModeracionService.
        const resultado = await moderacionService.listarPublicacionesReportadas({
          page: pagina,
          pageSize: TAMANIO_PAGINA,
          motivo: motivo || undefined,
          estadoReporte: estadoReporte || undefined,
          ordenarPor,
        });
        if (!cancelado) {
          setReportes(resultado.contenido);
          setTotalPaginas(resultado.totalPaginas);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el listado de publicaciones reportadas.");
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    void buscar();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motivo, estadoReporte, ordenarPor, pagina]);

  function manejarCambioFiltro(actualizar: () => void): void {
    actualizar();
    setPagina(1);
  }

  return (
    <section aria-label="Moderación de publicaciones y reportes">
      <h1>Moderación</h1>

      <label htmlFor="moderacion-filtro-motivo">Motivo</label>
      <select
        id="moderacion-filtro-motivo"
        value={motivo}
        onChange={(evento) =>
          manejarCambioFiltro(() => setMotivo(evento.target.value as MotivoReporte | ""))
        }
      >
        <option value="">Todos</option>
        {Object.values(MotivoReporte).map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>

      <label htmlFor="moderacion-filtro-estado">Estado del reporte</label>
      <select
        id="moderacion-filtro-estado"
        value={estadoReporte}
        onChange={(evento) =>
          manejarCambioFiltro(() => setEstadoReporte(evento.target.value as EstadoReporte | ""))
        }
      >
        <option value="">Todos</option>
        {Object.values(EstadoReporte).map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>

      <label htmlFor="moderacion-orden">Ordenar por</label>
      <select
        id="moderacion-orden"
        value={ordenarPor}
        onChange={(evento) =>
          manejarCambioFiltro(() =>
            setOrdenarPor(evento.target.value as "antiguedad" | "prioridad"),
          )
        }
      >
        <option value="prioridad">Prioridad</option>
        <option value="antiguedad">Antigüedad</option>
      </select>

      {cargando && <p data-testid="moderacion-cargando">Cargando…</p>}
      {error && (
        <p role="alert" data-testid="moderacion-error">
          {error}
        </p>
      )}

      {/* Ref: T064 (ReportesTable, no implementada aún) renderizará `reportes` con indicadores de
          prioridad/antigüedad. Placeholder mínimo mientras tanto, para no adelantar su alcance. */}
      <ul data-testid="moderacion-reportes">
        {reportes.map((reporte) => (
          <li key={reporte.id} data-testid="moderacion-reporte-item">
            {reporte.id}
          </li>
        ))}
      </ul>

      <div aria-label="Paginación de moderación">
        <button
          type="button"
          onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
          disabled={pagina <= 1}
        >
          Anterior
        </button>
        <span data-testid="moderacion-pagina-actual">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
          disabled={pagina >= totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
