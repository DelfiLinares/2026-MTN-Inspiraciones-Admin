/**
 * Catálogo de endpoints de la API REST del módulo admin/moderación.
 *
 * Ref: tasks.md T042 (depende de T040), contracts/openapi.yaml (todos los `paths`).
 *
 * Centraliza en un único lugar las rutas relativas usadas por los servicios de aplicación
 * (Fase 3) al invocar `httpClient` (T040), evitando strings de endpoints hardcodeados y
 * dispersos por el código (Principio III de la constitución: la capa de infraestructura es la
 * única responsable de conocer la forma exacta de la API REST).
 *
 * Cada función devuelve la ruta relativa (sin `baseUrl`, que resuelve `httpClient`/`config`).
 */

export const apiEndpoints = {
  /** Ref: `POST /auth/login`. */
  login: () => "/auth/login",

  /** Ref: `GET /dashboard`. */
  dashboard: () => "/dashboard",

  /** Ref: `GET /usuarios`. */
  usuarios: () => "/usuarios",
  /** Ref: `POST /usuarios/{usuarioId}/banear`. */
  banearUsuario: (usuarioId: string) => `/usuarios/${usuarioId}/banear`,
  /** Ref: `DELETE /usuarios/{usuarioId}`. */
  eliminarUsuario: (usuarioId: string) => `/usuarios/${usuarioId}`,
  /** Ref: `POST /usuarios/{usuarioId}/promover`. */
  promoverUsuario: (usuarioId: string) => `/usuarios/${usuarioId}/promover`,

  /** Ref: `GET /publicaciones/reportadas`. */
  publicacionesReportadas: () => "/publicaciones/reportadas",
  /** Ref: `DELETE /publicaciones/{publicacionId}`. */
  publicacion: (publicacionId: string) => `/publicaciones/${publicacionId}`,

  /** Ref: `GET /reportes/{reporteId}`. */
  reporte: (reporteId: string) => `/reportes/${reporteId}`,
  /** Ref: `POST /reportes/{reporteId}/resolver-sin-eliminar`. */
  resolverReporteSinEliminar: (reporteId: string) => `/reportes/${reporteId}/resolver-sin-eliminar`,

  /** Ref: `GET /desafios`. */
  desafios: () => "/desafios",
  /** Ref: `GET /desafios/{desafioId}`. */
  desafio: (desafioId: string) => `/desafios/${desafioId}`,
  /** Ref: `POST /desafios/{desafioId}/aprobar`. */
  aprobarDesafio: (desafioId: string) => `/desafios/${desafioId}/aprobar`,
  /** Ref: `POST /desafios/{desafioId}/rechazar`. */
  rechazarDesafio: (desafioId: string) => `/desafios/${desafioId}/rechazar`,

  /** Ref: `GET /reportes-analiticas`. */
  reportesAnaliticas: () => "/reportes-analiticas",
  /** Ref: `POST /reportes-analiticas/exportaciones`. */
  iniciarExportacionReporteAnalitica: () => "/reportes-analiticas/exportaciones",
  /** Ref: `GET /reportes-analiticas/exportaciones/{exportacionId}/descarga`. */
  descargarExportacionReporteAnalitica: (exportacionId: string) =>
    `/reportes-analiticas/exportaciones/${exportacionId}/descarga`,
} as const;
