# Phase 0 Research: Administración y Moderación

**Feature**: 001-admin-moderacion | **Date**: 2026-09-07

Este documento resuelve las decisiones técnicas necesarias antes del diseño de datos y contratos
(Fase 1), incluyendo las resoluciones propuestas para los puntos `NEEDS CLARIFICATION` de `spec.md` que
impactan directamente el diseño del frontend admin. Ninguna decisión aquí implica escribir código.

## 1. Arquitectura general del frontend admin

**Decisión**: Aplicación React (SPA) separada (`frontend-admin/`), organizada en 4 capas:
`presentation`, `domain`, `application`, `infrastructure`.

**Rationale**: Exigido explícitamente por la constitución del proyecto (Principio III, NON-NEGOTIABLE) y
por el contexto de usuario ("aplicación React separada del frontend de usuario final"). Esta separación
permite testear reglas de negocio (dominio) sin necesidad de renderizar componentes, y sustituir el
cliente HTTP real por mocks en tests de servicios.

**Alternativas consideradas**:
- *Organización por tipo de archivo* (`components/`, `pages/`, `services/` planos): rechazada porque no
  deja explícita la frontera entre reglas de negocio de UI y detalles de infraestructura/HTTP, violando
  el Principio III.
- *Monolito único con frontend de usuario final*: rechazada explícitamente por el contexto del proyecto
  (rol y audiencia distintos, requisitos de seguridad distintos, ciclo de despliegue independiente).

## 2. Autenticación de administrador y manejo de sesión

**Decisión**: El login de administrador reutiliza el mismo mecanismo de autenticación de la plataforma
(usuario/contraseña contra el backend), devolviendo un token de sesión (p. ej. JWT) que incluye el rol
del usuario. El frontend admin valida en el cliente que el rol recibido sea `ADMIN` antes de conceder
acceso a las pantallas del módulo, y además el backend debe rechazar cualquier operación administrativa
si el rol no es `ADMIN` (defensa en profundidad).

**Rationale**: Consistente con el requisito "Solo los usuarios con rol ADMIN pueden acceder al módulo
administrativo" (FR-002) y con el principio de seguridad de que las acciones administrativas deben
realizarse mediante sesión válida. No se documenta lógica de generación/verificación de tokens en el
servidor porque es responsabilidad del backend (fuera de alcance).

**Resolución (FR-027, sesión expirada durante acción sensible) — CONFIRMADA en Clarifications
Session 2026-09-08**: Ante una expiración de sesión detectada durante una acción sensible (eliminar,
banear, promover), el frontend admin **cancela la acción en curso**, descarta cualquier confirmación
pendiente y redirige al login, mostrando un mensaje de "sesión expirada, la acción no fue aplicada". Esto
evita dejar al usuario en un estado ambiguo sobre si la acción se ejecutó. Decisión definitiva, no
requiere validación adicional de negocio.

**Alternativas consideradas**:
- *Reintentar automáticamente tras reautenticación silenciosa*: rechazada por mayor complejidad y porque
  podría ejecutar una acción destructiva sin que el administrador la reconfirme explícitamente
  (violaría el requisito de confirmación explícita).

## 3. Paginación y filtrado de listados (usuarios, publicaciones/reportes)

**Decisión**: Todos los listados (usuarios, publicaciones reportadas, reportes, desafíos propuestos)
usan paginación basada en parámetros de consulta (`page`, `pageSize`) y filtros como query params
resueltos por el backend (p. ej. `estado`, `motivo`, `texto de búsqueda`). El frontend admin nunca
descarga el listado completo para filtrar en memoria.

**Rationale**: Exigido por el principio de escalabilidad de la constitución y por los requisitos FR-004,
FR-008 y FR-024 de la especificación. Permite que el sistema escale en cantidad de usuarios/publicaciones/
reportes sin degradar la experiencia del administrador.

**Alternativas consideradas**:
- *Cargar todo y filtrar client-side*: rechazada explícitamente por la constitución y por requisitos no
  funcionales de performance de la spec.

## 4. Exportación de reportes/analíticas

**Decisión (actualizada — CONFIRMADA en Clarifications Session 2026-09-08, reemplaza la decisión
original de flujo en dos pasos)**: La exportación de un reporte/analítica se modela como una operación
**síncrona de un solo paso**: el frontend admin invoca `POST /reportes-analiticas/exportaciones` y la
respuesta de esa misma llamada entrega directamente el resultado: o bien los datos/enlace del archivo
generado (éxito), o un error explícito si la generación falló. No existe un estado intermedio "en
proceso" ni un endpoint de consulta de estado por polling.

**Rationale**: Resuelve FR-028 conforme a la decisión de negocio registrada en `spec.md` (Clarifications,
Session 2026-09-08, pregunta 3, opción B). Simplifica el diseño del frontend admin (no requiere manejar
un estado `EN_PROCESO` ni loops de polling), a costa de que la request de exportación puede tardar más en
responder mientras el backend/módulo Python genera el archivo. Esto es aceptable dado el bajo volumen de
uso administrativo esperado (Scale/Scope de `plan.md`).

**Manejo de fallos**: Si la generación falla, el backend responde con un error (p. ej. 500/502) y el
frontend admin muestra el mensaje **"Error: Reporte no generado."** (Clarifications, Session 2026-09-08,
pregunta opcional 3), sin reintentos automáticos.

**Alternativas consideradas**:
- *Flujo asíncrono de dos pasos con polling manual* (decisión original de este documento, ahora
  reemplazada): se descartó tras la clarificación de negocio, que definió explícitamente un
  comportamiento síncrono.
- *Notificaciones push/WebSocket*: rechazada por complejidad desproporcionada para este caso de uso de
  baja frecuencia (Principio VI, "no forzar patrones donde una solución simple alcance").

**Impacto en diseño**: Esta decisión **elimina** la necesidad del enum `EstadoExportacionReporte` y de un
endpoint de consulta de estado de exportación; ver actualización correspondiente en `data-model.md` y
`contracts/openapi.yaml`.

## 5. Acciones administrativas entre administradores / sobre uno mismo

**Decisión (actualizada — CONFIRMADA en Clarifications Session 2026-09-08, opción B, reemplaza la
decisión provisional original de este documento)**: Las acciones de **banear** y **eliminar** MUST
aplicarse únicamente sobre usuarios con rol `USER`. Si el usuario objetivo tiene rol `ADMIN` —incluido el
caso en que sea el propio administrador autenticado (auto-baneo/auto-eliminación)— la acción debe estar
**deshabilitada en la interfaz** y **rechazada por el backend** si se invoca igualmente (p. ej. mediante
llamada directa a la API). La promoción a `ADMIN` sobre un usuario que ya tiene ese rol se rechaza como
operación inválida (no-op), independientemente de esta decisión.

**Rationale**: Elimina por completo el riesgo de que un administrador actúe sobre otro administrador
(conflictos de poder entre pares) y el riesgo de auto-bloqueo, priorizando una política más restrictiva y
simple de razonar y testear: "banear/eliminar solo aplica a USER". Reemplaza la decisión previa de este
documento, que permitía acciones entre administradores (opción A original), tras la clarificación de
negocio que optó explícitamente por la opción más restrictiva (opción B).

**Impacto en diseño**: `Usuario.puedeSerBaneado()` y `Usuario.puedeSerEliminado()` en `data-model.md`
deben incluir la condición `rol === USER` (no solo el estado de cuenta); ver actualización
correspondiente.

## 6. Descarte de reportes sin eliminar publicación

**Decisión (CONFIRMADA en Clarifications Session 2026-09-08)**: Se incorpora al diseño una acción
adicional, **"marcar reporte como resuelto sin eliminar la publicación"**, como parte del flujo de
moderación, resolviendo FR-026. Esta acción cambia el estado del **reporte** (no de la publicación) a un
estado de cierre, dejando la publicación en su estado actual.

**Rationale**: Sin esta acción, el moderador se vería forzado a elegir entre "eliminar" o "no hacer nada"
ante un reporte infundado, lo cual no es una experiencia de moderación razonable. Decisión confirmada por
negocio, ya no es un supuesto abierto.

**Alternativas consideradas**:
- *No incluir esta acción* (dejar el reporte "abierto" indefinidamente si no se elimina la publicación):
  rechazada porque impide medir/priorizar correctamente reportes pendientes reales en el dashboard.

## 7. Definición operativa de "usuarios activos" (dashboard)

**Decisión (CONFIRMADA en Clarifications Session 2026-09-08)**: "Usuarios activos" se define como
usuarios cuya cuenta no está baneada ni eliminada (`estadoCuenta = ACTIVO`), sin considerar actividad
reciente. Esta definición está confirmada en `spec.md` (Assumptions) y se mantiene consistente en
`data-model.md` y `contracts/openapi.yaml`.

**Rationale**: Es la interpretación más simple y verificable con los datos ya identificados en la spec,
evitando introducir un concepto adicional (ventana temporal de actividad) no solicitado explícitamente.

## 7bis. Indicadores generales del Dashboard

**Decisión (CONFIRMADA en Clarifications Session 2026-09-08)**: Además de los 3 indicadores base
(reportes pendientes, usuarios activos, desafíos pendientes), el dashboard MUST mostrar un conjunto fijo
de indicadores generales adicionales: **total de publicaciones activas**, **total de publicaciones
eliminadas** (histórico), **total de usuarios baneados**, y **total de desafíos aprobados/rechazados**
(histórico). Estos 7 indicadores en total conforman el contrato de `GET /dashboard` (ver
`contracts/openapi.yaml`).

**Rationale**: Resuelve la ambigüedad original sobre "indicadores generales" con un conjunto cerrado y
verificable, evitando un diseño de UI genérico/dinámico no testeable de forma consistente (ver opción C
descartada en la sesión de clarificación).

## 8. Patrón contenedor/presentacional en moderación

**Decisión**: Se aplica un patrón contenedor/presentacional únicamente en la pantalla de **moderación de
publicaciones y reportes**, separando un contenedor que gestiona filtros/paginación/llamadas a servicios
de una vista de tabla puramente presentacional.

**Rationale**: Es la única pantalla con lógica de filtrado suficientemente compleja (múltiples filtros,
paginación, indicadores de prioridad/antigüedad) para justificar la separación, conforme al Principio VI
de la constitución ("aplicar patrones solo si simplifican el diseño").

**Alternativas consideradas**:
- *Aplicar el mismo patrón a todas las pantallas*: rechazada por sobre-ingeniería en pantallas simples
  (login, detalle de desafío).

## Resumen de decisiones (todas CONFIRMADAS en Clarifications Session 2026-09-08)

| # | Punto origen | Decisión de diseño confirmada |
|---|---|---|
| 1 | FR-026 (descartar reporte) | Se agrega acción "resolver reporte sin eliminar" |
| 2 | FR-027 (sesión expira en acción sensible) | Cancelar acción y redirigir a login |
| 3 | FR-028 (exportación síncrona/asíncrona) | **Síncrona, un solo paso** (reemplaza decisión previa de polling) |
| 4 | FR-029 (acciones entre administradores) | **Prohibidas por completo sobre ADMIN** (incluye auto-baneo/eliminación); reemplaza decisión previa que permitía acciones entre pares |
| 5 | "Usuarios activos" (Assumptions) | Cuenta no baneada ni eliminada |
| 6 | Indicadores generales del Dashboard | Conjunto fijo de 4 indicadores adicionales (§7bis) |
| 7 | Decisión final de desafíos (US5) | Aprobar/rechazar es irreversible |
| 8 | Fallo de exportación | Mensaje "Error: Reporte no generado." |

Todas las decisiones de este documento están ahora alineadas 1:1 con `spec.md` § Clarifications
(Session 2026-09-08) y no requieren validación adicional de negocio.
