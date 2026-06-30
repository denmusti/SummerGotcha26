// lib/supabase.js
// Server-side client met service role key — enkel gebruiken in API routes!
// Deze key heeft volledige schrijfrechten en mag NOOIT naar de browser lekken.

import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
