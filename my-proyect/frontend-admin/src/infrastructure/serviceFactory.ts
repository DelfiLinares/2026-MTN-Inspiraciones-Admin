/**
 * Fábrica de servicios de aplicación con dependencias reales de infraestructura.
 *
 * Ref: tasks.md T044 (depende de T027-T032, T040, T042).
 *
 * Composition root del frontend-admin: conecta los casos de uso de la capa de aplicación con la
 * implementación concreta de `HttpClient` (`crearHttpClient`, T040) mediante inyección de
 * dependencias, sin acoplar la capa de presentación a constructores concretos.
 */
import { AuthAdminService } from "../application/AuthAdminService";
import { DashboardService } from "../application/DashboardService";
import { DesafiosService } from "../application/DesafiosService";
import { ModeracionService } from "../application/ModeracionService";
import { ReportesAnaliticaService } from "../application/ReportesAnaliticaService";
import { UsuariosService } from "../application/UsuariosService";
import { crearHttpClient } from "./httpClient";

export interface ServiceFactory {
  authAdminService: AuthAdminService;
  usuariosService: UsuariosService;
  moderacionService: ModeracionService;
  desafiosService: DesafiosService;
  reportesAnaliticaService: ReportesAnaliticaService;
  dashboardService: DashboardService;
}

/**
 * Crea un conjunto de servicios conectados al `httpClient` real.
 *
 * - Todos los servicios comparten la misma instancia de `httpClient`.
 * - `UsuariosService` recibe además `AuthAdminService` para validar permisos de promoción (T033).
 */
export function crearServiceFactory(): ServiceFactory {
  const httpClient = crearHttpClient();

  const authAdminService = new AuthAdminService(httpClient);
  const usuariosService = new UsuariosService(httpClient, authAdminService);
  const moderacionService = new ModeracionService(httpClient);
  const desafiosService = new DesafiosService(httpClient);
  const reportesAnaliticaService = new ReportesAnaliticaService(httpClient);
  const dashboardService = new DashboardService(httpClient);

  return {
    authAdminService,
    usuariosService,
    moderacionService,
    desafiosService,
    reportesAnaliticaService,
    dashboardService,
  };
}
