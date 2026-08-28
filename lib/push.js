// lib/push.js
// Web-push (gratis browsermeldingen) — draait NAAST lib/whatsapp.js.
// Server-side: enkel gebruiken in API routes / cron.

import webpush from 'web-push';

let geconfigureerd = false;

function configureer() {
  if (geconfigureerd) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@summer-gotcha26.vercel.app',
    pub,
    priv
  );
  geconfigureerd = true;
  return true;
}

export function pushGeconfigureerd() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function vapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

// Kern: stuur één payload naar een lijst abonnement-rijen ({ id, endpoint, keys }).
// Verlopen abonnementen (404/410) worden automatisch opgeruimd.
export async function stuurPushNaarAbonnementen(supabase, abonnementen, payload) {
  if (!configureer() || !abonnementen || abonnementen.length === 0) {
    return { verzonden: 0, mislukt: 0, opgeruimd: 0 };
  }

  const body = JSON.stringify({
    titel: payload.titel || 'Summer Gotcha 2026',
    tekst: payload.tekst || '',
    url: payload.url || '/mijn-doelwit',
    tag: payload.tag || null,
  });
  const opties = { TTL: 60 * 60 * 24, urgency: payload.urgency || 'high' };

  let verzonden = 0;
  let mislukt = 0;
  const teVerwijderen = [];

  await Promise.all(
    abonnementen.map(async (ab) => {
      try {
        await webpush.sendNotification({ endpoint: ab.endpoint, keys: ab.keys }, body, opties);
        verzonden++;
      } catch (e) {
        mislukt++;
        if (e.statusCode === 404 || e.statusCode === 410) teVerwijderen.push(ab.id);
        else console.error('Push mislukt:', e.statusCode, e.body || e.message);
      }
    })
  );

  if (teVerwijderen.length && supabase) {
    await supabase.from('push_abonnementen').delete().in('id', teVerwijderen);
  }
  if (verzonden && supabase) {
    const ids = abonnementen.map((a) => a.id).filter((id) => !teVerwijderen.includes(id));
    if (ids.length) {
      await supabase
        .from('push_abonnementen')
        .update({ laatst_gebruikt_op: new Date().toISOString() })
        .in('id', ids);
    }
  }

  return { verzonden, mislukt, opgeruimd: teVerwijderen.length };
}

// ── Doelgroep-helpers ───────────────────────────────────────

async function haalAbonnementen(supabase, filter) {
  let q = supabase.from('push_abonnementen').select('id, endpoint, keys, rol, deelnemer_id, marshall_id');
  if (filter?.rol) q = q.eq('rol', filter.rol);
  if (filter?.deelnemer_id) q = q.eq('deelnemer_id', filter.deelnemer_id);
  if (filter?.marshall_id) q = q.eq('marshall_id', filter.marshall_id);
  const { data } = await q;
  return data || [];
}

// Alle deelnemers — ook geëlimineerde (zoals de publieke kill-broadcast via WhatsApp).
export async function pushNaarAlleDeelnemers(supabase, payload) {
  const abos = await haalAbonnementen(supabase, { rol: 'deelnemer' });
  return stuurPushNaarAbonnementen(supabase, abos, payload);
}

// Enkel nog actieve deelnemers (bv. herschommeling).
export async function pushNaarActieveDeelnemers(supabase, payload) {
  const abos = await haalAbonnementen(supabase, { rol: 'deelnemer' });
  if (abos.length === 0) return { verzonden: 0, mislukt: 0, opgeruimd: 0 };
  const ids = [...new Set(abos.map((a) => a.deelnemer_id))];
  const { data: actief } = await supabase
    .from('deelnemers')
    .select('id')
    .in('id', ids)
    .eq('status', 'actief');
  const actiefIds = new Set((actief || []).map((d) => d.id));
  return stuurPushNaarAbonnementen(
    supabase,
    abos.filter((a) => actiefIds.has(a.deelnemer_id)),
    payload
  );
}

export async function pushNaarEenDeelnemer(supabase, deelnemerId, payload) {
  const abos = await haalAbonnementen(supabase, { rol: 'deelnemer', deelnemer_id: deelnemerId });
  return stuurPushNaarAbonnementen(supabase, abos, payload);
}

export async function pushNaarMarshalls(supabase, payload) {
  const abos = await haalAbonnementen(supabase, { rol: 'marshall' });
  return stuurPushNaarAbonnementen(supabase, abos, payload);
}

export async function pushNaarEenMarshall(supabase, marshallId, payload) {
  const abos = await haalAbonnementen(supabase, { rol: 'marshall', marshall_id: marshallId });
  return stuurPushNaarAbonnementen(supabase, abos, payload);
}
