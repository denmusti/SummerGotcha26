-- ============================================================
-- SCHEMA UPDATE 8 — "melding verstuurd"-status per kill
-- ============================================================
-- Laat de admin zien wanneer / hoe vaak een kill-melding
-- verstuurd is, en voedt de "al verstuurd"-rem bij opnieuw
-- versturen (te negeren met de forceer-knop).
--
-- Voer uit in Supabase → SQL Editor.
-- ============================================================

alter table kills add column if not exists notificatie_verstuurd_op timestamptz;
alter table kills add column if not exists notificatie_aantal int not null default 0;
