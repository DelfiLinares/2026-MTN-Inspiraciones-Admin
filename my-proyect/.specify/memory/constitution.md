# Inspiraciones Admin (Frontend Admin/Moderación) Constitution

## Contexto y Alcance del Módulo

Este proyecto forma parte de una red social de inspiración artística donde usuarios y artistas comparten
creaciones (dibujos, música, esculturas, etc.) y se inspiran en las de otros, con búsqueda con filtros,
geolocalización, integración con APIs externas de música, sistema de recomendaciones, notificaciones,
moderación y reportes.

Esta constitución aplica **exclusivamente** al módulo de **Frontend de Administración/Moderación**
(aplicación React separada de la aplicación de usuario final). Su responsabilidad es construir la
interfaz con la que un administrador/moderador gestiona la plataforma: login de administrador, panel/
dashboard, gestión de usuarios, moderación de publicaciones y reportes, y gestión de desafíos propuestos,
junto con reportes/analíticas exportables.

Este módulo **consume** la API REST del backend (Java/Spring Boot) y **no implementa** lógica de negocio
que corresponda al backend (persistencia, generación de rankings/recomendaciones, envío de mails,
generación de archivos de reportes, etc.). Su rol es presentar esos datos y capturar las acciones
administrativas de forma segura, clara y auditable.

**Pantallas y alcance funcional del módulo:**
- Login de administrador: autenticación exclusiva para usuarios con rol ADMIN.
- Dashboard/home administrativo: vista resumen de la plataforma (reportes pendientes, usuarios activos,
  desafíos propuestos pendientes de revisión, indicadores generales).
- Gestión de usuarios: búsqueda de usuarios, baneo/eliminación de usuarios, promoción de un usuario a
  administrador (acción restringida solo a administradores existentes).
- Moderación de publicaciones y reportes: listado y revisión de publicaciones reportadas, detalle del
  reporte, y acción de eliminar la publicación cuando corresponda.
- Gestión de desafíos: revisión de desafíos propuestos por usuarios mediante formulario, y aprobación o
  rechazo de dichas propuestas.
- Reportes/analíticas: visualización y exportación de reportes generados por el módulo de reportes
  (Python/openpyxl-XlsxWriter) para consumo del equipo administrativo.

**Fuera de alcance:** cualquier pantalla o funcionalidad orientada al usuario final (registro,
cuestionario, home de descubrimiento, edición de perfil propio, participación en desafíos), que
corresponde al frontend de usuario.

## Core Principles

### I. Especificación Manda Sobre Implementación
No se debe programar ninguna pantalla, componente o flujo que no esté trazado a una historia de usuario o
requisito del documento de alcance referido al rol ADMIN. El módulo trabaja únicamente sobre las pantallas
declaradas en el alcance funcional: login de administrador, dashboard/home administrativo, gestión de
usuarios, moderación de publicaciones y reportes, y gestión de desafíos propuestos. Cualquier pantalla o
funcionalidad no trazada debe rechazarse o derivarse a especificación antes de implementarse.

### II. Dominio de UI Orientado a Objetos
El dominio de UI debe modelarse con orientación a objetos real cuando exista lógica de negocio en el
cliente. Un modelo de `Usuario` en el frontend admin sabe si puede ser promovido a admin, baneado o
eliminado; un modelo de `Publicacion` sabe si está en estado REPORTADA y qué acciones administrativas
están disponibles sobre ella. Se debe evitar componentes/hooks anémicos que solo muevan datos sin
encapsular esas reglas.

### III. Separación de Capas (NON-NEGOTIABLE)
El frontend se organiza en capas estrictamente separadas:
- **Presentación**: componentes React de cada pantalla administrativa (login admin, dashboard, gestión de
  usuarios, moderación de publicaciones/reportes, gestión de desafíos).
- **Dominio/modelos de UI**: entidades livianas del lado cliente (Usuario, Publicacion, Reporte, Desafio)
  con sus reglas de permisos y estados administrativos.
- **Aplicación/servicios**: casos de uso de cliente (autenticar admin, listar/filtrar reportes, eliminar
  publicación, banear/eliminar usuario, promover a admin, aprobar/rechazar desafío propuesto, generar
  export de reportes).
- **Infraestructura**: clientes HTTP hacia la API REST (Java/Spring Boot), manejo de sesión y permisos de
  administrador.
No se debe mezclar llamadas a la API directamente dentro de componentes de presentación: deben pasar por
la capa de servicios.

### IV. Sin Duplicación ni Componentes Gigantes
Evitar lógica duplicada, componentes gigantes, validaciones repetidas en cada pantalla y mezcla de
responsabilidades. Un componente de presentación no debe contener reglas de permisos ni llamadas directas
a fetch/axios.

### V. Value Objects y Enums Tipados
Usar enums o value objects (constantes tipadas) para representar valores cerrados. Ejemplos: `RolUsuario`
(USER, ADMIN), `EstadoPublicacion` (ACTIVA, REPORTADA, ELIMINADA), `EstadoDesafioPropuesto` (PENDIENTE,
APROBADO, RECHAZADO), `MotivoReporte`. No usar strings o números "mágicos" sueltos en el código para
representar estos conceptos.

### VI. Patrones de Diseño con Criterio
Aplicar patrones de diseño solo si simplifican el diseño de la UI (por ejemplo, un patrón contenedor/
presentacional para separar la lógica de filtrado de reportes de su vista en tabla). No forzar patrones
donde una solución simple alcance.

### VII. Tests para Reglas de Negocio (NON-NEGOTIABLE)
Toda regla de negocio importante que viva en el frontend debe tener tests. Ejemplos: solo un usuario con
rol ADMIN puede ver habilitadas las acciones de moderación; solo un admin puede promover a otro usuario a
admin (la opción no debe existir para roles USER); las acciones destructivas (eliminar publicación o
usuario) deben requerir confirmación explícita antes de ejecutarse.

## Escalabilidad y Eficiencia Operativa

El sistema debe poder escalar en cantidad de usuarios, publicaciones y reportes sin degradar la
experiencia:
- Listados de moderación con paginación y filtros resueltos contra la API (no trayendo listas completas
  para filtrar en memoria).
- Vistas de reportes/analíticas que consuman datos ya agregados por el backend en lugar de recalcularlos
  en el cliente.

La interfaz debe priorizar la eficiencia operativa del moderador/administrador:
- Encontrar y resolver reportes pendientes debe ser simple y rápido, con indicadores claros de
  prioridad/antigüedad.
- Las acciones sensibles (eliminar, banear, promover a admin) deben ser visualmente distintas de las
  acciones de solo lectura para evitar errores.
- La exportación de reportes (generados por el módulo de reportes en Python) debe iniciarse desde esta
  interfaz y descargarse de forma clara para el usuario administrador.

## Flujo de Trabajo Spec-Driven

No implementar código durante las fases de especificación, aclaración, checklist, planificación y
generación de tareas (`/speckit.specify`, `/speckit.clarify`, `/speckit.checklist`, `/speckit.plan`,
`/speckit.tasks`). En esas fases solo se crean o actualizan los documentos correspondientes. La
implementación de código solo comienza en la fase de ejecución de tareas (`/speckit.implement`), y
siempre debe estar trazada a un requisito aprobado.

## Governance

Esta constitución tiene precedencia sobre cualquier otra práctica, guía o preferencia individual dentro
del módulo de frontend admin/moderación. Toda revisión de código (PR) debe verificar cumplimiento de
estos principios, en particular:
- Trazabilidad de toda pantalla/componente a un requisito del rol ADMIN.
- Respeto de la separación de capas (presentación / dominio / servicios / infraestructura).
- Uso de enums/value objects en vez de valores mágicos.
- Existencia de tests para reglas de negocio de permisos y acciones destructivas.
- No fetch/axios directo en componentes de presentación.

Cualquier excepción o complejidad adicional debe justificarse explícitamente en la documentación de
diseño (plan) antes de ser aprobada. Las enmiendas a esta constitución requieren documentación del cambio,
justificación, y actualización de la versión y fechas correspondientes.

**Version**: 1.0.0 | **Ratified**: 2026-09-07 | **Last Amended**: 2026-09-07
