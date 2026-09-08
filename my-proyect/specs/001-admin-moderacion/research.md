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

**Resolución de `NEEDS CLARIFICATION` (FR-027, sesión expirada durante acción sensible)**: Se decide que,
ante una expiración de sesión detectada durante una acción sensible (eliminar, banear, promover), el
frontend admin **cancela la acción en curso**, descarta cualquier confirmación pendiente y redirige al
login, mostrando un mensaje de "sesión expirada, la acción no fue aplicada". Esto evita dejar al usuario
en un estado ambiguo sobre si la acción se ejecutó. Esta decisión debe validarse con el equipo de negocio
antes de convertirse en requisito definitivo, pero se adopta como supuesto de diseño.

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

**Decisión**: Se modela la exportación como un flujo de **dos pasos**: (1) el frontend admin solicita
iniciar la exportación (`POST /api/admin/reportes/exportaciones`), recibiendo un identificador de trabajo
de exportación; (2) el frontend admin consulta el estado de ese trabajo (`GET
/api/admin/reportes/exportaciones/{id}`) mediante **polling manual/periódico simple** hasta que el estado
sea "LISTO", momento en el cual se habilita la descarga (`GET
/api/admin/reportes/exportaciones/{id}/descarga`).

**Rationale**: Resuelve el punto `NEEDS CLARIFICATION` (FR-028) asumiendo que la generación de archivos
de reportes (Python/openpyxl-XlsxWriter) es un proceso potencialmente no instantáneo, y que el frontend
admin no debe implementar dicha generación (fuera de alcance), solo orquestar la solicitud y descarga.
Un mecanismo de polling simple evita introducir infraestructura de tiempo real (WebSockets/SSE) que no
está justificada para un flujo de uso administrativo poco frecuente.

**Alternativas consideradas**:
- *Notificaciones push/WebSocket*: rechazada por complejidad desproporcionada para este caso de uso de
  baja frecuencia (Principio VI, "no forzar patrones donde una solución simple alcance").
- *Generación siempre síncrona*: rechazada porque no se puede garantizar que el backend/módulo Python
  genere el archivo de forma instantánea para volúmenes grandes de datos.

## 5. Acciones administrativas entre administradores / sobre uno mismo

**Decisión de diseño (a confirmar con negocio)**: Se asume, como resolución provisional del punto
`NEEDS CLARIFICATION` (FR-029), que:
- Un administrador **no puede banearse ni eliminarse a sí mismo** desde la interfaz (la acción debe
  deshabilitarse visualmente cuando el usuario objetivo coincide con el usuario autenticado).
- Un administrador **sí puede** banear/eliminar a otro administrador, dado que no se especificó una
  restricción explícita en contrario, pero esta acción se considera de máxima sensibilidad y debe
  distinguirse visualmente con el mismo criterio que las demás acciones destructivas.

**Rationale**: Minimiza el riesgo de que un administrador quede accidentalmente sin acceso al sistema
(auto-bloqueo), mientras se mantiene la flexibilidad operativa entre administradores. Esta es una
decisión de diseño explícita que debe validarse en la fase de clarificación de negocio; se documenta
aquí para que el diseño de datos y contratos sea consistente, no para cerrar la ambigüedad de forma
definitiva.

## 6. Descarte de reportes sin eliminar publicación

**Decisión**: Se incorpora al diseño una acción adicional, **"marcar reporte como resuelto sin eliminar
la publicación"**, como parte del flujo de moderación, resolviendo el punto `NEEDS CLARIFICATION`
(FR-026). Esta acción cambia el estado del **reporte** (no de la publicación) a un estado de cierre,
dejando la publicación en su estado actual (por ejemplo, `ACTIVA` si nunca se marcó como `REPORTADA` a
nivel de publicación, o permitiendo que una publicación con reportes resueltos dependa del backend para
decidir si permanece `REPORTADA` o vuelve a `ACTIVA`).

**Rationale**: Sin esta acción, el moderador se vería forzado a elegir entre "eliminar" o "no hacer nada"
ante un reporte infundado, lo cual no es una experiencia de moderación razonable. Se documenta como
supuesto de diseño a validar con negocio.

**Alternativas consideradas**:
- *No incluir esta acción* (dejar el reporte "abierto" indefinidamente si no se elimina la publicación):
  rechazada porque impide medir/priorizar correctamente reportes pendientes reales en el dashboard.

## 7. Definición operativa de "usuarios activos" (dashboard)

**Decisión**: Para efectos de este diseño, "usuarios activos" se define como usuarios cuya cuenta no está
baneada ni eliminada (`estadoCuenta = ACTIVO`), sin considerar actividad reciente. Esta definición es un
supuesto de diseño documentado en `spec.md` (Assumptions) y se mantiene consistente en `data-model.md` y
`contracts/openapi.yaml`.

**Rationale**: Es la interpretación más simple y verificable con los datos ya identificados en la spec,
evitando introducir un concepto adicional (ventana temporal de actividad) no solicitado explícitamente.

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

## Resumen de decisiones pendientes de confirmación por negocio

| # | Punto `NEEDS CLARIFICATION` origen | Decisión de diseño adoptada | Debe confirmarse antes de |
|---|---|---|---|
| 1 | FR-026 (descartar reporte) | Se agrega acción "resolver reporte sin eliminar" | Fase de tasks/implementación |
| 2 | FR-027 (sesión expira en acción sensible) | Cancelar acción y redirigir a login | Fase de tasks/implementación |
| 3 | FR-028 (exportación síncrona/asíncrona) | Flujo de 2 pasos con polling manual | Fase de tasks/implementación |
| 4 | FR-029 (acciones entre administradores) | Auto-bloqueo prohibido; entre admins permitido | Fase de tasks/implementación |
| 5 | "Usuarios activos" (Assumptions) | Cuenta no baneada ni eliminada | Fase de tasks/implementación |
