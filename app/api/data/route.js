// app/api/data/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET() {
  const supabase = getSupabaseServer();

  // Haal alles parallel op — tellers live berekend vanuit deelnemers tabel
  const [
    { data: stats, error: statsErr },
    { data: tijdlijn, error: tijdlijnErr },
    { data: alleDeelnemers },
    { data: alleKills },
  ] = await Promise.all([
    supabase.from('stats').select('*').eq('id', 1).single(),
    supabase.from('tijdlijn').select('*').order('tijdstip', { ascending: false }).limit(50),
    supabase.from('deelnemers').select('id, voornaam, familienaam, foto_url, status, geelinimineerd_op'),
    supabase.from('kills').select('schutter_id, tijdstip'),
  ]);

  if (statsErr || tijdlijnErr) {
    console.error(statsErr, tijdlijnErr);
    return Response.json({ error: 'Databasefout' }, { status: 500 });
  }

  const deelnemersLijst = alleDeelnemers || [];
  const totaal = deelnemersLijst.length;
  const levenden = deelnemersLijst.filter(d => d.status === 'actief').length;

  // Bereken topschutter correct
  const killData = Array.isArray(alleKills) ? alleKills : [];
  const tellerPerSchutter = {};
  const eersteKillPerSchutter = {};
  killData.forEach(k => {
    tellerPerSchutter[k.schutter_id] = (tellerPerSchutter[k.schutter_id] || 0) + 1;
    const t = new Date(k.tijdstip).getTime();
    if (!(k.schutter_id in eersteKillPerSchutter) || t < eersteKillPerSchutter[k.schutter_id]) {
      eersteKillPerSchutter[k.schutter_id] = t;
    }
  });
  const maxKills = killData.length > 0 ? Math.max(...Object.values(tellerPerSchutter)) : 0;
  const aantalTopschutters = Object.values(tellerPerSchutter).filter(v => v === maxKills).length;
  const topschutter = maxKills;

  // ── Winnaarsoverzicht — enkel als het spel gedaan is ──────────
  // Gedaan = na de einddatum OF nog maar 1 (of 0) overlevende
  const nu = new Date();
  const spelGedaan = (stats.eind_datum && nu > new Date(stats.eind_datum)) || levenden <= 1;

  let winnaars = null;
  if (spelGedaan && totaal > 0) {
    const verrijk = d => ({
      naam: `${d.voornaam} ${d.familienaam}`,
      foto_url: d.foto_url || null,
      status: d.status,
      kills: tellerPerSchutter[d.id] || 0,
      eersteKill: eersteKillPerSchutter[d.id] || null,
    });

    // Overlevenden: meeste kills eerst; ex aequo -> vroegste eerste kill eerst
    const overlevenden = deelnemersLijst
      .filter(d => d.status === 'actief')
      .map(verrijk)
      .sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return (a.eersteKill ?? Infinity) - (b.eersteKill ?? Infinity);
      });

    // Topkillers: iedereen met >= 1 kill; meeste kills eerst,
    // ex aequo -> nog in leven vóór dood, dan vroegste eerste kill eerst
    const topkillers = deelnemersLijst
      .filter(d => (tellerPerSchutter[d.id] || 0) > 0)
      .map(verrijk)
      .sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        const aLeeft = a.status === 'actief' ? 0 : 1;
        const bLeeft = b.status === 'actief' ? 0 : 1;
        if (aLeeft !== bLeeft) return aLeeft - bLeeft;
        return (a.eersteKill ?? Infinity) - (b.eersteKill ?? Infinity);
      });

    winnaars = {
      winnaar: overlevenden[0] || null,
      overlevenden,
      topkiller: topkillers[0] || null,
      topkillers,
    };
  }

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
    aantalTopschutters: maxKills > 0 ? aantalTopschutters : 0,
    startDatum: stats.start_datum,
    eindDatum: stats.eind_datum,
    herschommelGeplandOp: stats.herschommel_gepland_op || null,
    spelGedaan,
    winnaars,
    marshallAanpassingen: stats.marshall_aanpassingen || {},
    tijdlijn: tijdlijn.map(t => ({
      id: t.id,
      tijdstip: t.tijdstip,
      tekst: t.tekst,
      foto_url: t.foto_url || null,
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
    // Automatische tijdlijnberichten bij start/stop
    if (body.startDatum !== undefined) {
      const oudeStart = new Date(stats.start_datum);
      const nieuweStart = new Date(body.startDatum);
      const nu = new Date();
      // Startdatum wordt nu of in het verleden gezet → spel start
      if (nieuweStart <= nu && oudeStart > nu) {
        await supabase.from('tijdlijn').insert({ tekst: '🚀 Het spel is officieel gestart! Kijk om je heen...' });
      }
      statsUpdate.start_datum = body.startDatum;
    }
    if (body.eindDatum !== undefined) {
      const oudeEind = new Date(stats.eind_datum);
      const nieuwEind = new Date(body.eindDatum);
      const nu = new Date();
      // Einddatum wordt nu of in het verleden gezet → spel stopt
      if (nieuwEind <= nu && oudeEind > nu) {
        await supabase.from('tijdlijn').insert({ tekst: '🏁 Het spel is afgelopen! De overlevenden zijn bekend.' });
      }
      statsUpdate.eind_datum = body.eindDatum;
    }
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
// Tue Jul 14 15:56:39 UTC 2026
