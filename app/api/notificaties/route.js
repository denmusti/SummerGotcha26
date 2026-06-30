// app/api/notificaties/route.js
import { getSupabaseServer } from '../../../lib/supabase';
import { stuurKillPubliek, stuurKillMarshall, stuurTestBericht, stuurStartBericht } from '../../../lib/whatsapp';

const normaliseer = (tel) => {
  if (!tel) return null;
  const schoon = tel.replace(/[^0-9]/g, '');
  if (schoon.startsWith('04')) return '+32' + schoon.substring(1);
  if (schoon.startsWith('32')) return '+' + schoon;
  if (tel.startsWith('+')) return tel;
  return null;
};

export async function POST(request) {
  try {
    const body = await request.json();

    if (!process.env.WA_PHONE_NUMBER_ID || !process.env.WA_ACCESS_TOKEN) {
      return Response.json({ skipped: true, reden: 'WhatsApp niet geconfigureerd' });
    }

    const supabase = getSupabaseServer();
    const { data: stats } = await supabase.from('stats').select('*').eq('id', 1).single();
    const marshallTels = (stats?.marshall_telefoons || []).map(normaliseer).filter(Boolean);

    // ── Testbericht — enkel naar marshalls ──────────────────
    if (body.testBericht !== undefined) {
      if (marshallTels.length === 0) {
        return Response.json({ skipped: true, reden: 'Geen marshall nummers ingesteld' });
      }
      const result = await stuurTestBericht(marshallTels);
      return Response.json({ success: true, marshalls: result, deelnemers: { verzonden: 0, mislukt: 0 } });
    }

    // ── Startbericht — naar alle deelnemers individueel ─────
    if (body.actie === 'start') {
      const { data: deelnemers } = await supabase
        .from('deelnemers')
        .select('voornaam, familienaam, contact, toegangscode, killcode')
        .eq('status', 'actief');

      let verzonden = 0, mislukt = 0;
      for (const d of (deelnemers || [])) {
        const tel = normaliseer(d.contact);
        if (!tel) { mislukt++; continue; }
        const res = await stuurStartBericht(
          tel,
          `${d.voornaam} ${d.familienaam}`,
          d.toegangscode,
          d.killcode
        );
        if (res.success) verzonden++;
        else mislukt++;
      }
      return Response.json({ success: true, deelnemers: { verzonden, mislukt } });
    }

    // ── Kill bericht ─────────────────────────────────────────
    const { schutter, slachtoffer, nieuwDoelwit, tijdstip } = body;

    const { data: deelnemers } = await supabase
      .from('deelnemers').select('contact').eq('status', 'actief');

    const deelTels = (deelnemers || [])
      .map(d => normaliseer(d.contact)).filter(Boolean);

    const resultaten = await Promise.all([
      deelTels.length > 0
        ? stuurKillPubliek(deelTels, stats?.levenden || 0)
        : Promise.resolve({ verzonden: 0, mislukt: 0 }),
      marshallTels.length > 0
        ? stuurKillMarshall(marshallTels, slachtoffer, schutter, nieuwDoelwit, tijdstip)
        : Promise.resolve({ verzonden: 0, mislukt: 0 })
    ]);

    return Response.json({ success: true, deelnemers: resultaten[0], marshalls: resultaten[1] });

  } catch (e) {
    console.error('Notificatie fout:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
