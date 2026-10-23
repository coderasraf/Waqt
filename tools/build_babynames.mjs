// Builds src/ui/babynames.json from the lists in tools/babynames/n1..n5.json:
// checks every entry, drops duplicates (the first list a name appears in wins,
// so a prophet or Companion keeps that origin), and writes compact rows.
// node tools/build_babynames.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CATS = ['prophet', 'sahabi', 'righteous', 'wife', 'family', 'quran', 'sahabiya', 'abd', 'virtue', 'nature'];
const THEMES = ['faith', 'light', 'peace', 'knowledge', 'beauty', 'strength', 'nature', 'kindness', 'joy', 'honour', 'gratitude', 'patience', 'leader'];
const AR = /[؀-ۿ]/, BN = /[ঀ-৿]/;
const key = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

const rows = [], seen = new Map(), problems = [];
for (let i = 1; i <= 5; i++) {
  const f = `${ROOT}tools/babynames/n${i}.json`;
  if (!fs.existsSync(f)) { problems.push(`missing n${i}.json`); continue; }
  for (const n of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    const where = `n${i}:${n.en}`;
    if (!n.en || !n.bn || !n.ar || !n.mean_en || !n.mean_bn) { problems.push(`${where}: missing a field`); continue; }
    if (!['m', 'f'].includes(n.g)) { problems.push(`${where}: gender ${n.g}`); continue; }
    if (!AR.test(n.ar)) problems.push(`${where}: Arabic not in Arabic script`);
    if (!BN.test(n.bn) || !BN.test(n.mean_bn)) problems.push(`${where}: Bengali not in Bengali script`);
    if (!CATS.includes(n.cat)) { problems.push(`${where}: category ${n.cat} → virtue`); n.cat = 'virtue'; }
    const themes = (n.themes || []).filter((t) => THEMES.includes(t));
    const k = `${n.g}:${key(n.en)}`;
    if (seen.has(k)) { problems.push(`${where}: duplicate of ${seen.get(k)} (dropped)`); continue; }
    seen.set(k, where);
    rows.push([key(n.en) + (n.g === 'f' ? '-f' : ''), n.g, n.en.trim(), n.bn.trim(), n.ar.trim(), n.mean_en.trim(), n.mean_bn.trim(), n.cat, (n.origin_en || '').trim(), (n.origin_bn || '').trim(), themes.join(',')]);
  }
}
rows.sort((a, b) => a[2].localeCompare(b[2]));
fs.writeFileSync(`${ROOT}src/ui/babynames.json`, JSON.stringify(rows));
const by = (g) => rows.filter((r) => r[1] === g).length;
console.log(`${rows.length} names (${by('m')} boys, ${by('f')} girls); ${problems.length} notes`);
if (problems.length) console.log(problems.join('\n'));
