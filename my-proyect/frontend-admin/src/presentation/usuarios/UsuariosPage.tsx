/**
 * `UsuariosPage`: pantalla contenedora de gestión de usuarios.
 *
 * Ref: tasks.md T055 (depende de T029, T044, T047), spec.md FR-004, FR-024.
 *
 * FR-004: permite buscar/listar usuarios. FR-024: la búsqueda y paginación se resuelven vía la API
 * (`UsuariosService.buscarUsuarios`), sin cargar el conjunto completo de datos para filtrar en el
 * cliente: cada cambio de texto/página dispara una nueva consulta al servicio.
 *
 * Esta pantalla solo orquesta la búsqueda paginada/filtrada y su estado; el renderizado tabular en
 * sí corresponde al componente presentacional `UsuariosTable` (T056, no implementado aún) y las
 * acciones administrativas a `BanearUsuarioAction`/`EliminarUsuarioAction`/`PromoverUsuarioAction`
 * (T057–T059, no implementadas aún). Por eso el listado se muestra aquí de forma mínima
 * (encabezados + filas básicas) hasta que esas tareas existan, sin adelantar su alcance.
 */
import { useEffect, useState } from "react";
import { obtenerServiceFactory } from "../../infrastructure/serviceFactory";
import type { Usuario } from "../../domain/Usuario";

const TAMANIO_PAGINA = 20;

export function UsuariosPage(): JSX.Element {
  const { usuariosService } = obtenerServiceFactory();

  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(1);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar(): Promise<void> {
      setCargando(true);
      setError(null);
      try {
        // Ref: FR-024 — la búsqueda/paginación se resuelve server-side vía UsuariosService.
        const resultado = await usuariosService.buscarUsuarios({
          page: pagina,
          pageSize: TAMANIO_PAGINA,
          texto: texto || undefined,
        });
        if (!cancelado) {
          setUsuarios(resultado.contenido);
          setTotalPaginas(resultado.totalPaginas);
        }
      } catch {
        if (!cancelado) {
          setError("No se pudo obtener el listado de usuarios.");
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
  }, [texto, pagina]);

  function manejarCambioTexto(nuevoTexto: string): void {
    setTexto(nuevoTexto);
    setPagina(1);
  }

  return (
    <section aria-label="Gestión de usuarios">
      <h1>Usuarios</h1>

      <label htmlFor="usuarios-busqueda">Buscar</label>
      <input
        id="usuarios-busqueda"
        type="search"
        value={texto}
        onChange={(evento) => manejarCambioTexto(evento.target.value)}
        placeholder="Buscar por nombre o email"
      />

      {cargando && <p data-testid="usuarios-cargando">Cargando…</p>}
      {error && (
        <p role="alert" data-testid="usuarios-error">
          {error}
        </p>
      )}

      <table data-testid="usuarios-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} data-testid="usuarios-fila">
              <td>{usuario.nombre}</td>
              <td>{usuario.email}</td>
              <td>{usuario.rol}</td>
              <td>{usuario.estadoCuenta}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div aria-label="Paginación de usuarios">
        <button
          type="button"
          onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
          disabled={pagina <= 1}
        >
          Anterior
        </button>
        <span data-testid="usuarios-pagina-actual">
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
