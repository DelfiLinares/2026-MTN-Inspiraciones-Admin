# Quickstart: Validación Manual del Módulo de Administración y Moderación

**Feature**: 001-admin-moderacion | **Date**: 2026-09-07

Este documento describe cómo validar manualmente, una vez implementado, que el `frontend-admin` cumple
las historias de usuario prioritarias de `spec.md`, contra la API descripta en `contracts/openapi.yaml`.
No es una guía de implementación ni contiene código: es la guía de verificación funcional
extremo-a-extremo (E2E) que se ejecutará después de las fases de `tasks` e `implement`.

## Prerrequisitos

- `backend/` corriendo y exponiendo los endpoints de `contracts/openapi.yaml` (o un servidor mock que
  implemente el mismo contrato para pruebas tempranas).
- `frontend-admin/` corriendo y apuntando a la URL base del backend.
- Datos de prueba (seed) disponibles:
  - Al menos 1 usuario con rol `ADMIN` y credenciales conocidas.
  - Al menos 1 usuario con rol `USER`.
  - Al menos 1 publicación en estado `REPORTADA` con un reporte asociado en estado `PENDIENTE`.
  - Al menos 1 desafío propuesto en estado `PENDIENTE`.
  - Al menos 21 usuarios (para verificar paginación con `pageSize` por defecto de 20).

## Escenario 1: Acceso seguro al módulo (US1, P1)

1. Abrir el login de administrador del `frontend-admin`.
2. Intentar ingresar con las credenciales del usuario `USER` (no ADMIN).
   **Resultado esperado**: acceso rechazado con mensaje claro de falta de permisos (FR-002).
3. Ingresar con las credenciales del usuario `ADMIN`.
   **Resultado esperado**: acceso concedido, redirección al dashboard.
4. Forzar expiración de sesión (esperar el tiempo de expiración o invalidar el token manualmente) e
   intentar ejecutar una acción administrativa.
   **Resultado esperado**: el sistema exige reautenticación antes de continuar (FR-020, research.md §2).

## Escenario 2: Moderación de publicaciones y reportes (US2, P1)

1. Iniciar sesión como `ADMIN` y navegar a la pantalla de moderación.
2. Verificar que se lista la publicación de prueba en estado `REPORTADA`, con paginación visible.
3. Aplicar un filtro por motivo de reporte y verificar que la lista se actualiza consultando la API (no
   hay recarga completa del listado en el cliente).
4. Abrir el detalle del reporte de prueba y verificar que se muestra motivo, publicación asociada y
   reportante (FR-009).
5. Ejecutar la acción "eliminar publicación": verificar que el sistema solicita **confirmación explícita**
   antes de ejecutar (FR-010, FR-021).
6. Confirmar la eliminación y verificar que la publicación pasa a estado `ELIMINADA` y deja de listarse
   como reportada activa.
7. (Si está implementada la resolución sin eliminar, research.md §6) Sobre otro reporte de prueba,
   ejecutar "marcar como resuelto sin eliminar" y verificar que el reporte deja de aparecer como
   pendiente sin afectar el estado de la publicación.

## Escenario 3: Gestión de usuarios (US3, P2)

1. Navegar a la pantalla de gestión de usuarios y buscar por un criterio conocido (FR-004).
2. Verificar que los resultados están paginados y que la búsqueda se resuelve contra la API.
3. Sobre un usuario de prueba con rol `USER`, ejecutar "banear": verificar confirmación explícita antes
   de aplicarse (FR-005, FR-021).
4. Sobre otro usuario de prueba, ejecutar "eliminar": verificar confirmación explícita (FR-006, FR-021).
5. Sobre un usuario con rol `USER`, ejecutar "promover a administrador": verificar confirmación explícita
   y que, tras confirmar, el usuario pasa a rol `ADMIN` (FR-007, FR-022).
6. Verificar visualmente que las acciones banear/eliminar/promover se distinguen de las acciones de solo
   consulta (color/iconografía distintos) (FR-023).
7. Sobre un usuario de prueba con rol `ADMIN` (incluido el propio usuario autenticado), verificar que las
   acciones "banear" y "eliminar" están deshabilitadas o son rechazadas por el backend, ya que estas
   acciones solo aplican a usuarios con rol `USER` (FR-005, FR-006, FR-029, Clarifications Session
   2026-09-08, preguntas 2.1/2.2).
8. Sobre un usuario de prueba que ya tiene rol `ADMIN`, intentar "promover a administrador": verificar que
   la acción es rechazada como no-op (409) (FR-007, Clarifications Session 2026-09-08, pregunta 2.3).

## Escenario 4: Dashboard administrativo (US4, P2)

1. Iniciar sesión como `ADMIN` y observar el dashboard inicial.
2. Verificar que se muestran los 7 indicadores confirmados (FR-003, research.md §7bis):
   reportes pendientes, usuarios activos, desafíos pendientes de revisión, publicaciones activas,
   publicaciones eliminadas, usuarios baneados y desafíos decididos (aprobados + rechazados).
3. Verificar que los valores mostrados son consistentes con los datos de prueba cargados (ninguna
   recalculación visible en el cliente; los números coinciden con lo agregado por la API).

## Escenario 5: Gestión de desafíos propuestos (US5, P3)

1. Navegar a la pantalla de gestión de desafíos y verificar que se lista el desafío de prueba en estado
   `PENDIENTE` (FR-012).
2. Abrir el detalle del desafío y verificar que se muestra la información completa de la propuesta
   (FR-013).
3. Ejecutar "aprobar" sobre el desafío: verificar que pasa a estado `APROBADO` (FR-014).
4. Sobre otro desafío de prueba, ejecutar "rechazar": verificar que pasa a estado `RECHAZADO` (FR-015).
5. Verificar que, una vez aprobado/rechazado, las acciones de aprobar/rechazar dejan de estar disponibles
   sobre ese desafío.

## Escenario 6: Reportes y analíticas exportables (US6, P3)

1. Navegar a la pantalla de reportes/analíticas y verificar que se muestran datos agregados (FR-017).
2. Iniciar una exportación de un reporte disponible (FR-018).
3. Verificar que la exportación es **síncrona** (research.md §4, Clarifications Session 2026-09-08,
   pregunta 3): no existe un estado intermedio "en proceso"; la respuesta de la acción ya trae el
   resultado final (éxito o error).
4. En el caso de éxito, verificar que se ofrece de inmediato una acción clara de descarga (FR-019).
5. Descargar el archivo y verificar que se recibe correctamente.
6. Simular (o forzar en entorno de pruebas) un fallo de generación del reporte y verificar que se muestra
   el mensaje exacto **"Error: Reporte no generado."** (FR-028, Clarifications Session 2026-09-08,
   pregunta 3).

## Criterios de éxito de esta validación manual

- Todos los pasos de los Escenarios 1 y 2 (P1) deben pasar sin excepciones antes de considerar el MVP
  utilizable.
- Todas las acciones destructivas ejecutadas durante la validación deben haber requerido confirmación
  explícita (SC-004 de `spec.md`).
- Ningún paso de búsqueda/filtrado debe evidenciar carga de listados completos en el cliente (verificable
  inspeccionando las llamadas de red: deben incluir parámetros de paginación/filtro).
- Las acciones sensibles deben ser visualmente identificables sin necesidad de leer el texto completo del
  botón (SC-007).

## Fuera de alcance de este quickstart

- Pruebas de carga/performance con volúmenes masivos de datos (se cubre conceptualmente en SC-005, pero
  su medición detallada corresponde a un plan de pruebas de performance separado).
- Verificación de la generación real de archivos de reportes en Python/openpyxl-XlsxWriter (responsabilidad
  de otro módulo, fuera de alcance de `frontend-admin`).
- Pruebas de seguridad exhaustivas (pentesting) de la API REST del backend.
