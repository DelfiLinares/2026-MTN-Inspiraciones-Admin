# Implementation Plan: Administración y Moderación de la Red Social de Inspiración Artística

**Branch**: `001-admin-moderacion` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-admin-moderacion/spec.md`

**Note**: Este plan corresponde únicamente al diseño técnico. No se implementa código en esta fase, en
línea con el principio "Especificación manda sobre implementación" y la regla de no-código durante
planificación de la constitución del proyecto (`.specify/memory/constitution.md`).

## Summary

El requisito principal es construir el diseño técnico de un módulo de **administración y moderación**
para la red social de inspiración artística: una aplicación **React separada** (`frontend-admin/`) que
consume una **API REST** de un backend **Java/Spring Boot con MySQL** (`backend/`), sin implementar en el
cliente ninguna lógica de negocio que corresponda al servidor (persistencia, generación de rankings/
recomendaciones, envío de mails, generación de archivos de reportes).

El enfoque técnico consiste en:
- Definir contratos de API REST (`contracts/openapi.yaml`) para las operaciones administrativas
  identificadas en la spec (auth admin, dashboard, usuarios, publicaciones/reportes, desafíos, reportes/
  analíticas y exportación síncrona).
- Modelar el dominio de UI (`data-model.md`) con entidades livianas orientadas a objetos (`Usuario`,
  `Publicacion`, `Reporte`, `Desafio`, `ExportacionReporte`) y enums (`RolUsuario`, `EstadoCuentaUsuario`,
  `EstadoPublicacion`, `EstadoDesafioPropuesto`, `MotivoReporte`, `EstadoReporte`) que encapsulan las
  reglas de permisos y transición de estados descriptas en la spec.
- Documentar decisiones técnicas y alternativas evaluadas (`research.md`) para resolver los puntos
  `NEEDS CLARIFICATION` heredados de la especificación que impactan el diseño (sesión, exportación
  asíncrona, acciones entre administradores, etc.), dejando explícitas las decisiones asumidas.
- Describir el flujo de validación manual de extremo a extremo (`quickstart.md`) para verificar, una vez
  implementado, que las historias de usuario P1 (login admin, moderación) funcionan correctamente contra
  contratos simulados/reales de la API.

Este plan **no crea código de frontend ni de backend**. Solo produce los artefactos de diseño técnico
(`plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`), manteniendo
trazabilidad explícita con `spec.md`.

## Technical Context

**Language/Version**: TypeScript (React 18+) para `frontend-admin/`; Java 17+ / Spring Boot 3.x para
`backend/` (ya definidos por el contexto del proyecto, no se re-evalúan alternativas).

**Primary Dependencies**:
- Frontend admin: React, cliente HTTP (fetch/axios encapsulado en capa de infraestructura), enrutador
  SPA (React Router u equivalente), librería de testing (Jest/Vitest + Testing Library).
- Backend: Spring Boot (Web, Security, Data JPA), MySQL Driver. (Implementación de backend fuera de
  alcance de este plan; se documenta solo el contrato de API que el frontend admin consumirá).

**Storage**: MySQL, gestionado exclusivamente por el backend. El frontend admin **no accede** a MySQL
directamente en ningún caso; toda persistencia y consulta de datos pasa por la API REST.

**Testing**: Jest/Vitest + Testing Library para tests unitarios de modelos de dominio de UI y servicios;
tests de integración de la capa de servicios contra un cliente HTTP simulado (mock) o contra contratos
definidos en `contracts/openapi.yaml` (contract testing).

**Target Platform**: Aplicación web SPA de escritorio (navegador moderno), consumida por administradores/
moderadores desde un entorno de oficina/backoffice. No se requiere soporte offline ni mobile-first.

**Project Type**: Web application con **tres proyectos separados** en el repositorio final:
`backend/`, `frontend/` (usuario final, fuera de alcance) y `frontend-admin/` (este módulo).

**Performance Goals**: Listados de usuarios/publicaciones/reportes con paginación server-side; tiempos de
respuesta percibidos por el administrador consistentes independientemente del volumen total de datos
(ver SC-005 de la spec). No se definen objetivos de req/s ya que la carga esperada es de uso interno
(bajo número de administradores concurrentes).

**Constraints**:
- El frontend admin no debe implementar lógica de negocio de backend (persistencia, generación de
  rankings/recomendaciones, envío de mails, generación de archivos de reportes).
- Los componentes de presentación no deben realizar llamadas directas a fetch/axios; deben pasar por la
  capa de servicios (principio de separación de capas de la constitución).
- Toda regla de negocio crítica del frontend (permisos, confirmaciones destructivas, transición de
  estados) debe tener tests automatizados.

**Scale/Scope**: 6 pantallas administrativas (login, dashboard, gestión de usuarios, moderación de
publicaciones/reportes, gestión de desafíos, reportes/analíticas), 4 entidades de dominio de UI, ~15
operaciones de API consumidas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` (Inspiraciones Admin Constitution v1.0.0):

| Principio constitucional | Cumplimiento en este plan |
|---|---|
| I. Especificación manda sobre implementación | ✅ PASS. Todas las pantallas y entidades planificadas están trazadas 1:1 a historias de usuario (US1–US6) y requisitos (FR-001..FR-029) de `spec.md`. No se agregan pantallas fuera de las 6 declaradas. |
| II. Dominio de UI orientado a objetos | ✅ PASS. `data-model.md` define `Usuario`, `Publicacion`, `Reporte`, `Desafio` como clases con métodos de negocio (`puedeSerPromovido()`, `estaReportada()`, `puedeAprobarse()`, etc.), no como DTOs anémicos. |
| III. Separación de capas (NON-NEGOTIABLE) | ✅ PASS. La estructura de proyecto (`frontend-admin/src/{presentation,domain,application,infrastructure}`) refleja explícitamente las 4 capas exigidas; ningún componente de presentación llama directamente a fetch/axios. |
| IV. Sin duplicación ni componentes gigantes | ✅ PASS (a validar en fase de tasks). Se planifican servicios de aplicación reutilizables por pantalla en lugar de lógica repetida por componente. |
| V. Value objects y enums tipados | ✅ PASS. `RolUsuario`, `EstadoCuentaUsuario`, `EstadoPublicacion`, `EstadoDesafioPropuesto`, `MotivoReporte`, `EstadoReporte` se documentan como enums en `data-model.md` y se reflejan en `contracts/openapi.yaml` como esquemas `enum`. (Nota: `EstadoExportacionReporte` fue eliminado en Clarifications Session 2026-09-08 al confirmarse que la exportación de reportes es síncrona.) |
| VI. Patrones de diseño con criterio | ✅ PASS. Se propone un patrón contenedor/presentacional únicamente para la pantalla de moderación de publicaciones/reportes (filtrado complejo), no se fuerza en pantallas simples. |
| VII. Tests para reglas de negocio (NON-NEGOTIABLE) | ✅ PASS (a nivel de plan). `quickstart.md` y la sección de Testing de este plan detallan qué reglas requieren test unitario/integración; la ejecución real de tests se define en la fase de tasks. |
| Escalabilidad y eficiencia operativa | ✅ PASS. Todos los listados planificados usan paginación/filtros server-side (ver `contracts/openapi.yaml`); analíticas consumen datos ya agregados por el backend (no se recalculan en cliente). |
| Flujo de trabajo Spec-Driven (no código en fases previas) | ✅ PASS. Este plan no contiene código; solo documentos de diseño. |

**Resultado**: Sin violaciones. No se requiere completar la tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-moderacion/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Fase 0 (/speckit.plan)
├── data-model.md         # Fase 1 (/speckit.plan)
├── quickstart.md        # Fase 1 (/speckit.plan)
├── contracts/
│   └── openapi.yaml     # Fase 1 (/speckit.plan)
└── tasks.md             # Fase 2 (/speckit.tasks - NO generado por /speckit.plan)
```

### Source Code (repository root)

El repositorio final del proyecto (fuera del repo meta de especificación) tendrá la siguiente estructura
de alto nivel, de la cual este plan detalla únicamente `frontend-admin/`:

```text
backend/                          # Java / Spring Boot / MySQL (fuera de alcance de este plan)
├── src/main/java/...
└── src/test/java/...

frontend/                         # Aplicación de usuario final (fuera de alcance de este plan)
└── ...

frontend-admin/                   # Módulo planificado en este documento
├── src/
│   ├── presentation/            # Componentes React por pantalla
│   │   ├── login/               # Pantalla: login de administrador
│   │   ├── dashboard/           # Pantalla: dashboard/home administrativo
│   │   ├── usuarios/            # Pantalla: gestión de usuarios
│   │   ├── moderacion/          # Pantalla: moderación de publicaciones y reportes
│   │   ├── desafios/            # Pantalla: gestión de desafíos
│   │   └── reportes/            # Pantalla: reportes y analíticas
│   ├── domain/                  # Modelos de UI (dominio ligero)
│   │   ├── Usuario.ts
│   │   ├── Publicacion.ts
│   │   ├── Reporte.ts
│   │   ├── Desafio.ts
│   │   └── enums/               # RolUsuario, EstadoCuentaUsuario, EstadoPublicacion,
│   │                             # EstadoDesafioPropuesto, MotivoReporte, EstadoReporte
│   ├── application/             # Servicios / casos de uso administrativos
│   │   ├── AuthAdminService.ts
│   │   ├── DashboardService.ts
│   │   ├── UsuariosService.ts
│   │   ├── ModeracionService.ts
│   │   ├── DesafiosService.ts
│   │   └── ReportesAnaliticaService.ts
│   └── infrastructure/          # Cliente HTTP, sesión y permisos
│       ├── httpClient.ts
│       ├── sessionManager.ts
│       └── apiEndpoints.ts
└── tests/
    ├── domain/                  # Tests unitarios de reglas de Usuario/Publicacion/Reporte/Desafio
    ├── application/             # Tests de servicios (casos de uso) con cliente HTTP simulado
    ├── presentation/            # Tests de componentes (permisos visibles, confirmaciones)
    └── integration/             # Tests de integración contra contratos de la API
```

**Structure Decision**: Se adopta la variante **"Web application" (Opción 2 del template)**, extendida a
**tres proyectos** (`backend/`, `frontend/`, `frontend-admin/`) porque el contexto del proyecto exige una
aplicación de administración completamente separada del frontend de usuario final. Dentro de
`frontend-admin/`, se aplica una arquitectura por capas (`presentation` / `domain` / `application` /
`infrastructure`) exigida por el principio III de la constitución, en lugar de la organización genérica
por tipo de archivo (`components/`, `pages/`, `services/`) sugerida como ejemplo en el template.

## Complexity Tracking

> No aplica: el Constitution Check no registró violaciones que requieran justificación.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
