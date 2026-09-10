/**
 * Cliente HTTP concreto (`fetch` envuelto) que implementa el puerto `HttpClient`.
 *
 * Ref: tasks.md T040 (depende de T026), contracts/openapi.yaml (securitySchemes `bearerAuth`,
 * todos los paths), spec.md FR-002, FR-020, FR-027, research.md §2.
 *
 * Responsabilidades (capa `infrastructure/`, Principio III de la constitución):
 * - Es el único punto de la aplicación que invoca `fetch` directamente.
 * - Agrega de forma centralizada el header `Authorization: Bearer <token>` a cada request
 *   (FR-002, FR-020: toda acción administrativa viaja autenticada).
 * - Centraliza el manejo de errores 401 (no autenticado / sesión expirada) y 403 (rol no ADMIN o
 *   permiso insuficiente), traduciéndolos a `HttpUnauthorizedError`/`HttpForbiddenError` para que
 *   capas superiores (p. ej. `sessionGuard`, T043) puedan reaccionar sin parsear códigos HTTP.
 *
 * El token de sesión se gestiona aquí mediante un accesor simple (`setAuthToken`/`getAuthToken`);
 * el almacenamiento seguro/expiración del token es responsabilidad de `sessionManager` (T041), que
 * se apoyará en estas funciones para mantener sincronizado el token que usa este cliente.
 */
import type { HttpClient, HttpRequestOptions } from "../application/ports/HttpClient";
import { config } from "./config";

/** Error base para respuestas HTTP no exitosas devueltas por el backend. */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** 401: no autenticado o sesión expirada. Ref: FR-027, research.md §2. */
export class HttpUnauthorizedError extends HttpError {
  constructor(body: unknown) {
    super("No autenticado o sesión expirada.", 401, body);
    this.name = "HttpUnauthorizedError";
  }
}

/** 403: autenticado pero sin permiso suficiente (p. ej. rol distinto de ADMIN). Ref: FR-002, FR-020. */
export class HttpForbiddenError extends HttpError {
  constructor(body: unknown) {
    super("No tiene permisos suficientes para realizar esta acción.", 403, body);
    this.name = "HttpForbiddenError";
  }
}

let authToken: string | null = null;

/** Establece (o limpia, pasando `null`) el token Bearer usado en cada request. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Devuelve el token Bearer actualmente configurado, o `null` si no hay sesión. */
export function getAuthToken(): string | null {
  return authToken;
}

function construirUrl(baseUrl: string, path: string, params?: HttpRequestOptions["params"]): string {
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (params) {
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined) {
        url.searchParams.set(clave, String(valor));
      }
    }
  }
  return url.toString();
}

function construirHeaders(options?: HttpRequestOptions, tieneBody = false): Record<string, string> {
  const headers: Record<string, string> = { ...options?.headers };
  if (tieneBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

async function manejarRespuesta<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new HttpUnauthorizedError(await leerCuerpoSeguro(response));
  }
  if (response.status === 403) {
    throw new HttpForbiddenError(await leerCuerpoSeguro(response));
  }
  if (!response.ok) {
    throw new HttpError(
      `Error HTTP ${response.status} al invocar ${response.url}.`,
      response.status,
      await leerCuerpoSeguro(response),
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.blob()) as unknown as T;
}

async function leerCuerpoSeguro(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
}

/** Crea una implementación real de `HttpClient` contra `baseUrl` (por defecto, `config.apiBaseUrl`). */
export function crearHttpClient(baseUrl: string = config.apiBaseUrl): HttpClient {
  return {
    async get<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      const response = await fetch(construirUrl(baseUrl, path, options?.params), {
        method: "GET",
        headers: construirHeaders(options),
      });
      return manejarRespuesta<T>(response);
    },

    async post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
      const response = await fetch(construirUrl(baseUrl, path, options?.params), {
        method: "POST",
        headers: construirHeaders(options, body !== undefined),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return manejarRespuesta<T>(response);
    },

    async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
      const response = await fetch(construirUrl(baseUrl, path, options?.params), {
        method: "DELETE",
        headers: construirHeaders(options),
      });
      return manejarRespuesta<T>(response);
    },
  };
}
