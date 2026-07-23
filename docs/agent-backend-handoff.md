# NexoDigi — Handoff maestro para implementar backend

## Instrucción para el agente

Implementa el backend completo de NexoDigi sobre el proyecto actual. Lee también:

- `docs/context.md`
- `docs/backend-agent-prompt.md`
- `docs/digital-run-backend-prompt.md`

Este documento es el alcance consolidado. No reemplaces ni rompas las funciones locales ya existentes: la app debe seguir siendo usable sin cuenta y sin backend.

## Stack obligatorio

- Next.js 16 Route Handlers con Node.js y TypeScript.
- Supabase: Auth, PostgreSQL, Realtime, Storage opcional, migrations SQL y Row Level Security.
- `@supabase/ssr` para gestión de sesión.
- Zod para validar toda entrada HTTP.
- Service role exclusivamente en servidor.
- No crear Minimal API .NET en esta fase.

## Fase 1: identidad y datos de Tamer

Implementar:

- Registro/login con email y preparación para OAuth.
- Perfil: alias único, avatar opcional, biografía, fecha de creación, privacidad y rol.
- Roles: `tamer`, `moderator`, `admin`.
- Perfil público en `/tamer/[handle]`.
- Sincronización de colección, equipo, notas EVO, historial, filtros, misiones, logros y partidas.
- Migración opcional/idempotente de `nexodigi-collection`, `nexodigi-tamer-data`, récord y partida local de NexoRift. No borrar datos locales hasta confirmar persistencia en servidor.
- Exportación JSON desde datos sincronizados.

## Fase 2: comunidad y apariciones por serie

DAPI no entrega series oficiales. Implementar una capa comunitaria y moderada:

- Series: Adventure, Adventure 02, Tamers, Frontier, Savers, Xros Wars/Fusion, App Monsters, Adventure 2020, Ghost Game, Seekers y Other.
- Aparición: `dapi_id`, serie, temporada opcional, personaje/partner, tipo de aparición, fuentes, autor, estado y fechas.
- Formularios autenticados de sugerencia con URL, título y explicación de fuente.
- Cola de moderación: aprobar, rechazar, solicitar cambios, invalidar fuente.
- Bitácora de auditoría inmutable con autor, moderador, acción, antes/después y motivo.
- Comentarios, votos positivos y reportes de contenido.
- Panel `/moderacion` protegido por rol.

## Fase 3: retos, ranking y notificaciones

- Retos semanales configurables por administración.
- Progreso por usuario y rankings semanales/temporadas.
- Notificaciones de moderación, comentarios, retos y eventos; leído/no leído.
- Realtime sólo para notificaciones personales, cola de moderación, cambios de sugerencias y feed/eventos relevantes.
- No usar Realtime para búsqueda común del DigiDex ni para consultas a DAPI.

## Fase 4: NexoRift online competitivo

El modo local ya existe. Añadir:

- Guardado/reanudación de rutas autenticadas entre dispositivos.
- Rift diario con reglas y semilla idénticas para todos.
- Ranking diario, semanal y de temporada.
- Eventos comunitarios con jefe global.
- Migración opcional del récord local sin otorgar puntuación competitiva retroactiva.

El servidor debe ser autoridad absoluta de partidas competitivas:

- Cliente sólo envía intención: `pulse`, `technique`, `guard`, recompensa o evolución.
- Servidor resuelve semilla, encuentros, daño, afinidad, recompensa, estado, puntuación y victoria.
- Nunca aceptar vida, daño, nodo, semilla, score o victoria enviados por cliente.
- Versionar fórmulas de balance y guardar snapshots mínimos de DAPI al iniciar una ruta.
- Validar secuencia, idempotency key, propiedad, estado, cooldown y límites de acción.
- Persistir acciones/snapshots con hash encadenado para auditoría y detección básica de trampas.

## Modelo de datos mínimo

Crear migrations, índices, constraints y RLS para:

- `profiles`, `user_digimon`, `user_teams`, `user_team_members`, `user_evo_notes`, `user_saved_filters`, `user_scan_history`, `user_progress`.
- `series`, `digimon_appearances`, `appearance_sources`, `appearance_suggestions`, `moderation_audit_log`.
- `comments`, `votes`, `content_reports`, `weekly_challenges`, `challenge_progress`, `notifications`.
- `digital_run_balance_versions`, `digital_run_seasons`, `digital_run_daily_rifts`, `digital_runs`, `digital_run_actions`, `digital_run_rewards`, leaderboard seguro y `digital_run_local_migrations`.
- Para eventos: `community_rift_events`, `community_rift_contributions`.

Los datos de Digimon se referencian por `dapi_id`; no replicar el catálogo completo de DAPI. Cachear/snapshot sólo lo necesario.

## Seguridad obligatoria

- RLS activa en todas las tablas públicas con políticas explícitas.
- Usuario sólo puede modificar sus datos privados.
- Roles y acciones de moderación se validan del lado servidor.
- Validación Zod, límites de texto/URL, sanitización de contenido y rate limit para acciones sensibles.
- No exponer secretos de Supabase ni usar service role en navegador.
- Rutas competitivas de NexoRift requieren control anti-replay e idempotencia.

## Entregables

1. Migrations SQL, seeds de series/balance y políticas RLS.
2. Configuración de Auth/SSR/middleware y `.env.example` sin secretos.
3. Route Handlers tipados y validados.
4. UI funcional de cuentas, perfiles, comunidad, moderación, retos, notificaciones, Rift diario y rankings.
5. Realtime protegido con cleanup y fallback.
6. Migración de datos locales opcional e idempotente.
7. Pruebas unitarias, de integración y smoke tests para permisos, RLS, partidas y flujos principales.
8. README de despliegue, jobs diarios/semanales y operación.

## Criterios de aceptación

- Un Tamer puede registrarse, migrar datos locales y recuperarlos en otro dispositivo.
- Una aparición comunitaria no se publica sin aprobación y el autor recibe una notificación.
- RLS impide leer/modificar datos privados ajenos o asignarse roles.
- Dos usuarios reciben el mismo Rift diario; el servidor invalida acciones fuera de secuencia o victorias falsas.
- Los rankings sólo incluyen rutas validadas por servidor.
- Si DAPI o Supabase falla, el modo local existente conserva una alternativa utilizable.
- Lint, TypeScript y build terminan sin warnings ni errores.