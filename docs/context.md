# NexoDigi — Contexto del proyecto

## Objetivo

NexoDigi es una mini app web para fans de Digimon. La experiencia principal es un Digivice interactivo y un archivo navegable de Digimon alimentado por DAPI (`https://digi-api.com`). El producto debe sentirse como una herramienta de Tamer: visual, rápida, accesible y orientada a exploración y comunidad.

## Stack actual

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript estricto
- Tailwind CSS 4
- Componentes locales compatibles con la estructura de shadcn/ui (`src/components/ui`)
- Route Handlers de Next.js para adaptar DAPI
- PWA básica: `src/app/manifest.ts`, `public/sw.js`, registro en `src/components/pwa`
- Sin autenticación, base de datos ni servicios externos propios todavía

## Arquitectura y convenciones

- Mantener separación `domain`, `application`, `infrastructure`, `presentation` por feature.
- DAPI debe consumirse desde infraestructura o Route Handlers, no directamente desde componentes UI cuando pueda evitarse.
- Todo nuevo código debe ser TypeScript y seguir el estilo de componentes existentes.
- Preservar el diseño actual: fondo cálido, bordes oscuros de 2px, sombras duras, tipografía monoespaciada en etiquetas y estética editorial/técnica.
- No reemplazar la imagen literal del Digivice: `public/images/digivice-reference.png`.
- El favicon actual es `src/app/icon.png`.

## Rutas y fuentes actuales

- `/api/digimon`: búsqueda paginada y filtros DAPI.
- `/api/digimon/[id]`: detalle de un Digimon.
- `/api/archive/[kind]`: proxy paginado para `attribute`, `type`, `level`, `field`, `skill`.
- DAPI detalle/lista: `src/features/digimon/infrastructure/digi-api-client.ts`.
- Archivo DAPI: `src/features/digimon/infrastructure/digi-archive-client.ts`.

### Nota importante sobre DAPI

Los catálogos de DAPI ya no exponen `fields` en la raíz. La respuesta actual contiene `content[0].fields` y `pageable`. Algunos catálogos son muy grandes (por ejemplo, Skills tiene miles de registros), por eso el Archivo implementa carga progresiva. No descargar todos los registros al render inicial.

DAPI no ofrece una clasificación oficial por serie/anime (Adventure, 02, Tamers, etc.). Esa información deberá ser comunitaria, atribuida y moderada.

## Funcionalidades ya implementadas

### Exploración

- Digivice interactivo: perfil, escaneo aleatorio y vista EVO.
- DigiDex: búsqueda por nombre, nivel, atributo y X-Antibody; paginación y detalle.
- Mapa de evoluciones navegable.
- Archivo de atributos, tipos, niveles, campos y técnicas, con carga progresiva.

### Locales (sin backend)

- Colección local de Digimon; exportación e importación JSON.
- Equipo Tamer local de hasta seis Digimon.
- Historial de los últimos 20 escaneos.
- Filtros guardados y recuperables.
- Notas personales de rutas EVO por Digimon.
- Misiones locales diarias y logros locales.
- Trivia basada en detalles de DAPI.
- Comparador por ID de dos Digimon.
- PWA/offline básico.

### Persistencia local

- `nexodigi-collection`: IDs de la colección.
- `nexodigi-tamer-data`: equipo, historial, filtros, notas EVO y progreso de trivia.

Esta persistencia no se sincroniza entre equipos y debe migrarse con cuidado cuando exista cuenta.

## Puntos de integración principales

- `src/components/digivice/digivice.tsx`: registra escaneos en datos locales.
- `src/components/digidex/digidex.tsx`: colección, equipo, filtros y notas EVO.
- `src/components/tamer/tamer-console.tsx`: consola de progreso local.
- `src/features/tamer/presentation/use-tamer-data.ts`: estado local de Tamer.
- `src/features/collection/presentation/use-collection.ts`: colección, export/import.
- `src/features/community/domain/appearance.ts`: tipos iniciales para apariciones comunitarias por serie.

## Decisión recomendada para la fase backend

Usar **Next.js Route Handlers en Node.js/TypeScript + Supabase**.

Motivos:

1. El frontend ya está en Next/TypeScript; evita duplicar contratos y despliegues para una primera fase.
2. Supabase ofrece PostgreSQL, Auth, Realtime, Storage, SQL migrations y Row Level Security (RLS).
3. La comunidad necesita datos relacionales, moderación y permisos; PostgreSQL es preferible a una base documental.
4. Se puede extraer a una Minimal API de .NET posteriormente si el equipo tiene fuerte experiencia .NET, necesita integraciones corporativas, procesos de larga duración o una carga operativa que justifique un servicio separado.

No crear una réplica completa del catálogo de DAPI en la base. Guardar IDs de DAPI y cachear sólo datos necesarios para disponibilidad, búsqueda comunitaria o snapshots de referencias.

## Próxima fase

Consultar `docs/backend-agent-prompt.md`. Ese documento contiene alcance, modelo de datos, seguridad, tiempo real y criterios de aceptación para un agente encargado del backend.