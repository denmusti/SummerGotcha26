// app/api/check-wachtwoord/route.js
// Controleert of het een geldig marshall wachtwoord is
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from('marshalls')
    .select('id, naam, is_admin, aanpassingen, telefoon')
    .eq('wachtwoord', wachtwoord)
    .single();

  if (!data) {
    return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
  }
  return Response.json({ success: true, marshall: data });
}
