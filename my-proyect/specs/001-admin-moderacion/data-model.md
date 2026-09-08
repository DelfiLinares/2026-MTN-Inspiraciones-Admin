# Phase 1 Data Model: Administración y Moderación (Dominio de UI)

**Feature**: 001-admin-moderacion | **Date**: 2026-09-07

Este documento describe el **modelo de dominio de UI** del `frontend-admin`: entidades livianas del lado
cliente que encapsulan reglas de permisos y de transición de estado (Principio II de la constitución),
consumidas por la capa de `application/services` y usadas por la capa de `presentation`. No representa el
modelo de persistencia del backend (eso es responsabilidad de `backend/`, fuera de alcance).

Trazabilidad: cada entidad y regla referencia el/los requisito(s) funcional(es) (`FR-XXX`) y/o historia de
usuario (`US-X`) de `spec.md` que la originan.

## Enums / Value Objects

### RolUsuario
Valores: `USER`, `ADMIN`.
Uso: determina qué acciones administrativas están disponibles para el usuario autenticado (FR-002,
FR-007, US1, US3).

### EstadoCuentaUsuario
Valores: `ACTIVO`, `BANEADO`, `ELIMINADO`.
Uso: representa el estado administrativo de la cuenta de un usuario (FR-005, FR-006, US3). Se usa también
para la definición operativa de "usuario activo" en el dashboard (`ACTIVO` únicamente; ver `research.md`
§7).

### EstadoPublicacion
Valores: `ACTIVA`, `REPORTADA`, `ELIMINADA`.
Uso: representa el estado de una publicación y determina qué acciones de moderación están disponibles
(FR-010, FR-011, US2).

### EstadoDesafioPropuesto
Valores: `PENDIENTE`, `APROBADO`, `RECHAZADO`.
Uso: representa el estado de un desafío propuesto y determina si las acciones aprobar/rechazar están
habilitadas (FR-014, FR-015, FR-016, US5).

### MotivoReporte
Valores (cerrados, alineados a motivos típicos de moderación de contenido artístico):
`CONTENIDO_INAPROPIADO`, `SPAM`, `PLAGIO`, `DISCURSO_DE_ODIO`, `OTRO`.
Uso: clasifica el motivo de un reporte sobre una publicación, usado en filtros de la pantalla de
moderación (FR-008, FR-009, US2).
[NEEDS CLARIFICATION heredado de spec.md: la lista cerrada de motivos no está definida por negocio; se
adopta un conjunto razonable a validar antes de la fase de tasks].

### EstadoReporte
Valores: `PENDIENTE`, `RESUELTO_SIN_ELIMINAR`, `RESUELTO_CON_ELIMINACION`.
Uso: introducido para soportar la decisión de diseño de `research.md` §6 (descartar reporte sin eliminar
publicación), resolviendo FR-026. Permite calcular "reportes pendientes" en el dashboard (US4) sin
depender únicamente del estado de la publicación.

### EstadoExportacionReporte
Valores: `EN_PROCESO`, `LISTO`, `ERROR`.
Uso: representa el estado del trabajo de exportación de un reporte/analítica (US6, FR-018, FR-019,
resolviendo FR-028 según `research.md` §4).

## Entidades de Dominio de UI

### Usuario
Representa a un usuario de la plataforma desde la perspectiva del módulo administrativo.

**Atributos**:
- `id: string`
- `nombre: string`
- `email: string`
- `rol: RolUsuario`
- `estadoCuenta: EstadoCuentaUsuario`
- `fechaRegistro: Date` (para criterios de búsqueda/orden, si la API lo provee)

**Reglas de negocio encapsuladas** (no anémico, Principio II):
- `puedeSerPromovidoAAdmin(): boolean` → `true` si `rol === USER` y `estadoCuenta === ACTIVO`.
  Referencia: FR-007, US3.
- `puedeSerBaneado(): boolean` → `true` si `estadoCuenta === ACTIVO`. Referencia: FR-005.
- `puedeSerEliminado(): boolean` → `true` si `estadoCuenta !== ELIMINADO`. Referencia: FR-006.
- `esElMismoQue(otroUsuarioId: string): boolean` → soporta la regla de "no auto-banearse/auto-eliminarse"
  de `research.md` §5 (FR-029).
- Regla de **permiso de ejecución** (no del propio objeto `Usuario` sino del actor): solo un `Usuario`
  cuyo `rol === ADMIN` puede invocar `puedeSerPromovidoAAdmin`/baneo/eliminación sobre otro `Usuario`;
  esta verificación se modela en la capa de servicios (`UsuariosService`), no en la entidad, porque
  depende del **actor autenticado**, no del propio dato.

**Relaciones**: Un `Usuario` puede ser autor de múltiples `Publicacion` y `Desafio`; puede generar
múltiples `Reporte`.

### Publicacion
Representa una creación compartida por un usuario (dibujo, música, escultura, etc.), desde la
perspectiva de moderación.

**Atributos**:
- `id: string`
- `autorId: string`
- `titulo: string`
- `estado: EstadoPublicacion`
- `fechaCreacion: Date`

**Reglas de negocio encapsuladas**:
- `estaReportada(): boolean` → `estado === REPORTADA`. Referencia: US2.
- `puedeSerEliminada(): boolean` → `estado !== ELIMINADA`. Referencia: FR-010.
- `estaActiva(): boolean` → `estado === ACTIVA`.

**Relaciones**: Una `Publicacion` puede tener uno o más `Reporte` asociados.

### Reporte
Representa la denuncia de una publicación por parte de un usuario.

**Atributos**:
- `id: string`
- `publicacionId: string`
- `reportanteId: string`
- `motivo: MotivoReporte`
- `estado: EstadoReporte`
- `fechaCreacion: Date`
- `prioridad: 'ALTA' | 'MEDIA' | 'BAJA'` (indicador para la UI, FR-025)

**Reglas de negocio encapsuladas**:
- `estaPendiente(): boolean` → `estado === PENDIENTE`. Referencia: US2, dashboard (US4).
- `antiguedadEnDias(fechaActual: Date): number` → calcula antigüedad para mostrar indicador de prioridad/
  antigüedad (FR-025).
- `puedeResolverseSinEliminar(): boolean` → `estado === PENDIENTE`. Referencia: `research.md` §6 (FR-026).
- `puedeResolverseConEliminacion(): boolean` → `estado === PENDIENTE`. Referencia: FR-010.

**Relaciones**: Pertenece a una `Publicacion`; referencia a un `Usuario` reportante.

### Desafio (Desafío Propuesto)
Representa una propuesta de desafío enviada por un usuario para revisión administrativa.

**Atributos**:
- `id: string`
- `autorId: string`
- `titulo: string`
- `descripcion: string`
- `estado: EstadoDesafioPropuesto`
- `fechaPropuesta: Date`

**Reglas de negocio encapsuladas**:
- `estaPendiente(): boolean` → `estado === PENDIENTE`. Referencia: US5.
- `puedeAprobarse(): boolean` → `estado === PENDIENTE`. Referencia: FR-014.
- `puedeRechazarse(): boolean` → `estado === PENDIENTE`. Referencia: FR-015.
  (Ambas reglas reflejan la decisión de `research.md` que considera la decisión final una vez aprobado/
  rechazado — punto `NEEDS CLARIFICATION` de la spec, US5 escenario 5).

### SesionAdministrativa
Representa el contexto de autenticación de un administrador durante su interacción con el módulo.

**Atributos**:
- `usuario: Usuario`
- `token: string` (opaco para el dominio de UI; manejado por `infrastructure/sessionManager`)
- `expiraEn: Date`

**Reglas de negocio encapsuladas**:
- `esValida(fechaActual: Date): boolean` → `expiraEn > fechaActual`.
- `tienePermisoDeAdministrador(): boolean` → `usuario.rol === ADMIN`. Referencia: FR-002, FR-020.

### ReporteAnalitica (Reporte/Analítica Exportable)
Representa un conjunto de datos agregados generados por el backend, disponible para visualización y
exportación.

**Atributos**:
- `id: string`
- `tipo: string` (p. ej. "reportes_por_estado", "usuarios_activos_por_mes" — catálogo definido por el
  backend, no por este módulo)
- `datosAgregados: Record<string, number>` (ya agregados por backend, FR-017)

**Reglas de negocio encapsuladas**:
- No contiene lógica de cálculo (los datos ya vienen agregados); solo métodos de presentación como
  `tieneDatos(): boolean`.

### ExportacionReporte
Representa un trabajo de exportación solicitado por el administrador.

**Atributos**:
- `id: string`
- `reporteAnaliticaId: string`
- `estado: EstadoExportacionReporte`
- `urlDescarga: string | null`

**Reglas de negocio encapsuladas**:
- `estaListoParaDescargar(): boolean` → `estado === LISTO && urlDescarga !== null`. Referencia: FR-019.
- `fallo(): boolean` → `estado === ERROR`.

## Diagrama de relaciones (conceptual)

```text
Usuario (1) ──autor de──> (N) Publicacion ──recibe──> (N) Reporte ──generado por──> Usuario (reportante)
Usuario (1) ──autor de──> (N) Desafio
Usuario (1) ──posee────> (1) SesionAdministrativa   [solo si rol == ADMIN]
ReporteAnalitica (1) ──origina──> (N) ExportacionReporte
```

## Trazabilidad Entidad ↔ Requisito

| Entidad/Enum | Requisitos relacionados (spec.md) |
|---|---|
| Usuario, RolUsuario, EstadoCuentaUsuario | FR-002, FR-004, FR-005, FR-006, FR-007, FR-020, FR-029, US1, US3 |
| Publicacion, EstadoPublicacion | FR-008, FR-010, FR-011, US2 |
| Reporte, MotivoReporte, EstadoReporte | FR-008, FR-009, FR-025, FR-026, US2, US4 |
| Desafio, EstadoDesafioPropuesto | FR-012, FR-013, FR-014, FR-015, FR-016, US5 |
| SesionAdministrativa | FR-001, FR-002, FR-020, FR-027, US1 |
| ReporteAnalitica, ExportacionReporte, EstadoExportacionReporte | FR-017, FR-018, FR-019, FR-028, US6 |
