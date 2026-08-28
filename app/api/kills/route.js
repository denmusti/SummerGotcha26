// app/api/kills/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET(request) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');

  // Check marshall wachtwoord
  const { data: marshall } = await supabase.from('marshalls').select('id').eq('wachtwoord', wachtwoord).single();
  if (!marshall) {
    const { data: stats } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
    if (wachtwoord !== stats?.wachtwoord) {
      return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }
  }

  const killVelden = (extra) => `
      id,
      tijdstip,${extra}
      schutter:schutter_id(voornaam, familienaam),
      slachtoffer:slachtoffer_id(voornaam, familienaam, doelwit_id)
    `;
  // Val terug op de basisvelden als schema_update8 nog niet gedraaid is
  let { data: kills } = await supabase
    .from('kills')
    .select(killVelden('\n      notificatie_verstuurd_op,\n      notificatie_aantal,'))
    .order('tijdstip', { ascending: false });
  if (!kills) {
    ({ data: kills } = await supabase
      .from('kills')
      .select(killVelden(''))
      .order('tijdstip', { ascending: false }));
  }

  // Haal ook het doelwit op dat de schutter na de kill kreeg
  const killsMetDoelwit = await Promise.all((kills || []).map(async k => {
    return {
      id: k.id,
      tijdstip: k.tijdstip,
      notificatieVerstuurdOp: k.notificatie_verstuurd_op || null,
      notificatieAantal: k.notificatie_aantal || 0,
      schutter: k.schutter ? `${k.schutter.voornaam} ${k.schutter.familienaam}` : 'Onbekend',
      slachtoffer: k.slachtoffer ? `${k.slachtoffer.voornaam} ${k.slachtoffer.familienaam}` : 'Onbekend',
    };
  }));

  // ── Topschutter ranking ──────────────────────────────
  // Kills per schutter tellen
  const { data: alleKills } = await supabase.from('kills').select('schutter_id');
  const killTeller = {};
  (alleKills || []).forEach(k => {
    killTeller[k.schutter_id] = (killTeller[k.schutter_id] || 0) + 1;
  });

  // Alle deelnemers ophalen om naam, status en overlevingstijd te koppelen
  const { data: alleDeelnemers } = await supabase
    .from('deelnemers')
    .select('id, voornaam, familienaam, foto_url, status, geelinimineerd_op');

  const ranking = (alleDeelnemers || [])
    .map(d => ({
      id: d.id,
      naam: `${d.voornaam} ${d.familienaam}`,
      foto_url: d.foto_url,
      status: d.status,
      kills: killTeller[d.id] || 0,
      // Actieve spelers hebben nog geen eliminatie-tijdstip -> zij overleven "oneindig lang" (grootste waarde)
      overlevingsRang: d.status === 'actief' ? Infinity : new Date(d.geelinimineerd_op).getTime(),
    }))
    .sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills; // meeste kills eerst
      return b.overlevingsRang - a.overlevingsRang; // bij gelijkstand: actief/langst levende eerst
    })
    .map(({ overlevingsRang, ...rest }) => rest); // interne sorteerwaarde niet meesturen

  return Response.json({ kills: killsMetDoelwit, ranking });
}
