// scripts/preview-winnaars.mjs — toont hoe het winnaarsoverzicht er NU uit zou zien
// als het spel vandaag zou eindigen. Read-only, verandert niets.
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

const [{ data: deelnemers }, { data: kills }] = await Promise.all([
  supabase.from('deelnemers').select('id, voornaam, familienaam, status, geelinimineerd_op'),
  supabase.from('kills').select('schutter_id, tijdstip'),
]);

const teller = {}, eerste = {};
for (const k of kills) {
  teller[k.schutter_id] = (teller[k.schutter_id] || 0) + 1;
  const t = new Date(k.tijdstip).getTime();
  if (!(k.schutter_id in eerste) || t < eerste[k.schutter_id]) eerste[k.schutter_id] = t;
}
const verrijk = d => ({
  naam: `${d.voornaam} ${d.familienaam}`,
  status: d.status,
  kills: teller[d.id] || 0,
  eersteKill: eerste[d.id] || null,
});

const overlevenden = deelnemers.filter(d => d.status === 'actief').map(verrijk)
  .sort((a, b) => b.kills !== a.kills ? b.kills - a.kills : (a.eersteKill ?? Infinity) - (b.eersteKill ?? Infinity));

const topkillers = deelnemers.filter(d => (teller[d.id] || 0) > 0).map(verrijk)
  .sort((a, b) => {
    if (b.kills !== a.kills) return b.kills - a.kills;
    const aL = a.status === 'actief' ? 0 : 1, bL = b.status === 'actief' ? 0 : 1;
    if (aL !== bL) return aL - bL;
    return (a.eersteKill ?? Infinity) - (b.eersteKill ?? Infinity);
  });

const fmt = t => t ? new Date(t).toLocaleString('nl-BE') : '—';

console.log(`\n🏆 WINNAAR: ${overlevenden[0]?.naam || '(geen overlevenden)'}  (${overlevenden[0]?.kills ?? 0} kills, eerste kill ${fmt(overlevenden[0]?.eersteKill)})\n`);
console.log('💚 OVERLEVENDEN (meeste kills → minste):');
overlevenden.forEach((p, i) => console.log(`  ${i + 1}. ${p.naam.padEnd(26)} ${p.kills} kills   eerste kill: ${fmt(p.eersteKill)}`));
console.log(`\n💀 TOPKILLER: ${topkillers[0]?.naam}  (${topkillers[0]?.kills} kills, ${topkillers[0]?.status})\n`);
console.log('🎯 ALLE SCHERPSCHUTTERS:');
topkillers.forEach((p, i) => console.log(`  ${i + 1}. ${p.naam.padEnd(26)} ${p.kills} kills   ${p.status === 'actief' ? '💚 leeft ' : '💀 dood  '}  eerste kill: ${fmt(p.eersteKill)}`));
