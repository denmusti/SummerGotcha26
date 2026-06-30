// lib/data.js
// Deze defaults staan nu in de Supabase database (zie supabase/schema.sql).
// Dit bestand dient enkel nog als referentie/documentatie.

export const defaultData = {
  totaalDeelnemers: 0,
  levenden: 0,
  topschutterAantal: 0,
  eindDatum: "2026-09-20T23:59:59",
  startDatum: "2026-07-12T00:00:00",
  tijdlijn: [],
  // Wachtwoord: zie 'wachtwoord' kolom in de stats-tabel in Supabase
};
