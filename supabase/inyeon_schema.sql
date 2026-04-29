-- =====================================================
-- INYEON — Schema (MVP sin Supabase Auth)
-- Ownership por email, escrituras vía service_role en /api/*
-- =====================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

do $$ begin
  if not exists (select 1 from pg_type where typname='event_type') then
    create type event_type as enum (
      'wedding','xv','baptism','confirmation','first_communion',
      'baby_shower','gender_reveal','birthday','graduation','other'
    );
  end if;
  if not exists (select 1 from pg_type where typname='event_status') then
    create type event_status as enum ('draft','published','archived');
  end if;
  if not exists (select 1 from pg_type where typname='section_type') then
    create type section_type as enum (
      'cover','parents','ceremony','reception','itinerary',
      'registry','lodging','gallery','dresscode','album','custom'
    );
  end if;
  if not exists (select 1 from pg_type where typname='guest_kind') then
    create type guest_kind as enum ('single','group');
  end if;
  if not exists (select 1 from pg_type where typname='rsvp_status') then
    create type rsvp_status as enum ('pending','attending','declined');
  end if;
end $$;

-- =====================================================
-- TABLES
-- =====================================================

create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null,
  slug text unique not null default substring(replace(uuid_generate_v4()::text,'-','') from 1 for 10),
  type event_type not null default 'wedding',
  status event_status not null default 'draft',
  title text not null,
  subtitle text,
  event_date timestamptz not null,
  language text default 'es' not null,
  timezone text default 'America/Mexico_City' not null,
  cover_image_url text,
  palette jsonb default '{"primary":"#161514","secondary":"#B8593A","accent":"#F2EDE3"}',
  texts jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  published_at timestamptz
);

create index if not exists idx_events_owner on public.events(owner_email);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_status on public.events(status);

create table if not exists public.event_sections (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  type section_type not null,
  order_index int not null default 0,
  is_visible boolean default true not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (event_id, type)
);

create index if not exists idx_sections_event on public.event_sections(event_id);
create index if not exists idx_sections_order on public.event_sections(event_id, order_index);

create table if not exists public.gallery_images (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text,
  order_index int default 0 not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_gallery_event on public.gallery_images(event_id);

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

drop trigger if exists sections_updated_at on public.event_sections;
create trigger sections_updated_at before update on public.event_sections
  for each row execute function public.set_updated_at();

drop trigger if exists guests_updated_at on public.event_guests;
create trigger guests_updated_at before update on public.event_guests
  for each row execute function public.set_updated_at();

-- =====================================================
-- RLS
-- Lectura pública de invitaciones publicadas y de invitados por token.
-- Escrituras solo vía service_role (en /api/*) — RLS las bloquea para anon.
-- =====================================================

alter table public.events enable row level security;
alter table public.event_sections enable row level security;
alter table public.gallery_images enable row level security;
alter table public.event_guests enable row level security;

drop policy if exists "events_public_read_published" on public.events;
create policy "events_public_read_published"
  on public.events for select
  using (status = 'published');

drop policy if exists "sections_public_read_published" on public.event_sections;
create policy "sections_public_read_published"
  on public.event_sections for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_sections.event_id and e.status = 'published'
    )
  );

drop policy if exists "gallery_public_read_published" on public.gallery_images;
create policy "gallery_public_read_published"
  on public.gallery_images for select
  using (
    exists (
      select 1 from public.events e
      where e.id = gallery_images.event_id and e.status = 'published'
    )
  );

drop policy if exists "guests_public_read_by_token" on public.event_guests;
create policy "guests_public_read_by_token"
  on public.event_guests for select
  using (true);  -- el filtro real lo hace el cliente con .eq('token', ...)
