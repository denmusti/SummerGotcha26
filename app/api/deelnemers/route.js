// app/api/deelnemers/route.js
import { getSupabaseServer, genereerKillcode } from '../../../lib/supabase';

async function checkWachtwoord(supabase, wachtwoord) {
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  return data?.wachtwoord === wachtwoord;
}

function genereerToegangsCode(naam) {
  const basis = naam.toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${basis}${random}`;
}

async function updateStats(supabase) {
  const { data: alle } = await supabase.from('deelnemers').select('id');
  const { data: levenden } = await supabase.from('deelnemers').select('id').eq('status', 'actief');
  await supabase.from('stats').update({
    totaal_deelnemers: alle?.length || 0,
    levenden: levenden?.length || 0,
    updated_at: new Date().toISOString()
  }).eq('id', 1);
}

export async function GET(request) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(request.url);
  const wachtwoord = searchParams.get('wachtwoord');

  const { data: stats } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  if (!wachtwoord || wachtwoord !== stats?.wachtwoord) {
    return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('deelnemers')
    .select('*, doelwit:doelwit_id(id, nummer, voornaam, familienaam, adres, foto_url)')
    .order('nummer', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const supabase = getSupabaseServer();
  const body = await request.json();

  if (!await checkWachtwoord(supabase, body.wachtwoord)) {
    return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
  }

  const { actie } = body;

  // ── Deelnemer toevoegen ──────────────────────────────
  if (actie === 'toevoegen') {
    const { voornaam, familienaam, adres, foto_url, contact, notitie } = body;

    const { data: bestaande } = await supabase
      .from('deelnemers').select('nummer').order('nummer', { ascending: false }).limit(1);
    const nummer = bestaande?.length > 0 ? (bestaande[0].nummer + 1) : 1;

    // Unieke toegangscode
    let toegangscode;
    let uniek = false;
    while (!uniek) {
      toegangscode = genereerToegangsCode(voornaam);
      const { data: check } = await supabase.from('deelnemers').select('id').eq('toegangscode', toegangscode);
      uniek = !check?.length;
    }

    // Unieke killcode
    let killcode;
    uniek = false;
    while (!uniek) {
      killcode = genereerKillcode();
      const { data: check } = await supabase.from('deelnemers').select('id').eq('killcode', killcode);
      uniek = !check?.length;
    }

    const { data, error } = await supabase.from('deelnemers').insert({
      nummer, voornaam, familienaam, adres, foto_url, contact, notitie,
      toegangscode, killcode, status: 'actief'
    }).select().single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    await updateStats(supabase);
    return Response.json({ success: true, deelnemer: data, toegangscode, killcode });
  }

  // ── Foto URL opslaan ─────────────────────────────────
  if (actie === 'foto') {
    const { id, foto_url } = body;
    const { error } = await supabase.from('deelnemers').update({ foto_url }).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  // ── Deelnemer verwijderen ────────────────────────────
  if (actie === 'verwijderen') {
    const { id } = body;
    await supabase.from('kills').delete().or(`schutter_id.eq.${id},slachtoffer_id.eq.${id}`);
    const { error } = await supabase.from('deelnemers').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await updateStats(supabase);
    return Response.json({ success: true });
  }

  // ── Deelnemers switchen (doelwitten omwisselen) ──────
  if (actie === 'switch') {
    const { id1, id2 } = body;
    const { data: d1 } = await supabase.from('deelnemers').select('doelwit_id').eq('id', id1).single();
    const { data: d2 } = await supabase.from('deelnemers').select('doelwit_id').eq('id', id2).single();

    // Wissel doelwitten
    await supabase.from('deelnemers').update({ doelwit_id: d2.doelwit_id }).eq('id', id1);
    await supabase.from('deelnemers').update({ doelwit_id: d1.doelwit_id }).eq('id', id2);

    // Fix: wie had id1 als doelwit → krijgt nu id2 (en vice versa)
    const { data: schutterVanD1 } = await supabase.from('deelnemers').select('id').eq('doelwit_id', id1).neq('id', id1).neq('id', id2);
    const { data: schutterVanD2 } = await supabase.from('deelnemers').select('id').eq('doelwit_id', id2).neq('id', id1).neq('id', id2);

    if (schutterVanD1?.length) await supabase.from('deelnemers').update({ doelwit_id: id2 }).eq('id', schutterVanD1[0].id);
    if (schutterVanD2?.length) await supabase.from('deelnemers').update({ doelwit_id: id1 }).eq('id', schutterVanD2[0].id);

    return Response.json({ success: true });
  }

  // ── Elimineren via killcode ──────────────────────────
  if (actie === 'killcode') {
    const { killcode } = body;

    const { data: slachtoffer, error } = await supabase
      .from('deelnemers')
      .select('*, doelwit:doelwit_id(*)')
      .eq('killcode', killcode.toUpperCase().trim())
      .eq('status', 'actief')
      .single();

    if (error || !slachtoffer) {
      return Response.json({ error: 'Ongeldige killcode of deelnemer al geëlimineerd' }, { status: 404 });
    }

    return Response.json({ geldig: true, slachtoffer: { id: slachtoffer.id, naam: `${slachtoffer.voornaam} ${slachtoffer.familienaam}` } });
  }

  // ── Elimineren (via marshall of na killcode bevestiging) ──
  if (actie === 'elimineren') {
    const { id, omschrijving, killcode_gebruikt } = body;

    const { data: slachtoffer } = await supabase
      .from('deelnemers')
      .select('*, doelwit:doelwit_id(*)')
      .eq('id', id).single();

    if (!slachtoffer) return Response.json({ error: 'Deelnemer niet gevonden' }, { status: 404 });

    // Wie had slachtoffer als doelwit?
    const { data: schutters } = await supabase
      .from('deelnemers').select('*').eq('doelwit_id', id).eq('status', 'actief');

    // Registreer kill
    if (schutters?.length > 0) {
      await supabase.from('kills').insert({
        schutter_id: schutters[0].id,
        slachtoffer_id: id,
        killcode_gebruikt: killcode_gebruikt || false
      });
    }

    // Markeer als geëlimineerd
    await supabase.from('deelnemers').update({
      status: 'geëlimineerd',
      geelinimineerd_op: new Date().toISOString()
    }).eq('id', id);

    // Geef schutter het doelwit van het slachtoffer
    if (schutters?.length > 0 && slachtoffer.doelwit_id) {
      await supabase.from('deelnemers').update({
        doelwit_id: slachtoffer.doelwit_id
      }).eq('id', schutters[0].id);
    }

    // Topschutter bijhouden
    if (schutters?.length > 0) {
      const { data: killsSchutter } = await supabase
        .from('kills').select('id').eq('schutter_id', schutters[0].id);
      const aantalKills = killsSchutter?.length || 0;
      const { data: huidigeStats } = await supabase.from('stats').select('topschutter_aantal').eq('id', 1).single();
      if (aantalKills > (huidigeStats?.topschutter_aantal || 0)) {
        await supabase.from('stats').update({ topschutter_aantal: aantalKills }).eq('id', 1);
      }
    }

    // Tijdlijn
    const tekst = omschrijving || `Een deelnemer werd geëlimineerd`;
    await supabase.from('tijdlijn').insert({ tekst });

    await updateStats(supabase);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
