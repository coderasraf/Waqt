// Builds src/ui/prophets.json from the drafts in tools/prophets/p1..p5.json:
// checks every entry's shape, and that each passage's first verse and the key
// verse really contain the prophet's name in the Quran text the app ships.
// node tools/build_prophets.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const Q = `${ROOT}android/app/src/main/assets/quran/ar/`;
const ORDER = ['adam', 'idris', 'nuh', 'hud', 'salih', 'ibrahim', 'lut', 'ismail', 'ishaq', 'yaqub', 'yusuf', 'ayyub', 'shuayb', 'musa', 'harun',
  'dhulkifl', 'dawud', 'sulayman', 'ilyas', 'alyasa', 'yunus', 'zakariyya', 'yahya', 'isa', 'muhammad'];
const norm = (s) => s.replace(/\{[a-z_]+\|([^}]*)\}/g, '$1').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200B-\u200F]/g, '').replace(/[اأإآٱ]/g, '').replace(/ى/g, 'ي');
const verse = (s, v) => norm(JSON.parse(fs.readFileSync(Q + String(s).padStart(3, '0') + '.json', 'utf8'))[v - 1].u.join(' '));
const count = (s) => JSON.parse(fs.readFileSync(Q + String(s).padStart(3, '0') + '.json', 'utf8')).length;

const all = [];
for (let i = 1; i <= 5; i++) {
  const f = `${ROOT}tools/prophets/p${i}.json`;
  if (fs.existsSync(f)) all.push(...JSON.parse(fs.readFileSync(f, 'utf8')));
}
// Ids may be written differently by the drafts; match them to the order loosely.
const key = (id) => id.toLowerCase().replace(/[^a-z]/g, '');
const byId = Object.fromEntries(all.map((p) => [key(p.id), p]));
const problems = [];
const out = ORDER.map((id) => {
  const p = byId[id];
  if (!p) { problems.push(`missing ${id}`); return null; }
  p.id = id;
  p.en_alt ||= p.en.replace(' ﷺ', '');
  for (const f of ['ar', 'en', 'en_alt', 'bn', 'title_en', 'title_bn', 'tag_en', 'tag_bn', 'key', 'key_name']) if (!p[f]) problems.push(`${id}: no ${f}`);
  for (const f of ['story_en', 'story_bn', 'lessons_en', 'lessons_bn', 'passages']) if (!Array.isArray(p[f]) || !p[f].length) problems.push(`${id}: no ${f}`);
  if (p.story_en?.length !== p.story_bn?.length) problems.push(`${id}: ${p.story_en?.length} English but ${p.story_bn?.length} Bengali paragraphs`);
  if (p.lessons_en?.length !== 3 || p.lessons_bn?.length !== 3) problems.push(`${id}: lessons are not 3 and 3`);
  const check = (s, v, name, what) => {
    if (!(s >= 1 && s <= 114) || !(v >= 1 && v <= count(s))) { problems.push(`${id}: ${what} ${s}:${v} does not exist`); return; }
    // Some surahs spell a name with a small ya (إبرهـۧم in Al-Baqarah), so also compare without ya.
    const t = verse(s, v), w = norm(name), noYa = (x) => x.replace(/ي/g, '');
    if (!t.includes(w) && !noYa(t).includes(noYa(w))) problems.push(`${id}: ${what} ${s}:${v} does not contain ${name}`);
  };
  const [ks, kv] = String(p.key).split(':').map(Number);
  check(ks, kv, p.key_name, 'key');
  for (const x of p.passages || []) {
    check(x.s, x.from, x.name, 'passage');
    if (!(x.to >= x.from && x.to <= count(x.s))) problems.push(`${id}: passage ${x.s}:${x.from}-${x.to} runs past the surah`);
  }
  return p;
}).filter(Boolean);
// Which stories have narration: every clip, title and paragraphs, in that language.
for (const p of out) {
  p.audio = {};
  for (const lang of ['bn', 'en']) {
    const n = p[`story_${lang}`].length + 1;
    p.audio[lang] = Array.from({ length: n }, (_, k) => fs.existsSync(`${ROOT}src/ui/prophets/audio/${p.id}-${lang}-${k}.opus`)).every(Boolean);
  }
}
const told = out.filter((p) => p.audio.bn).length + out.filter((p) => p.audio.en).length;
console.log(`narrated: ${told} of ${out.length * 2} stories`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
fs.writeFileSync(`${ROOT}src/ui/prophets.json`, JSON.stringify(out));
console.log(`${out.length} prophets; ${problems.length} problems; ${(fs.statSync(`${ROOT}src/ui/prophets.json`).size / 1024).toFixed(0)} KB`);
