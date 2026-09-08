/**
 * Puerto `HttpClient`.
 *
 * Ref: tasks.md T026 — contrato abstracto, sin implementación, usado por todos los servicios de
 * la capa de aplicación (Fase 3). La implementación real (fetch/axios envuelto) se define en
 * `src/infrastructure/httpClient.ts` (Fase 4, T040), respetando el Principio III de la
 * constitución (Separación de Capas, NON-NEGOTIABLE): los servicios de aplicación no conocen
 * fetch/axios directamente, solo esta interfaz.
 *
 * Ref: contracts/openapi.yaml (todos los paths), spec.md FR-001..FR-019.
 */
export interface HttpRequestOptions {
  /** Query params opcionales (paginación/filtros server-side, FR-024). */
  params?: Record<string, string | number | boolean | undefined>;
  /** Headers adicionales opcionales (además de Authorization: Bearer, gestionado por infraestructura). */
  headers?: Record<string, string>;
}

export interface HttpClient {
  get<T>(path: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;
  delete<T>(path: string, options?: HttpRequestOptions): Promise<T>;
}
