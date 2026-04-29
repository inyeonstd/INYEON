# Daisi Clone — Invitaciones digitales

MVP de una plataforma de invitaciones digitales (estilo daisi.mx). Proyecto académico
de ingeniería inversa: análisis + réplica.

## Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion (animaciones)
- React Router
- Supabase (Postgres + Auth + Storage + RLS)

## Estructura

```
src/
├── components/
│   ├── sections/        # Cada sección de la invitación
│   │   ├── Hero.jsx
│   │   ├── Parents.jsx
│   │   ├── Events.jsx
│   │   ├── Itinerary.jsx
│   │   ├── Registry.jsx
│   │   ├── Lodging.jsx
│   │   ├── Gallery.jsx
│   │   ├── Closing.jsx
│   │   └── Footer.jsx
│   └── ui.jsx           # Componentes reutilizables (Reveal, SectionLabel)
├── hooks/
│   ├── useEvent.js      # Query a Supabase con fallback a mock
│   └── useCountdown.js
├── lib/
│   └── supabase.js      # Cliente
├── pages/
│   ├── InvitationPage.jsx
│   └── NotFound.jsx
├── data/
│   └── mockEvent.js     # Mock de datos para desarrollo
├── App.jsx
├── main.jsx
└── index.css
```

## Setup local

```bash
# 1. Instalar deps
npm install

# 2. Copiar variables de entorno (opcional al inicio)
cp .env.example .env
# Editar .env con las credenciales de tu proyecto Supabase

# 3. Correr en desarrollo
npm run dev
```

Si no configuras Supabase aún, automáticamente usa el mock de
`src/data/mockEvent.js` y podés ver la invitación funcionando.

## Conectar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Correr el archivo `daisi_schema.sql` en el SQL Editor
3. Crear un usuario en Authentication → Users
4. Insertar un evento de prueba (ver bloque seed comentado al final del SQL)
5. Poblar `event_sections` con las secciones (parents, ceremony, etc.)
6. Pegar URL y anon key en `.env`

## Rutas

- `/` → Demo directo (slug=`demo-sofia-roberto`)
- `/:slug` → Cualquier invitación pública por su slug

## Próximas fases

- [ ] Editor de invitaciones (admin)
- [ ] RSVP por token
- [ ] Generación con IA
- [ ] Pagos con Stripe
- [ ] Landing de marketing
