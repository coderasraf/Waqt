// Builds the offline azkar bundled in the Android app (assets/azkar):
// Hisnul Muslim (Sa'id al-Qahtani) in Arabic with Bengali transliteration,
// meaning and references (ThelightHub/dua-api, MIT), matched to the English
// translation and Arabic audio of hisnmuslim.com; Quranic duas with English
// from the bundled Saheeh International; and a few special adhkar.
//
//   node tools/build_azkar.mjs
import fs from 'node:fs';
import path from 'node:path';

const BN_API = 'https://dua-api.hisnul.workers.dev/api';
const EN_API = 'https://www.hisnmuslim.com/api/en';
const OUT = path.resolve(import.meta.dirname, '../app/src/main/assets/azkar');
const QURAN = path.resolve(import.meta.dirname, '../app/src/main/assets/quran');

const TITLES = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'azkar/titles_en.json'), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'azkar/en_extra.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return parseLoose(await r.text());
      if (i >= 4) throw new Error(`${r.status} ${url}`);
    } catch (e) { if (i >= 4) throw e; }
    await sleep(900 * (i + 1));
  }
}

const bnNum = (s) => String(s).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
const clean = (s) => String(s ?? '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
/// Arabic without marks, for matching the two sources.
const norm = (s) => String(s || '').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ̀-ͯ]/g, '')
  .replace(/[أإآٱا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/ة/g, 'ه').replace(/ـ/g, '').replace(/[^ء-ي ]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
function sim(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let n = 0; for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

/// How many times, from the Bengali text ("তিনবার", "১০০ বার").
const WORDS = { 'একবার': 1, 'দুইবার': 2, 'তিনবার': 3, 'চারবার': 4, 'সাতবার': 7, 'দশবার': 10, 'দশ বার': 10, 'একশত বার': 100, 'একশতবার': 100, 'একশ বার': 100 };
function countFrom(text) {
  const t = bnNum(text);
  const m = t.match(/(\d+)\s*বার/);
  if (m) return +m[1];
  for (const [w, n] of Object.entries(WORDS)) if (t.includes(w)) return n;
  return 0;
}

const CAT_EN = {
  'ঘুম': 'Sleep', 'সকাল - সন্ধ্যা': 'Morning & evening', 'পরিবার': 'Family', 'সামাজিক': 'Social life', 'রামাদান - সিয়াম': 'Ramadan & fasting', 'হজ্জ - উমরা': 'Hajj & Umrah',
  'পবিত্রতা': 'Purification', 'সালাত': 'Salah', 'খাদ্য ও পানীয়': 'Food & drink', 'সম্পত্তি - রিজিক': 'Wealth & provision', 'সফর': 'Travel', 'প্রকৃতি': 'Nature & weather',
  'শুকরিয়া - অনুতাপ': 'Gratitude & repentance', 'অসুস্থতা - মৃত্যু': 'Illness & death', 'বিপদ - দুশ্চিন্তা': 'Hardship & worry', 'ঘর - মসজিদ': 'Home & mosque', 'ঈমান - আকীদা': 'Faith', 'কুরআনের দোয়া': 'Duas from the Quran',
};

function quranText(id, s, from, to) {
  const f = path.join(QURAN, 't', String(id), `${String(s).padStart(3, '0')}.json`);
  const all = JSON.parse(fs.readFileSync(f, 'utf8'));
  return all.slice(from - 1, to).join(' ');
}
function quranTranslit(s, from, to) {
  const all = JSON.parse(fs.readFileSync(path.join(QURAN, 'wbw', 'en', `${String(s).padStart(3, '0')}.json`), 'utf8'));
  return all.slice(from - 1, to).map((v) => v.map((w) => w[1]).join(' ')).join(' · ');
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // English: chapter list, then each chapter's duas.
  const enList = (await get(`${EN_API}/husn_en.json`)).English;
  const en = {};
  for (let i = 0; i < enList.length; i += 6) {
    await Promise.all(enList.slice(i, i + 6).map(async (c) => {
      const j = await get(`${EN_API}/${c.ID}.json`);
      en[c.ID] = { title: c.TITLE.trim(), items: Object.values(j)[0] };
    }));
  }
  console.log('english chapters', Object.keys(en).length);

  const cats = (await get(`${BN_API}/categories`)).data;
  const books = [];
  const dhikr = [];
  let matched = 0, withAr = 0;
  for (const bookId of [1, 2, 3]) {
    const chs = (await get(`${BN_API}/books/${bookId}/chapters`)).data;
    const chapters = [];
    for (let i = 0; i < chs.length; i += 6) {
      await Promise.all(chs.slice(i, i + 6).map(async (ch) => {
        const duas = (await get(`${BN_API}/books/${bookId}/chapters/${ch.chap_id}/duas`)).data;
        const enCh = bookId === 1 ? en[ch.chap_id] : null;
        const used = new Set();
        // Quranic duas: [s:a] or [s:a-b] in the chapter name.
        const qm = bookId === 2 ? bnNum(ch.chapname).match(/\[(\d+):(\d+)(?:-(\d+))?\]/) : null;
        const items = duas.map((d) => {
          const segs = d.segments.map((x) => ({ n: clean(x.top), ar: clean(x.arabic), tr: clean(x.transliteration), bn: clean(x.translations), after: clean(x.bottom) }))
            .filter((x) => x.n || x.ar || x.bn || x.after);
          const ref = d.segments.map((x) => clean(x.reference)).filter(Boolean).join(' ');
          const o = { id: `${ch.chap_id}.${d.dua_id ?? 1}`, t: clean(d.duaname), s: segs };
          if (ref) o.ref = ref;
          const arAll = segs.map((x) => x.ar).join(' ');
          if (arAll) withAr++;
          // The English match: the most similar Arabic in the same chapter.
          if (enCh && arAll) {
            const A = norm(arAll);
            let best = -1, bs = 0;
            enCh.items.forEach((e, k) => { if (used.has(k)) return; const v = sim(A, norm(e.ARABIC_TEXT)); if (v > bs) { bs = v; best = k; } });
            if (best >= 0 && bs >= 0.45) {
              used.add(best); matched++;
              const e = enCh.items[best];
              o.en = clean(e.TRANSLATED_TEXT); o.tren = clean(e.LANGUAGE_ARABIC_TRANSLATED_TEXT);
              if (+e.REPEAT > 1) o.c = +e.REPEAT;
              if (e.AUDIO) o.au = e.AUDIO.replace(/^http:/, 'https:');
            }
          }
          if (qm && arAll) {
            const s = +qm[1], a = +qm[2], b = +(qm[3] || qm[2]);
            o.en = quranText(20, s, a, b); o.tren = quranTranslit(s, a, b); o.q = `${s}:${a}${b !== a ? '-' + b : ''}`;
            matched++;
          }
          // English the source lacks, translated for the app (tools/azkar/en_extra.json).
          if (!o.en && EXTRA[o.id]) { o.en = EXTRA[o.id].en; if (EXTRA[o.id].tren && EXTRA[o.id].tren !== '-') o.tren = EXTRA[o.id].tren; }
          if (!o.c) { const c = countFrom(segs.map((x) => `${x.n} ${x.after}`).join(' ')); if (c > 1) o.c = c; }
          o.cats = (d.categories || []).map((c) => c.id);
          dhikr.push({ ...o, book: bookId, ch: ch.chap_id });
          return o;
        });
        const chEn = enCh?.title || Object.entries(EXTRA).find(([k, v]) => k.startsWith(`${ch.chap_id}.`) && v.ch)?.[1].ch || TITLES[ch.chap_id] || '';
        chapters.push({ id: ch.chap_id, bn: clean(ch.chapname), en: chEn, n: items.length });
        fs.writeFileSync(path.join(OUT, `c${ch.chap_id}.json`), JSON.stringify(items));
      }));
    }
    chapters.sort((a, b) => a.id - b.id);
    books.push({ id: bookId, bn: { 1: 'হিসনুল মুসলিম', 2: 'কুরআনের দোয়া', 3: 'বিশেষ যিকর ও দোয়া' }[bookId], en: { 1: 'Hisnul Muslim', 2: 'Duas from the Quran', 3: 'Special adhkar' }[bookId], chapters });
    console.log('book', bookId, chapters.length, 'chapters');
  }

  // Category → the chapters and duas in it.
  const catOut = cats.map((c) => {
    const ids = dhikr.filter((d) => d.cats.includes(c.id)).map((d) => `${d.ch}:${d.id}`);
    return { id: c.id, bn: c.name, en: CAT_EN[c.name] || c.name, n: ids.length, items: ids };
  });
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({
    books, cats: catOut,
    source: 'Hisnul Muslim by Sa\'id ibn Wahf al-Qahtani. Bengali: ThelightHub/dua-api (MIT). English and recitation audio: hisnmuslim.com. Quranic duas in English: Saheeh International.',
  }));
  const size = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`dhikr ${dhikr.length}, with arabic ${withAr}, english ${matched}; ${(size / 1e6).toFixed(2)} MB`);
}

main().catch((e) => { console.error(e); process.exit(1); });

/// The English source has raw line breaks inside its strings, and one
/// chapter (126) has its title key without the closing quote.
function parseLoose(text) {
  let s = text.replace(/^﻿/, '').replace(/^(\{\s*"[^"\r\n]*?):?\s*\r?\n(\s*\[)/, '$1":\n$2');
  let out = '', inStr = false, esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) { esc = false; out += ch; continue; }
      if (ch === '\\') { esc = true; out += ch; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      out += ch.charCodeAt(0) < 0x20 ? ' ' : ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return JSON.parse(out);
}
