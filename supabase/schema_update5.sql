-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 5
-- Marshall admin rechten
-- ============================================================

-- Voeg is_admin kolom toe aan marshalls
alter table marshalls
  add column if not exists is_admin boolean not null default false;

-- Maak de eerste marshall admin (pas het ID aan naar jouw marshall)
-- update marshalls set is_admin = true where id = 1;

-- Wachtwoord kolom in stats is niet meer nodig voor login
-- (bewaren voor backwards compatibility, gewoon niet meer gebruiken)
