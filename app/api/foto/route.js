// app/api/foto/route.js
import { getSupabaseServer } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const supabase = getSupabaseServer();
    const formData = await request.formData();
    const wachtwoord = formData.get('wachtwoord');
    const deelnemerId = formData.get('deelnemerId');
    const file = formData.get('foto');

    // Wachtwoord controleren
    const { data: stats } = await supabase.from('stats').select('wachtwoord').eq('id', 1).single();
    if (wachtwoord !== stats?.wachtwoord) {
      return Response.json({ error: 'Ongeldig wachtwoord' }, { status: 401 });
    }

    if (!file || !deelnemerId) {
      return Response.json({ error: 'Foto en deelnemer ID zijn verplicht' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop().toLowerCase();
    const bestandsnaam = `deelnemer_${deelnemerId}_${Date.now()}.${ext}`;

    // Upload naar Supabase Storage
    const { data: upload, error: uploadError } = await supabase.storage
      .from('deelnemer-fotos')
      .upload(bestandsnaam, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error(uploadError);
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Publieke URL ophalen
    const { data: urlData } = supabase.storage
      .from('deelnemer-fotos')
      .getPublicUrl(bestandsnaam);

    const foto_url = urlData.publicUrl;

    // Opslaan in deelnemers tabel
    await supabase.from('deelnemers').update({ foto_url }).eq('id', deelnemerId);

    return Response.json({ success: true, foto_url });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Fout bij uploaden' }, { status: 500 });
  }
}
