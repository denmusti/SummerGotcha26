// scripts/db.mjs — lokale Supabase-inspectie (read-only), leest .env.local
// Gebruik:
//   node scripts/db.mjs                 -> lijst tabellen + rijaantallen
//   node scripts/db.mjs deelnemers      -> alle rijen van een tabel
//   node scripts/db.mjs kills 20        -> eerste 20 rijen
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// .env.local inladen (simpele parser)
try {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  console.error('Geen .env.local gevonden — run eerst:  vercel env pull .env.local');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const TABELLEN = ['stats', 'tijdlijn', 'deelnemers', 'kills', 'marshalls'];

const tabel = process.argv[2];
const limiet = Number(process.argv[3] || 200);

if (!tabel) {
  for (const t of TABELLEN) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(error ? `${t.padEnd(12)} FOUT: ${error.message}` : `${t.padEnd(12)} ${count} rijen`);
  }
  process.exit(0);
}

const { data, error } = await supabase.from(tabel).select('*').limit(limiet);
if (error) { console.error('Fout:', error.message); process.exit(1); }
console.log(`${tabel}: ${data.length} rijen\n`);
console.dir(data, { depth: null, maxArrayLength: null });
