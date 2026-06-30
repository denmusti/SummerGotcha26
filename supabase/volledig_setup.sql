-- ============================================================
-- SUMMER GOTCHA — Volledig database setup script
-- ============================================================
-- Gebruik dit script voor een nieuw spel / frisse start.
-- Voer uit in Supabase → SQL Editor → plak alles → Run
--
-- ⚠️  Dit verwijdert alle bestaande data!
--     Gebruik enkel bij een nieuwe opzet.
-- ============================================================

-- ── 1. Opruimen (bestaande tabellen verwijderen) ─────────────
drop table if exists kills cascade;
drop table if exists tijdlijn cascade;
drop table if exists deelnemers cascade;
drop table if exists marshalls cascade;
drop table if exists stats cascade;

-- ── 2. Stats tabel (1 rij — algemene spelgegevens) ───────────
create table stats (
  id int primary key default 1,
  totaal_deelnemers int not null default 0,
  levenden int not null default 0,
  topschutter_aantal int not null default 0,
  start_datum timestamptz not null default '2026-07-12 00:00:00+02',
  eind_datum timestamptz not null default '2026-09-20 23:59:59+02',
  wachtwoord text not null default 'verander-dit-wachtwoord',
  marshall_aanpassingen jsonb default '{}'::jsonb,
  marshall_telefoons jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into stats (id) values (1);

-- ── 3. Tijdlijn tabel (publieke eliminatieberichten) ─────────
create table tijdlijn (
  id bigserial primary key,
  tekst text not null,
  tijdstip timestamptz not null default now()
);

create index idx_tijdlijn_tijdstip on tijdlijn (tijdstip desc);

-- ── 4. Deelnemers tabel ──────────────────────────────────────
create table deelnemers (
  id bigserial primary key,
  nummer int unique,
  voornaam text not null,
  familienaam text not null,
  adres text,
  foto_url text,
  contact text,
  notitie text,
  toegangscode text unique,
  killcode text unique,
  status text not null default 'actief' check (status in ('actief', 'geëlimineerd')),
  doelwit_id bigint references deelnemers(id),
  geelinimineerd_op timestamptz,
  created_at timestamptz not null default now()
);

create index idx_deelnemers_toegangscode on deelnemers (toegangscode);
create index idx_deelnemers_killcode on deelnemers (killcode);

-- ── 5. Kills tabel (historiek per schutter) ──────────────────
create table kills (
  id bigserial primary key,
  schutter_id bigint references deelnemers(id),
  slachtoffer_id bigint references deelnemers(id),
  tijdstip timestamptz not null default now(),
  killcode_gebruikt boolean default false
);

create index idx_kills_schutter on kills (schutter_id);

-- ── 6. Marshalls tabel ───────────────────────────────────────
create table marshalls (
  id bigserial primary key,
  naam text not null,
  wachtwoord text not null,
  aanpassingen int not null default 0,
  created_at timestamptz not null default now()
);

-- ── 7. Row Level Security ────────────────────────────────────
-- Alle schrijfacties verlopen via de server (service role key).
-- De browser krijgt enkel leesrechten op niet-gevoelige tabellen.

alter table stats enable row level security;
alter table tijdlijn enable row level security;
alter table deelnemers enable row level security;
alter table kills enable row level security;
alter table marshalls enable row level security;

create policy "Publiek leesbaar - stats"
  on stats for select using (true);

create policy "Publiek leesbaar - tijdlijn"
  on tijdlijn for select using (true);

create policy "Publiek leesbaar - deelnemers"
  on deelnemers for select using (true);

create policy "Publiek leesbaar - kills"
  on kills for select using (true);

-- Marshalls tabel: GEEN publieke toegang (wachtwoorden!)
-- Enkel via service role key (server-side API routes)

-- ── 8. Supabase Storage bucket voor foto's ───────────────────
insert into storage.buckets (id, name, public)
values ('deelnemer-fotos', 'deelnemer-fotos', true)
on conflict (id) do nothing;

drop policy if exists "Publiek leesbaar - fotos" on storage.objects;
drop policy if exists "Service role upload" on storage.objects;

create policy "Publiek leesbaar - fotos"
  on storage.objects for select
  using (bucket_id = 'deelnemer-fotos');

create policy "Service role upload"
  on storage.objects for insert
  with check (bucket_id = 'deelnemer-fotos');

-- ── 9. Klaar! ────────────────────────────────────────────────
-- Vergeet niet het wachtwoord aan te passen:
-- update stats set wachtwoord = 'jouwSterkWachtwoord' where id = 1;
--
-- En de speelperiode indien nodig:
-- update stats set start_datum = '2026-07-12 00:00:00+02', eind_datum = '2026-09-20 23:59:59+02' where id = 1;
