-- ============================================================
-- SUMMER GOTCHA 2026 — Supabase Database Schema
-- ============================================================
-- HOE GEBRUIKEN:
-- 1. Ga naar je Supabase project → SQL Editor
-- 2. Plak deze volledige code en klik "Run"
-- ============================================================

-- Tabel: stats (één rij met de algemene spelstatistieken)
create table if not exists stats (
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

-- Standaardrij invoegen (enkel als ze nog niet bestaat)
insert into stats (id) values (1)
on conflict (id) do nothing;

-- Tabel: tijdlijn (eliminaties)
create table if not exists tijdlijn (
  id bigserial primary key,
  tekst text not null,
  tijdstip timestamptz not null default now()
);

create index if not exists idx_tijdlijn_tijdstip on tijdlijn (tijdstip desc);

-- Tabel: deelnemers (optioneel, voor toekomstige uitbreiding)
create table if not exists deelnemers (
  id bigserial primary key,
  nummer int,
  voornaam text not null,
  familienaam text not null,
  adres text,
  foto text,
  contact text,
  notitie text,
  status text not null default 'actief' check (status in ('actief', 'geëlimineerd')),
  doelwit_id bigint references deelnemers(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS) — publieke lees-toegang, geen schrijf
-- ============================================================
-- We doen schrijftoegang via de server (API routes met service role key),
-- dus de browser krijgt enkel lees-rechten op niet-gevoelige data.

alter table stats enable row level security;
alter table tijdlijn enable row level security;
alter table deelnemers enable row level security;

-- Iedereen mag stats lezen (wachtwoord wordt server-side weggefilterd)
create policy "Publiek leesbaar - stats" on stats
  for select using (true);

create policy "Publiek leesbaar - tijdlijn" on tijdlijn
  for select using (true);

create policy "Publiek leesbaar - deelnemers" on deelnemers
  for select using (true);

-- Schrijven gebeurt enkel via de Supabase service role key (server-side in onze API routes)
-- Browser/anon key krijgt GEEN insert/update/delete rechten — dat is gewenst.
