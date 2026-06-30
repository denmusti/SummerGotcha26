// app/api/data/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET() {
  const supabase = getSupabaseServer();

  const [{ data: stats, error: statsErr }, { data: tijdlijn, error: tijdlijnErr }] = await Promise.all([
    supabase.from('stats').select('*').eq('id', 1).single(),
    supabase.from('tijdlijn').select('*').order('tijdstip', { ascending: false }).limit(50),
  ]);

  if (statsErr || tijdlijnErr) {
    console.error(statsErr, tijdlijnErr);
    return Response.json({ error: 'Databasefout' }, { status: 500 });
  }

  // Wachtwoord nooit naar de browser sturen
  const { wachtwoord, updated_at, id, ...publiekeStats } = stats;

  return Response.json({
    totaalDeelnemers: publiekeStats.totaal_deelnemers,
    marshallTelefoons: stats.marshall_telefoons || [],
    levenden: publiekeStats.levenden,
    topschutterAantal: publiekeStats.topschutter_aantal,
    startDatum: publiekeStats.start_datum,
    eindDatum: publiekeStats.eind_datum,
    tijdlijn: tijdlijn.map(t => ({
      id: t.id,
      tijdstip: t.tijdstip,
      tekst: t.tekst,
    })),
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServer();

    // Wachtwoord controleren
    const { data: huidigeStats, error: leesErr } = await supabase
      .from('stats').select('wachtwoord').eq('id', 1).single();

    if (leesErr) {
      console.error(leesErr);
      return Response.json({ error: 'Databasefout' }, { status: 500 });
    }

    if (body.wachtwoord !== huidigeStats.wachtwoord) {
      return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }

    // Nieuwe eliminatie toevoegen aan tijdlijn
    if (body.nieuwEliminatie) {
      const { error } = await supabase
        .from('tijdlijn')
        .insert({ tekst: body.nieuwEliminatie });
      if (error) {
        console.error(error);
        return Response.json({ error: 'Fout bij toevoegen eliminatie' }, { status: 500 });
      }
    }

    // Tijdlijn item verwijderen
    if (body.verwijderTijdlijnId) {
      const { error } = await supabase
        .from('tijdlijn')
        .delete()
        .eq('id', body.verwijderTijdlijnId);
      if (error) {
        console.error(error);
        return Response.json({ error: 'Fout bij verwijderen' }, { status: 500 });
      }
    }

    // Statistieken updaten
    const statsUpdate = {};
    if (body.totaalDeelnemers !== undefined) statsUpdate.totaal_deelnemers = body.totaalDeelnemers;
    if (body.levenden !== undefined) statsUpdate.levenden = body.levenden;
    if (body.topschutterAantal !== undefined) statsUpdate.topschutter_aantal = body.topschutterAantal;
    if (body.startDatum !== undefined) statsUpdate.start_datum = body.startDatum;
    if (body.eindDatum !== undefined) statsUpdate.eind_datum = body.eindDatum;
    if (body.marshallTelefoons !== undefined) statsUpdate.marshall_telefoons = body.marshallTelefoons;

    if (Object.keys(statsUpdate).length > 0) {
      statsUpdate.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from('stats')
        .update(statsUpdate)
        .eq('id', 1);
      if (error) {
        console.error(error);
        return Response.json({ error: 'Fout bij opslaan statistieken' }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Fout bij verwerken' }, { status: 500 });
  }
}
