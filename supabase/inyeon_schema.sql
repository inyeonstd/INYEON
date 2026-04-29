-- =====================================================
-- INYEON — Schema (simplificado, JSONB-first)
-- - events: una fila por boda, con sections y gallery como jsonb
-- - event_guests: tabla aparte (lookup por token)
-- - Lecturas públicas vía RLS, escrituras vía service_role en /api/*
-- =====================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- ENUMS (idempotente)
-- =====================================================
do $$ begin
  if not exists (select 1 from pg_type where typname='event_status') then
    create type event_status as enum ('draft','published','archived');
  end if;
  if not exists (select 1 from pg_type where typname='guest_kind') then
    create type guest_kind as enum ('single','group');
  end if;
  if not exists (select 1 from pg_type where typname='rsvp_status') then
    create type rsvp_status as enum ('pending','attending','declined');
  end if;
end $$;

-- =====================================================
-- LIMPIEZA si vienes de un schema anterior con tablas separadas
-- =====================================================
drop table if exists public.gallery_images cascade;
drop table if exists public.event_sections cascade;
drop type if exists section_type cascade;
drop type if exists event_type cascade;
drop type if exists addon_type cascade;
drop table if exists public.ai_generations cascade;
drop table if exists public.payments cascade;
drop table if exists public.profiles cascade;
drop table if exists public.guests cascade;

-- =====================================================
-- TABLES
-- =====================================================
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null,
  slug text unique not null default substring(replace(uuid_generate_v4()::text,'-','') from 1 for 10),
  type text not null default 'wedding',
  status event_status not null default 'draft',
  title text not null,
  subtitle text,
  event_date timestamptz not null,
  language text default 'es' not null,
  timezone text default 'America/Mexico_City' not null,
  cover_image_url text,
  palette jsonb default '{"primary":"#161514","secondary":"#B8593A","accent":"#F2EDE3"}'::jsonb,
  texts jsonb default '{}'::jsonb,
  sections jsonb default '[]'::jsonb,
  gallery jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  published_at timestamptz
);

create index if not exists idx_events_owner on public.events(owner_email);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_status on public.events(status);

create table if not exists public.event_guests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  token text unique not null default substring(replace(uuid_generate_v4()::text,'-','') from 1 for 16),
  name text not null,
  kind guest_kind default 'single' not null,
  passes int default 1 not null,
  note text,
  rsvp rsvp_status default 'pending' not null,
  responded_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_guests_event on public.event_guests(event_id);
create index if not exists idx_guests_token on public.event_guests(token);

-- =====================================================
-- TRIGGERS
-- =====================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists guests_updated_at on public.event_guests;
create trigger guests_updated_at before update on public.event_guests
  for each row execute function public.set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
alter table public.events enable row level security;
alter table public.event_guests enable row level security;

drop policy if exists "events_public_read_published" on public.events;
create policy "events_public_read_published"
  on public.events for select using (status = 'published');

drop policy if exists "guests_public_read" on public.event_guests;
create policy "guests_public_read"
  on public.event_guests for select using (true);
