-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 4
-- Marshalls tabel
-- ============================================================

create table if not exists marshalls (
  id bigserial primary key,
  naam text not null,
  wachtwoord text not null,
  aanpassingen int not null default 0,
  created_at timestamptz not null default now()
);

alter table marshalls enable row level security;
-- Marshalls mogen enkel via server-side API gelezen worden
-- Geen publieke toegang

-- Verwijder marshall_aanpassingen uit stats (wordt nu bijgehouden in marshalls tabel)
-- alter table stats drop column if exists marshall_aanpassingen;
-- (uitgecommentarieerd voor veiligheid — doe dit manueel als alles werkt)
