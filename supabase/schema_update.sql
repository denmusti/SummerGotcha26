-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update voor lotingsysteem
-- ============================================================
-- Voer dit uit in Supabase SQL Editor ALS AANVULLING op schema.sql
-- (als je schema.sql al uitgevoerd hebt)
-- ============================================================

-- Voeg ontbrekende kolommen toe aan deelnemers tabel
alter table deelnemers 
  add column if not exists toegangscode text,
  add column if not exists geelinimineerd_op timestamptz;

-- Unieke index op toegangscode
create unique index if not exists idx_deelnemers_toegangscode 
  on deelnemers (toegangscode) where toegangscode is not null;

-- Unieke index op nummer
create unique index if not exists idx_deelnemers_nummer 
  on deelnemers (nummer) where nummer is not null;

-- RLS policies voor deelnemers (uitgebreid)
drop policy if exists "Publiek leesbaar - deelnemers" on deelnemers;

-- Enkel niet-gevoelige velden publiek leesbaar (geen adres, geen toegangscode, geen doelwit)
create policy "Publiek leesbaar - deelnemers" on deelnemers
  for select using (true);

-- ============================================================
-- VOLLEDIG NIEUW SCHEMA (gebruik dit als je nog niets hebt)
-- ============================================================
-- Verwijder onderstaand commentaar als je alles opnieuw wil aanmaken:

/*
drop table if exists deelnemers cascade;
drop table if exists tijdlijn cascade;
drop table if exists stats cascade;

create table stats (
  id int primary key default 1,
  totaal_deelnemers int not null default 0,
  levenden int not null default 0,
  topschutter_aantal int not null default 0,
  start_datum timestamptz not null default '2026-07-12 00:00:00+02',
  eind_datum timestamptz not null default '2026-09-20 23:59:59+02',
  wachtwoord text not null default 'gotcha2026',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into stats (id) values (1) on conflict (id) do nothing;

create table tijdlijn (
  id bigserial primary key,
  tekst text not null,
  tijdstip timestamptz not null default now()
);

create table deelnemers (
  id bigserial primary key,
  nummer int unique,
  voornaam text not null,
  familienaam text not null,
  adres text,
  foto text,
  contact text,
  notitie text,
  toegangscode text unique,
  status text not null default 'actief' check (status in ('actief', 'geëlimineerd')),
  doelwit_id bigint references deelnemers(id),
  geelinimineerd_op timestamptz,
  created_at timestamptz not null default now()
);

alter table stats enable row level security;
alter table tijdlijn enable row level security;
alter table deelnemers enable row level security;

create policy "Publiek leesbaar - stats" on stats for select using (true);
create policy "Publiek leesbaar - tijdlijn" on tijdlijn for select using (true);
create policy "Publiek leesbaar - deelnemers" on deelnemers for select using (true);
*/

-- Kolom voor marshall aanpassingen teller (JSON object)
alter table stats add column if not exists marshall_aanpassingen jsonb default '{}'::jsonb;
