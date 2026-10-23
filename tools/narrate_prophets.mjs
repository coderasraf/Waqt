// Narrates Stories of the Prophets with ElevenLabs, one file per paragraph
// (paragraph 0 is the name and title), into src/ui/prophets/audio/<id>-<lang>-<k>.opus.
//   node tools/narrate_prophets.mjs --count        how many characters it would send
//   node tools/narrate_prophets.mjs --budget 37000 narrate, stopping before the budget runs out
// Files that already exist are skipped, so it can be re-run safely.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${ROOT}src/ui/prophets/audio`;
const VOICE = 'JBFqnCBsd6RMkjVDRZzb'; // George: a warm, calm storyteller
const FORMAT = 'opus_48000_32';
const args = process.argv.slice(2);
const budget = +(args[args.indexOf('--budget') + 1] || 0);

/// What the narrator says: honorifics in full, verse and hadith references left to the screen.
function speech(text, lang) {
  let s = text.replace(/\s*\((?:[^()]*[\d০-৯]+:[\d০-৯]+[^()]*)\)/g, '')
    .replace(/\s*\((?:Sahih|Jami|Sunan|Musnad|সহীহ|জামে|সুনান|মুসনাদ)[^)]*\)/g, '');
  if (lang === 'bn') s = s.replace(/\(আ\.\)/g, 'আলাইহিস সালাম').replace(/\(রা\.\)/g, 'রাদিয়াল্লাহু আনহু').replace(/ﷺ/g, 'সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম');
  else s = s.replace(/\s*ﷺ/g, ', peace be upon him,').replace(/,\s*([.!?])/g, '$1').replace(/, ,/g, ',');
  return s.replace(/\s+/g, ' ').trim();
}
const title = (p, lang) => lang === 'bn' ? `${p.bn}। ${p.title_bn}।` : `${p.id === 'muhammad' ? 'The Prophet Muhammad ﷺ' : `Prophet ${p.en}, peace be upon him`}. ${p.title_en}.`;

const list = JSON.parse(fs.readFileSync(`${ROOT}src/ui/prophets.json`, 'utf8'));
const jobs = [];
for (const p of list) for (const lang of ['bn', 'en']) {
  [title(p, lang), ...p[`story_${lang}`]].forEach((t, k) => jobs.push({ file: `${OUT}/${p.id}-${lang}-${k}.opus`, lang, text: speech(t, lang) }));
}
const todo = jobs.filter((j) => !fs.existsSync(j.file));
const chars = todo.reduce((a, j) => a + j.text.length, 0);
console.log(`${jobs.length} clips, ${todo.length} still to make, ${chars} characters (about ${Math.round(chars * 0.4)} credits)`);
if (args.includes('--count')) process.exit(0);
if (!budget) { console.log('pass --budget <credits>'); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
const KEY = fs.readFileSync(`${ROOT}android/keys.txt`, 'utf8').trim();
let spent = 0, made = 0, failed = 0, i = 0;
async function one(j) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=${FORMAT}`, {
      method: 'POST', headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text: j.text, model_id: 'eleven_v3', language_code: j.lang }),
    });
    if (r.ok) {
      fs.writeFileSync(j.file, Buffer.from(await r.arrayBuffer()));
      spent += +(r.headers.get('character-cost') || j.text.length * 0.4);
      made++;
      return;
    }
    const body = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 4000 * (attempt + 1))); continue; }
    console.log('failed', j.file.split('/').pop(), r.status, body.slice(0, 200));
    if (/quota|credits|limit/i.test(body)) process.exit(2);
    failed++;
    return;
  }
  failed++;
}
// Three at a time, stopping before the next clip could go over the budget.
async function worker() {
  while (i < todo.length) {
    const j = todo[i++];
    if (spent + j.text.length * 0.45 > budget) { console.log('stopping: budget reached'); i = todo.length; return; }
    await one(j);
    if (made % 20 === 0) console.log(`${made} made, ${Math.round(spent)} credits`);
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`done: ${made} made, ${failed} failed, ${Math.round(spent)} credits spent`);
