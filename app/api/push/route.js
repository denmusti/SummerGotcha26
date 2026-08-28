// app/api/push/route.js
// Aan-/afmelden voor web-push meldingen. Draait NAAST de WhatsApp-notificaties.
import { getSupabaseServer } from '../../../lib/supabase';
import { vapidPublicKey, pushGeconfigureerd, stuurPushNaarAbonnementen } from '../../../lib/push';

// GET → publieke VAPID-sleutel voor de browser
export async function GET() {
  return Response.json({
    publicKey: vapidPublicKey(),
    geconfigureerd: pushGeconfigureerd(),
  });
}

async function bepaalEigenaar(supabase, body) {
  // Deelnemer via toegangscode
  if (body.toegangscode) {
    const { data: d } = await supabase
      .from('deelnemers')
      .select('id')
      .eq('toegangscode', String(body.toegangscode).toLowerCase().trim())
      .single();
    if (d) return { rol: 'deelnemer', deelnemer_id: d.id, marshall_id: null };
  }
  // Marshall via wachtwoord (of admin-wachtwoord uit stats → koppel aan admin-marshall indien mogelijk)
  if (body.wachtwoord) {
    const { data: m } = await supabase
      .from('marshalls')
      .select('id')
      .eq('wachtwoord', body.wachtwoord)
      .single();
    if (m) return { rol: 'marshall', marshall_id: m.id, deelnemer_id: null };
  }
  return null;
}

export async function POST(request) {
  const supabase = getSupabaseServer();
  const body = await request.json().catch(() => ({}));
  const { actie } = body;

  // ── Afmelden: enkel de endpoint nodig ──────────────────
  if (actie === 'afmelden') {
    if (!body.endpoint) return Response.json({ error: 'Geen endpoint' }, { status: 400 });
    await supabase.from('push_abonnementen').delete().eq('endpoint', body.endpoint);
    return Response.json({ success: true });
  }

  const eigenaar = await bepaalEigenaar(supabase, body);
  if (!eigenaar) return Response.json({ error: 'Ongeldige code' }, { status: 401 });

  // ── Aanmelden / bijwerken ──────────────────────────────
  if (actie === 'aanmelden') {
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return Response.json({ error: 'Ongeldige subscription' }, { status: 400 });
    }
    const { error } = await supabase.from('push_abonnementen').upsert(
      {
        endpoint: sub.endpoint,
        keys: sub.keys,
        rol: eigenaar.rol,
        deelnemer_id: eigenaar.deelnemer_id,
        marshall_id: eigenaar.marshall_id,
        user_agent: body.userAgent ? String(body.userAgent).slice(0, 300) : null,
        laatst_gebruikt_op: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  // ── Testmelding naar de eigen abonnementen ─────────────
  if (actie === 'test') {
    let q = supabase.from('push_abonnementen').select('id, endpoint, keys');
    q = eigenaar.rol === 'deelnemer'
      ? q.eq('deelnemer_id', eigenaar.deelnemer_id)
      : q.eq('marshall_id', eigenaar.marshall_id);
    const { data: abos } = await q;
    if (!abos?.length) return Response.json({ error: 'Nog geen toestel aangemeld' }, { status: 404 });
    const r = await stuurPushNaarAbonnementen(supabase, abos, {
      titel: 'Summer Gotcha 2026',
      tekst: '✅ Testmelding — meldingen werken op dit toestel!',
      url: eigenaar.rol === 'marshall' ? '/admin' : '/mijn-doelwit',
      tag: 'test',
    });
    return Response.json({ success: true, ...r });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
