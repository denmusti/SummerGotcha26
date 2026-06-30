// app/api/check-wachtwoord/route.js
// Puur lezen — schrijft NOOIT naar de database
import { getSupabaseServer } from '../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wachtwoord = decodeURIComponent(searchParams.get('wachtwoord') || '');

  const supabase = getSupabaseServer();
  const { data } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();

  if (!data || data.wachtwoord !== wachtwoord) {
    return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
  }
  return Response.json({ success: true });
}
