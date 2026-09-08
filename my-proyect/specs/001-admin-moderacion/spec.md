# Feature Specification: Administración y Moderación de la Red Social de Inspiración Artística

**Feature Branch**: `001-admin-moderacion`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "Desarrollar un sistema de administración y moderación para una red social de inspiración artística que permita gestionar usuarios, publicaciones, reportes, desafíos y reportes/analíticas. Actores: Administrador, Usuario, Sistema. Requisitos funcionales sobre login de administrador, dashboard, gestión de usuarios, moderación de publicaciones y reportes, gestión de desafíos, reportes/analíticas y permisos. Requisitos no funcionales de usabilidad, performance, seguridad y calidad. Fuera de alcance: registro de usuarios, funcionalidades de usuario final, generación de recomendaciones/rankings/analytics/archivos de reportes/mails, implementación de API REST del backend y APIs externas, persistencia en base de datos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso seguro al módulo administrativo (Priority: P1)

Un administrador necesita iniciar sesión en el módulo de administración con sus credenciales para poder
acceder a las herramientas de gestión y moderación de la plataforma. Un usuario que no tiene rol ADMIN no
debe poder ingresar al módulo aunque tenga una cuenta válida en la plataforma.

**Why this priority**: Es la puerta de entrada a todo el sistema. Sin autenticación y control de acceso
por rol, ninguna otra funcionalidad administrativa puede considerarse segura ni utilizable. Es el
prerrequisito técnico y de seguridad de todas las demás historias.

**Independent Test**: Puede probarse de forma independiente iniciando sesión con credenciales de un
usuario ADMIN válido y verificando el acceso al módulo; y luego intentando iniciar sesión con credenciales
de un usuario con rol USER y verificando que el acceso es rechazado.

**Acceptance Scenarios**:

1. **Given** un usuario con rol ADMIN y credenciales válidas, **When** inicia sesión en el login de
   administrador, **Then** el sistema le concede acceso al módulo administrativo.
2. **Given** un usuario con rol USER (no ADMIN) con credenciales válidas, **When** intenta iniciar sesión
   en el login de administrador, **Then** el sistema rechaza el acceso e informa que no tiene permisos.
3. **Given** un usuario con credenciales inválidas, **When** intenta iniciar sesión, **Then** el sistema
   muestra un error de autenticación sin revelar si el usuario existe o no.
4. **Given** un administrador con sesión iniciada, **When** su sesión expira o es invalidada, **Then** el
   sistema le exige volver a autenticarse antes de permitir nuevas acciones administrativas.

---

### User Story 2 - Moderación de publicaciones y reportes (Priority: P1)

Un administrador/moderador necesita revisar las publicaciones que fueron reportadas por los usuarios,
consultar el detalle de cada reporte y, cuando corresponda, eliminar la publicación reportada para
mantener la calidad y seguridad de la plataforma.

**Why this priority**: Es la funcionalidad central de moderación de contenido y la razón principal de
existir del módulo administrativo; sin esto, no hay forma de actuar sobre el contenido inapropiado
reportado por la comunidad, exponiendo a la plataforma a riesgos de reputación y seguridad.

**Independent Test**: Puede probarse de forma independiente accediendo al listado de publicaciones
reportadas, abriendo el detalle de un reporte y ejecutando la acción de eliminar la publicación
reportada, confirmando que su estado cambia a ELIMINADA y que deja de listarse como contenido activo.

**Acceptance Scenarios**:

1. **Given** existen publicaciones en estado REPORTADA, **When** el administrador abre la pantalla de
   moderación, **Then** el sistema muestra el listado de publicaciones reportadas con paginación.
2. **Given** un listado de reportes, **When** el administrador aplica un filtro (por ejemplo por motivo
   de reporte o estado), **Then** el sistema muestra únicamente los reportes que cumplen el filtro,
   resolviendo el filtrado a través de la API.
3. **Given** una publicación reportada, **When** el administrador abre su detalle, **Then** el sistema
   muestra la información del reporte (motivo, fecha, publicación asociada, reportante).
4. **Given** el detalle de un reporte sobre una publicación que amerita eliminación, **When** el
   administrador ejecuta la acción de eliminar, **Then** el sistema solicita confirmación explícita antes
   de ejecutar la eliminación.
5. **Given** el administrador confirma la eliminación, **When** se ejecuta la acción, **Then** la
   publicación pasa a estado ELIMINADA y dicha acción se distingue visualmente como una acción sensible.
6. **Given** un reporte que el administrador decide que no amerita eliminar la publicación, **When**
   revisa el reporte, **Then** puede marcarlo como resuelto/descartado sin eliminar la publicación
   [NEEDS CLARIFICATION: no se especifica un flujo explícito de "descartar reporte sin eliminar
   publicación"; se asume necesario para no forzar siempre la eliminación, a confirmar].

---

### User Story 3 - Gestión de usuarios (Priority: P2)

Un administrador necesita buscar usuarios de la plataforma y aplicar acciones administrativas sobre
ellos: banear, eliminar o promover a un usuario a rol de administrador, para mantener el orden y la
seguridad de la comunidad.

**Why this priority**: Es una funcionalidad de alto impacto (afecta cuentas de usuarios reales y otorga
permisos elevados), pero depende de que el acceso administrativo (US1) ya exista; se prioriza después de
la moderación de contenido porque la gestión de usuarios suele ser una acción más excepcional que la
revisión diaria de reportes.

**Independent Test**: Puede probarse de forma independiente buscando un usuario por nombre/criterio,
ejecutando sobre él las acciones de banear, eliminar y (solo si quien ejecuta es ADMIN) promover a
administrador, verificando en cada caso el resultado esperado y las confirmaciones requeridas.

**Acceptance Scenarios**:

1. **Given** el administrador está en la pantalla de gestión de usuarios, **When** ingresa un criterio de
   búsqueda, **Then** el sistema muestra los usuarios coincidentes resolviendo la búsqueda vía API y con
   resultados paginados.
2. **Given** un usuario listado, **When** el administrador selecciona la acción "banear", **Then** el
   sistema solicita confirmación explícita antes de aplicar el baneo.
3. **Given** un usuario listado, **When** el administrador selecciona la acción "eliminar", **Then** el
   sistema solicita confirmación explícita antes de eliminar la cuenta.
4. **Given** un usuario con rol USER, **When** un administrador ejecuta la acción "promover a
   administrador", **Then** el sistema solicita confirmación explícita y, al confirmarse, el usuario pasa
   a tener rol ADMIN.
5. **Given** un usuario con rol USER visualizando (hipotéticamente) esta pantalla, **When** se evalúan las
   acciones disponibles, **Then** la opción de "promover a administrador" no debe estar disponible para
   nadie que no tenga rol ADMIN ejecutando la acción.
6. **Given** las acciones de banear, eliminar y promover, **When** se muestran en la interfaz, **Then**
   deben diferenciarse visualmente de las acciones de solo consulta (por ejemplo, con color o iconografía
   distintiva).

---

### User Story 4 - Dashboard administrativo (Priority: P2)

Un administrador necesita, al ingresar al módulo, ver un resumen general del estado de la plataforma:
cantidad de reportes pendientes, usuarios activos, desafíos propuestos pendientes de revisión e
indicadores generales, para priorizar su trabajo del día.

**Why this priority**: Aporta valor de eficiencia operativa y visibilidad, pero no bloquea las acciones
de moderación o gestión (que pueden realizarse igualmente accediendo directamente a cada pantalla); por
eso se prioriza después de las funcionalidades operativas críticas (moderación y gestión de usuarios).

**Independent Test**: Puede probarse de forma independiente ingresando al dashboard con datos de prueba
(reportes pendientes, usuarios activos, desafíos pendientes) y verificando que los indicadores mostrados
correspondan a los datos agregados provistos por la API.

**Acceptance Scenarios**:

1. **Given** el administrador inicia sesión correctamente, **When** accede al dashboard, **Then** el
   sistema muestra la cantidad de reportes pendientes.
2. **Given** el dashboard, **When** se carga, **Then** el sistema muestra la cantidad de usuarios activos.
3. **Given** el dashboard, **When** se carga, **Then** el sistema muestra la cantidad de desafíos
   propuestos pendientes de revisión.
4. **Given** el dashboard, **When** se carga, **Then** el sistema muestra indicadores generales de la
   plataforma [NEEDS CLARIFICATION: no se especifica la lista cerrada de "indicadores generales";
   se asume un conjunto mínimo de reportes pendientes, usuarios activos y desafíos pendientes, a validar
   si se requieren más métricas].
5. **Given** los datos del dashboard, **When** se presentan, **Then** provienen de datos ya agregados por
   el backend, sin recalcularse en el cliente.

---

### User Story 5 - Gestión de desafíos propuestos (Priority: P3)

Un administrador necesita revisar los desafíos propuestos por los usuarios y decidir si se aprueban o
rechazan, para mantener actualizada y curada la oferta de desafíos de la plataforma.

**Why this priority**: Es una funcionalidad importante pero de menor frecuencia/urgencia operativa que la
moderación de contenido reportado o la gestión de usuarios; su ausencia no compromete la seguridad
inmediata de la plataforma.

**Independent Test**: Puede probarse de forma independiente listando desafíos en estado PENDIENTE,
abriendo el detalle de uno de ellos y ejecutando las acciones de aprobar o rechazar, verificando el
cambio de estado resultante.

**Acceptance Scenarios**:

1. **Given** existen desafíos propuestos en estado PENDIENTE, **When** el administrador abre la pantalla
   de gestión de desafíos, **Then** el sistema muestra el listado de desafíos pendientes de revisión.
2. **Given** un desafío propuesto, **When** el administrador abre su detalle, **Then** el sistema muestra
   la información completa del formulario de propuesta.
3. **Given** el detalle de un desafío propuesto, **When** el administrador ejecuta la acción "aprobar",
   **Then** el desafío pasa a estado APROBADO.
4. **Given** el detalle de un desafío propuesto, **When** el administrador ejecuta la acción "rechazar",
   **Then** el desafío pasa a estado RECHAZADO.
5. **Given** un desafío ya está en estado APROBADO o RECHAZADO, **When** el administrador lo visualiza,
   **Then** las acciones de aprobar/rechazar ya no están disponibles o se muestran deshabilitadas
   [NEEDS CLARIFICATION: no se especifica si un desafío ya aprobado/rechazado puede revertirse o
   reconsiderarse; se asume que la decisión es final, a confirmar].

---

### User Story 6 - Reportes y analíticas exportables (Priority: P3)

Un administrador necesita visualizar reportes y analíticas de la plataforma y poder iniciar la
exportación de dichos reportes para descargarlos y compartirlos con el equipo administrativo.

**Why this priority**: Aporta valor analítico y de negocio, pero depende de datos ya generados por otros
módulos (reportes en Python) y no es indispensable para las operaciones diarias de moderación; se ubica
en último lugar de prioridad dentro de este conjunto de historias.

**Independent Test**: Puede probarse de forma independiente accediendo a la pantalla de reportes/
analíticas, visualizando los datos agregados disponibles, iniciando una exportación y verificando que se
ofrece la descarga del archivo generado.

**Acceptance Scenarios**:

1. **Given** el administrador accede a la pantalla de reportes/analíticas, **When** la pantalla carga,
   **Then** el sistema muestra los datos agregados provistos por el backend.
2. **Given** la pantalla de reportes/analíticas, **When** el administrador solicita iniciar una
   exportación, **Then** el sistema envía la solicitud de exportación al backend/módulo de reportes.
3. **Given** una exportación fue solicitada, **When** el archivo de reporte está listo, **Then** el
   sistema ofrece al administrador un enlace o acción clara para descargarlo.
4. **Given** una exportación fue solicitada, **When** el archivo aún no está disponible, **Then** el
   sistema comunica claramente el estado de "en proceso" al administrador
   [NEEDS CLARIFICATION: no se especifica si la generación del reporte es síncrona o asíncrona, ni el
   mecanismo de aviso (polling, notificación, refresco manual) cuando el archivo está listo].

---

### Edge Cases

- ¿Qué sucede si un administrador intenta banear, eliminar o promover a otro administrador?
  [NEEDS CLARIFICATION: no se especifica si estas acciones están permitidas entre administradores o si
  existen restricciones adicionales, por ejemplo impedir que un admin se banee/elimine a sí mismo].
- ¿Qué sucede si dos administradores intentan actuar simultáneamente sobre el mismo reporte o usuario
  (por ejemplo, uno elimina una publicación mientras otro la está revisando)?
- ¿Qué sucede si un usuario reportado/eliminado ya no existe al momento de revisar el reporte?
- ¿Qué sucede si se pierde la conexión con la API mientras se está ejecutando una acción destructiva
  (eliminar, banear)? El sistema debe evitar dejar la interfaz en un estado ambiguo sobre si la acción se
  aplicó o no.
- ¿Cómo se comporta el listado de reportes/publicaciones/usuarios cuando no hay resultados que coincidan
  con los filtros aplicados?
- ¿Qué ocurre si la sesión del administrador expira mientras está completando una acción sensible (por
  ejemplo, a mitad de confirmar una eliminación)?
- ¿Qué sucede si se intenta acceder directamente (por URL) a una pantalla del módulo administrativo sin
  haber iniciado sesión como ADMIN?
- ¿Qué sucede si la exportación de un reporte falla en el backend? [NEEDS CLARIFICATION: no se especifica
  el mensaje o comportamiento esperado ante un fallo de generación del archivo de reporte].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un usuario iniciar sesión en el módulo administrativo mediante
  un formulario de login de administrador.
- **FR-002**: El sistema MUST permitir el acceso al módulo administrativo únicamente a usuarios con rol
  ADMIN; cualquier otro rol MUST ser rechazado con un mensaje claro.
- **FR-003**: El sistema MUST mostrar un dashboard con: cantidad de reportes pendientes, cantidad de
  usuarios activos, cantidad de desafíos propuestos pendientes de revisión, e indicadores generales de la
  plataforma.
- **FR-004**: El sistema MUST permitir buscar usuarios mediante criterios de búsqueda resueltos contra la
  API, con resultados paginados.
- **FR-005**: El sistema MUST permitir banear a un usuario, requiriendo confirmación explícita antes de
  ejecutar la acción.
- **FR-006**: El sistema MUST permitir eliminar a un usuario, requiriendo confirmación explícita antes de
  ejecutar la acción.
- **FR-007**: El sistema MUST permitir promover a un usuario a rol ADMIN, y esta acción MUST estar
  disponible únicamente para quienes ya tienen rol ADMIN, requiriendo confirmación explícita.
- **FR-008**: El sistema MUST mostrar el listado de publicaciones en estado REPORTADA, con paginación y
  filtros resueltos contra la API.
- **FR-009**: El sistema MUST permitir visualizar el detalle de un reporte sobre una publicación
  (motivo, publicación asociada, y demás datos provistos por el backend).
- **FR-010**: El sistema MUST permitir eliminar una publicación reportada, requiriendo confirmación
  explícita antes de ejecutar la acción, y reflejando el cambio de estado a ELIMINADA.
- **FR-011**: El sistema MUST representar el estado de una publicación únicamente como uno de los
  siguientes valores: ACTIVA, REPORTADA o ELIMINADA.
- **FR-012**: El sistema MUST mostrar el listado de desafíos propuestos por los usuarios, permitiendo
  identificar los que están en estado PENDIENTE.
- **FR-013**: El sistema MUST permitir visualizar el detalle de un desafío propuesto, incluyendo la
  información del formulario de propuesta.
- **FR-014**: El sistema MUST permitir aprobar un desafío propuesto, cambiando su estado a APROBADO.
- **FR-015**: El sistema MUST permitir rechazar un desafío propuesto, cambiando su estado a RECHAZADO.
- **FR-016**: El sistema MUST representar el estado de un desafío propuesto únicamente como uno de los
  siguientes valores: PENDIENTE, APROBADO o RECHAZADO.
- **FR-017**: El sistema MUST permitir visualizar reportes y analíticas de la plataforma con datos ya
  agregados por el backend.
- **FR-018**: El sistema MUST permitir iniciar la exportación de un reporte desde la interfaz
  administrativa.
- **FR-019**: El sistema MUST permitir descargar un reporte exportado una vez que está disponible.
- **FR-020**: El sistema MUST restringir todas las acciones de administración y moderación a usuarios
  autenticados con rol ADMIN y sesión válida.
- **FR-021**: El sistema MUST solicitar confirmación explícita antes de ejecutar cualquier acción
  destructiva: eliminar publicación, eliminar usuario, banear usuario.
- **FR-022**: El sistema MUST solicitar confirmación explícita antes de ejecutar la acción de promover un
  usuario a administrador.
- **FR-023**: El sistema MUST diferenciar visualmente las acciones sensibles (eliminar, banear, promover
  a administrador) de las acciones de solo consulta/lectura en toda la interfaz.
- **FR-024**: El sistema MUST resolver la paginación y el filtrado de listados de usuarios, publicaciones
  reportadas y reportes a través de la API, sin cargar el conjunto completo de datos para filtrar en el
  cliente.
- **FR-025**: El sistema MUST mostrar indicadores de prioridad y/o antigüedad en los listados de reportes
  pendientes, para facilitar su identificación y resolución rápida.

*Ambigüedades marcadas explícitamente:*

- **FR-026**: El sistema MUST permitir [NEEDS CLARIFICATION: no se especifica si existe una acción de
  "descartar/resolver reporte sin eliminar la publicación" o si la única acción posible sobre un reporte
  es eliminar o no hacer nada].
- **FR-027**: El sistema MUST manejar el flujo de expiración de sesión durante una acción sensible
  [NEEDS CLARIFICATION: no se especifica el comportamiento exacto: reintentar tras reautenticación,
  cancelar la acción, o mostrar error].
- **FR-028**: El sistema MUST comunicar el estado de una exportación de reporte en curso
  [NEEDS CLARIFICATION: no se especifica si el proceso de exportación es síncrono o asíncrono, ni el
  mecanismo de actualización de estado (polling, notificación push, refresco manual)].
- **FR-029**: El sistema MUST definir el comportamiento al intentar aplicar acciones administrativas
  (banear, eliminar, promover) sobre otro usuario con rol ADMIN, o sobre la propia cuenta del
  administrador que ejecuta la acción [NEEDS CLARIFICATION: no se especifica si están permitidas o
  restringidas estas operaciones entre administradores o sobre uno mismo].

### Key Entities *(include if feature involves data)*

- **Usuario**: Representa a una persona registrada en la plataforma. Atributos relevantes para este
  módulo: identificador, nombre/criterio de búsqueda, rol (`RolUsuario`: USER o ADMIN), estado de cuenta
  (activo/baneado/eliminado). Relaciones: puede tener publicaciones, puede generar reportes, puede
  proponer desafíos.
- **Publicación**: Representa una creación compartida por un usuario (dibujo, música, escultura, etc.).
  Atributos relevantes: identificador, autor, estado (`EstadoPublicacion`: ACTIVA, REPORTADA, ELIMINADA).
  Relación: puede tener uno o más reportes asociados.
- **Reporte**: Representa la denuncia de una publicación por parte de un usuario. Atributos relevantes:
  identificador, publicación asociada, motivo (`MotivoReporte`), usuario que reporta, fecha/antigüedad,
  indicador de prioridad. Relación: pertenece a una publicación.
- **Desafío Propuesto**: Representa una propuesta de desafío enviada por un usuario para su revisión.
  Atributos relevantes: identificador, autor de la propuesta, contenido del formulario, estado
  (`EstadoDesafioPropuesto`: PENDIENTE, APROBADO, RECHAZADO).
- **Sesión Administrativa**: Representa el contexto de autenticación de un administrador durante su
  interacción con el módulo. Atributos relevantes: usuario autenticado, rol validado (ADMIN), vigencia de
  la sesión.
- **Reporte/Analítica Exportable**: Representa un conjunto de datos agregados generados por el backend/
  módulo de reportes, disponible para visualización y para solicitar su exportación y descarga.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador puede iniciar sesión y llegar al dashboard en menos de 10 segundos en
  condiciones normales de red.
- **SC-002**: Un usuario sin rol ADMIN que intenta acceder al módulo administrativo es rechazado en el
  100% de los casos probados.
- **SC-003**: Un administrador puede localizar y abrir el detalle de un reporte pendiente específico en
  menos de 3 interacciones (por ejemplo: abrir listado, aplicar filtro, seleccionar reporte).
- **SC-004**: El 100% de las acciones destructivas (eliminar publicación, eliminar usuario, banear
  usuario, promover a administrador) ejecutadas en pruebas requieren y registran una confirmación
  explícita antes de aplicarse.
- **SC-005**: Los listados de usuarios, publicaciones reportadas y reportes mantienen tiempos de
  respuesta consistentes independientemente del volumen total de datos, gracias al uso de paginación y
  filtrado server-side (validado con un conjunto de datos de prueba significativamente mayor a una página
  de resultados).
- **SC-006**: El 100% de las reglas de negocio identificadas como críticas (control de rol para
  moderación, restricción de promoción a administrador solo para administradores, confirmación
  obligatoria en acciones destructivas) cuentan con tests automatizados que las verifican.
- **SC-007**: Un administrador puede distinguir visualmente, sin leer el texto completo del botón/acción,
  cuáles acciones son sensibles (destructivas) y cuáles son de solo consulta, en el 100% de las pantallas
  del módulo.

## Assumptions

- Se asume que la autenticación de administradores reutiliza el mismo mecanismo de autenticación de
  usuarios de la plataforma (login con credenciales), diferenciando el acceso posterior únicamente por el
  rol ADMIN, y no un sistema de login completamente separado.
- Se asume que el backend (Java/Spring Boot) expone los endpoints necesarios para: autenticación,
  listados paginados y filtrados de usuarios/publicaciones/reportes/desafíos, cambios de estado
  (banear, eliminar, promover, aprobar, rechazar), y datos agregados de analíticas.
- Se asume que la generación física de los archivos de reportes (Python/openpyxl-XlsxWriter) es
  responsabilidad de un módulo externo, y que este módulo de frontend solo dispara la solicitud de
  exportación y consume un enlace o archivo ya generado.
- Se asume que "usuarios activos" en el dashboard se refiere a usuarios con cuenta no baneada ni
  eliminada [NEEDS CLARIFICATION: no se especifica la definición exacta de "usuario activo" —por ejemplo,
  si implica actividad reciente en un período de tiempo determinado, o simplemente cuentas habilitadas].
- Se asume que no existe un límite explícito de administradores en la plataforma, y que cualquier
  administrador existente puede promover a otros usuarios sin restricción adicional de cantidad.
- Se asume que las funcionalidades fuera de alcance (registro de usuarios, home de descubrimiento,
  publicación de contenido, sistema de recomendaciones, generación de rankings, procesamiento de
  analytics, generación de archivos de reportes, envío de mails, implementación de API REST del backend,
  implementación de APIs externas, persistencia en base de datos) ya existen o serán resueltas por otros
  módulos/equipos, y este módulo únicamente los consume o no los referencia.
