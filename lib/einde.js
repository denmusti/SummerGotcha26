// lib/einde.js
// Eindbericht van het spel — gedeeld door /api/notificaties (actie 'einde'),
// de cron job (einddatum voorbij) en de eliminatie-flow (laatste speler over).

import { stuurNaarLijst } from './whatsapp';
import { pushNaarAlleDeelnemers, pushNaarMarshalls } from './push';

const normaliseer = (tel) => {
  if (!tel) return null;
  const schoon = tel.replace(/[^0-9]/g, '');
  if (schoon.startsWith('04')) return '+32' + schoon.substring(1);
  if (schoon.startsWith('32')) return '+' + schoon;
  if (tel.startsWith('+')) return tel;
  return null;
};

// Zelfde winnaar-logica als het publieke winnaarsoverzicht:
// nog actieve spelers, meeste kills eerst, bij gelijkstand vroegste eerste kill.
export async function bepaalWinnaar(supabase) {
  const { data: deelnemers } = await supabase
    .from('deelnemers')
    .select('id, voornaam, familienaam, foto_url, status');
  const { data: kills } = await supabase
    .from('kills')
    .select('schutter_id, tijdstip')
    .order('tijdstip', { ascending: true });

  const teller = {};
  const eerste = {};
  for (const k of kills || []) {
    teller[k.schutter_id] = (teller[k.schutter_id] || 0) + 1;
    if (!eerste[k.schutter_id]) eerste[k.schutter_id] = k.tijdstip;
  }

  const overlevenden = (deelnemers || [])
    .filter((d) => d.status === 'actief')
    .map((d) => ({
      naam: `${d.voornaam} ${d.familienaam}`,
      foto_url: d.foto_url || null,
      kills: teller[d.id] || 0,
      eerste: eerste[d.id] || null,
    }))
    .sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return new Date(a.eerste || 8e15) - new Date(b.eerste || 8e15);
    });

  return { winnaar: overlevenden[0] || null, aantalOverlevenden: overlevenden.length };
}

// kanaal: 'beide' | 'push' | 'whatsapp' | 'wa-rest'
export async function verstuurEindeBericht(supabase, { kanaal = 'beide', forceer = false } = {}) {
  const { data: stats, error: statsFout } = await supabase
    .from('stats')
    .select('einde_bericht_verstuurd_op')
    .eq('id', 1)
    .single();

  // Kolom bestaat nog niet → feature blijft slapend tot schema_update9 gedraaid is
  if (statsFout) return { skipped: true, reden: 'schema_update9 nog niet gedraaid' };

  if (stats?.einde_bericht_verstuurd_op && !forceer) {
    return { skipped: true, reden: 'al verstuurd', verstuurdOp: stats.einde_bericht_verstuurd_op };
  }
  const eersteKeer = !stats?.einde_bericht_verstuurd_op;

  const { winnaar, aantalOverlevenden } = await bepaalWinnaar(supabase);
  if (!winnaar) return { skipped: true, reden: 'geen overlevende gevonden' };

  const anderen = aantalOverlevenden - 1;
  const extra = anderen > 0
    ? ` — samen met ${anderen} andere overlevende${anderen === 1 ? '' : 'n'} die het einde haalde${anderen === 1 ? '' : 'n'}.`
    : '';
  const tekst = `🏆 ${winnaar.naam} wint Summer Gotcha 2026! ${winnaar.kills} eliminatie${winnaar.kills === 1 ? '' : 's'}.${extra}`;

  const twilioAan = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );

  const { data: deelnemers } = await supabase.from('deelnemers').select('id, contact');

  let pushDeelnemerIds = new Set();
  if (kanaal === 'wa-rest') {
    const { data: subs } = await supabase
      .from('push_abonnementen')
      .select('deelnemer_id')
      .eq('rol', 'deelnemer');
    pushDeelnemerIds = new Set((subs || []).map((s) => s.deelnemer_id));
  }

  const deelTels = (deelnemers || [])
    .filter((d) => kanaal !== 'wa-rest' || !pushDeelnemerIds.has(d.id))
    .map((d) => normaliseer(d.contact))
    .filter(Boolean);

  const { data: marshalls } = await supabase
    .from('marshalls')
    .select('telefoon')
    .not('telefoon', 'is', null);
  const marshallTels = (marshalls || []).map((m) => normaliseer(m.telefoon)).filter(Boolean);

  const stuurWa = kanaal !== 'push' && twilioAan;
  const stuurPush = kanaal !== 'whatsapp';
  const t = Date.now();

  const [waDeel, waMars, pushDeel, pushMars] = await Promise.all([
    stuurWa && deelTels.length ? stuurNaarLijst(deelTels, { '1': tekst }) : Promise.resolve({ verzonden: 0, mislukt: 0 }),
    stuurWa && marshallTels.length ? stuurNaarLijst(marshallTels, { '1': tekst }) : Promise.resolve({ verzonden: 0, mislukt: 0 }),
    stuurPush ? pushNaarAlleDeelnemers(supabase, { titel: '🏆 Summer Gotcha 2026', tekst, url: '/', tag: `einde-${t}` }) : Promise.resolve({ verzonden: 0 }),
    stuurPush ? pushNaarMarshalls(supabase, { titel: '🏆 Summer Gotcha 2026', tekst, url: '/', tag: `einde-m-${t}` }) : Promise.resolve({ verzonden: 0 }),
  ]);

  if (eersteKeer) {
    await supabase.from('tijdlijn').insert({
      tekst: `🏆 ${winnaar.naam} wint Summer Gotcha 2026 met ${winnaar.kills} eliminatie${winnaar.kills === 1 ? '' : 's'}!`,
      foto_url: winnaar.foto_url,
    });
  }
  await supabase.from('stats').update({ einde_bericht_verstuurd_op: new Date().toISOString() }).eq('id', 1);

  return {
    success: true,
    kanaal,
    winnaar: winnaar.naam,
    deelnemers: waDeel,
    marshalls: waMars,
    push: { deelnemers: pushDeel.verzonden, marshalls: pushMars.verzonden },
  };
}
