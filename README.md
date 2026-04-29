# Inyeon — Invitaciones digitales

Plataforma de invitaciones digitales con editor WYSIWYG y vista previa en vivo.

## Stack

- React 18 + Vite + Tailwind
- Framer Motion · React Router
- Supabase (Postgres + Storage)
- Vercel (hosting + serverless `/api/*`)

## Setup local

```bash
npm install
cp .env.example .env.local   # añade VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

Si no configuras Supabase, la app cae a `localStorage` para datos y a base64 para imágenes.

## Rutas

- `/login` — entrada al editor (modo demo, sin password real)
- `/app` — dashboard de bodas
- `/app/event/:id` — editor con preview en vivo (split screen)
- `/app/event/:id/guests` — lista de invitados con links únicos
- `/i/:slug` — invitación pública
- `/i/:slug?g=token` — invitación personalizada por invitado
- `/i/:slug?edit=1` — modo edición in-place (lo usa el preview del editor)

## Despliegue

GitHub `inyeonstd/INYEON` → Vercel autodeploya en cada push a `main`.

Variables de entorno requeridas en Vercel:

| Key | Dónde |
|---|---|
| `VITE_SUPABASE_URL` | client + server |
| `VITE_SUPABASE_ANON_KEY` | client |
| `SUPABASE_URL` | server (`/api/*`) |
| `SUPABASE_SERVICE_KEY` | server (`/api/*`) |
