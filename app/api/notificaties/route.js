// app/api/notificaties/route.js
// Stuurt spelmeldingen via TWEE kanalen naast elkaar:
//   1. WhatsApp (Twilio)      — lib/whatsapp.js
//   2. Web-push (gratis)      — lib/push.js
// Elk kanaal werkt onafhankelijk: als Twilio niet geconfigureerd is,
// worden de push-meldingen alsnog verstuurd (en omgekeerd).
import { getSupabaseServer } from '../../../lib/supabase';
import { stuurKillPubliek, stuurKillMarshall, stuurStartBericht, stuurNaarLijst } from '../../../lib/whatsapp';
import {
  pushNaarAlleDeelnemers,
  pushNaarEenDeelnemer,
  pushNaarMarshalls,
} from '../../../lib/push';

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
    const twilioAan = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
    );

    const supabase = getSupabaseServer();

    // Marshall-telefoons (voor WhatsApp)
    const { data: marshallsData } = await supabase
      .from('marshalls')
      .select('telefoon')
      .not('telefoon', 'is', null);
    const marshallTels = (marshallsData || [])
      .map((m) => normaliseer(m.telefoon))
      .filter(Boolean);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'summer-gotcha26.vercel.app';

    // ── Testberichten — altijd enkel naar marshalls ──────────
    if (body.testBericht !== undefined) {
      const testType = body.testType || 'kill_marshall';
      const teksten = {
        kill_publiek: '[TEST] Er is een nieuwe kill! Nog 12 spelers actief',
        kill_marshall: '[TEST] Kill! Jan Janssen uitgeschakeld door Marie Peeters. Nieuw doelwit: Luc De Smedt. Tijdstip: 12 juli om 14:30',
        start: `[TEST] Start! Welkom Jan Janssen. Code: test1234 - Killcode: ABCD12 - App: ${appUrl}/mijn-doelwit`,
        test: '[TEST] Testbericht - integratie werkt correct!',
      };
      const tekst = teksten[testType] || teksten.test;

      let wa = { verzonden: 0, mislukt: 0 };
      if (twilioAan && marshallTels.length > 0) {
        wa = await stuurNaarLijst(marshallTels, { '1': tekst });
      }
      const push = await pushNaarMarshalls(supabase, {
        titel: 'Summer Gotcha 2026 — test',
        tekst,
        url: '/admin',
        tag: 'test',
      });

      return Response.json({
        success: true,
        marshalls: wa,
        deelnemers: { verzonden: 0, mislukt: 0 },
        push,
      });
    }

    // ── Startbericht naar één deelnemer ─────────────────────
    if (body.actie === 'startEen') {
      const { data: d } = await supabase
        .from('deelnemers')
        .select('id, voornaam, familienaam, contact, toegangscode, killcode')
        .eq('id', body.deelnemerId)
        .single();

      if (!d) return Response.json({ skipped: true, reden: 'Deelnemer niet gevonden' });

      let wa = { success: false, error: 'geen telefoonnummer' };
      const tel = normaliseer(d.contact);
      if (twilioAan && tel) {
        wa = await stuurStartBericht(tel, `${d.voornaam} ${d.familienaam}`, d.toegangscode, d.killcode);
      }
      const push = await pushNaarEenDeelnemer(supabase, d.id, {
        titel: 'Summer Gotcha 2026',
        tekst: `Welkom ${d.voornaam}! Open de app voor je toegangscode en je doelwit.`,
        url: '/mijn-doelwit',
        tag: 'start',
      });

      return Response.json({ success: wa.success || push.verzonden > 0, error: wa.error, push });
    }

    // ── Startbericht — naar alle actieve deelnemers ─────────
    if (body.actie === 'start') {
      const { data: deelnemers } = await supabase
        .from('deelnemers')
        .select('id, voornaam, familienaam, contact, toegangscode, killcode')
        .eq('status', 'actief');

      let verzonden = 0, mislukt = 0;
      let pushVerzonden = 0;
      for (const d of deelnemers || []) {
        const tel = normaliseer(d.contact);
        if (twilioAan && tel) {
          const res = await stuurStartBericht(tel, `${d.voornaam} ${d.familienaam}`, d.toegangscode, d.killcode);
          res.success ? verzonden++ : mislukt++;
        } else if (twilioAan) {
          mislukt++;
        }
        const p = await pushNaarEenDeelnemer(supabase, d.id, {
          titel: 'Summer Gotcha 2026',
          tekst: `Welkom ${d.voornaam}! Het spel is gestart — open de app voor je doelwit.`,
          url: '/mijn-doelwit',
          tag: 'start',
        });
        pushVerzonden += p.verzonden;
      }

      // Marshalls
      let marshallVerzonden = 0;
      if (twilioAan) {
        for (const m of marshallsData || []) {
          const tel = normaliseer(m.telefoon);
          if (!tel) continue;
          const res = await stuurNaarLijst([tel], {
            '1': `Het spel is gestart! ${verzonden} deelnemers ontvingen hun startbericht. Beheer via: ${appUrl}/admin`,
          });
          if (res.verzonden > 0) marshallVerzonden++;
        }
      }
      const marshallPush = await pushNaarMarshalls(supabase, {
        titel: 'Summer Gotcha 2026',
        tekst: 'Het spel is gestart! Beheer via de admin-pagina.',
        url: '/admin',
        tag: 'start',
      });

      return Response.json({
        success: true,
        deelnemers: { verzonden, mislukt },
        marshalls: { verzonden: marshallVerzonden },
        push: { deelnemers: pushVerzonden, marshalls: marshallPush.verzonden },
      });
    }

    // ── Kill bericht ─────────────────────────────────────────
    const { schutter, slachtoffer, nieuwDoelwit, tijdstip, aantalLevenden } = body;

    // WhatsApp: kill-berichten gaan naar ALLE deelnemers, ook geëlimineerde
    const { data: deelnemers } = await supabase.from('deelnemers').select('contact');
    const deelTels = (deelnemers || []).map((d) => normaliseer(d.contact)).filter(Boolean);

    let levendenAantal = aantalLevenden;
    if (levendenAantal === undefined) {
      const { data: levendeData } = await supabase.from('deelnemers').select('id').eq('status', 'actief');
      levendenAantal = levendeData?.length || 0;
    }

    const tijd = tijdstip
      ? new Date(tijdstip).toLocaleString('nl-BE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : '';

    const [waPubliek, waMarshall, pushPubliek, pushMarshall] = await Promise.all([
      twilioAan && deelTels.length > 0
        ? stuurKillPubliek(deelTels, levendenAantal, slachtoffer)
        : Promise.resolve({ verzonden: 0, mislukt: 0 }),
      twilioAan && marshallTels.length > 0
        ? stuurKillMarshall(marshallTels, slachtoffer, schutter, nieuwDoelwit, tijdstip)
        : Promise.resolve({ verzonden: 0, mislukt: 0 }),
      pushNaarAlleDeelnemers(supabase, {
        titel: '💀 Nieuwe kill!',
        tekst: `RIP ${slachtoffer}. Nog ${levendenAantal} spelers actief.`,
        url: '/',
        tag: 'kill',
      }),
      pushNaarMarshalls(supabase, {
        titel: '💀 Kill geregistreerd',
        tekst: `${slachtoffer} uitgeschakeld door ${schutter}. Nieuw doelwit: ${nieuwDoelwit}.${tijd ? ' ' + tijd : ''}`,
        url: '/admin',
        tag: 'kill-marshall',
      }),
    ]);

    return Response.json({
      success: true,
      deelnemers: waPubliek,
      marshalls: waMarshall,
      push: { deelnemers: pushPubliek.verzonden, marshalls: pushMarshall.verzonden },
    });
  } catch (e) {
    console.error('Notificatie fout:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
