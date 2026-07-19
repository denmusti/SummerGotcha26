// lib/whatsapp.js
// WhatsApp via Twilio met Content Template

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://summer-gotcha26.vercel.app';

function normaliseer(tel) {
  if (!tel) return null;
  const schoon = tel.replace(/[^0-9]/g, '');
  if (schoon.startsWith('04')) return '+32' + schoon.substring(1);
  if (schoon.startsWith('32')) return '+' + schoon;
  if (tel.startsWith('+')) return tel;
  return null;
}

async function stuurTwilioTemplate(naar, variabelen) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const vanNummer = process.env.TWILIO_WHATSAPP_FROM;
  const templateSid = process.env.TWILIO_TEMPLATE_SID;

  if (!accountSid || !authToken || !vanNummer || !templateSid) {
    return { success: false, error: 'Twilio niet volledig geconfigureerd' };
  }

  const genormaliseerd = normaliseer(naar);
  if (!genormaliseerd) return { success: false, error: `Ongeldig nummer: ${naar}` };

  const from = vanNummer.startsWith('whatsapp:') ? vanNummer : `whatsapp:${vanNummer}`;
  const to = `whatsapp:${genormaliseerd}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const body = new URLSearchParams({
    From: from,
    To: to,
    ContentSid: templateSid,
    ContentVariables: JSON.stringify(variabelen),
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('Twilio fout:', json);
      return { success: false, error: json.message || 'Twilio fout' };
    }
    return { success: true, sid: json.sid };
  } catch (e) {
    console.error('Twilio verbindingsfout:', e);
    return { success: false, error: e.message };
  }
}

export async function stuurNaarLijst(telefoons, variabelen) {
  const resultaten = await Promise.allSettled(
    telefoons.map(tel => stuurTwilioTemplate(tel, variabelen))
  );
  const mislukt = resultaten.filter(r => r.status === 'rejected' || !r.value?.success).length;
  return { verzonden: telefoons.length - mislukt, mislukt };
}

// Template body: "Summer Gotcha 2026: {{1}} - Volg het spel op summer-gotcha26.vercel.app"

// Kill bericht naar alle deelnemers
export async function stuurKillPubliek(telefoons, aantalLevenden, slachtoffer) {
  return stuurNaarLijst(telefoons, { "1": `Er is een nieuwe kill! RIP: ${slachtoffer}. Nog ${aantalLevenden} spelers actief` });
}

// Kill bericht naar marshalls (met alle info)
export async function stuurKillMarshall(telefoons, slachtoffer, schutter, nieuwDoelwit, tijdstip) {
  const tijd = new Date(tijdstip).toLocaleString('nl-BE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return stuurNaarLijst(telefoons, { "1": `Kill! ${slachtoffer} uitgeschakeld door ${schutter}. Nieuw doelwit: ${nieuwDoelwit}. Tijdstip: ${tijd}` });
}

// Testbericht
export async function stuurTestBericht(telefoons) {
  return stuurNaarLijst(telefoons, { "1": "Testbericht - WhatsApp integratie werkt correct!" });
}

// Startbericht naar individuele deelnemer
export async function stuurStartBericht(telefoon, naam, toegangscode, killcode) {
  return stuurTwilioTemplate(telefoon, { "1": `Welkom ${naam}! Jouw toegangscode: ${toegangscode} - Bekijk je doelwit op: ${APP_URL}/mijn-doelwit` });
}
