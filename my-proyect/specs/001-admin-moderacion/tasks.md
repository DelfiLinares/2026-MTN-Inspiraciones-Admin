---
description: "Task list for Admin/Moderation module implementation"
---

# Tasks: Administración y Moderación de la Red Social de Inspiración Artística

**Input**: Design documents from `/specs/001-admin-moderacion/`
(`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`)

**Prerequisites**: `plan.md` ✅, `spec.md` ✅, `data-model.md` ✅, `contracts/openapi.yaml` ✅, `quickstart.md` ✅

**Status**: Planning only — **no code is created or executed by this document**. Every task below is a
unit of future work to be picked up in the `/speckit.implement` phase.

**Scope note**: Per `plan.md`, this feature covers only `frontend-admin/` (React). Backend (`backend/`,
Java/Spring Boot/MySQL) tasks are listed separately and are limited to the **contract** the frontend
depends on (per `contracts/openapi.yaml`); backend internal implementation (persistence, business rules
that belong server-side) is out of scope of this module and is marked as an external dependency, not a
task to execute here.

## Format: `[ID] [P?] [Layer] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other unfinished tasks)
- **[Layer]**: `FE` (frontend-admin), `BE` (backend, contract/consumption boundary only), `TEST`
- Include exact file paths in every description
- Traceability tags reference `spec.md` (`FR-XXX`, `US-X`), `data-model.md` (entities/enums) and
  `contracts/openapi.yaml` (endpoints)

## Path Conventions

Per `plan.md` → Project Structure:

```text
frontend-admin/
├── src/
│   ├── presentation/{login,dashboard,usuarios,moderacion,desafios,reportes}/
│   ├── domain/ (+ domain/enums/)
│   ├── application/
│   └── infrastructure/
└── tests/{domain,application,presentation,integration}/
```

---

## Phase 1: Setup del Frontend Administrativo

**Purpose**: Inicializar el proyecto `frontend-admin/` como aplicación separada, sin lógica de negocio
todavía. Bloquea todas las fases siguientes.

- [ ] T001 Crear la estructura de carpetas de `frontend-admin/` (`src/presentation`, `src/domain`,
  `src/domain/enums`, `src/application`, `src/infrastructure`, `tests/domain`, `tests/application`,
  `tests/presentation`, `tests/integration`) conforme a `plan.md` → Project Structure.
- [ ] T002 [FE] Inicializar el proyecto React + TypeScript en `frontend-admin/` (`package.json`,
  `tsconfig.json`) como aplicación separada del `frontend/` de usuario final, según Technical Context de
  `plan.md`.
- [ ] T003 [P] [FE] Configurar linting y formato (`.eslintrc`, `.prettierrc`) en `frontend-admin/` para
  hacer cumplir la separación de capas (Principio III de la constitución): reglas que prohíban imports de
  `fetch`/`axios` fuera de `src/infrastructure/`.
- [ ] T004 [P] [FE] Configurar el runner de tests (Jest/Vitest + Testing Library) en
  `frontend-admin/jest.config.ts` (o `vitest.config.ts`), habilitando las carpetas `tests/domain`,
  `tests/application`, `tests/presentation`, `tests/integration`.
- [ ] T005 [P] [FE] Configurar variables de entorno para la URL base de la API
  (`frontend-admin/.env.example`, `frontend-admin/src/infrastructure/config.ts`) sin hardcodear endpoints.

**Checkpoint**: Proyecto `frontend-admin/` inicializado, sin lógica de negocio. Habilita Fase 2.

---

## Phase 2: Modelo de Dominio y Enums

**Purpose**: Modelar el dominio de UI orientado a objetos (Principio II de la constitución) ANTES de
cualquier servicio o pantalla, y escribir primero los tests de las reglas administrativas
(TDD para reglas de negocio, según petición explícita del usuario: "priorizar primero el modelo de
dominio y los tests de las reglas administrativas"). Bloquea Fases 3–9.

**Trazabilidad**: `data-model.md` (todas las entidades/enums), `spec.md` FR-002, FR-005..FR-007,
FR-010..FR-016, FR-025, FR-026, FR-029.

### Enums (paralelizables entre sí)

- [ ] T006 [P] [FE] Crear enum `RolUsuario` (`USER`, `ADMIN`) en
  `frontend-admin/src/domain/enums/RolUsuario.ts`. Ref: `data-model.md` §Enums, FR-002/FR-007.
- [ ] T007 [P] [FE] Crear enum `EstadoCuentaUsuario` (`ACTIVO`, `BANEADO`, `ELIMINADO`) en
  `frontend-admin/src/domain/enums/EstadoCuentaUsuario.ts`. Ref: FR-005/FR-006.
- [ ] T008 [P] [FE] Crear enum `EstadoPublicacion` (`ACTIVA`, `REPORTADA`, `ELIMINADA`) en
  `frontend-admin/src/domain/enums/EstadoPublicacion.ts`. Ref: FR-011.
- [ ] T009 [P] [FE] Crear enum `EstadoDesafioPropuesto` (`PENDIENTE`, `APROBADO`, `RECHAZADO`) en
  `frontend-admin/src/domain/enums/EstadoDesafioPropuesto.ts`. Ref: FR-016.
- [ ] T010 [P] [FE] Crear enum `MotivoReporte` (`CONTENIDO_INAPROPIADO`, `SPAM`, `PLAGIO`,
  `DISCURSO_DE_ODIO`, `OTRO`) en `frontend-admin/src/domain/enums/MotivoReporte.ts`. Ref: `data-model.md`
  §Enums (marcado `NEEDS CLARIFICATION` en origen; implementar tal como documentado).
- [ ] T011 [P] [FE] Crear enum `EstadoReporte` (`PENDIENTE`, `RESUELTO_SIN_ELIMINAR`,
  `RESUELTO_CON_ELIMINACION`) en `frontend-admin/src/domain/enums/EstadoReporte.ts`. Ref: FR-026,
  `research.md` §6.
- [x] ~~T012~~ **ELIMINADA** — el enum `EstadoExportacionReporte` ya no existe: la exportación de
  reportes es una operación **síncrona** (Clarifications Session 2026-09-08, pregunta 3; `research.md`
  §4; `data-model.md` → `ExportacionReporte`). No reemplazar este ID; se mantiene documentado el motivo
  de su eliminación por trazabilidad.

### Tests de reglas de dominio (escribir ANTES de las entidades; deben fallar primero)

- [ ] T013 [P] [TEST] Test de reglas de `Usuario` (`puedeSerPromovidoAAdmin`, `puedeSerBaneado`,
  `puedeSerEliminado`, `esElMismoQue`) en `frontend-admin/tests/domain/Usuario.test.ts`. Ref: FR-005,
  FR-006, FR-007, FR-029, US3.
- [ ] T014 [P] [TEST] Test de reglas de `Publicacion` (`estaReportada`, `puedeSerEliminada`,
  `estaActiva`) en `frontend-admin/tests/domain/Publicacion.test.ts`. Ref: FR-010, FR-011, US2.
- [ ] T015 [P] [TEST] Test de reglas de `Reporte` (`estaPendiente`, `antiguedadEnDias`,
  `puedeResolverseSinEliminar`, `puedeResolverseConEliminacion`) en
  `frontend-admin/tests/domain/Reporte.test.ts`. Ref: FR-025, FR-026, US2, US4.
- [ ] T016 [P] [TEST] Test de reglas de `Desafio` (`estaPendiente`, `puedeAprobarse`,
  `puedeRechazarse`) en `frontend-admin/tests/domain/Desafio.test.ts`. Ref: FR-014, FR-015, FR-016, US5.
- [ ] T017 [P] [TEST] Test de reglas de `SesionAdministrativa` (`esValida`,
  `tienePermisoDeAdministrador`) en `frontend-admin/tests/domain/SesionAdministrativa.test.ts`. Ref:
  FR-002, FR-020.
- [ ] T018 [P] [TEST] Test de reglas de `ExportacionReporte` (`estaListoParaDescargar` cuando
  `exitoso === true`, `fallo` cuando `exitoso === false` con mensaje por defecto
  "Error: Reporte no generado.") en `frontend-admin/tests/domain/ExportacionReporte.test.ts`. Ref:
  FR-019, FR-028, Clarifications Session 2026-09-08 pregunta 3.

### Entidades de dominio (implementar después de que los tests de T013–T018 existan y fallen)

- [ ] T019 [FE] Implementar clase `Usuario` con sus reglas de negocio en
  `frontend-admin/src/domain/Usuario.ts` (depende de T006, T007, T013). Hace pasar T013.
- [ ] T020 [FE] Implementar clase `Publicacion` en `frontend-admin/src/domain/Publicacion.ts` (depende de
  T008, T014). Hace pasar T014.
- [ ] T021 [FE] Implementar clase `Reporte` en `frontend-admin/src/domain/Reporte.ts` (depende de T010,
  T011, T015). Hace pasar T015.
- [ ] T022 [FE] Implementar clase `Desafio` en `frontend-admin/src/domain/Desafio.ts` (depende de T009,
  T016). Hace pasar T016.
- [ ] T023 [FE] Implementar clase `SesionAdministrativa` en
  `frontend-admin/src/domain/SesionAdministrativa.ts` (depende de T006, T017). Hace pasar T017.
- [ ] T024 [P] [FE] Implementar clase `ReporteAnalitica` en
  `frontend-admin/src/domain/ReporteAnalitica.ts` (sin reglas complejas; datos ya agregados). Ref: FR-017.
- [ ] T025 [FE] Implementar clase `ExportacionReporte` en
  `frontend-admin/src/domain/ExportacionReporte.ts` (forma síncrona: `reporteAnaliticaId`, `exitoso`,
  `urlDescarga`, `mensajeError`; depende de T018, no de T012 — eliminada). Hace pasar T018.

**Checkpoint**: Dominio de UI completo y testeado de forma aislada (sin HTTP, sin React). Habilita Fase 3.

---

## Phase 3: Servicios de Aplicación

**Purpose**: Implementar los casos de uso administrativos (capa `application/`) que orquestan el dominio
y delegan el acceso a datos a la infraestructura (aún no implementada; se usan interfaces/mocks).
Ninguna llamada HTTP directa aquí: solo dependencia de una interfaz `HttpClient` a definir en Fase 4.

**Trazabilidad**: `contracts/openapi.yaml` (todos los paths), `spec.md` FR-001..FR-019.

- [ ] T026 [FE] Definir la interfaz `HttpClient` (contrato abstracto, sin implementación) en
  `frontend-admin/src/application/ports/HttpClient.ts`, usada por todos los servicios (depende de T001).
- [ ] T027 [P] [FE] Implementar `AuthAdminService` (`login`, `obtenerSesionActual`) en
  `frontend-admin/src/application/AuthAdminService.ts` (depende de T023, T026). Ref: `POST /auth/login`,
  FR-001, FR-002.
- [ ] T028 [P] [FE] Implementar `DashboardService` (`obtenerIndicadores`) en
  `frontend-admin/src/application/DashboardService.ts` (depende de T026). Ref: `GET /dashboard`, FR-003.
- [ ] T029 [P] [FE] Implementar `UsuariosService` (`buscarUsuarios`, `banear`, `eliminar`, `promover`) en
  `frontend-admin/src/application/UsuariosService.ts` (depende de T019, T026). Ref: `GET /usuarios`,
  `POST /usuarios/{id}/banear`, `DELETE /usuarios/{id}`, `POST /usuarios/{id}/promover`, FR-004..FR-007,
  FR-024.
- [ ] T030 [P] [FE] Implementar `ModeracionService` (`listarPublicacionesReportadas`,
  `obtenerDetalleReporte`, `eliminarPublicacion`, `resolverReporteSinEliminar`) en
  `frontend-admin/src/application/ModeracionService.ts` (depende de T020, T021, T026). Ref:
  `GET /publicaciones/reportadas`, `GET /reportes/{id}`, `DELETE /publicaciones/{id}`,
  `POST /reportes/{id}/resolver-sin-eliminar`, FR-008..FR-011, FR-024..FR-026.
- [ ] T031 [P] [FE] Implementar `DesafiosService` (`listarDesafios`, `obtenerDetalle`, `aprobar`,
  `rechazar`) en `frontend-admin/src/application/DesafiosService.ts` (depende de T022, T026). Ref:
  `GET /desafios`, `GET /desafios/{id}`, `POST /desafios/{id}/aprobar`, `POST /desafios/{id}/rechazar`,
  FR-012..FR-016.
- [ ] T032 [P] [FE] Implementar `ReportesAnaliticaService` (`listarReportesAnaliticas`,
  `iniciarExportacion`, `descargarExportacion`) en
  `frontend-admin/src/application/ReportesAnaliticaService.ts` (depende de T024, T025, T026).
  `iniciarExportacion` es **síncrono**: devuelve directamente el resultado final
  (`ExportacionReporte { exitoso, urlDescarga, mensajeError }`), sin método de consulta de estado
  intermedio (Clarifications Session 2026-09-08, pregunta 3). Ref: `GET /reportes-analiticas`,
  `POST /reportes-analiticas/exportaciones`,
  `GET /reportes-analiticas/exportaciones/{id}/descarga`, FR-017..FR-019, FR-028.
- [ ] T033 [FE] Implementar la regla de permiso de ejecución "solo ADMIN promueve a ADMIN" dentro de
  `UsuariosService.promover` (verificación del actor autenticado vía `AuthAdminService`, además de la
  regla de la entidad `Usuario`) en `frontend-admin/src/application/UsuariosService.ts` (depende de T027,
  T029). Ref: FR-007 (regla de permisos, no solo de estado).

### Tests de servicios (con `HttpClient` mockeado)

- [ ] T034 [P] [TEST] Test de `AuthAdminService` (login exitoso, rechazo de rol no-ADMIN, credenciales
  inválidas) en `frontend-admin/tests/application/AuthAdminService.test.ts` (depende de T027).
- [ ] T035 [P] [TEST] Test de `DashboardService` en
  `frontend-admin/tests/application/DashboardService.test.ts` (depende de T028).
- [ ] T036 [P] [TEST] Test de `UsuariosService` (búsqueda paginada, banear, eliminar, promover, y el caso
  "un USER no puede promover") en `frontend-admin/tests/application/UsuariosService.test.ts` (depende de
  T029, T033).
- [ ] T037 [P] [TEST] Test de `ModeracionService` (listado paginado/filtrado, detalle, eliminar,
  resolver-sin-eliminar) en `frontend-admin/tests/application/ModeracionService.test.ts` (depende de
  T030).
- [ ] T038 [P] [TEST] Test de `DesafiosService` (listar, detalle, aprobar, rechazar, y transición inválida
  sobre desafío ya decidido) en `frontend-admin/tests/application/DesafiosService.test.ts` (depende de
  T031).
- [ ] T039 [P] [TEST] Test de `ReportesAnaliticaService` (listar, iniciar exportación con resultado
  síncrono exitoso, iniciar exportación con resultado síncrono fallido — mensaje
  "Error: Reporte no generado." —, descarga) en
  `frontend-admin/tests/application/ReportesAnaliticaService.test.ts` (depende de T032).

**Checkpoint**: Casos de uso administrativos completos y testeados contra un `HttpClient` simulado.
Habilita Fase 4 (en paralelo puede empezar antes si el equipo lo desea, ya que solo depende de la
interfaz `HttpClient`, no de su implementación real).

---

## Phase 4: Infraestructura y Autenticación

**Purpose**: Implementar el cliente HTTP real y el manejo de sesión/permisos (capa `infrastructure/`),
conectando los servicios de la Fase 3 con la API REST real descripta en `contracts/openapi.yaml`.

**Trazabilidad**: `contracts/openapi.yaml` (securitySchemes `bearerAuth`), `spec.md` FR-002, FR-020,
FR-027, `research.md` §2.

- [ ] T040 [FE] Implementar el cliente HTTP concreto (`fetch`/`axios` envuelto) que satisface la interfaz
  `HttpClient` en `frontend-admin/src/infrastructure/httpClient.ts` (depende de T026). Incluye manejo
  centralizado de headers `Authorization: Bearer` y de errores 401/403.
- [ ] T041 [FE] Implementar `sessionManager` (almacenamiento seguro del token, expiración,
  `esValida()`) en `frontend-admin/src/infrastructure/sessionManager.ts` (depende de T023). Ref: FR-020,
  `research.md` §2.
- [ ] T042 [FE] Implementar el catálogo de endpoints (`apiEndpoints.ts`) con las rutas de
  `contracts/openapi.yaml` en `frontend-admin/src/infrastructure/apiEndpoints.ts` (depende de T040).
- [ ] T043 [FE] Implementar el interceptor/guardia de expiración de sesión durante una acción sensible:
  cancelar la acción en curso y redirigir a login (decisión de `research.md` §2) en
  `frontend-admin/src/infrastructure/sessionGuard.ts` (depende de T041). Ref: FR-027.
- [ ] T044 [FE] Conectar `AuthAdminService`, `UsuariosService`, `ModeracionService`, `DesafiosService`,
  `ReportesAnaliticaService`, `DashboardService` con la implementación real de `httpClient` mediante
  inyección de dependencias en `frontend-admin/src/infrastructure/serviceFactory.ts` (depende de T027-T032,
  T040, T042).

### Tests de infraestructura

- [ ] T045 [P] [TEST] Test de `sessionManager` (expiración, validez) en
  `frontend-admin/tests/application/sessionManager.test.ts` (depende de T041).
- [ ] T046 [P] [TEST] Test de `sessionGuard` (cancelación de acción sensible ante sesión expirada) en
  `frontend-admin/tests/application/sessionGuard.test.ts` (depende de T043). Ref: FR-027.

**Checkpoint**: El frontend-admin puede autenticarse y consumir la API real (o un servidor mock que
cumpla `contracts/openapi.yaml`). Habilita Fases 5–9.

---

## Phase 5: Pantallas Administrativas (Presentación Base)

**Purpose**: Construir el andamiaje de presentación común (ruteo, layout, guardas de rol) antes de las
pantallas específicas de cada dominio funcional (Fases 6–9).

**Trazabilidad**: `spec.md` US1 (acceso), FR-002, FR-023 (diferenciación visual de acciones sensibles).

- [ ] T047 [FE] Configurar el enrutador SPA con rutas para las 6 pantallas
  (`/login`, `/dashboard`, `/usuarios`, `/moderacion`, `/desafios`, `/reportes`) en
  `frontend-admin/src/presentation/AppRouter.tsx` (depende de T002).
- [ ] T048 [FE] Implementar el guard de ruta "solo ADMIN" que usa `SesionAdministrativa` para bloquear el
  acceso a cualquier ruta administrativa si `tienePermisoDeAdministrador()` es falso en
  `frontend-admin/src/presentation/RequireAdmin.tsx` (depende de T023, T044). Ref: FR-002, US1.
- [ ] T049 [P] [FE] Implementar componentes visuales reutilizables `AccionSensibleButton` (estilo
  distintivo: color/ícono) y `AccionConsultaButton` en
  `frontend-admin/src/presentation/shared/AccionSensibleButton.tsx` y
  `frontend-admin/src/presentation/shared/AccionConsultaButton.tsx` (depende de T001). Ref: FR-023.
- [ ] T050 [P] [FE] Implementar componente reutilizable `ModalConfirmacionExplicita` (usado por toda
  acción destructiva/sensible) en
  `frontend-admin/src/presentation/shared/ModalConfirmacionExplicita.tsx` (depende de T001). Ref: FR-021,
  FR-022.
- [ ] T051 [FE] Implementar pantalla de login de administrador en
  `frontend-admin/src/presentation/login/LoginAdminPage.tsx` (usa `AuthAdminService` vía T044; sin fetch
  directo) (depende de T027, T044, T047). Ref: FR-001, FR-002, US1.
- [ ] T051bis [FE] Implementar la pantalla de dashboard administrativo (`DashboardPage.tsx`), mostrando
  los 7 indicadores confirmados (reportes pendientes, usuarios activos, desafíos pendientes,
  publicaciones activas, publicaciones eliminadas, usuarios baneados, desafíos decididos) usando
  `DashboardService.obtenerIndicadores()`, sin recálculo en cliente, en
  `frontend-admin/src/presentation/dashboard/DashboardPage.tsx` (depende de T028, T044, T047). Ref:
  FR-003, US4, `research.md` §7bis, Clarifications Session 2026-09-08 pregunta 4 (corrige brecha
  detectada en `/speckit.analyze`: pantalla de Dashboard sin tarea de implementación).

### Tests de presentación (base)

- [ ] T052 [P] [TEST] Test de `RequireAdmin` (bloquea acceso a usuario no-ADMIN, permite acceso a ADMIN)
  en `frontend-admin/tests/presentation/RequireAdmin.test.tsx` (depende de T048). Ref: FR-002, SC-002.
- [ ] T053 [P] [TEST] Test de `ModalConfirmacionExplicita` (no ejecuta acción sin confirmación explícita)
  en `frontend-admin/tests/presentation/ModalConfirmacionExplicita.test.tsx` (depende de T050). Ref:
  FR-021, FR-022, SC-004.
- [ ] T054 [P] [TEST] Test de `LoginAdminPage` (rechazo de USER, aceptación de ADMIN, error de
  credenciales) en `frontend-admin/tests/presentation/LoginAdminPage.test.tsx` (depende de T051). Ref:
  US1 (escenarios 1–3).
- [ ] T054bis [P] [TEST] Test de `DashboardPage` (renderiza los 7 indicadores confirmados con los valores
  devueltos por `DashboardService`, sin recálculo en cliente) en
  `frontend-admin/tests/presentation/DashboardPage.test.tsx` (depende de T051bis). Ref: FR-003, US4.

**Checkpoint**: Andamiaje de presentación, login, dashboard y componentes de acción sensible listos.
Habilita Fases 6–9 en paralelo.

---

## Phase 6: Gestión de Usuarios

**Trazabilidad**: `spec.md` US3, FR-004..FR-007, FR-021..FR-024; `contracts/openapi.yaml`
`/usuarios*`.

- [ ] T055 [FE] Implementar la pantalla contenedora de gestión de usuarios (búsqueda + paginación,
  llamando a `UsuariosService`) en `frontend-admin/src/presentation/usuarios/UsuariosPage.tsx` (depende de
  T029, T044, T047). Ref: FR-004, FR-024.
- [ ] T056 [P] [FE] Implementar tabla presentacional `UsuariosTable` (solo props, sin llamadas a
  servicios) en `frontend-admin/src/presentation/usuarios/UsuariosTable.tsx` (depende de T019, T049).
- [ ] T057 [FE] Implementar acción "banear" con `ModalConfirmacionExplicita` y `AccionSensibleButton`,
  deshabilitada/oculta cuando `usuario.puedeSerBaneado()` es falso (es decir, cuando el usuario objetivo
  tiene rol `ADMIN`, incluido el propio actor autenticado) en
  `frontend-admin/src/presentation/usuarios/BanearUsuarioAction.tsx` (depende de T019, T050, T055). Ref:
  FR-005, FR-021, FR-029, Clarifications Session 2026-09-08 preguntas 2.1/2.2.
- [ ] T058 [FE] Implementar acción "eliminar" con `ModalConfirmacionExplicita`, deshabilitada/oculta
  cuando `usuario.puedeSerEliminado()` es falso (rol `ADMIN`, incluido el propio actor autenticado) en
  `frontend-admin/src/presentation/usuarios/EliminarUsuarioAction.tsx` (depende de T019, T050, T055). Ref:
  FR-006, FR-021, FR-029, Clarifications Session 2026-09-08 preguntas 2.1/2.2.
- [ ] T059 [FE] Implementar acción "promover a administrador", visible únicamente si el actor autenticado
  tiene rol `ADMIN` y el usuario objetivo `puedeSerPromovidoAAdmin()`, con confirmación explícita, en
  `frontend-admin/src/presentation/usuarios/PromoverUsuarioAction.tsx` (depende de T019, T033, T050,
  T055). Ref: FR-007, FR-022, "la opción no debe existir para roles USER".

### Tests de gestión de usuarios

- [ ] T060 [P] [TEST] Test de `UsuariosPage` (búsqueda paginada resuelta vía servicio, no en memoria) en
  `frontend-admin/tests/presentation/UsuariosPage.test.tsx` (depende de T055). Ref: FR-004, FR-024.
- [ ] T061 [P] [TEST] Test de `PromoverUsuarioAction` verificando que la acción **no se renderiza** para
  un actor sin rol ADMIN en `frontend-admin/tests/presentation/PromoverUsuarioAction.test.tsx` (depende de
  T059). Ref: FR-007, SC-002.
- [ ] T062 [P] [TEST] Test de `BanearUsuarioAction`/`EliminarUsuarioAction` verificando (a) confirmación
  explícita antes de invocar el servicio, y (b) que la acción está deshabilitada/oculta para **cualquier**
  usuario objetivo con rol `ADMIN`, incluido el propio actor autenticado (no solo autobaneo) en
  `frontend-admin/tests/presentation/UsuarioAccionesDestructivas.test.tsx` (depende de T057, T058). Ref:
  FR-021, FR-029, SC-004, Clarifications Session 2026-09-08 preguntas 2.1/2.2.

**Checkpoint**: US3 completa y testeable de forma independiente.

---

## Phase 7: Moderación de Publicaciones y Reportes

**Trazabilidad**: `spec.md` US2, FR-008..FR-011, FR-025, FR-026; `contracts/openapi.yaml`
`/publicaciones/reportadas`, `/reportes/{id}`, `/reportes/{id}/resolver-sin-eliminar`,
`/publicaciones/{id}`.

- [ ] T063 [FE] Implementar el **contenedor** de moderación (patrón contenedor/presentacional, según
  `research.md` §8): filtros, paginación y llamadas a `ModeracionService` en
  `frontend-admin/src/presentation/moderacion/ModeracionContainer.tsx` (depende de T030, T044). Ref: FR-008,
  FR-024, `research.md` §8.
- [ ] T064 [P] [FE] Implementar la vista presentacional `ReportesTable` con indicadores de
  prioridad/antigüedad visualmente claros (usa `Reporte.antiguedadEnDias()`) en
  `frontend-admin/src/presentation/moderacion/ReportesTable.tsx` (depende de T021, T049). Ref: FR-025.
- [ ] T065 [FE] Implementar la pantalla de detalle de reporte en
  `frontend-admin/src/presentation/moderacion/DetalleReportePage.tsx` (depende de T030, T044). Ref:
  FR-009.
- [ ] T066 [FE] Implementar acción "eliminar publicación" con `ModalConfirmacionExplicita` en
  `frontend-admin/src/presentation/moderacion/EliminarPublicacionAction.tsx` (depende de T020, T050,
  T065). Ref: FR-010, FR-021.
- [ ] T067 [FE] Implementar acción "resolver reporte sin eliminar" en
  `frontend-admin/src/presentation/moderacion/ResolverReporteAction.tsx` (depende de T021, T065). Ref:
  FR-026, `research.md` §6.

### Tests de moderación

- [ ] T068 [P] [TEST] Test de `ModeracionContainer` (filtrado/paginación resueltos vía servicio) en
  `frontend-admin/tests/presentation/ModeracionContainer.test.tsx` (depende de T063). Ref: FR-008,
  FR-024.
- [ ] T069 [P] [TEST] Test de `EliminarPublicacionAction` (requiere confirmación explícita, cambia estado
  a ELIMINADA) en `frontend-admin/tests/presentation/EliminarPublicacionAction.test.tsx` (depende de
  T066). Ref: FR-010, FR-021, SC-004.
- [ ] T070 [P] [TEST] Test de `ReportesTable` (muestra indicador de antigüedad/prioridad de forma
  distinguible) en `frontend-admin/tests/presentation/ReportesTable.test.tsx` (depende de T064). Ref:
  FR-025, SC-003.

**Checkpoint**: US2 completa y testeable de forma independiente (historia P1, junto con US1).

---

## Phase 8: Gestión de Desafíos

**Trazabilidad**: `spec.md` US5, FR-012..FR-016; `contracts/openapi.yaml` `/desafios*`.

- [ ] T071 [FE] Implementar la pantalla de listado de desafíos propuestos en
  `frontend-admin/src/presentation/desafios/DesafiosPage.tsx` (depende de T031, T044). Ref: FR-012.
- [ ] T072 [FE] Implementar la pantalla de detalle de desafío propuesto en
  `frontend-admin/src/presentation/desafios/DetalleDesafioPage.tsx` (depende de T031, T044). Ref: FR-013.
- [ ] T073 [FE] Implementar acciones "aprobar"/"rechazar", habilitadas solo si `desafio.estaPendiente()`
  es verdadero, en `frontend-admin/src/presentation/desafios/AprobarRechazarDesafioActions.tsx` (depende
  de T022, T072). Ref: FR-014, FR-015, US5 escenario 5.

### Tests de gestión de desafíos

- [ ] T074 [P] [TEST] Test de `DesafiosPage` (lista solo pendientes al filtrar) en
  `frontend-admin/tests/presentation/DesafiosPage.test.tsx` (depende de T071). Ref: FR-012.
- [ ] T075 [P] [TEST] Test de `AprobarRechazarDesafioActions` (deshabilita acciones cuando el desafío ya
  no está PENDIENTE) en
  `frontend-admin/tests/presentation/AprobarRechazarDesafioActions.test.tsx` (depende de T073). Ref:
  FR-014, FR-015, US5 escenario 5.

**Checkpoint**: US5 completa y testeable de forma independiente.

---

## Phase 9: Reportes y Analíticas

**Trazabilidad**: `spec.md` US6, FR-017..FR-019, FR-028; `contracts/openapi.yaml`
`/reportes-analiticas*`.

- [ ] T076 [FE] Implementar la pantalla de reportes/analíticas (consume datos ya agregados, sin
  recálculo en cliente) en `frontend-admin/src/presentation/reportes/ReportesAnaliticaPage.tsx` (depende
  de T032, T044). Ref: FR-017.
- [ ] T077 [FE] Implementar la acción "iniciar exportación" como una operación **síncrona** de un solo
  paso (sin polling: la llamada a `ReportesAnaliticaService.iniciarExportacion` devuelve directamente el
  resultado final `exitoso`/`urlDescarga`/`mensajeError`) en
  `frontend-admin/src/presentation/reportes/ExportarReporteAction.tsx` (depende de T025, T032, T076). Ref:
  FR-018, FR-028, `research.md` §4, Clarifications Session 2026-09-08 pregunta 3. En caso de fallo, mostrar
  el mensaje exacto "Error: Reporte no generado.".
- [ ] T078 [FE] Implementar la acción de descarga, habilitada únicamente cuando el resultado de T077 fue
  `exitoso === true` (la `urlDescarga` está disponible de inmediato, sin espera adicional), en
  `frontend-admin/src/presentation/reportes/DescargarReporteAction.tsx` (depende de T025, T077). Ref:
  FR-019.

### Tests de reportes y analíticas

- [ ] T079 [P] [TEST] Test de `ExportarReporteAction` (caso síncrono exitoso: se ofrece descarga de
  inmediato sin estado intermedio; caso síncrono fallido: se muestra el mensaje exacto
  "Error: Reporte no generado.") en `frontend-admin/tests/presentation/ExportarReporteAction.test.tsx`
  (depende de T077). Ref: FR-028, Clarifications Session 2026-09-08 pregunta 3.
- [ ] T080 [P] [TEST] Test de `DescargarReporteAction` (habilitado únicamente cuando la exportación
  síncrona fue exitosa) en `frontend-admin/tests/presentation/DescargarReporteAction.test.tsx` (depende de
  T078). Ref: FR-019.

**Checkpoint**: US6 completa y testeable de forma independiente. Todas las historias de usuario (US1–US6)
quedan implementadas de forma independiente tras las Fases 5–9.

---

## Phase 10: Tests Frontend (Cross-Cutting)

**Purpose**: Completar la cobertura de tests que no pertenece a una única pantalla/servicio, y verificar
el cumplimiento de las reglas de negocio críticas de forma consolidada (SC-006 de `spec.md`).

- [ ] T081 [P] [TEST] Test consolidado de reglas de permisos administrativos (matriz rol × acción:
  USER vs ADMIN sobre banear/eliminar/promover/eliminar publicación/aprobar/rechazar) en
  `frontend-admin/tests/domain/PermisosAdministrativos.test.ts` (depende de T019-T025). Ref: SC-006.
- [ ] T082 [P] [TEST] Test consolidado de confirmaciones explícitas (todas las acciones destructivas
  listadas en `spec.md` FR-021/FR-022 requieren y registran confirmación) en
  `frontend-admin/tests/presentation/ConfirmacionesExplicitas.test.tsx` (depende de T057, T058, T059,
  T066). Ref: SC-004.
- [ ] T083 [P] [TEST] Test de cobertura de transiciones de estado válidas/ inválidas para
  `EstadoPublicacion`, `EstadoDesafioPropuesto`, `EstadoReporte`, y de los resultados válidos/inválidos de
  `ExportacionReporte` (`exitoso`/`fallo`, ya no un enum de estado) en
  `frontend-admin/tests/domain/TransicionesDeEstado.test.ts` (depende de T020-T025).
- [ ] T084 [P] [FE] Configurar reporte de cobertura de tests (`coverage`) en la configuración de
  `frontend-admin/jest.config.ts` (o `vitest.config.ts`) para verificar cumplimiento de SC-006 (depende de
  T004).

**Checkpoint**: Todas las reglas de negocio críticas identificadas en la constitución y en `spec.md`
cuentan con test automatizado (Principio VII, SC-006).

---

## Phase 11: Integración Frontend-Backend

**Purpose**: Verificar el `frontend-admin/` contra la API real (o un servidor de contrato/mock fiel a
`contracts/openapi.yaml`), cerrando la brecha entre el desarrollo aislado (servicios mockeados) y el
backend real. Las tareas de backend aquí se limitan al **cumplimiento del contrato** consumido por el
frontend; la implementación interna del backend (persistencia, reglas server-side) está fuera de alcance
de este módulo.

- [ ] T085 [BE] Verificar/soportar que el backend expone los endpoints de `contracts/openapi.yaml`
  (exportación de reportes es síncrona: no existe endpoint de consulta de estado intermedio) con los
  esquemas de request/response documentados (tarea de coordinación con el equipo de backend, no de
  implementación del `frontend-admin/`).
- [ ] T086 [FE] Implementar/validar un servidor de contrato (mock server) basado en
  `contracts/openapi.yaml` para pruebas de integración tempranas en
  `frontend-admin/tests/integration/mockServer.ts` (depende de T042).
- [ ] T087 [P] [TEST] Test de integración: login admin contra el contrato (`POST /auth/login`) en
  `frontend-admin/tests/integration/AuthAdmin.integration.test.ts` (depende de T044, T086). Ref: FR-001,
  FR-002.
- [ ] T088 [P] [TEST] Test de integración: listado y filtrado de publicaciones reportadas
  (`GET /publicaciones/reportadas`) verificando que los parámetros de paginación/filtro viajan en la
  request en `frontend-admin/tests/integration/Moderacion.integration.test.ts` (depende de T044, T086).
  Ref: FR-008, FR-024, SC-005.
- [ ] T089 [P] [TEST] Test de integración: ciclo completo banear/eliminar/promover usuario contra el
  contrato en `frontend-admin/tests/integration/Usuarios.integration.test.ts` (depende de T044, T086).
  Ref: FR-005..FR-007.
- [ ] T090 [P] [TEST] Test de integración: ciclo completo aprobar/rechazar desafío contra el contrato en
  `frontend-admin/tests/integration/Desafios.integration.test.ts` (depende de T044, T086). Ref:
  FR-014, FR-015.
- [ ] T091 [P] [TEST] Test de integración: exportación síncrona de reporte de analítica (caso exitoso →
  descarga inmediata; caso fallido → mensaje "Error: Reporte no generado.") contra el contrato en
  `frontend-admin/tests/integration/ReportesAnalitica.integration.test.ts` (depende de T044, T086). Ref:
  FR-018, FR-019, FR-028, Clarifications Session 2026-09-08 pregunta 3.
- [ ] T092 [BE] Coordinar con backend la verificación de los códigos de error 401/403/404/409 documentados
  en `contracts/openapi.yaml` para los flujos de acciones sensibles (auto-baneo, transición inválida de
  desafío) — tarea de coordinación, no de implementación del `frontend-admin/`.

**Checkpoint**: `frontend-admin/` verificado contra el contrato de API completo, con o sin backend real
disponible.

---

## Phase 12: Validación End-to-End según `quickstart.md`

**Purpose**: Ejecutar manualmente los 6 escenarios de `quickstart.md` contra el sistema desplegado
(backend real + `frontend-admin/`), como último gate antes de considerar la feature completa.

- [ ] T093 Ejecutar Escenario 1 de `quickstart.md` (Acceso seguro al módulo, US1) y registrar resultado.
  Depende de T085 (backend disponible) y T051 (login implementado).
- [ ] T094 Ejecutar Escenario 2 de `quickstart.md` (Moderación de publicaciones y reportes, US2) y
  registrar resultado. Depende de T085, T063-T067.
- [ ] T095 Ejecutar Escenario 3 de `quickstart.md` (Gestión de usuarios, US3) y registrar resultado.
  Depende de T085, T055-T059.
- [ ] T096 Ejecutar Escenario 4 de `quickstart.md` (Dashboard administrativo, US4) y registrar resultado.
  Depende de T085, T028, T051bis.
- [ ] T097 Ejecutar Escenario 5 de `quickstart.md` (Gestión de desafíos propuestos, US5) y registrar
  resultado. Depende de T085, T071-T073.
- [ ] T098 Ejecutar Escenario 6 de `quickstart.md` (Reportes y analíticas exportables, US6) y registrar
  resultado. Depende de T085, T076-T078.
- [ ] T099 Verificar los "Criterios de éxito de esta validación manual" de `quickstart.md` (SC-004,
  SC-005, SC-007 de `spec.md`) de forma consolidada, inspeccionando las llamadas de red durante los
  escenarios 2, 3 y 5. Depende de T093-T098.

**Checkpoint**: Feature `001-admin-moderacion` validada end-to-end y lista para cierre.

---

## Dependencies & Execution Order

### Phase Dependencies (secuencial obligatorio entre fases)

- **Fase 1 (Setup)**: Sin dependencias — inicio inmediato.
- **Fase 2 (Dominio y Enums)**: Depende de Fase 1. **BLOQUEA** Fases 3–9 (ninguna pantalla o servicio
  puede referenciar entidades/enums que no existen).
- **Fase 3 (Servicios de Aplicación)**: Depende de Fase 2.
- **Fase 4 (Infraestructura y Autenticación)**: Depende de Fase 3 (usa la interfaz `HttpClient` definida
  en T026); **BLOQUEA** el uso real (no mockeado) de los servicios en Fases 5–9.
- **Fase 5 (Pantallas base)**: Depende de Fase 4.
- **Fases 6–9 (Gestión de usuarios / Moderación / Desafíos / Reportes)**: Dependen de Fase 5; **son
  independientes entre sí** y pueden ejecutarse en paralelo por distintos desarrolladores.
- **Fase 10 (Tests Frontend cross-cutting)**: Depende de que las Fases 6–9 tengan al menos sus entidades y
  acciones principales implementadas (T019-T025, T057-T059, T066).
- **Fase 11 (Integración Frontend-Backend)**: Depende de Fase 4 (T044) y de que el backend real o un mock
  fiel a `contracts/openapi.yaml` esté disponible.
- **Fase 12 (Validación E2E)**: Depende de TODAS las fases anteriores y de que el backend real esté
  desplegado (T085).

### Reglas de paralelización

- Todas las tareas `[P]` dentro de una misma fase pueden ejecutarse en paralelo (archivos distintos, sin
  dependencias cruzadas entre sí).
- Las Fases 6, 7, 8 y 9 pueden asignarse a desarrolladores distintos en paralelo una vez cerrada la Fase 5.
- Las tareas de backend (`[BE]`, T085 y T092) son de **coordinación de contrato**, no de implementación, y
  pueden avanzar en paralelo con cualquier fase del frontend a partir de que `contracts/openapi.yaml` está
  congelado (ya lo está, generado en `/speckit.plan`).

### Regla TDD dentro de cada fase

- En la Fase 2, los tests (T013–T018) se listan y deben escribirse **antes** que las entidades
  correspondientes (T019–T025), y deben fallar hasta que la entidad exista.
- En la Fase 3, los tests de servicios (T034–T039) se ejecutan contra los servicios ya implementados con
  un `HttpClient` mockeado; deben cubrir explícitamente los casos de permisos (p. ej. T036 cubre "un USER
  no puede promover").
- En las Fases 6–9, los tests de presentación (T060–T062, T068–T070, T074–T075, T079–T080) verifican
  específicamente: (a) que las acciones sensibles exigen confirmación explícita, y (b) que las acciones
  restringidas por rol no se renderizan para actores sin permiso.

---

## Resumen de Trazabilidad (Requisitos ↔ Tareas)

| Requisito / Historia | Tareas principales |
|---|---|
| FR-001, FR-002 (login, acceso ADMIN) | T027, T048, T051, T052, T054, T093 |
| FR-003 (dashboard) | T028, T035, T051bis, T054bis, T096 |
| FR-004..FR-007, FR-029 (gestión de usuarios, restricción ADMIN) | T019, T029, T033, T036, T055-T059,
  T060-T062, T089, T095 |
| FR-008..FR-011 (moderación) | T020, T021, T030, T037, T063-T067, T068-T070, T088, T094 |
| FR-012..FR-016 (desafíos) | T022, T031, T038, T071-T073, T074-T075, T090, T097 |
| FR-017..FR-019, FR-028 (reportes/analíticas, exportación síncrona) | T024, T025, T032, T039, T076-T078,
  T079-T080, T091, T098 |
| FR-020, FR-027 (sesión válida, expiración) | T023, T041, T043, T045, T046, T093 |
| FR-021, FR-022 (confirmación explícita) | T050, T053, T057, T058, T059, T066, T082, T099 |
| FR-023 (diferenciación visual) | T049, T099 |
| FR-024 (paginación/filtros server-side) | T029, T030, T055, T063, T088, T099 |
| FR-025 (prioridad/antigüedad) | T021, T064, T070, T099 |
| FR-026 (resolver-sin-eliminar) | T011, T021, T067 |
| ~~T012~~ (eliminada — exportación síncrona) | ver FR-017..FR-019, FR-028 arriba |
| SC-006 (tests de reglas críticas) | T081, T082, T083, T084 |

---

## Notes

- **No se crea ni ejecuta código en este documento.** `tasks.md` es un artefacto de planificación; la
  ejecución real corresponde a `/speckit.implement`.
- `[P]` = archivos distintos, sin dependencias pendientes entre sí dentro de la misma fase.
- `[FE]` = `frontend-admin/`; `[BE]` = coordinación de contrato con `backend/` (implementación de backend
  fuera de alcance); `[TEST]` = tareas de test explícitas.
- Cada tarea indica archivo(s) concreto(s) y su trazabilidad a `spec.md` (`FR-XXX`/`US-X`),
  `data-model.md` y/o `contracts/openapi.yaml`.
- El modelo de dominio (Fase 2) y sus tests se priorizan explícitamente antes que servicios, pantallas o
  integración, según lo solicitado.
- Toda acción administrativa sensible (banear, eliminar, promover, eliminar publicación) tiene una tarea
  de implementación de confirmación explícita y una tarea de test asociada.
