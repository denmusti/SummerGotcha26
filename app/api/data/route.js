// app/api/data/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET() {
  const supabase = getSupabaseServer();

  // Haal alles parallel op — tellers live berekend vanuit deelnemers tabel
  const [
    { data: stats, error: statsErr },
    { data: tijdlijn, error: tijdlijnErr },
    { data: alleDeelnemers },
    { data: levendeDeelnemers },
    { data: topKills },
  ] = await Promise.all([
    supabase.from('stats').select('*').eq('id', 1).single(),
    supabase.from('tijdlijn').select('*').order('tijdstip', { ascending: false }).limit(50),
    supabase.from('deelnemers').select('id'),
    supabase.from('deelnemers').select('id').eq('status', 'actief'),
    supabase.from('kills').select('schutter_id').then(({ data }) => {
      if (!data) return { data: 0 };
      const teller = {};
      data.forEach(k => { teller[k.schutter_id] = (teller[k.schutter_id] || 0) + 1; });
      return { data: Math.max(0, ...Object.values(teller), 0) };
    }),
  ]);

  if (statsErr || tijdlijnErr) {
    console.error(statsErr, tijdlijnErr);
    return Response.json({ error: 'Databasefout' }, { status: 500 });
  }

  const totaal = alleDeelnemers?.length || 0;
  const levenden = levendeDeelnemers?.length || 0;
  const topschutter = topKills?.data || 0;

  // Sync tellers terug naar stats tabel (stille achtergrondtaak)
  supabase.from('stats').update({
    totaal_deelnemers: totaal,
    levenden: levenden,
    topschutter_aantal: topschutter,
  }).eq('id', 1).then(() => {}).catch(() => {});

  return Response.json({
    totaalDeelnemers: totaal,
    marshallTelefoons: stats.marshall_telefoons || [],
    levenden: levenden,
    topschutterAantal: topschutter,
    startDatum: stats.start_datum,
    eindDatum: stats.eind_datum,
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
