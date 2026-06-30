// lib/whatsapp.js
// WhatsApp Business API via Meta (Cloud API)

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://summer-gotcha26.vercel.app';

async function stuurBericht(telefoon, template, params = []) {
  const nummer = telefoon.replace(/[^0-9+]/g, '');
  if (!nummer || nummer.length < 8) return { success: false, error: 'Ongeldig nummer' };

  const body = {
    messaging_product: 'whatsapp',
    to: nummer,
    type: 'template',
    template: {
      name: template,
      language: { code: 'nl' },
      components: params.length > 0 ? [{
        type: 'body',
        parameters: params.map(p => ({ type: 'text', text: String(p) }))
      }] : []
    }
  };

  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`
      },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('WhatsApp fout:', json);
      return { success: false, error: json.error?.message || 'WhatsApp API fout' };
    }
    return { success: true };
  } catch (e) {
    console.error('WhatsApp verbindingsfout:', e);
    return { success: false, error: e.message };
  }
}

// Kill bericht naar alle deelnemers (anoniem)
// Template: gotcha_kill_publiek
// Body: "💀 Er is een nieuwe kill! Er zijn nog {{1}} spelers actief. Volg het spel op {{2}}"
export async function stuurKillPubliek(telefoons, aantalLevenden) {
  const resultaten = await Promise.allSettled(
    telefoons.map(tel => stuurBericht(tel, 'gotcha_kill_publiek', [aantalLevenden, APP_URL]))
  );
  const mislukt = resultaten.filter(r => r.status === 'rejected' || !r.value?.success).length;
  return { verzonden: telefoons.length - mislukt, mislukt };
}

// Kill bericht naar marshall (met alle info)
// Template: gotcha_kill_marshall
// Body: "🎯 Kill! Slachtoffer: {{1}} — Schutter: {{2}} — Nieuw doelwit schutter: {{3}} — Tijdstip: {{4}}"
export async function stuurKillMarshall(telefoons, slachtoffer, schutter, nieuwDoelwit, tijdstip) {
  const tijdFormatted = new Date(tijdstip).toLocaleString('nl-BE', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });
  const resultaten = await Promise.allSettled(
    telefoons.map(tel => stuurBericht(tel, 'gotcha_kill_marshall', [
      slachtoffer, schutter, nieuwDoelwit || 'onbekend', tijdFormatted
    ]))
  );
  const mislukt = resultaten.filter(r => r.status === 'rejected' || !r.value?.success).length;
  return { verzonden: telefoons.length - mislukt, mislukt };
}

// Testbericht enkel naar marshall(s)
// Template: gotcha_kill_marshall (hergebruiken met testdata)
export async function stuurTestBericht(telefoons) {
  const resultaten = await Promise.allSettled(
    telefoons.map(tel => stuurBericht(tel, 'gotcha_kill_marshall', [
      'Test Slachtoffer', 'Test Schutter', 'Test Doelwit',
      new Date().toLocaleString('nl-BE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    ]))
  );
  const mislukt = resultaten.filter(r => r.status === 'rejected' || !r.value?.success).length;
  return { verzonden: telefoons.length - mislukt, mislukt };
}

// Startbericht naar individuele deelnemer met zijn persoonlijke gegevens
// Template: gotcha_start_deelnemer
// Body: "🎯 Summer Gotcha 2026 is gestart!\nJouw toegangscode: {{1}}\nJouw killcode: {{2}}\nApp: {{3}}"
export async function stuurStartBericht(telefoon, naam, toegangscode, killcode) {
  return stuurBericht(telefoon, 'gotcha_start_deelnemer', [
    naam, toegangscode, killcode, `${APP_URL}/mijn-doelwit`
  ]);
}
