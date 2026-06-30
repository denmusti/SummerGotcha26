// app/api/marshalls/route.js
import { getSupabaseServer } from '../../../lib/supabase';

async function checkAdmin(supabase, wachtwoord) {
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
  return data?.wachtwoord === wachtwoord;
}

// GET: login als marshall
export async function GET(request) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');
  const alleenLijst = searchParams.get('lijst') === 'true';
  const adminWw = decodeURIComponent(searchParams.get('adminWw') || '');

  // Admin vraagt lijst van marshalls op
  if (alleenLijst && await checkAdmin(supabase, adminWw)) {
    const { data } = await supabase.from('marshalls').select('id, naam, aanpassingen').order('naam');
    return Response.json(data || []);
  }

  // Marshall logt in
  if (wachtwoord) {
    const { data } = await supabase.from('marshalls')
      .select('id, naam, aanpassingen')
      .eq('wachtwoord', wachtwoord)
      .single();
    if (!data) return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    return Response.json({ success: true, marshall: data });
  }

  return Response.json({ error: 'Geen wachtwoord opgegeven' }, { status: 400 });
}

// POST: marshall beheren (enkel admin)
export async function POST(request) {
  const supabase = getSupabaseServer();
  const body = await request.json();

  if (!await checkAdmin(supabase, body.adminWachtwoord)) {
    return Response.json({ error: 'Ongeldig admin wachtwoord' }, { status: 401 });
  }

  const { actie } = body;

  if (actie === 'toevoegen') {
    const { naam, wachtwoord } = body;
    if (!naam?.trim() || !wachtwoord?.trim()) {
      return Response.json({ error: 'Naam en wachtwoord zijn verplicht' }, { status: 400 });
    }
    const { data, error } = await supabase.from('marshalls')
      .insert({ naam: naam.trim(), wachtwoord: wachtwoord.trim() })
      .select().single();
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

  return Response.json({ error: 'Onbekende actie' }, { status: 400 });
}
