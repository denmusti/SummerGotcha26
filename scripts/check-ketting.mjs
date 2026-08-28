// scripts/check-ketting.mjs — verifieert of de doelwit-ketting van actieve spelers
// één gesloten Hamiltoniaanse cykel vormt (geen dode doelwitten, geen deellussen)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

try {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { console.error('Geen .env.local'); process.exit(1); }

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: alle } = await supabase.from('deelnemers').select('id, nummer, voornaam, familienaam, status, doelwit_id');
const byId = new Map(alle.map(d => [d.id, d]));
const actief = alle.filter(d => d.status === 'actief');

console.log(`${actief.length} actieve spelers\n`);

let problemen = 0;
for (const d of actief) {
  const doel = byId.get(d.doelwit_id);
  if (!doel) { console.log(`❌ ${d.voornaam} ${d.familienaam} (#${d.nummer}) → doelwit_id ${d.doelwit_id} BESTAAT NIET`); problemen++; }
  else if (doel.status !== 'actief') { console.log(`❌ ${d.voornaam} ${d.familienaam} (#${d.nummer}) → ${doel.voornaam} ${doel.familienaam} (#${doel.nummer}) is GEËLIMINEERD`); problemen++; }
}

// Volg de cykel vanaf de eerste actieve speler
const start = actief[0];
const bezocht = new Set();
let cur = start, stappen = 0;
while (cur && !bezocht.has(cur.id) && stappen <= actief.length + 1) {
  bezocht.add(cur.id);
  cur = byId.get(cur.doelwit_id);
  stappen++;
}
const geslotenCykel = cur && cur.id === start.id && bezocht.size === actief.length;

console.log('');
if (geslotenCykel && problemen === 0) {
  console.log('✅ Geldige gesloten ketting: alle actieve spelers zitten in één cykel.');
} else {
  console.log(`⚠️  Ketting NIET in orde — ${problemen} kapotte doelwit(ten), cykel omvat ${bezocht.size}/${actief.length} spelers.`);
  console.log('\nHele actieve ketting:');
  for (const d of actief) {
    const doel = byId.get(d.doelwit_id);
    console.log(`  #${d.nummer} ${d.voornaam} ${d.familienaam} → ${doel ? `#${doel.nummer} ${doel.voornaam} ${doel.familienaam} [${doel.status}]` : `?? (${d.doelwit_id})`}`);
  }
}
