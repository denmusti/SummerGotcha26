// app/api/kills/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET(request) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');

  // Check marshall wachtwoord
  const { data: marshall } = await supabase.from('marshalls').select('id').eq('wachtwoord', wachtwoord).single();
  if (!marshall) {
    const { data: stats } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
    if (wachtwoord !== stats?.wachtwoord) {
      return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }
  }

  const { data: kills } = await supabase
    .from('kills')
    .select(`
      id,
      tijdstip,
      schutter:schutter_id(voornaam, familienaam),
      slachtoffer:slachtoffer_id(voornaam, familienaam, doelwit_id)
    `)
    .order('tijdstip', { ascending: false });

  // Haal ook het doelwit op dat de schutter na de kill kreeg
  const killsMetDoelwit = await Promise.all((kills || []).map(async k => {
    // Het nieuwe doelwit van de schutter = het doelwit van het slachtoffer op het moment van de kill
    // Dat is nu gewoon het huidige doelwit van de schutter (tenzij er nog kills na waren)
    return {
      id: k.id,
      tijdstip: k.tijdstip,
      schutter: k.schutter ? `${k.schutter.voornaam} ${k.schutter.familienaam}` : 'Onbekend',
      slachtoffer: k.slachtoffer ? `${k.slachtoffer.voornaam} ${k.slachtoffer.familienaam}` : 'Onbekend',
    };
  }));

  return Response.json(killsMetDoelwit);
}
