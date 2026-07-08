// app/api/cron/route.js
// Vercel Cron Job — wordt automatisch aangeroepen op de startdatum
// Configureer in vercel.json

import { getSupabaseServer } from '../../../lib/supabase';
import { stuurStartBericht } from '../../../lib/whatsapp';

export async function GET(request) {
  // Vercel cron authenticatie
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  // Controleer of het spel net gestart is (binnen het laatste uur)
  const { data: stats } = await supabase.from('stats').select('*').eq('id', 1).single();
  const nu = new Date();
  const start = new Date(stats?.start_datum);
  const verschil = nu - start;

  // Enkel uitvoeren als we binnen 1 uur na de startdatum zitten
  if (verschil < 0 || verschil > 3600000) {
    return Response.json({ skipped: true, reden: 'Niet in het startvenster' });
  }

  // Controleer of startberichten al verstuurd zijn
  const { data: alVerstuurd } = await supabase
    .from('tijdlijn')
    .select('id')
    .ilike('tekst', '%gestart%')
    .limit(1);

  if (alVerstuurd?.length > 0) {
    return Response.json({ skipped: true, reden: 'Startberichten al verstuurd' });
  }

  // Haal alle actieve deelnemers op
  const { data: deelnemers } = await supabase
    .from('deelnemers')
    .select('voornaam, familienaam, contact, toegangscode, killcode')
    .eq('status', 'actief');

  let verzonden = 0, mislukt = 0;
  for (const d of (deelnemers || [])) {
    if (!d.contact) { mislukt++; continue; }
    const res = await stuurStartBericht(
      d.contact,
      `${d.voornaam} ${d.familienaam}`,
      d.toegangscode,
      d.killcode
    );
    if (res.success) verzonden++;
    else mislukt++;
  }

  // Stuur ook bericht naar marshalls
  const { data: marshalls } = await supabase
    .from('marshalls')
    .select('telefoon, naam')
    .not('telefoon', 'is', null);

  let marshallVerzonden = 0;
  for (const m of (marshalls || [])) {
    const { stuurNaarLijst } = await import('../../../lib/whatsapp.js');
    const res = await stuurNaarLijst([m.telefoon], {
      "1": `Spel gestart! Als marshall van Summer Gotcha 2026 ben je nu actief. Beheer via: ${process.env.NEXT_PUBLIC_APP_URL || 'summer-gotcha26.vercel.app'}/admin`
    });
    if (res.verzonden > 0) marshallVerzonden++;
  }

  // Registreer in tijdlijn
  await supabase.from('tijdlijn').insert({
    tekst: '🚀 Het spel is officieel gestart! Startberichten verstuurd.'
  });

  return Response.json({ success: true, verzonden, mislukt, marshallVerzonden });
}
