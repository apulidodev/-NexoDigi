# NexoDigi

Una experiencia web de Digivice para descubrir Digimon, inspirada en un archivo editorial de comunidad.

## Stack

- Next.js 16, React 19 y TypeScript
- Tailwind CSS 4
- Estructura compatible con shadcn/ui (`components.json` y componentes en `src/components/ui`)
- DAPI mediante una capa de infraestructura aislada

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Arquitectura

- `src/features/digimon/domain`: modelos del dominio.
- `src/features/digimon/application`: casos de uso.
- `src/features/digimon/infrastructure`: cliente de DAPI y mapeo de respuestas externas.
- `src/components`: componentes de interfaz y Digivice interactivo.
- `src/app/api`: rutas internas que exponen los datos al cliente.

## Verificación

```bash
npm run lint
npm run build
```