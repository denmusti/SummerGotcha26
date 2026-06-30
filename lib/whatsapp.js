// lib/whatsapp.js
// WhatsApp Business API via Meta (Cloud API)

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

async function stuurBericht(telefoon, template, params = []) {
  // Zorg dat telefoonnummer in E.164 formaat staat (bv. +32471112233)
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

// Stuur kill-bericht naar alle deelnemers (anoniem)
// Template: gotcha_kill_publiek
// Body: "💀 Een nieuwe kill! Er zijn nog {{1}} spelers actief."
export async function stuurKillPubliek(telefoons, aantalLevenden) {
  const resultaten = await Promise.allSettled(
    telefoons.map(tel => stuurBericht(tel, 'gotcha_kill_publiek', [aantalLevenden]))
  );
  const mislukt = resultaten.filter(r => r.status === 'rejected' || !r.value?.success).length;
  return { verzonden: telefoons.length - mislukt, mislukt };
}

// Stuur kill-bericht naar marshall (met alle info)
// Template: gotcha_kill_marshall
// Body: "🎯 Kill geregistreerd!\nSlachtoffer: {{1}}\nSchutter: {{2}}\nNieuw doelwit schutter: {{3}}\nTijdstip: {{4}}"
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
