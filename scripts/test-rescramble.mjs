// scripts/test-rescramble.mjs — LOKALE DROOGTEST van de herschommel-loting.
// Leest de huidige actieve spelers uit Supabase (ALLEEN LEZEN, geen enkele write)
// en draait het echte genereerKetting()-algoritme N keer om te bewijzen dat het
// resultaat altijd één gesloten Hamiltoniaanse cykel is.
//
//   node scripts/test-rescramble.mjs [aantal-iteraties]   (default 100000)

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ---- .env.local inladen ----
try {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { console.error('Geen .env.local'); process.exit(1); }

// ---- EXACTE KOPIE van genereerKetting() uit lib/herschommel.js ----
// (letterlijk overgenomen; Node kan de ESM-module niet los importeren zonder build)
function genereerKetting(deelnemers) {
  const n = deelnemers.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const doelwitten = new Array(n);
  for (let i = 0; i < n; i++) {
    doelwitten[indices[i]] = indices[(i + 1) % n];
  }
  if (doelwitten.some((d, i) => d === i)) {
    for (let i = 0; i < n; i++) {
      if (doelwitten[i] === i) {
        for (let j = i + 1; j < n; j++) {
          if (doelwitten[j] !== i && doelwitten[i] !== j) {
            [doelwitten[i], doelwitten[j]] = [doelwitten[j], doelwitten[i]];
            break;
          }
        }
      }
    }
  }
  return doelwitten;
}

// ---- Validatie: is dit precies één gesloten cykel over alle spelers? ----
function isGeslotenCykel(doelwit_indices) {
  const n = doelwit_indices.length;
  // geen zelfkoppeling
  if (doelwit_indices.some((d, i) => d === i)) return { ok: false, reden: 'zelfkoppeling' };
  // doelwitten moeten een permutatie zijn (iedereen exact 1x doelwit, iedereen exact 1x schutter)
  const gezien = new Set(doelwit_indices);
  if (gezien.size !== n) return { ok: false, reden: 'geen permutatie (dubbel doelwit)' };
  // volg de cykel vanaf 0
  let cur = 0, stappen = 0;
  const bezocht = new Set();
  while (!bezocht.has(cur) && stappen <= n) {
    bezocht.add(cur);
    cur = doelwit_indices[cur];
    stappen++;
  }
  if (cur !== 0) return { ok: false, reden: 'keert niet terug naar start' };
  if (bezocht.size !== n) return { ok: false, reden: `deellus van ${bezocht.size}/${n}` };
  return { ok: true };
}

// ---- Data ophalen ----
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: deelnemers, error } = await supabase
  .from('deelnemers')
  .select('id, nummer, voornaam, familienaam, doelwit_id')
  .eq('status', 'actief')
  .order('nummer', { ascending: true });
if (error) { console.error(error.message); process.exit(1); }

const n = deelnemers.length;
const iteraties = Number(process.argv[2] || 100000);
console.log(`DROOGTEST rescramble — ${n} actieve spelers, ${iteraties.toLocaleString('nl-BE')} iteraties\n`);
console.log('Actieve spelers:', deelnemers.map(d => `#${d.nummer} ${d.voornaam}`).join(', '), '\n');

// ---- HUIDIGE cirkel tonen (ter vergelijking) ----
{
  const idToIdx0 = new Map(deelnemers.map((d, i) => [d.id, i]));
  console.log('HUIDIGE cirkel (live in de database):');
  let curId = deelnemers[0].id;
  const gezien = new Set();
  while (curId != null && !gezien.has(curId) && idToIdx0.has(curId)) {
    gezien.add(curId);
    const d = deelnemers[idToIdx0.get(curId)];
    const doel = deelnemers[idToIdx0.get(d.doelwit_id)];
    console.log(`  #${d.nummer} ${d.voornaam} ${d.familienaam}  →  ${doel ? `#${doel.nummer} ${doel.voornaam} ${doel.familienaam}` : `?? (${d.doelwit_id})`}`);
    curId = d.doelwit_id;
  }
  console.log(`  ↺ terug naar #${deelnemers[0].nummer} ${deelnemers[0].voornaam} — ${gezien.size === n ? 'cirkel gesloten' : `⚠️ slechts ${gezien.size}/${n}`}\n`);
}

// ---- N keer draaien en valideren ----
let mislukt = 0;
const redenen = {};
let identiekeKetting = 0;
let zelfdeDoelwitTotaal = 0;

const huidigDoelwitById = new Map(deelnemers.map(d => [d.id, d.doelwit_id]));

for (let it = 0; it < iteraties; it++) {
  const di = genereerKetting(deelnemers);
  const v = isGeslotenCykel(di);
  if (!v.ok) { mislukt++; redenen[v.reden] = (redenen[v.reden] || 0) + 1; continue; }

  // simuleer de write-mapping: schutter deelnemers[i] -> doelwit deelnemers[di[i]]
  let zelfdeDoelwit = 0, allesGelijk = true;
  for (let i = 0; i < n; i++) {
    const schutter = deelnemers[i];
    const nieuwDoelwitId = deelnemers[di[i]].id;
    if (nieuwDoelwitId === huidigDoelwitById.get(schutter.id)) zelfdeDoelwit++;
    else allesGelijk = false;
  }
  zelfdeDoelwitTotaal += zelfdeDoelwit;
  if (allesGelijk) identiekeKetting++;
}

console.log('─'.repeat(50));
if (mislukt === 0) {
  console.log(`✅ ALLE ${iteraties.toLocaleString('nl-BE')} kettingen waren één gesloten cykel over alle ${n} spelers.`);
  console.log('   Geen zelfkoppelingen, geen deellussen, geen dubbele doelwitten.');
} else {
  console.log(`❌ ${mislukt} van ${iteraties} kettingen FOUT:`);
  for (const [r, c] of Object.entries(redenen)) console.log(`   - ${r}: ${c}x`);
}
console.log('─'.repeat(50));
console.log(`Kans dat de ketting exact identiek blijft:      ${identiekeKetting}/${iteraties} (${(100*identiekeKetting/iteraties).toFixed(3)}%)`);
console.log(`Gem. spelers dat toevallig hetzelfde doelwit houdt: ${(zelfdeDoelwitTotaal/iteraties).toFixed(2)} van ${n}`);

// ---- Eén voorbeeld-herschommeling tonen ----
console.log('\nVoorbeeld van één herschommeling (niet opgeslagen):');
const di = genereerKetting(deelnemers);
let curId = deelnemers[0].id;
const idToIdx = new Map(deelnemers.map((d, i) => [d.id, i]));
const bezocht = new Set();
while (!bezocht.has(curId)) {
  bezocht.add(curId);
  const i = idToIdx.get(curId);
  const doel = deelnemers[di[i]];
  const oud = huidigDoelwitById.get(curId);
  const markering = doel.id === oud ? '  (ongewijzigd)' : '';
  console.log(`  #${deelnemers[i].nummer} ${deelnemers[i].voornaam} ${deelnemers[i].familienaam}  →  #${doel.nummer} ${doel.voornaam} ${doel.familienaam}${markering}`);
  curId = doel.id;
}
console.log(`  ↺ terug naar #${deelnemers[0].nummer} ${deelnemers[0].voornaam} — cirkel gesloten (${bezocht.size}/${n})`);
