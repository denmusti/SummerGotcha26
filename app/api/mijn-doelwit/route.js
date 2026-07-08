// app/api/mijn-doelwit/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function POST(request) {
  const supabase = getSupabaseServer();
  const { toegangscode, adminPreview, forceGestart } = await request.json();

  if (!toegangscode) return Response.json({ error: 'Geen code opgegeven' }, { status: 400 });

  // Haal spelfase op
  const { data: stats } = await supabase.from('stats').select('*').eq('id', 1).single();
  const nu = new Date();
  const start = new Date(stats.start_datum);
  const spelGestart = forceGestart ? true : nu >= start;

  // Admin preview: wachtwoord als toegangscode
  const isAdmin = adminPreview && toegangscode === stats.wachtwoord;

  if (!isAdmin) {
    // Normale deelnemer
    const { data: deelnemer, error } = await supabase
      .from('deelnemers')
      .select('*, doelwit:doelwit_id(id, nummer, voornaam, familienaam, adres, foto_url)')
      .eq('toegangscode', toegangscode.toLowerCase().trim())
      .single();

    if (error || !deelnemer) return Response.json({ error: 'Ongeldige code' }, { status: 401 });

    // Haal kills op van deze deelnemer
    const { data: kills } = await supabase
      .from('kills')
      .select('*, slachtoffer:slachtoffer_id(voornaam, familienaam, foto_url)')
      .eq('schutter_id', deelnemer.id)
      .order('tijdstip', { ascending: false });

    const isAdminCode = toegangscode === stats.wachtwoord;
    return Response.json({
      naam: `${deelnemer.voornaam} ${deelnemer.familienaam}`,
      isAdmin: isAdminCode,
      killcode: deelnemer.status === 'actief' ? deelnemer.killcode : null,
      status: deelnemer.status,
      nummer: deelnemer.nummer,
      spelGestart,
      doelwit: spelGestart && deelnemer.status === 'actief' && deelnemer.doelwit ? {
        naam: `${deelnemer.doelwit.voornaam} ${deelnemer.doelwit.familienaam}`,
        adres: deelnemer.doelwit.adres,
        foto_url: deelnemer.doelwit.foto_url,
      } : null,
      doelwitBeschikbaarOp: !spelGestart ? stats.start_datum : null,
      kills: kills?.map(k => ({
        naam: `${k.slachtoffer.voornaam} ${k.slachtoffer.familienaam}`,
        foto_url: k.slachtoffer.foto_url,
        tijdstip: k.tijdstip,
      })) || [],
    });
  }

  // Admin preview: geef lijst van alle deelnemers met hun doelwit
  const { data: deelnemers } = await supabase
    .from('deelnemers')
    .select('*, doelwit:doelwit_id(id, nummer, voornaam, familienaam, adres, foto_url)')
    .order('nummer', { ascending: true });

  return Response.json({
    isAdmin: true,
    spelGestart,
    deelnemers: deelnemers?.map(d => ({
      id: d.id,
      nummer: d.nummer,
      naam: `${d.voornaam} ${d.familienaam}`,
      toegangscode: d.toegangscode,
      status: d.status,
      doelwit: d.doelwit ? {
        naam: `${d.doelwit.voornaam} ${d.doelwit.familienaam}`,
        adres: d.doelwit.adres,
        foto_url: d.doelwit.foto_url,
      } : null,
    }))
  });
}
