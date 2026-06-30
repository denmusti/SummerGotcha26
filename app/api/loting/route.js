// app/api/loting/route.js
import { getSupabaseServer } from '../../../lib/supabase';

async function checkWachtwoord(supabase, wachtwoord) {
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  return data?.wachtwoord === wachtwoord;
}

function genereerKetting(deelnemers) {
  // Sato-algoritme: genereer een gegarandeerd gesloten ketting (Hamiltoniaanse cykel)
  // Stap 1: maak een random permutatie
  const n = deelnemers.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Stap 2: bouw één gesloten ketting via de geshuffle volgorde
  // Deelnemer op positie i krijgt deelnemer op positie (i+1) % n als doelwit
  // Dit garandeert altijd precies één ketting
  const doelwitten = new Array(n);
  for (let i = 0; i < n; i++) {
    doelwitten[indices[i]] = indices[(i + 1) % n];
  }
  
  // Valideer: geen zelfkoppelingen
  if (doelwitten.some((d, i) => d === i)) {
    // Herstel: wissel de twee zelfkoppelingen
    for (let i = 0; i < n; i++) {
      if (doelwitten[i] === i) {
        // Zoek een ander element om mee te wisselen
        for (let j = i + 1; j < n; j++) {
          if (doelwitten[j] !== i && doelwitten[i] !== j) {
            [doelwitten[i], doelwitten[j]] = [doelwitten[j], doelwitten[i]];
            break;
          }
        }
      }
    }
  }
  
  return doelwitten;
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

    // Testmodus: stuur koppeling terug zonder op te slaan
    if (testModus) {
      // Bouw koppeling op als map
      const koppelingMap = {};
      deelnemers.forEach((schutter, i) => {
        koppelingMap[schutter.id] = {
          schutter_naam: `${schutter.voornaam} ${schutter.familienaam}`,
          doelwit_id: deelnemers[doelwit_indices[i]].id,
          doelwit_naam: `${deelnemers[doelwit_indices[i]].voornaam} ${deelnemers[doelwit_indices[i]].familienaam}`,
        };
      });

      // Volg de ketting vanaf de eerste deelnemer
      const preview = [];
      let huidigId = deelnemers[0].id;
      const bezocht = new Set();
      while (!bezocht.has(huidigId) && koppelingMap[huidigId]) {
        bezocht.add(huidigId);
        const koppeling = koppelingMap[huidigId];
        preview.push({
          schutter_naam: koppeling.schutter_naam,
          doelwit_naam: koppeling.doelwit_naam,
        });
        huidigId = koppeling.doelwit_id;
      }

      return Response.json({ success: true, aantalDeelnemers: deelnemers.length, testModus: true, preview });
    }

    // Sla echte koppeling op
    for (let i = 0; i < deelnemers.length; i++) {
      const schutter = deelnemers[i];
      const doelwit = deelnemers[doelwit_indices[i]];
      await supabase.from('deelnemers').update({ doelwit_id: doelwit.id }).eq('id', schutter.id);
    }

    return Response.json({ success: true, aantalDeelnemers: deelnemers.length });
  }

  // Marshall aanpassing — wissel doelwitten van 2 deelnemers
  if (actie === 'aanpassing') {
    const { schutter_id, nieuw_doelwit_id, marshall_naam } = body;
    // schutter_id = deelnemer 1, nieuw_doelwit_id = deelnemer 2

    if (!marshall_naam) {
      return Response.json({ error: 'Marshall naam is verplicht' }, { status: 400 });
    }

    // Haal marshall op via naam (bij eigen wachtwoord login) of marshall_id
    const { data: marshallData, error: marshallErr } = await supabase
      .from('marshalls').select('id, naam, aanpassingen').eq('id', marshall_id).single();

    if (marshallErr || !marshallData) {
      return Response.json({ error: 'Marshall niet gevonden' }, { status: 404 });
    }

    if (marshallData.aanpassingen >= 3) {
      return Response.json({ error: `${marshallData.naam} heeft het maximum van 3 aanpassingen bereikt` }, { status: 400 });
    }

    // Haal huidige doelwitten op van beide deelnemers
    const { data: d1 } = await supabase.from('deelnemers').select('doelwit_id').eq('id', schutter_id).single();
    const { data: d2 } = await supabase.from('deelnemers').select('doelwit_id').eq('id', nieuw_doelwit_id).single();

    if (!d1 || !d2) return Response.json({ error: 'Deelnemer niet gevonden' }, { status: 404 });

    // Wissel doelwitten
    await supabase.from('deelnemers').update({ doelwit_id: d2.doelwit_id }).eq('id', schutter_id);
    await supabase.from('deelnemers').update({ doelwit_id: d1.doelwit_id }).eq('id', nieuw_doelwit_id);

    // Fix: wie had d1 als doelwit → krijgt nu d2 (en vice versa)
    const { data: schutterVanD1 } = await supabase.from('deelnemers').select('id').eq('doelwit_id', schutter_id).eq('status', 'actief').neq('id', schutter_id).neq('id', nieuw_doelwit_id);
    const { data: schutterVanD2 } = await supabase.from('deelnemers').select('id').eq('doelwit_id', nieuw_doelwit_id).eq('status', 'actief').neq('id', schutter_id).neq('id', nieuw_doelwit_id);

    if (schutterVanD1?.length) await supabase.from('deelnemers').update({ doelwit_id: nieuw_doelwit_id }).eq('id', schutterVanD1[0].id);
    if (schutterVanD2?.length) await supabase.from('deelnemers').update({ doelwit_id: schutter_id }).eq('id', schutterVanD2[0].id);

    // Teller ophogen in marshalls tabel
    await supabase.from('marshalls')
      .update({ aanpassingen: marshallData.aanpassingen + 1 })
      .eq('id', marshall_id);

    return Response.json({ success: true, aanpassingenResterend: 3 - (marshallData.aanpassingen + 1) });
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
