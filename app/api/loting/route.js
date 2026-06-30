// app/api/loting/route.js
import { getSupabaseServer } from '../../../lib/supabase';

async function checkWachtwoord(supabase, wachtwoord) {
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  return data?.wachtwoord === wachtwoord;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genereerKetting(deelnemers) {
  let pogingen = 0;
  while (pogingen < 1000) {
    const indices = shuffle(deelnemers.map((_, i) => i));
    if (!indices.some((d, i) => d === i)) return indices;
    pogingen++;
  }
  return null;
}

export async function POST(request) {
  const supabase = getSupabaseServer();
  const body = await request.json();

  if (!await checkWachtwoord(supabase, body.wachtwoord)) {
    return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
  }

  const { actie, testModus } = body;

  // Loting genereren
  if (actie === 'genereer') {
    const { data: deelnemers, error } = await supabase
      .from('deelnemers')
      .select('*')
      .eq('status', 'actief')
      .order('nummer', { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!deelnemers || deelnemers.length < 3) {
      return Response.json({ error: 'Minimum 3 actieve deelnemers nodig' }, { status: 400 });
    }

    const doelwit_indices = genereerKetting(deelnemers);
    if (!doelwit_indices) {
      return Response.json({ error: 'Ketting genereren mislukt' }, { status: 500 });
    }

    // Reset alle doelwitten eerst (niet bij testmodus)
    if (!testModus) await supabase.from('deelnemers').update({ doelwit_id: null }).eq('status', 'actief');

    // Sla koppeling op (niet bij testmodus)
    if (testModus) return Response.json({ success: true, aantalDeelnemers: deelnemers.length, testModus: true });
    for (let i = 0; i < deelnemers.length; i++) {
      const schutter = deelnemers[i];
      const doelwit = deelnemers[doelwit_indices[i]];
      await supabase.from('deelnemers').update({ doelwit_id: doelwit.id }).eq('id', schutter.id);
    }

    return Response.json({ success: true, aantalDeelnemers: deelnemers.length });
  }

  // Aanpassing doorvoeren (marshall)
  if (actie === 'aanpassing') {
    const { schutter_id, nieuw_doelwit_id, marshall_naam } = body;

    if (!marshall_naam) {
      return Response.json({ error: 'Marshall naam is verplicht' }, { status: 400 });
    }

    // Tel bestaande aanpassingen van deze marshall
    // We houden dit bij in een aparte tabel of via een tijdlijn-notitie
    // Eenvoudige oplossing: bewaar in stats als JSON
    const { data: statsData } = await supabase.from('stats').select('*').eq('id', 1).single();
    const aanpassingen = statsData.marshall_aanpassingen || {};
    const huidigAantal = aanpassingen[marshall_naam] || 0;

    if (huidigAantal >= 3) {
      return Response.json({ error: `${marshall_naam} heeft het maximum van 3 aanpassingen bereikt` }, { status: 400 });
    }

    // Aanpassing doorvoeren
    const { error } = await supabase.from('deelnemers')
      .update({ doelwit_id: nieuw_doelwit_id })
      .eq('id', schutter_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Teller ophogen
    aanpassingen[marshall_naam] = huidigAantal + 1;
    await supabase.from('stats').update({ marshall_aanpassingen: aanpassingen }).eq('id', 1);

    return Response.json({ success: true, aanpassingenResterend: 3 - aanpassingen[marshall_naam] });
  }

  // Ketting valideren
  if (actie === 'valideer') {
    const { data: deelnemers } = await supabase
      .from('deelnemers')
      .select('id, voornaam, familienaam, doelwit_id, status')
      .eq('status', 'actief');

    const fouten = [];
    const doelwitMap = {};
    const schutterMap = {};

    deelnemers.forEach(d => {
      if (!d.doelwit_id) {
        fouten.push(`${d.voornaam} ${d.familienaam} heeft geen doelwit`);
        return;
      }
      if (d.doelwit_id === d.id) {
        fouten.push(`${d.voornaam} ${d.familienaam} is zijn/haar eigen doelwit`);
      }
      if (doelwitMap[d.doelwit_id]) {
        fouten.push(`Doelwit is gekoppeld aan meerdere schutters`);
      }
      doelwitMap[d.doelwit_id] = d.id;
      schutterMap[d.id] = d.doelwit_id;
    });

    // Controleer gesloten ketting
    if (fouten.length === 0 && deelnemers.length > 0) {
      const start = deelnemers[0].id;
      let huidig = start;
      const bezocht = new Set();
      while (true) {
        if (bezocht.has(huidig)) {
          if (huidig !== start) fouten.push('Ketting vormt een deellus — niet één grote ketting');
          break;
        }
        bezocht.add(huidig);
        huidig = schutterMap[huidig];
        if (!huidig) { fouten.push('Ketting is niet gesloten'); break; }
      }
      if (bezocht.size !== deelnemers.length && fouten.length === 0) {
        fouten.push('Niet alle deelnemers zitten in dezelfde ketting');
      }
    }

    return Response.json({ geldig: fouten.length === 0, fouten });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
