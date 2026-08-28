-- ============================================================
-- SCHEMA UPDATE 7 — Web-push abonnementen (gratis browsermeldingen)
-- ============================================================
-- Draait NAAST de bestaande Twilio/WhatsApp-integratie.
-- Elke deelnemer/marshall die in zijn browser meldingen aanzet,
-- krijgt hier één rij per toestel/browser.
--
-- Voer uit in Supabase → SQL Editor.
-- ============================================================

create table if not exists push_abonnementen (
  id bigserial primary key,
  endpoint text not null unique,
  keys jsonb not null,                       -- { p256dh, auth } van de PushSubscription
  rol text not null check (rol in ('deelnemer', 'marshall')),
  deelnemer_id bigint references deelnemers(id) on delete cascade,
  marshall_id  bigint references marshalls(id)  on delete cascade,
  user_agent text,
  aangemaakt_op timestamptz not null default now(),
  laatst_gebruikt_op timestamptz,
  -- precies één eigenaar-kolom ingevuld, passend bij de rol
  constraint push_eigenaar_check check (
    (rol = 'deelnemer' and deelnemer_id is not null and marshall_id is null) or
    (rol = 'marshall'  and marshall_id  is not null and deelnemer_id is null)
  )
);

create index if not exists idx_push_deelnemer on push_abonnementen (deelnemer_id);
create index if not exists idx_push_marshall  on push_abonnementen (marshall_id);
create index if not exists idx_push_rol        on push_abonnementen (rol);

-- Alle toegang verloopt via de server (service role key), net als bij de marshalls-tabel.
alter table push_abonnementen enable row level security;
-- (geen publieke policies — de browser mag deze tabel niet lezen of schrijven)
