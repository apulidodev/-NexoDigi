# Prompt de handoff — Fase Backend NexoDigi

Actúa como el agente principal de la fase backend de NexoDigi. Trabaja sobre el proyecto existente, respeta `docs/context.md` y no reemplaces ni simplifiques la experiencia visual actual. Implementa, prueba y documenta la fase completa.

## Decisión técnica obligatoria

Implementa el backend inicial con:

- Route Handlers de Next.js 16 ejecutados en Node.js/TypeScript.
- Supabase: PostgreSQL, Auth, Realtime, Storage opcional y migrations SQL.
- Cliente de servidor separado del cliente de navegador. Las claves `SUPABASE_SERVICE_ROLE_KEY` jamás deben llegar al cliente.
- `@supabase/ssr` para sesiones y protección de rutas.
- RLS activado en todas las tablas públicas.

No uses Minimal API de .NET para esta fase. Documenta que sería una alternativa futura sólo si el equipo decide separar servicios por capacidad operativa o experiencia interna.

## Alcance funcional completo

### 1. Identidad y perfiles de Tamer

- Registro e inicio de sesión con Supabase Auth (email/password; preparar proveedores OAuth sin obligarlos).
- Perfil: alias único, avatar opcional, biografía breve, fecha de creación y rol.
- Roles: `tamer`, `moderator`, `admin`.
- Perfil público con colección/equipo visibles según una preferencia de privacidad.
- Migración explícita y opcional de `nexodigi-collection` y `nexodigi-tamer-data` al iniciar sesión. Nunca borrar datos locales hasta confirmar éxito.

### 2. Colección y progreso sincronizados

- Sincronizar colección, equipo (máximo seis), notas EVO, filtros guardados, historial y progreso de misiones/logros.
- Resolver conflictos de forma simple y documentada: `updated_at`/last-write-wins en primera versión, con confirmación visible si hubo choque.
- Exportar JSON desde datos del servidor además del respaldo local.
- Mantener los Digimon referenciados por `dapi_id`, no duplicar todo el catálogo externo.

### 3. Apariciones por serie creadas por comunidad

DAPI no tiene series oficiales. Implementar una capa comunitaria para mapear Digimon a series/franquicias:

- Series iniciales: Adventure, Adventure 02, Tamers, Frontier, Data Squad/Savers, Xros Wars/Fusion, Universe: App Monsters, Adventure: 2020, Ghost Game, Seekers y `other`.
- Una aparición tiene: `dapi_id`, serie, temporada opcional, personaje/partner opcional, tipo de aparición, estado de verificación, fuentes y autor.
- Los Tamers pueden enviar sugerencias y fuentes URL con una explicación breve.
- No publicar directamente: pasar a cola de moderación.
- Moderadores pueden aprobar, rechazar, pedir cambios o marcar una fuente como inválida.
- Conservar autor, moderador, timestamps, motivo y una bitácora inmutable de revisión.

### 4. Comunidad

- Comentarios en perfiles públicos y fichas de Digimon, con edición limitada por autor, eliminación propia y reportes.
- Votos positivos a contribuciones/apariciones aprobadas (un voto por usuario y objeto).
- Reportes de contenido y panel de moderación con estados: abierto, en revisión, resuelto, descartado.
- Protección contra abuso: rate limiting por usuario/IP en acciones sensibles, límites de longitud, sanitización y políticas RLS.

### 5. Retos, rankings y notificaciones

- Retos semanales configurables por admins: por ejemplo, completar una colección temática, responder trivia, explorar evoluciones o contribuir una fuente verificada.
- Progreso por usuario y ranking semanal; reglas transparentes y reinicio por periodo.
- Notificaciones: aprobación/rechazo de sugerencia, respuesta a comentario, cambio de reto y avance relevante.
- Centro de notificaciones con leído/no leído.

### 6. Tiempo real: usarlo sólo donde aporta valor

Usar Supabase Realtime para:

- Notificaciones del usuario autenticado.
- Cambios de estado de sugerencias que el usuario envió.
- Actualización del panel de moderación para moderadores.
- Contadores o feed de contribuciones recientes si se implementan.

No usar realtime para consultas DAPI, búsqueda general ni cada vista del DigiDex. DAPI se obtiene por HTTP con cache/revalidación. Real-time debe estar protegido por RLS y canales filtrados por usuario/rol.

## Modelo de datos mínimo

Crear migrations versionadas y documentadas. Ajusta nombres si es necesario, pero conserva la intención:

- `profiles (id uuid PK -> auth.users, handle unique, role, bio, avatar_path, is_public, created_at, updated_at)`
- `user_digimon (user_id, dapi_id, created_at, updated_at, PK user_id+dapi_id)`
- `user_teams (id, user_id, name, created_at)` y `user_team_members (team_id, dapi_id, position 1..6)`
- `user_evo_notes (user_id, dapi_id, note, updated_at)`
- `user_saved_filters (id, user_id, label, filters jsonb, created_at, updated_at)`
- `user_scan_history (id, user_id, dapi_id, scanned_at)`
- `user_progress (user_id, progress jsonb, updated_at)`
- `series (id, slug unique, name, sort_order)`
- `digimon_appearances (id, dapi_id, series_id, season, character_name, appearance_type, verification_status, created_by, reviewed_by, reviewed_at, created_at, updated_at)`
- `appearance_sources (id, appearance_id, url, title, note, created_by, is_valid, created_at)`
- `appearance_suggestions (id, submitted_by, payload jsonb, status, reviewer_id, review_note, created_at, updated_at)`
- `moderation_audit_log (id, actor_id, entity_type, entity_id, action, before jsonb, after jsonb, created_at)`
- `comments (id, author_id, target_type, target_id, body, created_at, updated_at, deleted_at)`
- `votes (user_id, target_type, target_id, created_at, unique user_id+target_type+target_id)`
- `content_reports (id, reporter_id, target_type, target_id, reason, status, resolved_by, created_at, resolved_at)`
- `weekly_challenges (id, title, description, rules jsonb, starts_at, ends_at, status)`
- `challenge_progress (challenge_id, user_id, progress jsonb, score, updated_at, PK challenge_id+user_id)`
- `notifications (id, user_id, type, payload jsonb, read_at, created_at)`

Agregar claves foráneas, `CHECK` constraints, índices para `user_id`, `dapi_id`, `status`, `created_at`, `series_id` y tablas de ranking. Añadir un trigger seguro para crear `profiles` tras el registro.

## Seguridad obligatoria

- Activar RLS en todas las tablas públicas y escribir políticas SQL explícitas.
- Usuarios sólo leen/escriben sus datos privados.
- Contenido público sólo se expone si el perfil/registro está aprobado y publicado.
- Roles de moderación/admin se validan en servidor; no confiar en un claim enviado por el cliente.
- Toda revisión, puntuación administrativa y cambio de rol se ejecuta con Route Handler protegido o función RPC segura.
- Validar con Zod cada entrada HTTP; limitar tamaños, URLs y enumeraciones.
- Sanitizar texto que vaya a renderizarse en comunidad. No renderizar HTML de usuario.
- Definir rate limiting (Upstash Redis o middleware equivalente), empezando por comentarios, votos, sugerencias y reportes.
- Incluir `.env.example` sin secretos: URL/anon key de Supabase, service role para servidor, URL de sitio, variables de rate limit si se usan.

## Integración de datos DAPI

- Conservar los clientes DAPI actuales y sus Route Handlers.
- Centralizar traducción de `dapi_id` a detalle bajo demanda.
- Implementar cache/revalidación para DAPI y manejo de indisponibilidad.
- Si se necesita consistencia histórica de nombres/imágenes para contribuciones, crear una cache mínima `digimon_snapshots` con fecha de actualización; no bloquear la UI si DAPI falla.
- No inventar apariciones por serie: cada relación debe tener una fuente y un estado de verificación.

## UX y rutas sugeridas

- `/login`, `/registro` o flujo modal equivalente.
- `/tamer/[handle]` perfil público.
- `/comunidad/apariciones` explorador por serie/Digimon.
- `/comunidad/contribuir` formulario de sugerencia autenticada.
- `/moderacion` sólo moderador/admin.
- `/retos` y `/notificaciones` autenticadas.

Mantener los componentes visuales existentes y crear features por dominio: `auth`, `profile`, `community`, `challenges`, `notifications`.

## Entregables

1. Supabase migrations SQL completas, seed de series y políticas RLS.
2. Configuración SSR/Auth, middleware y protección de rutas.
3. Route Handlers tipados y validación Zod.
4. UI funcional para cada historia de usuario indicada.
5. Suscripciones Supabase Realtime necesarias, con cleanup y manejo de reconexión.
6. Migración opcional de datos locales, idempotente y comprobable.
7. Pruebas: unitarias para reglas/mappers; integración para rutas protegidas y RLS cuando sea posible; smoke tests de flujos principales.
8. `README`/documentación de despliegue, variables de entorno y decisión de arquitectura.
9. No romper DigiDex, Digivice, Archivo ni PWA actuales.

## Criterios de aceptación

- Un usuario puede registrarse, migrar datos locales, iniciar sesión en otro dispositivo y recuperar colección/equipo/notas.
- Un Tamer puede enviar una aparición con fuente; no se muestra públicamente hasta aprobación.
- Un moderador puede revisar la solicitud y el autor recibe una notificación en tiempo real.
- RLS impide que un usuario modifique datos privados de otro o se asigne roles.
- El ranking semanal se calcula bajo reglas persistidas y no depende de confianza del cliente.
- La app sigue siendo usable si DAPI falla temporalmente.
- Lint, tipos y build terminan sin errores ni warnings.