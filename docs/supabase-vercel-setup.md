# Activación de backend: Supabase + Vercel

## 1. Variables de entorno

En Vercel, agrega para **Production**, **Preview** y **Development**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=https://nexo-digi.vercel.app
```

Nunca copies `SUPABASE_SECRET_KEY` al navegador, archivos versionados o chat. El proyecto incluye `.env.example` sin valores reales.

## 2. Ejecutar la migración

En Supabase Dashboard > SQL Editor, abre y ejecuta:

- `supabase/migrations/202607240001_tamer_foundation.sql`

Crea perfiles de Tamer, datos privados sincronizables, series semilla y políticas RLS. El primer administrador se asigna manualmente desde SQL Editor después de crear su cuenta:

```sql
update public.profiles set role = 'admin' where handle = 'tu-alias';
```

## 3. Configurar Supabase Auth

En Authentication > URL Configuration:

- Site URL: `https://nexo-digi.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://nexo-digi.vercel.app/**`

Para Preview, agrega después el patrón específico de tu cuenta/equipo Vercel.

## 4. Deploy

Importa el repositorio en Vercel con `nexodigi` como Root Directory. Vercel detecta Next.js. Después de registrar variables, realiza un nuevo deployment: los cambios de variables sólo se aplican a nuevos despliegues.

## Endpoints disponibles en esta fase

- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /auth/callback`

Aún falta la interfaz visual de cuenta y la sincronización completa; los endpoints y el esquema base ya están protegidos para construirlas encima.