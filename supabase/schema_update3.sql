-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 3
-- Marshall telefoonnummers voor WhatsApp notificaties
-- ============================================================

alter table stats
  add column if not exists marshall_telefoons jsonb default '[]'::jsonb;
