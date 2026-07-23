# Prompt de handoff — Backend de NexoRift: Digital Run

Implementa la fase online del minijuego NexoRift: Digital Run de NexoDigi. Lee primero `docs/context.md` y `docs/backend-agent-prompt.md`. Respeta el diseño actual y conserva el modo local, que debe seguir jugando sin cuenta.

## Estado actual

El MVP está en `src/components/digital-run/digital-run-game.tsx`, `src/features/digital-run/domain/digital-run.ts` y `src/features/digital-run/presentation/use-digital-run.ts`.

Hoy una ruta local tiene cinco nodos (el último es jefe), acciones `pulse`, `technique`, `guard`, recompensas de reparación/módulo/EVO y récord en `localStorage`. DAPI aporta identidad, imagen, nivel, atributo, técnicas y evoluciones; las fórmulas de combate son propias de NexoDigi. No copies mecánicas, assets o textos de otros juegos.

## Stack obligatorio

- Next.js Route Handlers con Node.js/TypeScript.
- Supabase: PostgreSQL, Auth, Realtime, migrations SQL y RLS.
- `@supabase/ssr` para sesión.
- Zod para contratos HTTP.
- No API .NET independiente durante esta fase.
- El service role nunca llega al navegador.

## Funcionalidades

1. Guardar y reanudar rutas autenticadas desde cualquier dispositivo.
2. Rift diario con misma semilla/reglas para todos los jugadores.
3. Rankings diario, semanal y de temporada.
4. Validación de servidor de toda partida competitiva; el cliente sólo envía intenciones.
5. Migración opcional del récord local, sin incluir resultados históricos en rankings.
6. Preparar eventos comunitarios con jefe global.

## Reglas de autoridad y determinismo

- Versionar balance: `balance_version` y fórmulas/tablas en JSON o código versionado.
- Para ruta normal usar CSPRNG; para Rift diario generar semilla en servidor y guardar sólo hash público hasta finalizar.
- El servidor resuelve encuentros, variación, afinidades, daño, recompensa, evolución, jefe y puntuación.
- El cliente manda sólo acción (`pulse`, `technique`, `guard`, recompensa, evolución) con una idempotency key y sequence.
- Nunca aceptar HP, daño, score, nodo, semilla ni victoria reportados por cliente.
- Guardar snapshots o log de acciones con hash encadenado para auditoría.
- Guardar snapshot DAPI mínimo al inicio de la ruta para que ésta continúe si DAPI falla después.

## Migrations y modelo de datos

Crear migrations con FK, checks, índices, timestamps y RLS:

- `digital_run_balance_versions (id, version unique, rules jsonb, is_active, created_at)`
- `digital_run_seasons (id, name, starts_at, ends_at, status)`
- `digital_run_daily_rifts (id, run_date unique, seed_hash, balance_version_id, rules jsonb, starts_at, ends_at)`
- `digital_runs (id uuid, user_id, mode normal|daily|event, status active|won|lost|abandoned|expired, seed_server_only, seed_hash, balance_version_id, daily_rift_id nullable, state jsonb, score, current_node, started_at, completed_at, updated_at)`
- `digital_run_actions (id, run_id, sequence, action_type, payload jsonb, resulting_state_hash, created_at; unique run_id+sequence)`
- `digital_run_rewards (id, run_id, reward_type, dapi_id nullable, applied_at)`
- leaderboard mediante vista/materialización segura por día, semana y temporada.
- `digital_run_local_migrations (user_id, local_record_hash unique, payload jsonb, migrated_at)`.

Para futuro jefe global:

- `community_rift_events (id, title, boss_dapi_id, hp_total, hp_remaining, rules jsonb, starts_at, ends_at, status)`
- `community_rift_contributions (id, event_id, user_id, run_id, damage_contributed, created_at; unique event_id+run_id)`.

Indexar `user_id`, `status`, `completed_at`, `daily_rift_id`, `run_date`, `event_id`. Añadir límites de nodo y secuencia con constraints.

## Route Handlers

- `POST /api/digital-run/start`: inicia ruta normal/diaria con `dapi_id` de compañero.
- `GET /api/digital-run/[id]`: estado visible de ruta propia.
- `POST /api/digital-run/[id]/action`: procesa acción/recompensa en servidor.
- `POST /api/digital-run/[id]/abandon`.
- `GET /api/digital-run/daily`: metadata del Rift y estado personal.
- `GET /api/digital-run/leaderboard?scope=daily|weekly|season`.
- `POST /api/digital-run/migrate-local`.
- Rutas admin para balance, temporadas, rifts y eventos.

Validar sesión, ownership, estado, sequence, idempotencia, cooldown y payload con Zod en cada mutación.

## Realtime y seguridad

Usar Supabase Realtime sólo para ranking al terminar ruta, estado agregado de jefe global y notificaciones de evento. No usarlo por turno: combate es request/response con Route Handler.

- RLS limita rutas a su dueño; los rankings se exponen mediante vista o RPC segura.
- Rate limit por usuario/IP para inicio y acciones.
- Registrar secuencias inválidas, ritmo imposible y acciones fuera de estado.
- Política admin de auditoría e invalidación de runs sospechosas.
- Publicar sólo resultados verificados de Rifts diarios.

## UX y fallback

- Mostrar claramente “local”, “online” o “Rift diario”.
- Ruta online puede reanudarse en otro dispositivo.
- Si Supabase/backend no está disponible, permitir jugar el modo local existente.
- Migración de localStorage opcional, idempotente y sin borrar datos locales hasta confirmar éxito.

## Entregables y aceptación

1. Migrations, seed de balance/temporada y políticas RLS.
2. Fórmulas puras cubiertas con tests: afinidades, PRNG, daño, transición de estado y puntuación.
3. Tests de integración: no modificar ruta ajena, no saltar nodo, no duplicar acción.
4. UI de ruta online, Rift diario, ranking y migración local.
5. Suscripciones Realtime con cleanup y fallback.
6. README de variables, jobs programados diarios y despliegue.

La aceptación exige que dos usuarios reciban el mismo Rift diario con reglas idénticas; el servidor rechace acciones inválidas; una victoria aparezca en ranking sólo tras validación; una ruta online se recupere en otro dispositivo; y lint, tipos y build terminen limpios.