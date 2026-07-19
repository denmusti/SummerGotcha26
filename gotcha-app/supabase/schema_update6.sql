-- ============================================================
-- SUMMER GOTCHA 2026 — Schema update 6
-- Foto URL toevoegen aan tijdlijn
-- ============================================================

alter table tijdlijn
  add column if not exists foto_url text;

-- Update bestaande kill in tijdlijn met foto van slachtoffer
-- Vervang 'FOTO_URL' door de echte URL uit de deelnemers tabel
-- en 'TIJDLIJN_ID' door het ID van de tijdlijn rij

-- Stap 1: zoek het ID van de tijdlijn rij
-- SELECT id, tekst FROM tijdlijn ORDER BY tijdstip DESC LIMIT 10;

-- Stap 2: zoek de foto URL van het slachtoffer
-- SELECT id, voornaam, familienaam, foto_url FROM deelnemers WHERE status = 'geëlimineerd';

-- Stap 3: update de tijdlijn rij
-- UPDATE tijdlijn SET tekst = '💀 [naam] is uitgeschakeld. Nog 19 spelers actief.', foto_url = '[foto_url]' WHERE id = [id];
