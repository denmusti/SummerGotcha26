// app/api/deelnemers/route.js
import { getSupabaseServer } from '../../../lib/supabase';

async function checkWachtwoord(supabase, wachtwoord) {
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  return data?.wachtwoord === wachtwoord;
}

function genereerCode(naam) {
  const basis = naam.toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${basis}${random}`;
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
    .select('*, doelwit:doelwit_id(id, voornaam, familienaam, adres, foto)')
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

  // Deelnemer toevoegen
  if (actie === 'toevoegen') {
    const { voornaam, familienaam, adres, foto, contact, notitie } = body;

    // Volgnummer bepalen
    const { data: bestaande } = await supabase
      .from('deelnemers').select('nummer').order('nummer', { ascending: false }).limit(1);
    const nummer = bestaande?.length > 0 ? (bestaande[0].nummer + 1) : 1;

    // Unieke toegangscode genereren
    let code;
    let uniek = false;
    while (!uniek) {
      code = genereerCode(voornaam);
      const { data: bestaandeCode } = await supabase
        .from('deelnemers').select('id').eq('toegangscode', code);
      uniek = !bestaandeCode?.length;
    }

    const { data, error } = await supabase.from('deelnemers').insert({
      nummer, voornaam, familienaam, adres, foto, contact, notitie,
      toegangscode: code, status: 'actief'
    }).select().single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Stats updaten
    const { data: alle } = await supabase.from('deelnemers').select('id');
    await supabase.from('stats').update({
      totaal_deelnemers: alle.length,
      levenden: alle.length,
      updated_at: new Date().toISOString()
    }).eq('id', 1);

    return Response.json({ success: true, deelnemer: data, toegangscode: code });
  }

  // Deelnemer verwijderen
  if (actie === 'verwijderen') {
    const { id } = body;
    const { error } = await supabase.from('deelnemers').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const { data: alle } = await supabase.from('deelnemers').select('id');
    const { data: levenden } = await supabase.from('deelnemers').select('id').eq('status', 'actief');
    await supabase.from('stats').update({
      totaal_deelnemers: alle.length,
      levenden: levenden.length,
      updated_at: new Date().toISOString()
    }).eq('id', 1);

    return Response.json({ success: true });
  }

  // Deelnemer elimineren
  if (actie === 'elimineren') {
    const { id, omschrijving } = body;

    // Haal schutter en doelwit op
    const { data: slachtoffer } = await supabase
      .from('deelnemers')
      .select('*, doelwit:doelwit_id(*)')
      .eq('id', id).single();

    if (!slachtoffer) return Response.json({ error: 'Deelnemer niet gevonden' }, { status: 404 });

    // Zoek wie het slachtoffer als doelwit had
    const { data: schutters } = await supabase
      .from('deelnemers')
      .select('*')
      .eq('doelwit_id', id)
      .eq('status', 'actief');

    // Markeer als geëlimineerd
    await supabase.from('deelnemers').update({
      status: 'geëlimineerd',
      geelinimineerd_op: new Date().toISOString()
    }).eq('id', id);

    // Geef schutter het nieuwe doelwit (doelwit van het slachtoffer)
    if (schutters?.length > 0 && slachtoffer.doelwit_id) {
      await supabase.from('deelnemers').update({
        doelwit_id: slachtoffer.doelwit_id
      }).eq('id', schutters[0].id);
    }

    // Topschutter bijhouden (tel eliminaties per schutter)
    if (schutters?.length > 0) {
      const { data: eliminaties } = await supabase
        .from('tijdlijn')
        .select('id')
        .ilike('tekst', `%${schutters[0].voornaam}%`);
      const aantalEl = (eliminaties?.length || 0) + 1;
      const { data: huidigeStats } = await supabase.from('stats').select('topschutter_aantal').eq('id', 1).single();
      if (aantalEl > (huidigeStats?.topschutter_aantal || 0)) {
        await supabase.from('stats').update({ topschutter_aantal: aantalEl }).eq('id', 1);
      }
    }

    // Tijdlijn updaten
    const tekst = omschrijving || `Een deelnemer werd geëlimineerd`;
    await supabase.from('tijdlijn').insert({ tekst });

    // Levenden updaten
    const { data: levenden } = await supabase.from('deelnemers').select('id').eq('status', 'actief');
    await supabase.from('stats').update({
      levenden: levenden.length,
      updated_at: new Date().toISOString()
    }).eq('id', 1);

    return Response.json({ success: true });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
