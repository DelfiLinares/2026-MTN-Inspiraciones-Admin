/**
 * `DesafiosPage`: pantalla de listado de desafíos propuestos.
 *
 * Ref: tasks.md T071 (depende de T031, T044), spec.md FR-012.
 *
 * FR-012: permite listar los desafíos propuestos, filtrando por estado
 * (`EstadoDesafioPropuesto`: PENDIENTE/APROBADO/RECHAZADO). Por defecto se filtra por PENDIENTE,
 * que es el caso de uso principal de moderación (desafíos a revisar); el administrador puede
 * cambiar el filtro para ver también los ya decididos.
 *
 * Usa `DesafiosService.listarDesafios` (T031) a través de la instancia compartida de
 * `serviceFactory` (T044); no invoca `fetch`/`axios` directamente (Principio III). El filtrado y
 * la paginación se resuelven server-side, sin cargar el conjunto completo para filtrar en el
 * cliente.
 *
 * El detalle de cada desafío (`DetalleDesafioPage`, T072) y las acciones
 * aprobar/rechazar (`AprobarRechazarDesafioActions`, T073) no se implementan aquí.
 */
import { useEffect, useState } from "react";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { Desafio } from "../../domain/Desafio";
import { EstadoDesafioPropuesto } from "../../domain/enums/EstadoDesafioPropuesto";

const TAMANIO_PAGINA = 20;

export function DesafiosPage(): JSX.Element {
  const { desafiosService } = obtenerServiceFactory();

  const [estado, setEstado] = useState<EstadoDesafioPropuesto | "">(
    EstadoDesafioPropuesto.PENDIENTE,
  );
  const [pagina, setPagina] = useState(1);
  const [desafios, setDesafios] = useState<Desafio[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-012 — listado/filtrado de desafíos propuestos resuelto server-side.
        const resultado = await desafiosService.listarDesafios({
          page: pagina,
          pageSize: TAMANIO_PAGINA,
          estado: estado || undefined,
        });
        if (!cancelado) {
          setDesafios(resultado.contenido);
          setTotalPaginas(resultado.totalPaginas);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el listado de desafíos propuestos.");
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
  }, [estado, pagina]);

  function manejarCambioEstado(nuevoEstado: EstadoDesafioPropuesto | ""): void {
    setEstado(nuevoEstado);
    setPagina(1);
  }

  return (
    <section aria-label="Desafíos propuestos">
      <h1>Desafíos propuestos</h1>

      <label htmlFor="desafios-filtro-estado">Estado</label>
      <select
        id="desafios-filtro-estado"
        value={estado}
        onChange={(evento) =>
          manejarCambioEstado(evento.target.value as EstadoDesafioPropuesto | "")
        }
      >
        <option value="">Todos</option>
        {Object.values(EstadoDesafioPropuesto).map((valor) => (
          <option key={valor} value={valor}>
            {valor}
          </option>
        ))}
      </select>

      {cargando && <p data-testid="desafios-cargando">Cargando…</p>}
      {error && (
        <p role="alert" data-testid="desafios-error">
          {error}
        </p>
      )}

      <table data-testid="desafios-tabla">
        <thead>
          <tr>
            <th>Título</th>
            <th>Estado</th>
            <th>Fecha propuesta</th>
          </tr>
        </thead>
        <tbody>
          {desafios.map((desafio) => (
            <tr key={desafio.id} data-testid="desafios-fila">
              <td>{desafio.titulo}</td>
              <td>{desafio.estado}</td>
              <td>{desafio.fechaPropuesta.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-label="Paginación de desafíos">
        <button
          type="button"
          onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
          disabled={pagina <= 1}
        >
          Anterior
        </button>
        <span data-testid="desafios-pagina-actual">
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
