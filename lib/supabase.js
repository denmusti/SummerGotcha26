// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Server-side client met service role — enkel in API routes gebruiken!
export function getSupabaseServer() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Helper: genereer killcode (6 tekens, alfanumeriek)
export function genereerKillcode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
