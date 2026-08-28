// app/api/cron/route.js
// Vercel Cron Job — draait dagelijks (zie vercel.json: "0 22 * * *" = middernacht Belgische tijd).
// Doet twee dingen, elk met eigen guard zodat dagelijks draaien onschadelijk is:
//   1. Startberichten versturen als het spel net gestart is
//   2. Een geplande herschommeling uitvoeren als het geplande tijdstip bereikt is

import { getSupabaseServer } from '../../../lib/supabase';
import { stuurStartBericht, stuurNaarLijst } from '../../../lib/whatsapp';
import { pushNaarEenDeelnemer, pushNaarMarshalls } from '../../../lib/push';
import { voerHerschommel } from '../../../lib/herschommel';

export async function GET(request) {
  // Vercel cron authenticatie
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const { data: stats } = await supabase.from('stats').select('*').eq('id', 1).single();
  const nu = new Date();

  const resultaat = {
    start: await verwerkStart(supabase, stats, nu),
    herschommel: await verwerkGeplandeHerschommel(supabase, stats, nu),
  };

  return Response.json(resultaat);
}

// ── 1. Startberichten ────────────────────────────────────────
async function verwerkStart(supabase, stats, nu) {
  const start = new Date(stats?.start_datum);
  const verschil = nu - start;

  // Enkel uitvoeren als we binnen 1 uur na de startdatum zitten
  if (verschil < 0 || verschil > 3600000) {
    return { skipped: true, reden: 'Niet in het startvenster' };
  }

  // Controleer of startberichten al verstuurd zijn
  const { data: alVerstuurd } = await supabase
    .from('tijdlijn')
    .select('id')
    .ilike('tekst', '%gestart%')
    .limit(1);

  if (alVerstuurd?.length > 0) {
    return { skipped: true, reden: 'Startberichten al verstuurd' };
  }

  // Haal alle actieve deelnemers op
  const { data: deelnemers } = await supabase
    .from('deelnemers')
    .select('id, voornaam, familienaam, contact, toegangscode, killcode')
    .eq('status', 'actief');

  let verzonden = 0, mislukt = 0;
  for (const d of (deelnemers || [])) {
    if (d.contact) {
      const res = await stuurStartBericht(
        d.contact,
        `${d.voornaam} ${d.familienaam}`,
        d.toegangscode,
        d.killcode
      );
      if (res.success) verzonden++;
      else mislukt++;
    } else {
      mislukt++;
    }
    // Web-push (gratis, naast WhatsApp)
    await pushNaarEenDeelnemer(supabase, d.id, {
      titel: 'Summer Gotcha 2026',
      tekst: `Welkom ${d.voornaam}! Het spel is gestart — open de app voor je doelwit.`,
      url: '/mijn-doelwit',
      tag: 'start',
    }).catch(() => {});
  }

  // Stuur ook bericht naar marshalls
  const { data: marshalls } = await supabase
    .from('marshalls')
    .select('telefoon, naam')
    .not('telefoon', 'is', null);

  let marshallVerzonden = 0;
  for (const m of (marshalls || [])) {
    const res = await stuurNaarLijst([m.telefoon], {
      "1": `Spel gestart! Als marshall van Summer Gotcha 2026 ben je nu actief. Beheer via: ${process.env.NEXT_PUBLIC_APP_URL || 'summer-gotcha26.vercel.app'}/admin`
    });
    if (res.verzonden > 0) marshallVerzonden++;
  }
  await pushNaarMarshalls(supabase, {
    titel: 'Summer Gotcha 2026',
    tekst: 'Het spel is gestart! Beheer via de admin-pagina.',
    url: '/admin',
    tag: 'start',
  }).catch(() => {});

  // Registreer in tijdlijn
  await supabase.from('tijdlijn').insert({
    tekst: '🚀 Het spel is officieel gestart! Startberichten verstuurd.'
  });

  return { success: true, verzonden, mislukt, marshallVerzonden };
}

// ── 2. Geplande herschommeling ───────────────────────────────
async function verwerkGeplandeHerschommel(supabase, stats, nu) {
  const gepland = stats?.herschommel_gepland_op ? new Date(stats.herschommel_gepland_op) : null;
  if (!gepland || isNaN(gepland.getTime())) {
    return { skipped: true, reden: 'Geen herschommeling gepland' };
  }
  // 5 min speling zodat een cron die net iets te vroeg afgaat een middernacht-planning niet een dag opschuift
  const GRACE_MS = 5 * 60 * 1000;
  if (nu.getTime() < gepland.getTime() - GRACE_MS) {
    return { skipped: true, reden: `Gepland voor ${gepland.toISOString()}` };
  }

  // Alleen tijdens een lopend spel
  const start = new Date(stats?.start_datum);
  const eind = new Date(stats?.eind_datum);
  if (nu < start || nu > eind) {
    // Buiten de speelperiode: plan gewoon opruimen, niets doen
    await supabase.from('stats').update({ herschommel_gepland_op: null }).eq('id', 1);
    return { skipped: true, reden: 'Buiten de speelperiode — planning gewist' };
  }

  const r = await voerHerschommel(supabase, { bron: 'gepland' });

  // Planning altijd wissen zodat ze niet opnieuw afgaat
  await supabase.from('stats').update({ herschommel_gepland_op: null, updated_at: new Date().toISOString() }).eq('id', 1);

  if (!r.ok) return { success: false, fout: r.error };
  return { success: true, aantalDeelnemers: r.aantalDeelnemers };
}
