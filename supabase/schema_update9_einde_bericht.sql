-- ============================================================
-- SCHEMA UPDATE 9 — vlag "eindbericht verstuurd"
-- ============================================================
-- Zorgt dat het automatische eindbericht (bij laatste speler
-- over, of na de einddatum) maar één keer uitgaat.
-- De admin-knop kan het nadien nog manueel (her)sturen.
--
-- Voer uit in Supabase → SQL Editor.
-- ============================================================

alter table stats add column if not exists einde_bericht_verstuurd_op timestamptz;
