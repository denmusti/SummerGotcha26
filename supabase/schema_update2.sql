-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 2
-- Uitvoeren in Supabase SQL Editor
-- ============================================================

-- Killcode en foto toevoegen aan deelnemers
alter table deelnemers
  add column if not exists killcode text unique,
  add column if not exists foto_url text;

-- Kills tabel
create table if not exists kills (
  id bigserial primary key,
  schutter_id bigint references deelnemers(id),
  slachtoffer_id bigint references deelnemers(id),
  tijdstip timestamptz not null default now(),
  killcode_gebruikt boolean default false
);

create index if not exists idx_kills_schutter on kills(schutter_id);

-- RLS voor kills tabel
alter table kills enable row level security;
create policy "Publiek leesbaar - kills" on kills for select using (true);

-- Unieke index op killcode
create unique index if not exists idx_deelnemers_killcode
  on deelnemers (killcode) where killcode is not null;

-- Supabase Storage bucket aanmaken voor foto's
insert into storage.buckets (id, name, public)
values ('deelnemer-fotos', 'deelnemer-fotos', true)
on conflict (id) do nothing;

-- Storage policies (drop eerst om conflicten te vermijden)
drop policy if exists "Publiek leesbaar - fotos" on storage.objects;
drop policy if exists "Service role upload" on storage.objects;

create policy "Publiek leesbaar - fotos"
  on storage.objects for select
  using (bucket_id = 'deelnemer-fotos');

create policy "Service role upload"
  on storage.objects for insert
  with check (bucket_id = 'deelnemer-fotos');
