// Builds the hadith catalogue bundled in the Android app (assets/hadith):
// every book's chapters with Bengali names and hadith ranges, plus the three
// small Forty Hadith books in full. The big books download on the phone,
// chapter by chapter, from the same source (fawazahmed0/hadith-api).
//
//   node tools/build_hadith.mjs
import fs from 'node:fs';
import path from 'node:path';

const CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const OUT = path.resolve(import.meta.dirname, '../app/src/main/assets/hadith');
/// Bengali names for the chapters the source numbers 0.
const BN0 = { muslim: 'ভূমিকা (মুকাদ্দিমা)', ibnmajah: 'সুন্নাহ' };
const BN = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'hadith/sections_bn.json'), 'utf8'));

const BOOKS = [
  { id: 'bukhari', ar: 'صحيح البخاري', en: 'Sahih al-Bukhari', bn: 'সহীহ বুখারী', by_en: 'Imam al-Bukhari', by_bn: 'ইমাম বুখারী (রহ.)' },
  { id: 'muslim', ar: 'صحيح مسلم', en: 'Sahih Muslim', bn: 'সহীহ মুসলিম', by_en: 'Imam Muslim', by_bn: 'ইমাম মুসলিম (রহ.)' },
  { id: 'abudawud', ar: 'سنن أبي داود', en: 'Sunan Abu Dawud', bn: 'সুনান আবু দাউদ', by_en: 'Imam Abu Dawud', by_bn: 'ইমাম আবু দাউদ (রহ.)' },
  { id: 'tirmidhi', ar: 'جامع الترمذي', en: "Jami' at-Tirmidhi", bn: 'জামে আত-তিরমিযী', by_en: 'Imam at-Tirmidhi', by_bn: 'ইমাম তিরমিযী (রহ.)' },
  { id: 'nasai', ar: 'سنن النسائي', en: "Sunan an-Nasa'i", bn: 'সুনান আন-নাসাঈ', by_en: "Imam an-Nasa'i", by_bn: 'ইমাম নাসাঈ (রহ.)' },
  { id: 'ibnmajah', ar: 'سنن ابن ماجه', en: 'Sunan Ibn Majah', bn: 'সুনান ইবনে মাজাহ', by_en: 'Imam Ibn Majah', by_bn: 'ইমাম ইবনে মাজাহ (রহ.)' },
  { id: 'malik', ar: 'موطأ مالك', en: 'Muwatta Malik', bn: 'মুওয়াত্তা মালিক', by_en: 'Imam Malik', by_bn: 'ইমাম মালিক (রহ.)' },
  { id: 'nawawi', ar: 'الأربعون النووية', en: 'Forty Hadith of an-Nawawi', bn: 'আন-নাওয়াবীর চল্লিশ হাদীস', by_en: 'Imam an-Nawawi', by_bn: 'ইমাম নাওয়াবী (রহ.)', bundled: true },
  { id: 'qudsi', ar: 'الأحاديث القدسية', en: 'Forty Hadith Qudsi', bn: 'চল্লিশ হাদীসে কুদসী', by_en: 'Hadith Qudsi', by_bn: 'হাদীসে কুদসী', bundled: true },
  { id: 'dehlawi', ar: 'الأربعون للدهلوي', en: 'Forty Hadith of Shah Waliullah', bn: 'শাহ ওয়ালিউল্লাহর চল্লিশ হাদীস', by_en: 'Shah Waliullah Dehlawi', by_bn: 'শাহ ওয়ালিউল্লাহ দেহলভী (রহ.)', bundled: true },
];

const GITHUB = 'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1';

/// jsDelivr refuses files it hasn't cached from this large repository; GitHub has them all.
async function getAny(rel) {
  try { return await get(`${CDN}/${rel}`); } catch { return get(`${GITHUB}/${rel}`); }
}

async function get(url) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      if (i >= 4) throw new Error(`${r.status} ${url}`);
    } catch (e) { if (i >= 4) throw e; }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
}

const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(data));
};

/// Only what the reader uses: number, text, grades.
const slim = (h) => {
  const o = { n: h.hadithnumber, t: (h.text || '').trim() };
  if (h.arabicnumber !== h.hadithnumber) o.a = h.arabicnumber;
  if (h.grades?.length) o.g = h.grades.map((g) => [g.name, g.grade]);
  return o;
};

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  const editions = await get(`${CDN}/editions.json`);
  const info = await get(`${CDN}/info.json`);
  const books = [];
  for (const b of BOOKS) {
    const meta = info[b.id].metadata;
    const langs = editions[b.id].collection.map((c) => c.name.split('-')[0]).filter((l, i, a) => ['ara', 'eng', 'ben'].includes(l) && a.indexOf(l) === i);
    // Section 0 is a real chapter when the source names it (Muslim's
    // Introduction, Ibn Majah's Book of the Sunnah); otherwise it holds
    // hadiths left outside any chapter, which go to the chapter whose range
    // holds their number, or else the one just before them.
    const named = !!meta.sections['0'];
    const ranges = Object.entries(meta.section_details).filter(([n]) => n !== '0' || named).map(([n, d]) => [+n, d.hadithnumber_first, d.hadithnumber_last]).sort((x, y) => x[1] - y[1]);
    const home = (h) => {
      if (h.reference.book !== 0) return h.reference.book;
      const r = ranges.find(([, a, z]) => h.hadithnumber >= a && h.hadithnumber <= z) || ranges.filter(([, a]) => a <= h.hadithnumber).pop() || ranges[0];
      if (h.hadithnumber > r[2]) r[2] = h.hadithnumber;
      if (h.hadithnumber < r[1]) r[1] = h.hadithnumber;
      return r[0];
    };
    // Only hadiths with text in at least one language count (the source has
    // numbered placeholders, e.g. most of Muslim's Introduction).
    const texts = new Set();
    for (const l of ['ara', 'eng', 'ben']) {
      if (!editions[b.id].collection.some((c) => c.name === `${l}-${b.id}`)) continue;
      for (const h of (await getAny(`editions/${l}-${b.id}.min.json`)).hadiths) if ((h.text || '').trim()) texts.add(h.hadithnumber);
    }
    const counts = {};
    for (const h of info[b.id].hadiths) if (texts.has(h.hadithnumber)) counts[home(h)] = (counts[home(h)] || 0) + 1;
    else home(h);
    const sections = ranges.filter(([n]) => counts[n]).map(([n, a, z]) => ({
      n, en: b.bundled ? b.en : meta.sections[n], bn: b.bundled ? b.bn : BN[b.id]?.[n] || BN0[b.id] || meta.sections[n], from: a, to: z, count: counts[n],
    }));
    const extra = (counts[0] || 0) > 0 || info[b.id].hadiths.some((h) => h.reference.book === 0);
    books.push({ ...b, langs, count: sections.reduce((n, s) => n + s.count, 0), extra, sections });
    if (b.bundled) {
      for (const l of langs) {
        const e = await get(`${CDN}/editions/${l}-${b.id}.min.json`);
        write(`${b.id}/1/${l}.json`, e.hadiths.map(slim));
      }
    }
    console.log(b.id, langs.join(','), sections.length, 'chapters', extra ? '(+unassigned)' : '');
  }
  write('meta.json', {
    books,
    cdn: `${CDN}/editions`,
    source: 'Hadith texts, translations and grades: fawazahmed0/hadith-api (sunnah.com and other public sources). Bengali translations as published in Bangladesh.',
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
