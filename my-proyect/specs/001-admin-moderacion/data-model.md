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
moderación (FR-008, FR-009, US2). Conjunto adoptado como definitivo para esta versión del módulo.

### EstadoReporte
Valores: `PENDIENTE`, `RESUELTO_SIN_ELIMINAR`, `RESUELTO_CON_ELIMINACION`.
Uso: introducido para soportar la decisión confirmada en `research.md` §6 (descartar reporte sin
eliminar publicación), resolviendo FR-026. Permite calcular "reportes pendientes" en el dashboard (US4)
sin depender únicamente del estado de la publicación.

~~### EstadoExportacionReporte~~ *(ELIMINADO — ver nota abajo)*

> **Cambio respecto a la versión anterior de este documento**: Tras la decisión confirmada en
> `spec.md` (Clarifications, Session 2026-09-08) de que la exportación de reportes es **síncrona**
> (`research.md` §4), el enum `EstadoExportacionReporte` (`EN_PROCESO`, `LISTO`, `ERROR`) **ya no es
> necesario**: no existe un estado intermedio observable por el cliente. La entidad `ExportacionReporte`
> se simplifica más abajo para reflejar un resultado inmediato (éxito con `urlDescarga`, o error con
> `mensajeError`).

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
- `puedeSerBaneado(): boolean` → `true` si `rol === USER` y `estadoCuenta === ACTIVO`. **Actualizado**
  (Clarifications Session 2026-09-08, FR-029): ya no basta con verificar el estado de cuenta; un usuario
  con `rol === ADMIN` **nunca** puede ser baneado desde este módulo, sin excepción (ni siquiera por otro
  ADMIN). Referencia: FR-005, FR-029.
- `puedeSerEliminado(): boolean` → `true` si `rol === USER` y `estadoCuenta !== ELIMINADO`.
  **Actualizado** (Clarifications Session 2026-09-08, FR-029): igual que `puedeSerBaneado()`, un usuario
  con `rol === ADMIN` nunca puede ser eliminado desde este módulo. Referencia: FR-006, FR-029.
- `esElMismoQue(otroUsuarioId: string): boolean` → método auxiliar de comparación de identidad. Ya no es
  la única defensa contra auto-baneo/auto-eliminación: dado que todo `ADMIN` está protegido por
  `puedeSerBaneado()`/`puedeSerEliminado()` (que exigen `rol === USER`), el caso de auto-acción queda
  cubierto automáticamente si el actor es ADMIN. Se mantiene disponible para trazas de auditoría o
  mensajes de UI más específicos ("no podés aplicar esta acción sobre tu propia cuenta").
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
  (**Confirmado** en Clarifications Session 2026-09-08: la decisión de aprobar/rechazar es final e
  irreversible; una vez que `estado !== PENDIENTE`, ambos métodos devuelven `false` de forma permanente,
  sin mecanismo de reversión).

### SesionAdministrativa
Representa el contexto de autenticación de un administrador durante su interacción con el módulo.

**Atributos**:
- `usuario: Usuario`
- `token: string` (opaco para el dominio de UI; manejado por `infrastructure/sessionManager`)
- `expiraEn: Date`

**Reglas de negocio encapsuladas**:
- `esValida(fechaActual: Date): boolean` → `expiraEn > fechaActual`.
- `tienePermisoDeAdministrador(): boolean` → `usuario.rol === ADMIN`. Referencia: FR-002, FR-020.

### DashboardIndicadores
Representa el resumen de indicadores mostrado en el dashboard administrativo (US4). **Nuevo en esta
revisión** (Clarifications Session 2026-09-08, `research.md` §7bis).

**Atributos** (los 3 originales + los 4 confirmados como conjunto fijo adicional):
- `reportesPendientes: number`
- `usuariosActivos: number`
- `desafiosPendientes: number`
- `publicacionesActivas: number`
- `publicacionesEliminadas: number`
- `usuariosBaneados: number`
- `desafiosDecididos: number` (suma de aprobados + rechazados, histórico)

**Reglas de negocio encapsuladas**: Ninguna (datos ya agregados por el backend); solo métodos de
presentación triviales si se requieren (p. ej. `tieneAlertas(): boolean` → `reportesPendientes > 0`).

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
Representa el **resultado inmediato y síncrono** de una solicitud de exportación (Clarifications
Session 2026-09-08, `research.md` §4). **Simplificado respecto a la versión anterior**: ya no modela un
trabajo en curso con estados intermedios, sino el resultado directo de la operación.

**Atributos**:
- `reporteAnaliticaId: string`
- `exitoso: boolean`
- `urlDescarga: string | null` (presente solo si `exitoso === true`)
- `mensajeError: string | null` (presente solo si `exitoso === false`; valor esperado por defecto:
  `"Error: Reporte no generado."`, según Clarifications Session 2026-09-08)

**Reglas de negocio encapsuladas**:
- `estaListoParaDescargar(): boolean` → `exitoso === true && urlDescarga !== null`. Referencia: FR-019.
- `fallo(): boolean` → `exitoso === false`. Referencia: FR-028, mensaje de error confirmado.

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
| DashboardIndicadores | FR-003, US4 |
| ReporteAnalitica, ExportacionReporte | FR-017, FR-018, FR-019, FR-028, US6 |

**Nota de versión**: Esta tabla y el documento completo reflejan las decisiones confirmadas en
`spec.md` § Clarifications (Session 2026-09-08). El enum `EstadoExportacionReporte` fue **retirado** del
modelo (exportación ahora síncrona) y se agregó la entidad `DashboardIndicadores` (indicadores generales
confirmados).
