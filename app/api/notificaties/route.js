// app/api/notificaties/route.js
import { getSupabaseServer } from '../../../lib/supabase';
import { stuurKillPubliek, stuurKillMarshall, stuurTestBericht, stuurStartBericht, stuurNaarLijst } from '../../../lib/whatsapp';

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

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
      return Response.json({ skipped: true, reden: 'WhatsApp niet geconfigureerd' });
    }

    const supabase = getSupabaseServer();
    const { data: stats } = await supabase.from('stats').select('*').eq('id', 1).single();

    // Haal marshall telefoons uit marshalls tabel
    const { data: marshallsData } = await supabase
      .from('marshalls')
      .select('telefoon')
      .not('telefoon', 'is', null);
    const marshallTels = (marshallsData || [])
      .map(m => normaliseer(m.telefoon))
      .filter(Boolean);

    // ── Testberichten — altijd enkel naar marshalls ──────────
    if (body.testBericht !== undefined) {
      if (marshallTels.length === 0) {
        return Response.json({ skipped: true, reden: 'Geen marshall telefoonnummers ingesteld bij marshalls' });
      }

      const testType = body.testType || 'kill_marshall';
      let result;

      if (testType === 'kill_publiek') {
        // Simuleer kill bericht zoals deelnemers het zien — maar stuur enkel naar marshalls
        result = await stuurNaarLijst(marshallTels, { "1": `[TEST] Er is een nieuwe kill! Nog 12 spelers actief` });
      } else if (testType === 'kill_marshall') {
        // Simuleer kill bericht zoals marshalls het zien
        result = await stuurNaarLijst(marshallTels, { "1": `[TEST] Kill! Jan Janssen uitgeschakeld door Marie Peeters. Nieuw doelwit: Luc De Smedt. Tijdstip: 12 juli om 14:30` });
      } else if (testType === 'start') {
        // Simuleer startbericht zoals deelnemers het zien — maar stuur enkel naar marshalls
        result = await stuurNaarLijst(marshallTels, { "1": `[TEST] Start! Welkom Jan Janssen. Code: test1234 - Killcode: ABCD12 - App: ${process.env.NEXT_PUBLIC_APP_URL || 'summer-gotcha26.vercel.app'}/mijn-doelwit` });
      } else {
        result = await stuurTestBericht(marshallTels);
      }

      return Response.json({ success: true, marshalls: result, deelnemers: { verzonden: 0, mislukt: 0 } });
    }

    // ── Startbericht naar één deelnemer ─────────────────────
    if (body.actie === 'startEen') {
      const { data: d } = await supabase
        .from('deelnemers')
        .select('voornaam, familienaam, contact, toegangscode, killcode')
        .eq('id', body.deelnemerId)
        .single();

      if (!d || !d.contact) {
        return Response.json({ skipped: true, reden: 'Deelnemer niet gevonden of geen telefoonnummer' });
      }

      const tel = normaliseer(d.contact);
      if (!tel) return Response.json({ skipped: true, reden: 'Ongeldig telefoonnummer' });

      const res = await stuurStartBericht(tel, `${d.voornaam} ${d.familienaam}`, d.toegangscode, d.killcode);
      return Response.json({ success: res.success, error: res.error });
    }

    // ── Startbericht naar één deelnemer ─────────────────────
    if (body.actie === 'startEen') {
      const { data: d } = await supabase
        .from('deelnemers')
        .select('voornaam, familienaam, contact, toegangscode, killcode')
        .eq('id', body.deelnemerId)
        .single();

      if (!d || !d.contact) {
        return Response.json({ skipped: true, reden: 'Deelnemer niet gevonden of geen telefoonnummer' });
      }

      const tel = normaliseer(d.contact);
      if (!tel) return Response.json({ skipped: true, reden: 'Ongeldig telefoonnummer' });

      const res = await stuurStartBericht(tel, `${d.voornaam} ${d.familienaam}`, d.toegangscode, d.killcode);
      return Response.json({ success: res.success, error: res.error });
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
      // Stuur ook bericht naar marshalls
      let marshallVerzonden = 0;
      for (const m of (marshallsData || [])) {
        const tel = normaliseer(m.telefoon);
        if (!tel) continue;
        const res = await stuurNaarLijst([tel], {
          "1": `Het spel is gestart! ${verzonden} deelnemers ontvingen hun startbericht. Beheer via: ${process.env.NEXT_PUBLIC_APP_URL || 'summer-gotcha26.vercel.app'}/admin`
        });
        if (res.verzonden > 0) marshallVerzonden++;
      }

      return Response.json({ success: true, deelnemers: { verzonden, mislukt }, marshalls: { verzonden: marshallVerzonden } });
    }

    // ── Kill bericht ─────────────────────────────────────────
    const { schutter, slachtoffer, nieuwDoelwit, tijdstip } = body;

    // Kill berichten gaan naar ALLE deelnemers, ook geëlimineerde
    const { data: deelnemers } = await supabase
      .from('deelnemers').select('contact');

    const deelTels = (deelnemers || [])
      .map(d => normaliseer(d.contact)).filter(Boolean);

    const resultaten = await Promise.all([
      deelTels.length > 0
        ? stuurKillPubliek(deelTels, stats?.levenden || 0, slachtoffer)
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
