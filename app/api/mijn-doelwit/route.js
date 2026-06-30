// app/api/mijn-doelwit/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function POST(request) {
  const supabase = getSupabaseServer();
  const { toegangscode } = await request.json();

  if (!toegangscode) return Response.json({ error: 'Geen code opgegeven' }, { status: 400 });

  const { data: deelnemer, error } = await supabase
    .from('deelnemers')
    .select('*, doelwit:doelwit_id(voornaam, familienaam, adres, foto)')
    .eq('toegangscode', toegangscode.toLowerCase().trim())
    .single();

  if (error || !deelnemer) return Response.json({ error: 'Ongeldige code' }, { status: 401 });

  return Response.json({
    naam: `${deelnemer.voornaam} ${deelnemer.familienaam}`,
    status: deelnemer.status,
    nummer: deelnemer.nummer,
    doelwit: deelnemer.doelwit ? {
      naam: `${deelnemer.doelwit.voornaam} ${deelnemer.doelwit.familienaam}`,
      adres: deelnemer.doelwit.adres,
      foto: deelnemer.doelwit.foto,
    } : null,
  });
}
