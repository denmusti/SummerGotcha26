// lib/herschommel.js
// Gedeelde loting-logica: het kettingalgoritme + de volledige herschommeling.
// Gebruikt door zowel de admin-API (app/api/loting) als de cron job (app/api/cron).

import { stuurNaarLijst } from './whatsapp';
import { pushNaarActieveDeelnemers } from './push';

// Sato-algoritme: genereer een gegarandeerd gesloten ketting (Hamiltoniaanse cykel).
// Geeft een array `doelwitten` terug waarbij doelwitten[i] de index is van het
// doelwit van deelnemer i. Altijd precies één gesloten kring, nooit losse deellussen.
export function genereerKetting(deelnemers) {
  const n = deelnemers.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Bouw één gesloten ketting: positie i jaagt op positie (i+1) % n
  const doelwitten = new Array(n);
  for (let i = 0; i < n; i++) {
    doelwitten[indices[i]] = indices[(i + 1) % n];
  }

  // Veiligheidsnet tegen zelfkoppelingen (kan bij n >= 2 niet voorkomen, maar toch)
  if (doelwitten.some((d, i) => d === i)) {
    for (let i = 0; i < n; i++) {
      if (doelwitten[i] === i) {
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

// Voer een volledige herschommeling uit voor alle NOG ACTIEVE spelers.
// - schrijft de nieuwe doelwit-koppeling weg
// - reset de marshall-aanpassingstellers
// - plaatst een tijdlijnbericht (zonder de koppelingen te onthullen)
// - stuurt iedereen een neutrale WhatsApp-melding
// Retourneert { ok, aantalDeelnemers } of { ok:false, error, status }.
export async function voerHerschommel(supabase, { bron = 'handmatig' } = {}) {
  const { data: deelnemers, error } = await supabase
    .from('deelnemers')
    .select('*')
    .eq('status', 'actief')
    .order('nummer', { ascending: true });

  if (error) return { ok: false, error: error.message, status: 500 };
  if (!deelnemers || deelnemers.length < 2) {
    return { ok: false, error: 'Minimum 2 actieve deelnemers nodig om te herschommelen', status: 400 };
  }

  const doelwit_indices = genereerKetting(deelnemers);
  if (!doelwit_indices) {
    return { ok: false, error: 'Herschommelen mislukt', status: 500 };
  }

  // Nieuwe koppeling opslaan
  for (let i = 0; i < deelnemers.length; i++) {
    const schutter = deelnemers[i];
    const doelwit = deelnemers[doelwit_indices[i]];
    await supabase.from('deelnemers').update({ doelwit_id: doelwit.id }).eq('id', schutter.id);
  }

  // Aanpassingstellers van alle marshalls resetten — nieuwe ronde, nieuwe kansen
  const { data: alleMarshalls } = await supabase.from('marshalls').select('id');
  if (alleMarshalls?.length) {
    const ids = alleMarshalls.map((m) => m.id);
    await supabase.from('marshalls').update({ aanpassingen: 0 }).in('id', ids);
  }

  // Tijdlijnbericht — zonder de nieuwe koppelingen te onthullen
  const prefix = bron === 'gepland' ? '🔀 (gepland) ' : '🔀 ';
  await supabase.from('tijdlijn').insert({
    tekst: `${prefix}De doelwitten van alle ${deelnemers.length} overgebleven spelers zijn opnieuw geschud!`,
  });

  // WhatsApp naar alle nog actieve spelers — geen details, enkel dat er iets veranderd is
  const telefoons = deelnemers
    .map((d) => d.contact)
    .filter(Boolean)
    .map((tel) => {
      const schoon = tel.replace(/[^0-9]/g, '');
      if (schoon.startsWith('04')) return '+32' + schoon.substring(1);
      if (schoon.startsWith('32')) return '+' + schoon;
      return tel.startsWith('+') ? tel : null;
    })
    .filter(Boolean);

  if (telefoons.length > 0) {
    try {
      await stuurNaarLijst(telefoons, { '1': 'De doelwitten zijn herschud! Check je nieuwe doelwit in de app' });
    } catch (e) {
      console.error('Herschommel-WhatsApp mislukt:', e);
    }
  }

  // Web-push naar dezelfde groep (gratis, naast WhatsApp)
  try {
    await pushNaarActieveDeelnemers(supabase, {
      titel: '🔀 Doelwitten herschud',
      tekst: 'De doelwitten zijn opnieuw geschud! Check je nieuwe doelwit in de app.',
      url: '/mijn-doelwit',
      tag: `herschommel-${Date.now()}`,
    });
  } catch (e) {
    console.error('Herschommel-push mislukt:', e);
  }

  return { ok: true, aantalDeelnemers: deelnemers.length };
}
