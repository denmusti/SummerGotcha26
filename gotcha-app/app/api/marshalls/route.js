// app/api/marshalls/route.js
import { getSupabaseServer } from '../../../lib/supabase';

// GET: login als marshall (of ophalen lijst voor admin)
export async function GET(request) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');
  const alleenLijst = searchParams.get('lijst') === 'true';
  const adminWw = decodeURIComponent(searchParams.get('adminWw') || '');

  // Admin vraagt lijst op via marshall wachtwoord
  if (alleenLijst) {
    const { data: marshall } = await supabase
      .from('marshalls').select('is_admin').eq('wachtwoord', adminWw).single();
    if (!marshall?.is_admin) {
      return Response.json({ error: 'Geen admin rechten' }, { status: 401 });
    }
    const { data } = await supabase
      .from('marshalls')
      .select('id, naam, aanpassingen, telefoon, is_admin')
      .order('naam');
    return Response.json(data || []);
  }

  // Marshall logt in
  if (wachtwoord) {
    const { data } = await supabase
      .from('marshalls')
      .select('id, naam, aanpassingen, telefoon, is_admin')
      .eq('wachtwoord', wachtwoord)
      .single();
    if (!data) return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    return Response.json({ success: true, marshall: data });
  }

  return Response.json({ error: 'Geen wachtwoord opgegeven' }, { status: 400 });
}

// POST: marshall beheren (enkel admin marshalls)
export async function POST(request) {
  const supabase = getSupabaseServer();
  const body = await request.json();

  // Controleer admin rechten via marshall wachtwoord
  const { data: admin } = await supabase
    .from('marshalls').select('is_admin').eq('wachtwoord', body.adminWachtwoord || '').single();
  if (!admin?.is_admin) {
    return Response.json({ error: 'Geen admin rechten' }, { status: 401 });
  }

  const { actie } = body;

  if (actie === 'toevoegen') {
    const { naam, wachtwoord, telefoon, is_admin } = body;
    if (!naam?.trim() || !wachtwoord?.trim()) {
      return Response.json({ error: 'Naam en wachtwoord zijn verplicht' }, { status: 400 });
    }
    const { data, error } = await supabase.from('marshalls').insert({
      naam: naam.trim(),
      wachtwoord: wachtwoord.trim(),
      telefoon: telefoon?.trim() || null,
      is_admin: is_admin || false
    }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, marshall: data });
  }

  if (actie === 'verwijderen') {
    const { id } = body;
    const { error } = await supabase.from('marshalls').delete().eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (actie === 'resetAanpassingen') {
    const { id } = body;
    const { error } = await supabase.from('marshalls').update({ aanpassingen: 0 }).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (actie === 'toggleAdmin') {
    const { id, is_admin } = body;
    const { error } = await supabase.from('marshalls').update({ is_admin }).eq('id', id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
