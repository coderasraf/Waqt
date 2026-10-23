// Builds the offline Quran bundled in the Android app (assets/quran) from
// the Quran.com API: Uthmani (with tajweed marks) and IndoPak words, nine
// English and Bengali translations, and word-by-word meanings.
//
//   node tools/build_quran.mjs
//
// Re-running replaces the data. Takes a few minutes (about 260 requests).
import fs from 'node:fs';
import path from 'node:path';
import { BN_NAMES } from './quran_bn_names.mjs';

const API = 'https://api.quran.com/api/v4';
const OUT = path.resolve(import.meta.dirname, '../app/src/main/assets/quran');

/// Translations bundled in the app. Quran.com resource ids.
const TRANSLATIONS = [
  { id: 20, lang: 'en', name: 'Saheeh International' },
  { id: 22, lang: 'en', name: 'Abdullah Yusuf Ali' },
  { id: 19, lang: 'en', name: 'M. Pickthall' },
  { id: 203, lang: 'en', name: 'Al-Hilali & Khan' },
  { id: 84, lang: 'en', name: 'Mufti Taqi Usmani' },
  { id: 161, lang: 'bn', name: 'তাইসীরুল কুরআন', name_en: 'Taisirul Quran' },
  { id: 213, lang: 'bn', name: 'ড. আবু বকর মুহাম্মাদ যাকারিয়া', name_en: 'Dr. Abu Bakr Muhammad Zakaria' },
  { id: 163, lang: 'bn', name: 'শেখ মুজিবুর রহমান', name_en: 'Sheikh Mujibur Rahman' },
  { id: 162, lang: 'bn', name: 'রাওয়াইউল বায়ান', name_en: 'Rawai Al-bayan' },
];

/// Online tafsirs offered per verse (fetched and cached on the phone).
const TAFSIRS = [
  { id: 169, lang: 'en', name: 'Ibn Kathir (abridged)' },
  { id: 168, lang: 'en', name: "Ma'arif al-Qur'an" },
  { id: 165, lang: 'bn', name: 'তাফসীর আহসানুল বায়ান', name_en: 'Tafsir Ahsanul Bayaan' },
  { id: 166, lang: 'bn', name: 'তাফসীর আবু বকর যাকারিয়া', name_en: 'Tafsir Abu Bakr Zakaria' },
  { id: 164, lang: 'bn', name: 'তাফসীর ইবনে কাসীর', name_en: 'Tafsir Ibn Kathir' },
  { id: 381, lang: 'bn', name: 'তাফসীর ফাতহুল মাজীদ', name_en: 'Tafsir Fathul Majid' },
];

const BN_RECITERS = {
  7: 'মিশারী রাশিদ আল-আফাসি', 2: 'আব্দুল বাসিত (মুরাত্তাল)', 1: 'আব্দুল বাসিত (মুজাওয়াদ)', 3: 'আব্দুর রহমান আস-সুদাইস',
  4: 'আবু বকর আল-শাতরি', 5: 'হানি আর-রিফাই', 6: 'মাহমুদ খলিল আল-হুসারি', 12: 'আল-হুসারি (মুআল্লিম)',
  9: 'মুহাম্মদ সিদ্দিক আল-মিনশাভি (মুরাত্তাল)', 8: 'আল-মিনশাভি (মুজাওয়াদ)', 10: 'সাউদ আশ-শুরাইম', 11: 'মুহাম্মদ আত-তাবলাভি',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      if (i >= 5) throw new Error(`${r.status} ${url}`);
    } catch (e) {
      if (i >= 5) throw e;
    }
    await sleep(800 * (i + 1));
  }
}

/// Footnote markers and stray tags out; entities decoded.
const clean = (s) => String(s ?? '')
  .replace(/<sup[^>]*>.*?<\/sup>/g, '')
  .replace(/<[^>]+>/g, '')
  // Footnote references some translations keep inline, like [১] or [12].
  .replace(/\s*\[[০-৯0-9]+\]/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

/// Tajweed markup kept, in a compact form the reader expands: <rule class=x>…</rule> → {x|…}.
const tajweed = (s) => String(s ?? '').replace(/<rule class=([a-z_]+)>(.*?)<\/rule>/g, (_, c, t) => `{${c}|${t}}`).replace(/<[^>]+>/g, '');

async function chapterVerses(c, wordLang) {
  const tr = TRANSLATIONS.map((t) => t.id).join(',');
  const fields = 'juz_number,page_number,hizb_number,rub_el_hizb_number,sajdah_number';
  const wf = wordLang === 'en' ? 'text_uthmani_tajweed,text_indopak' : 'text_uthmani';
  const out = [];
  for (let page = 1; ; page++) {
    const q = `${API}/verses/by_chapter/${c}?words=true&word_fields=${wf}&language=${wordLang}&word_translation_language=${wordLang}&fields=${fields}` +
      (wordLang === 'en' ? `&translations=${tr}` : '') + `&per_page=50&page=${page}`;
    const j = await get(q);
    out.push(...j.verses);
    if (!j.pagination.next_page) break;
  }
  return out;
}

const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data));
};

/// Only the Bengali word-by-word meanings (node tools/build_quran.mjs wbw-bn).
async function wbwBn() {
  let done = 0;
  const all = [...Array(114)].map((_, i) => i + 1);
  for (let i = 0; i < all.length; i += 4) {
    await Promise.all(all.slice(i, i + 4).map(async (c) => {
      const vb = await chapterVerses(c, 'bn');
      write(`wbw/bn/${String(c).padStart(3, '0')}.json`, vb.map((v) => v.words.filter((w) => w.char_type_name === 'word').map((w) => clean(w.translation?.text))));
      done++;
    }));
  }
  console.log(`wbw-bn: ${done}/114`);
}

async function main() {
  if (process.argv[2] === 'wbw-bn') return wbwBn();
  fs.rmSync(OUT, { recursive: true, force: true });
  const [en, bn, juzs] = await Promise.all([get(`${API}/chapters?language=en`), get(`${API}/chapters?language=bn`), get(`${API}/juzs`)]);

  // Reciters with word timings, and their per-verse file pattern.
  const recs = (await get(`${API}/resources/recitations?language=en`)).recitations;
  const reciters = [];
  for (const r of recs) {
    const a = (await get(`${API}/recitations/${r.id}/by_chapter/2?per_page=1&page=200&fields=segments`)).audio_files[0];
    if (!a?.segments?.length || !a.url.includes('002200')) continue;
    const base = a.url.startsWith('//') ? 'https:' + a.url : 'https://verses.quran.com/' + a.url;
    reciters.push({ id: r.id, name: r.reciter_name, name_bn: BN_RECITERS[r.id] || r.reciter_name, style: r.style || '', url: base.replace('002200', '{s}{v}') });
  }
  // A familiar voice first.
  reciters.sort((a, b) => (a.id === 7 ? -1 : b.id === 7 ? 1 : 0));

  const seen = new Set();
  const juz = juzs.juzs.filter((j) => !seen.has(j.juz_number) && seen.add(j.juz_number)).map((j) => {
    const keys = Object.entries(j.verse_mapping);
    const [s0, r0] = keys[0], [s1, r1] = keys[keys.length - 1];
    return { n: j.juz_number, from: `${s0}:${r0.split('-')[0]}`, to: `${s1}:${r1.split('-')[1]}`, verses: j.verses_count };
  }).sort((a, b) => a.n - b.n);

  const chapters = en.chapters.map((c, i) => ({
    id: c.id, ar: c.name_arabic, en: c.name_simple, bn: BN_NAMES[i],
    en_t: c.translated_name.name, bn_t: bn.chapters[i].translated_name.name, place: c.revelation_place, verses: c.verses_count,
    pages: c.pages, bismillah: c.bismillah_pre,
  }));

  let done = 0;
  const work = chapters.map((c) => async () => {
    const pad = String(c.id).padStart(3, '0');
    const [ve, vb] = await Promise.all([chapterVerses(c.id, 'en'), chapterVerses(c.id, 'bn')]);
    const words = (v) => v.words.filter((w) => w.char_type_name === 'word');
    write(`ar/${pad}.json`, ve.map((v) => {
      const o = { j: v.juz_number, p: v.page_number, r: v.rub_el_hizb_number, u: words(v).map((w) => tajweed(w.text_uthmani_tajweed)), i: words(v).map((w) => w.text_indopak) };
      if (v.sajdah_number) o.s = 1;
      return o;
    }));
    write(`wbw/en/${pad}.json`, ve.map((v) => words(v).map((w) => [clean(w.translation?.text), clean(w.transliteration?.text)])));
    write(`wbw/bn/${pad}.json`, vb.map((v) => words(v).map((w) => clean(w.translation?.text))));
    for (const t of TRANSLATIONS) {
      write(`t/${t.id}/${pad}.json`, ve.map((v) => clean(v.translations.find((x) => x.resource_id === t.id)?.text)));
    }
    const miss = ve.filter((v) => v.words.filter((w) => w.char_type_name === 'word').length !== vb[ve.indexOf(v)].words.filter((w) => w.char_type_name === 'word').length);
    if (miss.length) console.warn(`surah ${c.id}: word count differs in ${miss.length} verses`);
    console.log(`${++done}/114 ${c.en}`);
  });
  // Four at a time: kind to the API.
  for (let i = 0; i < work.length; i += 4) await Promise.all(work.slice(i, i + 4).map((f) => f()));

  write('meta.json', {
    chapters, juz, reciters,
    translations: TRANSLATIONS, tafsirs: TAFSIRS,
    english_audio: { name: 'Saheeh International, read by Ibrahim Walk', url: 'https://everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/{s}{v}.mp3' },
    word_audio: 'https://audio.qurancdn.com/wbw/{s}_{v}_{w}.mp3',
    source: 'Text, translations, word-by-word and timings: Quran.com (Quran Foundation). Uthmani font: King Fahd Glorious Quran Printing Complex.',
  });

  const total = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? total(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  console.log(`done: ${(total(OUT) / 1e6).toFixed(1)} MB, ${reciters.length} reciters`);
}

main().catch((e) => { console.error(e); process.exit(1); });
