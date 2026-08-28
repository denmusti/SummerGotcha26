-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 7
-- Geplande herschommeling: datum/tijd waarop de doelwitten
-- automatisch herschud worden (via de dagelijkse cron job).
-- NULL = geen herschommeling gepland.
-- ============================================================

alter table stats
  add column if not exists herschommel_gepland_op timestamptz;

-- Handmatig plannen kan ook rechtstreeks:
--   update stats set herschommel_gepland_op = '2026-09-01 00:00:00+02' where id = 1;
-- Annuleren:
--   update stats set herschommel_gepland_op = null where id = 1;
