// app/api/notificaties/route.js
// Wordt aangeroepen vanuit de deelnemers API na elke kill

import { getSupabaseServer } from '../../../lib/supabase';
import { stuurKillPubliek, stuurKillMarshall } from '../../../lib/whatsapp';

export async function POST(request) {
  try {
    const body = await request.json();
    const { schutter, slachtoffer, nieuwDoelwit, tijdstip } = body;

    // Controleer of WhatsApp geconfigureerd is
    if (!process.env.WA_PHONE_NUMBER_ID || !process.env.WA_ACCESS_TOKEN) {
      return Response.json({ skipped: true, reden: 'WhatsApp niet geconfigureerd' });
    }

    const supabase = getSupabaseServer();

    // Haal alle actieve deelnemers op met telefoonnummer
    const { data: deelnemers } = await supabase
      .from('deelnemers')
      .select('contact, status')
      .eq('status', 'actief');

    // Haal marshall nummers op uit stats
    const { data: stats } = await supabase
      .from('stats')
      .select('marshall_telefoons, levenden')
      .eq('id', 1)
      .single();

    const deelnemersTelefoons = (deelnemers || [])
      .map(d => d.contact)
      .filter(c => c && (c.includes('+') || c.startsWith('04')));

    const marshallTelefoons = stats?.marshall_telefoons || [];

    // Converteer Belgische nummers naar E.164
    const normaliseer = (tel) => {
      const schoon = tel.replace(/[^0-9]/g, '');
      if (schoon.startsWith('04')) return '+32' + schoon.substring(1);
      if (schoon.startsWith('32')) return '+' + schoon;
      return tel;
    };

    const deelTels = deelnemersTelefoons.map(normaliseer);
    const marshallTels = marshallTelefoons.map(normaliseer);

    const resultaten = await Promise.all([
      deelTels.length > 0
        ? stuurKillPubliek(deelTels, stats?.levenden || 0)
        : Promise.resolve({ verzonden: 0, mislukt: 0 }),
      marshallTels.length > 0
        ? stuurKillMarshall(marshallTels, slachtoffer, schutter, nieuwDoelwit, tijdstip)
        : Promise.resolve({ verzonden: 0, mislukt: 0 })
    ]);

    return Response.json({
      success: true,
      deelnemers: resultaten[0],
      marshalls: resultaten[1]
    });
  } catch (e) {
    console.error('Notificatie fout:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
