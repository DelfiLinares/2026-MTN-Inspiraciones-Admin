/**
 * Servidor de contrato (mock) basado en `contracts/openapi.yaml`.
 *
 * Ref: tasks.md T086 (depende de T042), contracts/openapi.yaml (todos los `paths`).
 *
 * Provee un mock fiel al contrato para las pruebas de integración tempranas (T087+), sin
 * depender de un backend real levantado. Funciona interceptando `globalThis.fetch` (el único
 * punto de entrada HTTP real, usado por `httpClient.ts`, T040) y respondiendo según la ruta y el
 * método HTTP invocados, replicando exactamente los esquemas de request/response, códigos de
 * estado (200/204/401/403/404/409/502) y reglas de negocio documentadas en el contrato (FR-001,
 * FR-002, FR-005..FR-007, FR-009, FR-010, FR-012, FR-014, FR-015, FR-017..FR-019, FR-024..FR-026,
 * FR-028, FR-029).
 *
 * No usa una librería de mocking externa (p. ej. MSW): `package.json` no la declara como
 * dependencia, y este mock cubre exactamente los endpoints necesarios para los tests de
 * integración de esta fase sin ampliar el alcance de dependencias del proyecto.
 *
 * Uso típico en un test de integración:
 *   beforeEach(() => iniciarMockServer());
 *   afterEach(() => detenerMockServer());
 */
import { config } from "../../src/infrastructure/config";

interface UsuarioMock {
  id: string;
  nombre: string;
  email: string;
  rol: "USER" | "ADMIN";
  estadoCuenta: "ACTIVO" | "BANEADO" | "ELIMINADO";
  fechaRegistro: string;
}

interface PublicacionMock {
  id: string;
  autorId: string;
  titulo: string;
  estado: "ACTIVA" | "REPORTADA" | "ELIMINADA";
  fechaCreacion: string;
}

interface ReporteMock {
  id: string;
  publicacionId: string;
  reportanteId: string;
  motivo: string;
  estado: "PENDIENTE" | "RESUELTO_SIN_ELIMINAR" | "RESUELTO_CON_ELIMINACION";
  fechaCreacion: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
}

interface DesafioMock {
  id: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  fechaPropuesta: string;
}

interface ReporteAnaliticaMock {
  id: string;
  tipo: string;
  datosAgregados: Record<string, number>;
}

/** Estado en memoria del mock; se reinicia en cada `iniciarMockServer()`. Ref: FR-024..FR-026, FR-029. */
let usuarios: UsuarioMock[] = [];
let publicaciones: PublicacionMock[] = [];
let reportes: ReporteMock[] = [];
let desafios: DesafioMock[] = [];
let reportesAnaliticas: ReporteAnaliticaMock[] = [];
let credencialesValidas = { email: "admin@example.com", password: "admin123" };
let siguienteExportacionExitosa = true;

let fetchOriginal: typeof fetch | null = null;

function seedPorDefecto(): void {
  usuarios = [
    {
      id: "u1",
      nombre: "Admin Principal",
      email: "admin@example.com",
      rol: "ADMIN",
      estadoCuenta: "ACTIVO",
      fechaRegistro: "2026-01-01T00:00:00Z",
    },
    {
      id: "u2",
      nombre: "Usuario Regular",
      email: "usuario@example.com",
      rol: "USER",
      estadoCuenta: "ACTIVO",
      fechaRegistro: "2026-01-02T00:00:00Z",
    },
  ];
  publicaciones = [
    {
      id: "p1",
      autorId: "u2",
      titulo: "Publicación de prueba",
      estado: "REPORTADA",
      fechaCreacion: "2026-01-03T00:00:00Z",
    },
  ];
  reportes = [
    {
      id: "r1",
      publicacionId: "p1",
      reportanteId: "u2",
      motivo: "SPAM",
      estado: "PENDIENTE",
      fechaCreacion: "2026-01-04T00:00:00Z",
      prioridad: "ALTA",
    },
  ];
  desafios = [
    {
      id: "d1",
      autorId: "u2",
      titulo: "Desafío propuesto de prueba",
      descripcion: "Descripción del desafío",
      estado: "PENDIENTE",
      fechaPropuesta: "2026-01-05T00:00:00Z",
    },
  ];
  reportesAnaliticas = [
    { id: "ra1", tipo: "USUARIOS_ACTIVOS_POR_MES", datosAgregados: { enero: 10, febrero: 20 } },
  ];
  credencialesValidas = { email: "admin@example.com", password: "admin123" };
  siguienteExportacionExitosa = true;
}

/** Permite a un test forzar que la próxima exportación falle (FR-028, mensaje "Error: Reporte no generado."). */
export function configurarProximaExportacionComoFallida(): void {
  siguienteExportacionExitosa = false;
}

function json(status: number, body: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function error(status: number, mensaje: string): Response {
  return json(status, { codigo: `HTTP_${status}`, mensaje });
}

function obtenerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

/** Ref: FR-002, FR-020 — toda ruta protegida exige `Authorization: Bearer <token-mock-valido>`. */
function requiereSesionAdmin(request: Request): Response | null {
  const token = obtenerToken(request);
  if (!token) {
    return error(401, "No autenticado o sesión expirada.");
  }
  if (token !== "token-mock-valido") {
    return error(403, "No tiene permisos suficientes para realizar esta acción.");
  }
  return null;
}

async function manejarRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/admin/, "");
  const metodo = request.method.toUpperCase();

  // Ref: `POST /auth/login`, FR-001, FR-002.
  if (path === "/auth/login" && metodo === "POST") {
    const cuerpo = (await request.json()) as { email?: string; password?: string };
    const usuario = usuarios.find((u) => u.email === cuerpo.email);
    if (
      !usuario ||
      cuerpo.email !== credencialesValidas.email ||
      cuerpo.password !== credencialesValidas.password
    ) {
      return error(401, "Credenciales inválidas.");
    }
    if (usuario.rol !== "ADMIN") {
      return error(403, "Usuario válido pero sin rol ADMIN.");
    }
    return json(200, {
      token: "token-mock-valido",
      expiraEn: "2999-01-01T00:00:00Z",
      usuario,
    });
  }

  const sesionInvalida = requiereSesionAdmin(request);
  if (sesionInvalida) {
    return sesionInvalida;
  }

  // Ref: `GET /dashboard`, FR-003.
  if (path === "/dashboard" && metodo === "GET") {
    return json(200, {
      reportesPendientes: reportes.filter((r) => r.estado === "PENDIENTE").length,
      usuariosActivos: usuarios.filter((u) => u.estadoCuenta === "ACTIVO").length,
      desafiosPendientes: desafios.filter((d) => d.estado === "PENDIENTE").length,
      publicacionesActivas: publicaciones.filter((p) => p.estado === "ACTIVA").length,
      publicacionesEliminadas: publicaciones.filter((p) => p.estado === "ELIMINADA").length,
      usuariosBaneados: usuarios.filter((u) => u.estadoCuenta === "BANEADO").length,
      desafiosDecididos: desafios.filter((d) => d.estado !== "PENDIENTE").length,
    });
  }

  // Ref: `GET /usuarios`, FR-004, FR-024.
  if (path === "/usuarios" && metodo === "GET") {
    const texto = url.searchParams.get("texto")?.toLowerCase();
    const filtrados = texto
      ? usuarios.filter(
          (u) => u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto),
        )
      : usuarios;
    return json(200, {
      contenido: filtrados,
      totalElementos: filtrados.length,
      totalPaginas: 1,
      paginaActual: 1,
    });
  }

  // Ref: `POST /usuarios/{usuarioId}/banear`, FR-005, FR-029.
  const banearMatch = path.match(/^\/usuarios\/([^/]+)\/banear$/);
  if (banearMatch && metodo === "POST") {
    const usuario = usuarios.find((u) => u.id === banearMatch[1]);
    if (!usuario) return error(404, "Usuario no encontrado.");
    if (usuario.rol === "ADMIN") {
      return error(409, "No se puede banear a un usuario con rol ADMIN.");
    }
    usuario.estadoCuenta = "BANEADO";
    return json(200, usuario);
  }

  // Ref: `DELETE /usuarios/{usuarioId}`, FR-006, FR-029.
  const eliminarUsuarioMatch = path.match(/^\/usuarios\/([^/]+)$/);
  if (eliminarUsuarioMatch && metodo === "DELETE") {
    const usuario = usuarios.find((u) => u.id === eliminarUsuarioMatch[1]);
    if (!usuario) return error(404, "Usuario no encontrado.");
    if (usuario.rol === "ADMIN") {
      return error(409, "No se puede eliminar a un usuario con rol ADMIN.");
    }
    usuario.estadoCuenta = "ELIMINADO";
    return new Response(null, { status: 204 });
  }

  // Ref: `POST /usuarios/{usuarioId}/promover`, FR-007.
  const promoverMatch = path.match(/^\/usuarios\/([^/]+)\/promover$/);
  if (promoverMatch && metodo === "POST") {
    const usuario = usuarios.find((u) => u.id === promoverMatch[1]);
    if (!usuario) return error(404, "Usuario no encontrado.");
    if (usuario.rol === "ADMIN") {
      return error(409, "El usuario ya tiene rol ADMIN.");
    }
    usuario.rol = "ADMIN";
    return json(200, usuario);
  }

  // Ref: `GET /publicaciones/reportadas`, FR-008, FR-024, FR-025.
  if (path === "/publicaciones/reportadas" && metodo === "GET") {
    const motivo = url.searchParams.get("motivo");
    const estadoReporte = url.searchParams.get("estadoReporte");
    let filtrados = reportes;
    if (motivo) filtrados = filtrados.filter((r) => r.motivo === motivo);
    if (estadoReporte) filtrados = filtrados.filter((r) => r.estado === estadoReporte);
    return json(200, {
      contenido: filtrados,
      totalElementos: filtrados.length,
      totalPaginas: 1,
      paginaActual: 1,
    });
  }

  // Ref: `GET /reportes/{reporteId}`, FR-009.
  const reporteDetalleMatch = path.match(/^\/reportes\/([^/]+)$/);
  if (reporteDetalleMatch && metodo === "GET") {
    const reporte = reportes.find((r) => r.id === reporteDetalleMatch[1]);
    if (!reporte) return error(404, "Reporte no encontrado.");
    const publicacion = publicaciones.find((p) => p.id === reporte.publicacionId);
    const reportante = usuarios.find((u) => u.id === reporte.reportanteId);
    return json(200, { ...reporte, publicacion, reportante });
  }

  // Ref: `POST /reportes/{reporteId}/resolver-sin-eliminar`, FR-026, research.md §6.
  const resolverMatch = path.match(/^\/reportes\/([^/]+)\/resolver-sin-eliminar$/);
  if (resolverMatch && metodo === "POST") {
    const reporte = reportes.find((r) => r.id === resolverMatch[1]);
    if (!reporte) return error(404, "Reporte no encontrado.");
    reporte.estado = "RESUELTO_SIN_ELIMINAR";
    const publicacion = publicaciones.find((p) => p.id === reporte.publicacionId);
    const reportante = usuarios.find((u) => u.id === reporte.reportanteId);
    return json(200, { ...reporte, publicacion, reportante });
  }

  // Ref: `DELETE /publicaciones/{publicacionId}`, FR-010.
  const eliminarPublicacionMatch = path.match(/^\/publicaciones\/([^/]+)$/);
  if (eliminarPublicacionMatch && metodo === "DELETE") {
    const publicacion = publicaciones.find((p) => p.id === eliminarPublicacionMatch[1]);
    if (!publicacion) return error(404, "Publicación no encontrada.");
    publicacion.estado = "ELIMINADA";
    return new Response(null, { status: 204 });
  }

  // Ref: `GET /desafios`, FR-012.
  if (path === "/desafios" && metodo === "GET") {
    const estado = url.searchParams.get("estado");
    const filtrados = estado ? desafios.filter((d) => d.estado === estado) : desafios;
    return json(200, {
      contenido: filtrados,
      totalElementos: filtrados.length,
      totalPaginas: 1,
      paginaActual: 1,
    });
  }

  // Ref: `GET /desafios/{desafioId}`, FR-013.
  const desafioDetalleMatch = path.match(/^\/desafios\/([^/]+)$/);
  if (desafioDetalleMatch && metodo === "GET") {
    const desafio = desafios.find((d) => d.id === desafioDetalleMatch[1]);
    if (!desafio) return error(404, "Desafío no encontrado.");
    return json(200, desafio);
  }

  // Ref: `POST /desafios/{desafioId}/aprobar`, FR-014.
  const aprobarMatch = path.match(/^\/desafios\/([^/]+)\/aprobar$/);
  if (aprobarMatch && metodo === "POST") {
    const desafio = desafios.find((d) => d.id === aprobarMatch[1]);
    if (!desafio) return error(404, "Desafío no encontrado.");
    if (desafio.estado !== "PENDIENTE") {
      return error(409, "El desafío ya no está en estado PENDIENTE.");
    }
    desafio.estado = "APROBADO";
    return json(200, desafio);
  }

  // Ref: `POST /desafios/{desafioId}/rechazar`, FR-015.
  const rechazarMatch = path.match(/^\/desafios\/([^/]+)\/rechazar$/);
  if (rechazarMatch && metodo === "POST") {
    const desafio = desafios.find((d) => d.id === rechazarMatch[1]);
    if (!desafio) return error(404, "Desafío no encontrado.");
    if (desafio.estado !== "PENDIENTE") {
      return error(409, "El desafío ya no está en estado PENDIENTE.");
    }
    desafio.estado = "RECHAZADO";
    return json(200, desafio);
  }

  // Ref: `GET /reportes-analiticas`, FR-017.
  if (path === "/reportes-analiticas" && metodo === "GET") {
    return json(200, reportesAnaliticas);
  }

  // Ref: `POST /reportes-analiticas/exportaciones`, FR-018, FR-028 — operación SÍNCRONA.
  if (path === "/reportes-analiticas/exportaciones" && metodo === "POST") {
    const cuerpo = (await request.json()) as { reporteAnaliticaId?: string };
    if (!siguienteExportacionExitosa) {
      return error(502, "Error: Reporte no generado.");
    }
    return json(200, {
      reporteAnaliticaId: cuerpo.reporteAnaliticaId,
      exitoso: true,
      urlDescarga: `/api/admin/reportes-analiticas/exportaciones/exp-${cuerpo.reporteAnaliticaId}/descarga`,
      mensajeError: null,
    });
  }

  // Ref: `GET /reportes-analiticas/exportaciones/{exportacionId}/descarga`, FR-019.
  const descargaMatch = path.match(/^\/reportes-analiticas\/exportaciones\/([^/]+)\/descarga$/);
  if (descargaMatch && metodo === "GET") {
    return new Response(new Blob(["contenido-mock-del-reporte"]), {
      status: 200,
      headers: { "content-type": "application/octet-stream" },
    });
  }

  return error(404, `Ruta de mock no implementada: ${metodo} ${path}`);
}

/**
 * Inicia el mock server: reemplaza `globalThis.fetch` por una implementación que responde según
 * el contrato, y reinicia los datos en memoria a un estado semilla conocido (aislamiento entre
 * tests).
 */
export function iniciarMockServer(): void {
  seedPorDefecto();
  if (!fetchOriginal) {
    fetchOriginal = globalThis.fetch;
  }
  globalThis.fetch = manejarRequest as unknown as typeof fetch;
  void config; // Ref: config.apiBaseUrl es la base contra la que httpClient.ts construye las URLs interceptadas aquí.
}

/** Restaura `globalThis.fetch` original al finalizar los tests de integración. */
export function detenerMockServer(): void {
  if (fetchOriginal) {
    globalThis.fetch = fetchOriginal;
    fetchOriginal = null;
  }
}
