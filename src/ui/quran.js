'use strict';
// Waqt Quran (phones): the whole Quran offline in Arabic (Uthmani with
// tajweed colours, or IndoPak) with English and Bengali translations and
// word-by-word meanings, and an audiobook that highlights each word as it
// is recited, then reads the meaning. Loaded by app.js on Android only.

const Q = { meta: null, ar: {}, tr: {}, wbw: { en: {}, bn: {} }, seg: {}, segWait: {}, st: null, p: { active: false }, tickAt: 0, tab: 'surah', cur: '', curW: 0, scrollAt: 0, view: null, voices: null };

const QDEF = () => ({
  script: 'uthmani', tajweed: true, arSize: 30, trSize: 16,
  en: 20, bn: 161, showEn: true, showBn: true, wbw: 'off', translit: false, keepOn: true,
  reciter: 7, speed: 1, repeat: 1, gap: 0, meaning: '', cont: true, follow: true,
  bm: {}, last: null, listen: null,
});

const QT = {
  en: {
    title: 'Al-Quran', sub: 'Read, listen and understand. The text works offline.', continue: 'Continue reading', audiobook: 'Audiobook', audiobook_d: 'Recitation with live word highlight and meaning',
    surahs: 'Surahs', juz: 'Juz', bookmarks: 'Bookmarks', search_ph: 'Search surah, verse or words…', verses: 'verses', makkah: 'Meccan', madinah: 'Medinan',
    no_bm: 'No bookmarks yet. Tap ☆ on any verse to keep it here.', play_surah: 'Play', settings: 'Quran settings', next_s: 'Next surah', prev_s: 'Previous surah',
    page: 'Page', sajdah: 'Sajdah', play_here: 'Play from this verse', memorize: 'Repeat this verse (memorize)', tafsir: 'Tafsir', copy: 'Copy', share: 'Share',
    bookmark: 'Bookmark', unbookmark: 'Remove bookmark', copied: 'Copied', reading: 'Reading', script: 'Arabic script', uthmani: 'Uthmani', indopak: 'IndoPak',
    tajweed: 'Tajweed colours', tajweed_d: 'Colour-coded rules of recitation', ar_size: 'Arabic size', tr_size: 'Translation size', en_tr: 'English translation',
    bn_tr: 'Bengali translation', none: 'Hidden', wbw: 'Word by word', wbw_d: 'The meaning under every Arabic word', off: 'Off', translit: 'Transliteration',
    keep_on: 'Keep the screen on while reading', listening: 'Listening', reciter: 'Reciter', meaning: 'Meaning after each verse', m_none: 'Recitation only',
    m_en: 'English (human voice)', m_ent: 'English (phone voice)', m_bn: 'বাংলা (phone voice)', m_enbn: 'English + বাংলা', speed: 'Speed', repeat: 'Repeat each verse',
    gap: 'Pause between verses', cont: 'Continue to the next surah', follow: 'Follow along', follow_d: 'Scroll to the verse being recited', downloads: 'Offline audio',
    downloads_d: 'Save a surah to listen without internet', download: 'Download', delete: 'Delete', saved_size: 'Saved on this phone', cancel: 'Cancel',
    voice_bn_missing: 'This phone has no Bengali voice yet. Install one to hear the Bengali meaning.', voice_en_missing: 'This phone has no English voice installed.',
    voice_fix: 'Install voice', sources: 'Sources', reciting: 'Reciting', en_meaning: 'English meaning', bn_meaning: 'Bengali meaning', start: 'Start listening',
    resume: 'Resume', from_verse: 'From verse', surah: 'Surah', sleep: 'Sleep timer', end_surah: 'End of surah', min: 'min', offline: 'No internet. Recitations stream online unless you download them.',
    results: 'results', no_results: 'Nothing found', searching: 'Searching the whole Quran…', of: 'of', tafsir_offline: 'The tafsir needs internet the first time it opens.',
    loading: 'Loading…', word: 'Word', play_word: 'Hear the word', legend: 'Tajweed colours', times: '×', forever: 'Until stopped', sec: 's', downloading: 'Downloading',
    dl_done: 'Saved for offline listening', none_saved: 'Nothing saved yet.', stop: 'Stop', all: 'All', meaning_note: 'Bengali and other phone-voice meanings use your phone\'s text-to-speech voice.',
    tafsir_choose: 'Choose a tafsir', last_listen: 'Last listened', bismillah: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
  },
  bn: {
    title: 'আল-কুরআন', sub: 'পড়ুন, শুনুন ও বুঝুন। টেক্সট ইন্টারনেট ছাড়াই চলে।', continue: 'পড়া চালিয়ে যান', audiobook: 'অডিওবুক', audiobook_d: 'তিলাওয়াতের সাথে শব্দে শব্দে হাইলাইট ও অর্থ',
    surahs: 'সূরা', juz: 'পারা', bookmarks: 'বুকমার্ক', search_ph: 'সূরা, আয়াত বা শব্দ খুঁজুন…', verses: 'আয়াত', makkah: 'মাক্কী', madinah: 'মাদানী',
    no_bm: 'এখনো কোনো বুকমার্ক নেই। যেকোনো আয়াতে ☆ চাপুন।', play_surah: 'শুনুন', settings: 'কুরআন সেটিংস', next_s: 'পরের সূরা', prev_s: 'আগের সূরা',
    page: 'পৃষ্ঠা', sajdah: 'সিজদা', play_here: 'এই আয়াত থেকে শুনুন', memorize: 'এই আয়াত বারবার (মুখস্থ)', tafsir: 'তাফসীর', copy: 'কপি', share: 'শেয়ার',
    bookmark: 'বুকমার্ক', unbookmark: 'বুকমার্ক সরান', copied: 'কপি হয়েছে', reading: 'পড়া', script: 'আরবি লিপি', uthmani: 'উসমানী', indopak: 'ইন্দোপাক (হাফেজী)',
    tajweed: 'তাজবীদ রং', tajweed_d: 'তিলাওয়াতের নিয়ম রঙে চিহ্নিত', ar_size: 'আরবি লেখার আকার', tr_size: 'অনুবাদের আকার', en_tr: 'ইংরেজি অনুবাদ',
    bn_tr: 'বাংলা অনুবাদ', none: 'লুকানো', wbw: 'শব্দে শব্দে অর্থ', wbw_d: 'প্রতিটি আরবি শব্দের নিচে অর্থ', off: 'বন্ধ', translit: 'উচ্চারণ (ইংরেজি হরফে)',
    keep_on: 'পড়ার সময় স্ক্রিন চালু রাখুন', listening: 'শোনা', reciter: 'ক্বারী', meaning: 'প্রতি আয়াতের পর অর্থ', m_none: 'শুধু তিলাওয়াত',
    m_en: 'ইংরেজি (মানুষের কণ্ঠ)', m_ent: 'ইংরেজি (ফোনের কণ্ঠ)', m_bn: 'বাংলা (ফোনের কণ্ঠ)', m_enbn: 'ইংরেজি + বাংলা', speed: 'গতি', repeat: 'প্রতি আয়াত পুনরাবৃত্তি',
    gap: 'আয়াতের মাঝে বিরতি', cont: 'পরের সূরায় চলতে থাকুক', follow: 'সাথে সাথে চলুক', follow_d: 'যে আয়াত পড়া হচ্ছে সেখানে স্ক্রল হবে', downloads: 'অফলাইন অডিও',
    downloads_d: 'ইন্টারনেট ছাড়া শুনতে সূরা সংরক্ষণ করুন', download: 'ডাউনলোড', delete: 'মুছুন', saved_size: 'এই ফোনে সংরক্ষিত', cancel: 'বাতিল',
    voice_bn_missing: 'এই ফোনে এখনো বাংলা কণ্ঠ নেই। বাংলা অর্থ শুনতে একটি ইনস্টল করুন।', voice_en_missing: 'এই ফোনে ইংরেজি কণ্ঠ নেই।',
    voice_fix: 'কণ্ঠ ইনস্টল করুন', sources: 'উৎস', reciting: 'তিলাওয়াত', en_meaning: 'ইংরেজি অর্থ', bn_meaning: 'বাংলা অর্থ', start: 'শোনা শুরু করুন',
    resume: 'আবার শুরু', from_verse: 'আয়াত থেকে', surah: 'সূরা', sleep: 'স্লিপ টাইমার', end_surah: 'সূরা শেষে', min: 'মিনিট', offline: 'ইন্টারনেট নেই। ডাউনলোড না করলে তিলাওয়াত অনলাইনে চলে।',
    results: 'ফলাফল', no_results: 'কিছু পাওয়া যায়নি', searching: 'পুরো কুরআনে খোঁজা হচ্ছে…', of: '/', tafsir_offline: 'প্রথমবার তাফসীর খুলতে ইন্টারনেট লাগে।',
    loading: 'লোড হচ্ছে…', word: 'শব্দ', play_word: 'শব্দটি শুনুন', legend: 'তাজবীদের রং', times: 'বার', forever: 'থামানো পর্যন্ত', sec: 'সে.', downloading: 'ডাউনলোড হচ্ছে',
    dl_done: 'অফলাইনে শোনার জন্য সংরক্ষিত', none_saved: 'এখনো কিছু সংরক্ষিত নেই।', stop: 'বন্ধ', all: 'সব', meaning_note: 'বাংলা ও ফোনের কণ্ঠের অর্থ আপনার ফোনের টেক্সট-টু-স্পিচ দিয়ে পড়া হয়।',
    tafsir_choose: 'তাফসীর বেছে নিন', last_listen: 'শেষ শোনা', bismillah: 'পরম করুণাময়, অতি দয়ালু আল্লাহর নামে।',
  },
};
const qt = (k) => QT[L()][k] ?? QT.en[k] ?? k;
const pad3 = (n) => String(n).padStart(3, '0');
const AR_DIGITS = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

async function qj(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}
const qMeta = async () => (Q.meta ??= await qj('/quran/meta.json'));
const qAr = async (s) => (Q.ar[s] ??= await qj(`/quran/ar/${pad3(s)}.json`));
const qTr = async (id, s) => ((Q.tr[id] ??= {})[s] ??= await qj(`/quran/t/${id}/${pad3(s)}.json`));
const qWbw = async (lang, s) => (Q.wbw[lang][s] ??= await qj(`/quran/wbw/${lang}/${pad3(s)}.json`));

async function qState() {
  if (!Q.st) {
    let saved = {};
    try { saved = await api('/api/quran/state'); } catch { /* first run */ }
    Q.st = { ...QDEF(), ...saved };
    Q.st.bm ??= {};
  }
  return Q.st;
}
function qSave() {
  clearTimeout(qSave.t);
  qSave.t = setTimeout(() => put('/api/quran/state', Q.st).catch(() => {}), 600);
}

const cname = (c) => (L() === 'bn' ? c.bn : c.en);
const cmean = (c) => (L() === 'bn' ? c.bn_t : c.en_t);
const trName = (tr) => (L() === 'bn' ? tr.name : tr.name_en || tr.name);
const recName = (r) => (L() === 'bn' ? r.name_bn : r.name) + (r.style && !/Murattal/.test(r.style) ? ` (${r.style})` : '');

/// A word's Arabic: tajweed markup ({rule|letters}) as coloured letters, or plain.
const qWord = (w, tajweed) => esc(w).replace(/\{([a-z_]+)\|([^}]*)\}/g, tajweed ? '<i class="tj-$1">$2</i>' : '$2');
const plainAr = (w) => w.replace(/\{[a-z_]+\|([^}]*)\}/g, '$1');

/// Arabic for search: no vowel marks, one form of alif, ya and ta marbuta.
const normAr = (s) => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

// ---------- Icons ----------
Object.assign(IC, {
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5" opacity=".6"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  prev: '<path d="M18 6 9 12l9 6z" fill="currentColor" stroke="none"/><path d="M6 6v12"/>',
  next: '<path d="m6 6 9 6-9 6z" fill="currentColor" stroke="none"/><path d="M18 6v12"/>',
  bmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  bmarked: '<path d="M6 3h12v18l-6-4.5L6 21z" fill="currentColor"/>',
  more: '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="m7 22-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  open: '<path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  moonz: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M15 3h4l-4 4h4" opacity=".7"/>',
});

// ---------- Router ----------
VIEWS.quran = async (tok) => {
  await Promise.all([qMeta(), qState()]);
  if (!live(tok)) return;
  const parts = location.hash.replace(/^#\/?quran\/?/, '').split('/').filter(Boolean);
  Q.view = null;
  if (!parts.length) return qHome(tok);
  if (parts[0] === 'listen') return qListen(tok);
  if (parts[0] === 'settings') return qSettings(tok);
  if (parts[0] === 'search') return qSearch(tok, decodeURIComponent(parts.slice(1).join('/')));
  const s = Math.min(114, Math.max(1, +parts[0] || 1));
  return qReader(tok, s, +parts[1] || 0);
};

// ---------- Home: surahs, juz, bookmarks ----------
async function qHome(tok) {
  const m = Q.meta, st = Q.st;
  const last = st.last && m.chapters[st.last.s - 1];
  const lis = st.listen && m.chapters[st.listen.s - 1];
  const list = Q.tab === 'juz' ? qJuzList() : Q.tab === 'bm' ? await qBmList() : qSurahList();
  if (!live(tok)) return;
  view.innerHTML = `<div class="qhome">
    <div class="qh-head"><div><h1>${esc(qt('title'))} <span class="ar gold qh-ar">القرآن الكريم</span></h1><p class="sub">${esc(qt('sub'))}</p></div>
      <a class="icon-btn" href="#/quran/settings" title="${esc(qt('settings'))}">${icon('sliders')}</a></div>
    <div class="qh-cards">
      ${last ? `<a class="qh-card read" href="#/quran/${st.last.s}/${st.last.v}">${icon('book')}<div><small>${esc(qt('continue'))}</small><b>${esc(cname(last))}</b><span>${N(`${st.last.s}:${st.last.v}`)}</span></div></a>` : ''}
      <a class="qh-card listen" href="#/quran/listen">${icon('headphones')}<div><small>${esc(qt('audiobook'))}</small><b>${lis ? esc(cname(lis)) + ' ' + N(`${st.listen.s}:${st.listen.v}`) : esc(qt('audiobook_d'))}</b>${lis ? `<span>${esc(qt('last_listen'))}</span>` : ''}</div></a>
    </div>
    <form class="search-box qsearch" data-qa="search">${icon('search')}<input class="input" id="qs-q" placeholder="${esc(qt('search_ph'))}" autocomplete="off" spellcheck="false" enterkeyhint="search"></form>
    <div class="seg qtabs"><button class="${Q.tab === 'surah' ? 'on' : ''}" data-qa="tab" data-v="surah">${esc(qt('surahs'))}</button><button class="${Q.tab === 'juz' ? 'on' : ''}" data-qa="tab" data-v="juz">${esc(qt('juz'))}</button><button class="${Q.tab === 'bm' ? 'on' : ''}" data-qa="tab" data-v="bm">${esc(qt('bookmarks'))}</button></div>
    <div class="qlist" id="qlist">${list}</div></div>`;
  // Live filter of the surah list as you type; Enter searches the text.
  $('#qs-q').addEventListener('input', (e) => {
    if (Q.tab !== 'surah') return;
    const q = e.target.value.trim().toLowerCase();
    $$('#qlist .qs-row').forEach((r) => { r.hidden = q && !r.dataset.f.includes(q); });
  });
}

function qSurahList() {
  return Q.meta.chapters.map((c) => `<a class="qs-row" href="#/quran/${c.id}" data-f="${esc(`${c.id} ${c.en} ${c.bn} ${c.en_t} ${c.bn_t} ${c.ar} ${normAr(c.ar)}`.toLowerCase())}">
    <span class="qs-n"><b>${N(c.id)}</b></span>
    <div class="qs-t"><b>${esc(cname(c))}</b><small>${esc(cmean(c))} · ${esc(qt(c.place))} · ${N(c.verses)} ${esc(qt('verses'))}</small></div>
    <span class="ar qs-ar">${c.ar}</span></a>`).join('');
}

function qJuzList() {
  return Q.meta.juz.map((j) => {
    const [s, v] = j.from.split(':').map(Number);
    const c = Q.meta.chapters[s - 1];
    return `<a class="qs-row" href="#/quran/${s}/${v}"><span class="qs-n"><b>${N(j.n)}</b></span>
      <div class="qs-t"><b>${esc(qt('juz'))} ${N(j.n)}</b><small>${esc(cname(c))} ${N(j.from)} → ${N(j.to)}</small></div><span class="qs-meta">${N(j.verses)} ${esc(qt('verses'))}</span></a>`;
  }).join('');
}

async function qBmList() {
  const keys = Object.keys(Q.st.bm).sort((a, b) => Q.st.bm[b] - Q.st.bm[a]);
  if (!keys.length) return `<div class="card muted" style="margin-top:8px">${esc(qt('no_bm'))}</div>`;
  const rows = await Promise.all(keys.map(async (k) => {
    const [s, v] = k.split(':').map(Number);
    const c = Q.meta.chapters[s - 1];
    const tid = L() === 'bn' ? (Q.st.bn || 161) : (Q.st.en || 20);
    const text = (await qTr(tid, s))[v - 1] || '';
    return `<div class="qs-row bm"><a class="qs-t" href="#/quran/${s}/${v}"><b>${esc(cname(c))} ${N(k)}</b><small>${esc(text.slice(0, 140))}${text.length > 140 ? '…' : ''}</small></a>
      <button class="icon-btn" data-qa="bm" data-k="${k}" title="${esc(qt('unbookmark'))}">${icon('bmarked')}</button></div>`;
  }));
  return rows.join('');
}

// ---------- Reader ----------
async function qReader(tok, s, v) {
  const m = Q.meta, st = Q.st, c = m.chapters[s - 1];
  const words = st.wbw !== 'off' || st.translit;
  const [ar, en, bn, we, wb] = await Promise.all([
    qAr(s),
    st.showEn && st.en ? qTr(st.en, s) : null,
    st.showBn && st.bn ? qTr(st.bn, s) : null,
    words ? qWbw('en', s) : null,
    st.wbw === 'bn' ? qWbw('bn', s) : null,
  ]);
  if (!live(tok)) return;
  Q.view = { s };
  Q.cur = ''; Q.curW = 0;
  const bism = s !== 1 && s !== 9;
  const juzStarts = new Set(m.juz.map((j) => j.from));
  const verses = ar.map((a, i) => {
    const n = i + 1;
    const mark = juzStarts.has(`${s}:${n}`) ? `<div class="qjuz">${esc(qt('juz'))} ${N(a.j)}</div>` : '';
    return mark + qVerse(s, n, a, en?.[i], bn?.[i], we?.[i], wb?.[i]);
  }).join('');
  const prev = s > 1 ? m.chapters[s - 2] : null, next = s < 114 ? m.chapters[s] : null;
  view.innerHTML = `<div class="qread" style="--ars:${st.arSize}px;--trs:${st.trSize}px">
    <div class="qr-bar"><a class="icon-btn" href="#/quran">${icon('back')}</a><div class="qr-t"><b>${esc(cname(c))}</b><small>${N(s)} · ${N(c.verses)} ${esc(qt('verses'))}</small></div>
      <button class="icon-btn" data-qa="play" data-s="${s}" data-v="1" title="${esc(qt('play_surah'))}">${icon('play')}</button><a class="icon-btn" href="#/quran/settings">${icon('sliders')}</a></div>
    <div class="qr-head"><div class="ar qr-name">${c.ar}</div><b>${esc(cname(c))}</b><small>${esc(cmean(c))} · ${esc(qt(c.place))} · ${N(c.verses)} ${esc(qt('verses'))}</small>
      ${bism ? `<div class="qr-bism ${st.script === 'indopak' ? 'ip' : ''}">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>` : ''}</div>
    <div class="qverses">${verses}</div>
    <div class="qr-nav">${prev ? `<a class="btn" href="#/quran/${s - 1}">${icon('chevL')}${esc(cname(prev))}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/quran/${s + 1}">${esc(cname(next))}${icon('chevR')}</a>` : ''}</div>
  </div>`;
  if (st.keepOn) nativeUi('keepScreenOn', 1);
  if (v > 1) qScrollTo(v);
  qWatchReading(s);
  qPaintPlaying(true);
}

/// Verses off screen are laid out lazily, so the first jump lands near the
/// verse; a few more settle it exactly.
function qScrollTo(v) {
  const token = (Q.jump = {});
  let n = 0, still = 0;
  const go = () => {
    const el = $(`#qv-${v}`);
    if (!el || Q.jump !== token) return;
    const top = el.getBoundingClientRect().top;
    el.scrollIntoView({ block: 'start' });
    still = Math.abs(el.getBoundingClientRect().top - top) < 3 ? still + 1 : 0;
    if (++n < 25 && still < 3) setTimeout(go, 100);
  };
  go();
  document.fonts?.ready.then(() => { if (Q.jump === token) { n = 0; still = 0; go(); } });
}
// A finger on the screen ends any jump in progress.
document.addEventListener('touchstart', () => { Q.jump = null; }, { passive: true });

function qVerse(s, n, a, en, bn, we, wb) {
  const st = Q.st;
  const ip = st.script === 'indopak';
  const ws = ip ? a.i : a.u;
  const wbw = st.wbw !== 'off';
  const arabic = ws.map((w, i) => {
    const txt = ip ? esc(w) : qWord(w, st.tajweed);
    if (!wbw) return `<span class="w" data-w="${i + 1}">${txt}</span>`;
    const mean = st.wbw === 'bn' ? wb?.[i] : we?.[i]?.[0];
    return `<span class="w wb" data-w="${i + 1}"><span class="wa">${txt}</span><small>${esc(mean || '')}</small>${st.translit ? `<em>${esc(we?.[i]?.[1] || '')}</em>` : ''}</span>`;
  }).join(' ');
  const key = `${s}:${n}`;
  const bm = Q.st.bm[key];
  return `<article class="qv" id="qv-${n}" data-v="${n}">
    <div class="qv-h"><span class="qv-k">${N(key)}</span>${a.s ? `<span class="qv-sj">۩ ${esc(qt('sajdah'))}</span>` : ''}
      <span class="qv-acts"><button data-qa="play" data-s="${s}" data-v="${n}">${icon('play')}</button><button data-qa="bm" data-k="${key}" class="${bm ? 'on' : ''}">${icon(bm ? 'bmarked' : 'bmark')}</button><button data-qa="vmore" data-s="${s}" data-v="${n}">${icon('more')}</button></span></div>
    <div class="qa ${ip ? 'ip' : ''} ${wbw ? 'wbw' : ''}" data-k="${key}" dir="rtl">${arabic} <span class="qend">${AR_DIGITS(n)}</span></div>
    ${st.translit && !wbw && we ? `<p class="qtl">${esc(we.map((x) => x[1]).join(' '))}</p>` : ''}
    ${en != null ? `<p class="qt en" lang="en">${esc(en)}</p>` : ''}
    ${bn != null ? `<p class="qt bn" lang="bn">${esc(bn)}</p>` : ''}
  </article>`;
}

/// Remembers the verse at the top of the screen as "continue reading".
function qWatchReading(s) {
  Q.obs?.disconnect();
  const seen = new Set();
  Q.obs = new IntersectionObserver((ents) => {
    for (const e of ents) { if (e.isIntersecting) seen.add(+e.target.dataset.v); else seen.delete(+e.target.dataset.v); }
    if (!seen.size || Q.view?.s !== s) return;
    const v = Math.min(...seen);
    if (Q.st.last?.s !== s || Q.st.last?.v !== v) { Q.st.last = { s, v }; qSave(); window.qOnRead?.(s, v); }
  }, { root: $('#scroll'), rootMargin: '-20% 0px -60% 0px' });
  $$('.qv').forEach((el) => Q.obs.observe(el));
}

// ---------- Playing: start, live highlight, mini player ----------
async function qPlay(s, v, extra = {}) {
  const st = Q.st;
  const c = Q.meta.chapters[s - 1];
  try {
    await post('/api/quran/play', {
      reciter: st.reciter, s, v, to: extra.to || 0, repeat: extra.repeat || st.repeat, loop: extra.loop || 0, gap: st.gap,
      meaning: st.meaning, en: st.en || 20, bn: st.bn || 161, next: extra.to ? false : st.cont, speed: st.speed, title: cname(c),
    });
    st.listen = { s, v }; qSave();
    Q.p = { ...Q.p, active: true, s, v, kind: 'ar', pos: 0, playing: true, loading: true, reciter: st.reciter, speed: st.speed };
    qBar();
    if (st.meaning && !Q.voices && /ent|bn/.test(st.meaning)) qCheckVoices();
  } catch (e) { toast(e.message); }
}

const qCmd = (cmd) => post('/api/quran/cmd', { cmd }).catch(() => {});

async function qCheckVoices() {
  try { Q.voices = await api('/api/quran/voices'); } catch { return; }
  const m = Q.st.meaning;
  if (m.includes('bn') && !Q.voices.bn) toast(qt('voice_bn_missing'), 6000);
  else if (m.includes('ent') && !Q.voices.en) toast(qt('voice_en_missing'), 6000);
}

window.onQuranTick = (p) => {
  const was = Q.p;
  Q.p = p; Q.tickAt = performance.now();
  if (p.active && p.s && (was.s !== p.s || was.v !== p.v)) { Q.st.listen = { s: p.s, v: p.v }; qSave(); }
  if (p.error === 'offline' && was.error !== 'offline') toast(qt('offline'), 5000);
  if (p.error === 'no_bn_voice' && was.error !== 'no_bn_voice') toast(qt('voice_bn_missing'), 6000);
  qBar();
  if (!qRaf) qRaf = requestAnimationFrame(qFrame);
};

let qRaf = 0;
function qFrame() {
  qRaf = 0;
  qPaintPlaying(false);
  if (Q.p.active && Q.p.playing) qRaf = requestAnimationFrame(qFrame);
}

/// Marks the verse being recited and, from the reciter's timings, the word.
function qPaintPlaying(force) {
  const p = Q.p;
  const key = p.active ? `${p.s}:${p.v}` : '';
  if (force || key !== Q.cur) {
    $$('.qv.now').forEach((e) => e.classList.remove('now'));
    $$('.qa .w.hl').forEach((e) => e.classList.remove('hl'));
    Q.cur = key; Q.curW = 0;
    if (key && Q.view?.s === p.s) {
      const el = $(`#qv-${p.v}`);
      el?.classList.add('now');
      if (el && Q.st.follow && !force && performance.now() - Q.scrollAt > 6000) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (key && Q.view?.s && Q.view.s !== p.s && Q.st.follow && !force && route() === 'quran' && Q.view.s === p.s - 1) {
      // The audiobook moved on to the next surah: so does the page.
      location.hash = `#/quran/${p.s}/${p.v}`;
      return;
    }
    if (Q.view?.listen) qListenVerse();
  }
  if (!key) return;
  let w = 0;
  if (p.kind === 'ar') {
    const seg = Q.seg[`${p.reciter}:${p.s}`];
    if (seg) {
      const at = p.pos + (p.playing ? (performance.now() - Q.tickAt) * (p.speed || 1) : 0);
      for (const [n, a, b] of seg[p.v] || []) if (at >= a && at < b) { w = n; break; }
    } else qLoadSeg(p.reciter, p.s);
  }
  if (Q.view?.listen) {
    $('#ql-phase') && ($('#ql-phase').textContent = qPhase(p.kind));
    $$('.ql-tr').forEach((e) => e.classList.toggle('on', (p.kind === 'bn' && e.classList.contains('bn')) || ((p.kind === 'en' || p.kind === 'ent') && e.classList.contains('en'))));
  }
  if (w === Q.curW) return;
  Q.curW = w;
  $$('.qa .w.hl').forEach((e) => e.classList.remove('hl'));
  if (w) $$(`.qa[data-k="${key}"] .w[data-w="${w}"]`).forEach((e) => e.classList.add('hl'));
}

async function qLoadSeg(r, s) {
  const k = `${r}:${s}`;
  if (Q.segWait[k]) return;
  Q.segWait[k] = true;
  try { Q.seg[k] = (await api(`/api/quran/segments?r=${r}&s=${s}`)).v; } catch { setTimeout(() => { Q.segWait[k] = false; }, 30000); }
}

const qPhase = (kind) => (kind === 'bn' ? qt('bn_meaning') : kind === 'en' || kind === 'ent' ? qt('en_meaning') : qt('reciting'));

/// The mini player above the tab bar, on every page while the audiobook runs.
function qBar() {
  let bar = $('#qbar');
  const p = Q.p;
  const show = p.active && !Q.view?.listen;
  document.body.classList.toggle('qb-on', !!show);
  if (!show) { if (bar) bar.hidden = true; return; }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'qbar'; bar.className = 'qbar';
    document.body.appendChild(bar);
  }
  bar.hidden = false;
  const c = Q.meta?.chapters[p.s - 1];
  if (!c) return;
  const pct = Math.round((p.v / c.verses) * 100);
  const sig = `${p.s}:${p.v}:${p.kind}:${p.playing}:${p.loading}`;
  if (bar.dataset.sig === sig) return;
  bar.dataset.sig = sig;
  bar.innerHTML = `<a class="qb-info" href="#/quran/listen"><b>${esc(cname(c))} ${N(`${p.s}:${p.v}`)}</b><small>${p.loading ? esc(qt('loading')) : esc(qPhase(p.kind))}</small><i style="--p:${pct}%"></i></a>
    <button data-qa="cmd" data-c="prev">${icon('prev')}</button><button class="qb-play" data-qa="cmd" data-c="toggle">${icon(p.playing ? 'pause' : 'play')}</button><button data-qa="cmd" data-c="next">${icon('next')}</button><button data-qa="cmd" data-c="stop">${icon('x')}</button>`;
}

// ---------- Audiobook ----------
async function qListen(tok) {
  const m = Q.meta, st = Q.st, p = Q.p;
  Q.view = { listen: true };
  qBar();
  const from = p.active ? p : st.listen || { s: 1, v: 1 };
  const c = m.chapters[from.s - 1];
  const opts = qListenOpts();
  view.innerHTML = `<div class="qlisten">
    <div class="qr-bar"><a class="icon-btn" href="#/quran">${icon('back')}</a><div class="qr-t"><b>${esc(qt('audiobook'))}</b><small>${esc(recName(m.reciters.find((r) => r.id === st.reciter) || m.reciters[0]))}</small></div><a class="icon-btn" href="#/quran/settings">${icon('sliders')}</a></div>
    <div id="ql-stage">${p.active ? '<div class="ql-card"></div>' : `<div class="card ql-start">
      <label>${esc(qt('surah'))}<select class="input" id="ql-s">${m.chapters.map((x) => `<option value="${x.id}" ${x.id === from.s ? 'selected' : ''}>${N(x.id)}. ${esc(cname(x))}</option>`).join('')}</select></label>
      <label>${esc(qt('from_verse'))}<input class="input" id="ql-v" type="number" min="1" max="${c.verses}" value="${from.v}" inputmode="numeric"></label>
      <button class="btn gold" data-qa="ql-start">${icon('play')}${esc(st.listen ? qt('resume') : qt('start'))}</button></div>`}</div>
    ${p.active ? `<div class="ql-ctl"><button data-qa="cmd" data-c="prev">${icon('prev')}</button><button class="ql-play" data-qa="cmd" data-c="toggle" id="ql-play">${icon(p.playing ? 'pause' : 'play')}</button><button data-qa="cmd" data-c="next">${icon('next')}</button></div>
      <div class="ql-prog"><input type="range" id="ql-seek" min="1" max="${c.verses}" value="${p.v}"><div><span id="ql-pos">${N(p.v)}</span> ${esc(qt('of'))} ${N(c.verses)}</div></div>` : ''}
    <div class="card ql-opts">${opts}</div>
  </div>`;
  if (p.active) qListenVerse(true);
  $('#ql-seek')?.addEventListener('change', (e) => qPlay(Q.p.s, +e.target.value));
  $('#ql-s')?.addEventListener('change', (e) => { const n = Q.meta.chapters[e.target.value - 1].verses; $('#ql-v').max = n; $('#ql-v').value = 1; });
  if (Q.st.keepOn) nativeUi('keepScreenOn', 1);
}

function qListenOpts() {
  const st = Q.st;
  const chip = (k, v, label) => `<button class="chip ${String(st[k]) === String(v) ? 'on' : ''}" data-qa="lopt" data-k="${k}" data-v="${v}">${esc(label)}</button>`;
  const sleep = Q.p.sleep ? Math.max(0, Math.round((Q.p.sleep - Date.now()) / 60000)) : 0;
  return `<div class="ql-row"><b>${esc(qt('meaning'))}</b><div class="chips">${[['', 'm_none'], ['en', 'm_en'], ['bn', 'm_bn'], ['en,bn', 'm_enbn'], ['ent', 'm_ent']].map(([v, k]) => chip('meaning', v, qt(k))).join('')}</div></div>
    <div class="ql-row"><b>${esc(qt('speed'))}</b><div class="chips">${[0.75, 1, 1.25, 1.5].map((v) => chip('speed', v, `${N(v)}×`)).join('')}</div></div>
    <div class="ql-row"><b>${esc(qt('repeat'))}</b><div class="chips">${[1, 2, 3, 5, 10].map((v) => chip('repeat', v, `${N(v)} ${qt('times')}`)).join('')}</div></div>
    <div class="ql-row"><b>${esc(qt('sleep'))}${sleep ? ` · ${N(sleep)} ${esc(qt('min'))}` : ''}</b><div class="chips">${[[0, qt('off')], [15, `${N(15)} ${qt('min')}`], [30, `${N(30)} ${qt('min')}`], [60, `${N(60)} ${qt('min')}`], [-1, qt('end_surah')]].map(([v, l]) => `<button class="chip" data-qa="sleep" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="ql-row"><b>${esc(qt('reciter'))}</b><select class="input" data-qk="reciter" data-num="1">${Q.meta.reciters.map((r) => `<option value="${r.id}" ${r.id === st.reciter ? 'selected' : ''}>${esc(recName(r))}</option>`).join('')}</select></div>
    <p class="muted ql-note">${esc(qt('meaning_note'))}</p>`;
}

/// The audiobook's verse card: the Arabic with the live word, and its meaning.
async function qListenVerse(force) {
  const p = Q.p, st = Q.st;
  const stage = $('#ql-stage');
  if (!stage || !p.active) return;
  const key = `${p.s}:${p.v}`;
  if (!force && stage.dataset.k === key) return;
  stage.dataset.k = key;
  const [ar, en, bn] = await Promise.all([qAr(p.s), qTr(st.en || 20, p.s), qTr(st.bn || 161, p.s)]);
  if (stage.dataset.k !== key) return;
  const c = Q.meta.chapters[p.s - 1];
  const a = ar[p.v - 1];
  const ip = st.script === 'indopak';
  const words = (ip ? a.i : a.u).map((w, i) => `<span class="w" data-w="${i + 1}">${ip ? esc(w) : qWord(w, st.tajweed)}</span>`).join(' ');
  stage.innerHTML = `<div class="ql-card"><div class="ql-head"><span class="ar">${c.ar}</span><b>${esc(cname(c))} · ${N(key)}</b><small id="ql-phase">${esc(qPhase(p.kind))}</small></div>
    <div class="qa ql-ar ${ip ? 'ip' : ''}" data-k="${key}" dir="rtl">${words} <span class="qend">${AR_DIGITS(p.v)}</span></div>
    ${st.showEn !== false ? `<p class="ql-tr en">${esc(en[p.v - 1] || '')}</p>` : ''}${st.showBn !== false ? `<p class="ql-tr bn" lang="bn">${esc(bn[p.v - 1] || '')}</p>` : ''}
    <a class="ql-read" href="#/quran/${p.s}/${p.v}">${icon('book')}${esc(L() === 'bn' ? 'পড়ার পাতায় খুলুন' : 'Open in reader')}</a></div>`;
  stage.classList.remove('fade'); void stage.offsetWidth; stage.classList.add('fade');
  if ($('#ql-seek')) { $('#ql-seek').max = c.verses; $('#ql-seek').value = p.v; $('#ql-pos').textContent = N(p.v); }
  if ($('#ql-play')) $('#ql-play').innerHTML = icon(p.playing ? 'pause' : 'play');
  Q.curW = 0;
}

// Keep the big play button in step between verses.
setInterval(() => {
  const b = $('#ql-play');
  if (b && Q.p.active) { const ic = Q.p.playing ? 'pause' : 'play'; if (b.dataset.ic !== ic) { b.dataset.ic = ic; b.innerHTML = icon(ic); } }
  if (Q.view?.listen && !Q.p.active && $('.ql-card') && !$('.ql-start')) render();
}, 400);

// ---------- Search ----------
async function qSearch(tok, q) {
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/quran">${icon('back')}</a><div class="qr-t"><b>“${esc(q)}”</b><small id="qs-n">${esc(qt('searching'))}</small></div></div><div id="qs-r" class="qresults"></div>`;
  const st = Q.st, m = Q.meta;
  const term = q.trim().toLowerCase();
  if (!term) return;
  // "2:255" or "2 255" jumps straight to the verse.
  const jump = term.match(/^(\d{1,3})[:\s.](\d{1,3})$/);
  if (jump && +jump[1] >= 1 && +jump[1] <= 114) { location.hash = `#/quran/${+jump[1]}/${+jump[2]}`; return; }
  const isAr = /[؀-ۿ]/.test(term);
  const nt = normAr(term);
  const ids = [st.en || 20, st.bn || 161];
  const hits = [];
  for (let s = 1; s <= 114 && hits.length < 300; s++) {
    const [ar, en, bn] = await Promise.all([qAr(s), qTr(ids[0], s), qTr(ids[1], s)]);
    if (!live(tok)) return;
    ar.forEach((a, i) => {
      if (hits.length >= 300) return;
      if (isAr ? normAr(a.u.map(plainAr).join(' ')).includes(nt) : (en[i].toLowerCase().includes(term) || bn[i].toLowerCase().includes(term))) {
        hits.push({ s, v: i + 1, ar: a.u.map(plainAr).join(' '), text: isAr ? (L() === 'bn' ? bn[i] : en[i]) : (en[i].toLowerCase().includes(term) ? en[i] : bn[i]) });
      }
    });
  }
  const mark = (txt) => {
    if (isAr) return esc(txt);
    const i = txt.toLowerCase().indexOf(term);
    if (i < 0) return esc(txt.slice(0, 200));
    const a = Math.max(0, i - 80);
    const end = i + term.length + 120;
    return (a ? '…' : '') + esc(txt.slice(a, i)) + `<mark>${esc(txt.slice(i, i + term.length))}</mark>` + esc(txt.slice(i + term.length, end)) + (end < txt.length ? '…' : '');
  };
  const names = m.chapters.filter((c) => `${c.en} ${c.bn} ${c.en_t} ${c.bn_t}`.toLowerCase().includes(term) || (isAr && normAr(c.ar).includes(nt)));
  $('#qs-n').textContent = `${N(hits.length + names.length)}${hits.length >= 300 ? '+' : ''} ${qt('results')}`;
  $('#qs-r').innerHTML = (names.map((c) => `<a class="qs-row" href="#/quran/${c.id}"><span class="qs-n"><b>${N(c.id)}</b></span><div class="qs-t"><b>${esc(cname(c))}</b><small>${esc(cmean(c))}</small></div><span class="ar qs-ar">${c.ar}</span></a>`).join('') +
    hits.map((h) => `<a class="qres" href="#/quran/${h.s}/${h.v}"><b>${esc(cname(m.chapters[h.s - 1]))} ${N(`${h.s}:${h.v}`)}</b>${isAr ? `<div class="ar">${esc(h.ar)}</div>` : ''}<p>${mark(h.text)}</p></a>`).join('')) ||
    `<div class="card muted">${esc(qt('no_results'))}</div>`;
}

// ---------- Settings ----------
async function qSettings(tok) {
  const st = Q.st, m = Q.meta;
  let dl = { surahs: [], bytes: 0, busy: false };
  try { dl = await api(`/api/quran/downloads?r=${st.reciter}`); } catch { /* ignore */ }
  if (!Q.voices) api('/api/quran/voices').then((v) => { Q.voices = v; if (route() === 'quran' && Q.view?.settings) qVoiceNote(); }).catch(() => {});
  if (!live(tok)) return;
  Q.view = { settings: true };
  const row = (label, help, control) => `<div class="srow"><div class="lab"><b>${esc(label)}</b>${help ? `<small>${esc(help)}</small>` : ''}</div>${control}</div>`;
  const tog = (k) => `<button class="toggle ${st[k] ? 'on' : ''}" data-qa="qtog" data-k="${k}" role="switch" aria-checked="${!!st[k]}"></button>`;
  const sel = (k, opts, num) => `<select class="input" data-qk="${k}" ${num ? 'data-num="1"' : ''}>${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(st[k]) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${String(st[k]) === String(v) ? 'on' : ''}" data-qa="qset" data-k="${k}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
  const range = (k, min, max) => `<input type="range" min="${min}" max="${max}" value="${st[k]}" data-qk="${k}" style="--p:${((st[k] - min) / (max - min)) * 100}%;width:150px"><span class="qsz" id="qsz-${k}">${N(st[k])}</span>`;
  const enOpts = [[0, qt('none')], ...m.translations.filter((x) => x.lang === 'en').map((x) => [x.id, x.name])];
  const bnOpts = [[0, qt('none')], ...m.translations.filter((x) => x.lang === 'bn').map((x) => [x.id, trName(x)])];
  const saved = dl.surahs.map((x) => `<div class="qdl-row"><span>${N(x.s)}. ${esc(cname(m.chapters[x.s - 1]))}</span><small>${N(x.have)}/${N(x.total)}</small><button class="btn small ghost" data-qa="dl-del" data-s="${x.s}">${esc(qt('delete'))}</button></div>`).join('');
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/quran">${icon('back')}</a><div class="qr-t"><b>${esc(qt('settings'))}</b></div></div>
  <section class="card sgroup"><h2>${icon('book')}${esc(qt('reading'))}</h2>
    ${themeRow()}
    ${row(qt('script'), '', seg('script', [['uthmani', qt('uthmani')], ['indopak', qt('indopak')]]))}
    ${st.script === 'uthmani' ? row(qt('tajweed'), qt('tajweed_d'), tog('tajweed')) + (st.tajweed ? qLegend() : '') : ''}
    <div class="qpreview" style="--ars:${st.arSize}px;--trs:${st.trSize}px"><div class="qa ${st.script === 'indopak' ? 'ip' : ''}" dir="rtl" id="qprev-ar"></div><p class="qt" id="qprev-tr"></p></div>
    ${row(qt('ar_size'), '', range('arSize', 20, 52))}
    ${row(qt('tr_size'), '', range('trSize', 13, 26))}
    ${row(qt('en_tr'), '', sel('en', enOpts, 1))}
    ${row(qt('bn_tr'), '', sel('bn', bnOpts, 1))}
    ${row(qt('wbw'), qt('wbw_d'), seg('wbw', [['off', qt('off')], ['en', 'English'], ['bn', 'বাংলা']]))}
    ${row(qt('translit'), '', tog('translit'))}
    ${row(qt('keep_on'), '', tog('keepOn'))}
  </section>
  <section class="card sgroup"><h2>${icon('headphones')}${esc(qt('listening'))}</h2>
    ${row(qt('reciter'), '', sel('reciter', m.reciters.map((r) => [r.id, recName(r)]), 1))}
    ${row(qt('meaning'), '', sel('meaning', [['', qt('m_none')], ['en', qt('m_en')], ['bn', qt('m_bn')], ['en,bn', qt('m_enbn')], ['ent', qt('m_ent')], ['ent,bn', `${qt('m_ent')} + বাংলা`]]))}
    <div id="qvoice"></div>
    ${row(qt('speed'), '', sel('speed', [0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => [v, `${N(v)}×`]), 1))}
    ${row(qt('repeat'), '', sel('repeat', [1, 2, 3, 5, 7, 10, 20].map((v) => [v, `${N(v)} ${qt('times')}`]), 1))}
    ${row(qt('gap'), '', sel('gap', [0, 1000, 2000, 3000, 5000, 10000].map((v) => [v, v ? `${N(v / 1000)} ${qt('sec')}` : qt('off')]), 1))}
    ${row(qt('cont'), '', tog('cont'))}
    ${row(qt('follow'), qt('follow_d'), tog('follow'))}
  </section>
  <section class="card sgroup"><h2>${icon('download')}${esc(qt('downloads'))}</h2>
    <p class="muted" style="margin:0 0 10px">${esc(qt('downloads_d'))} · ${esc(recName(m.reciters.find((r) => r.id === st.reciter) || m.reciters[0]))}</p>
    <div class="qdl-new"><select class="input" id="qdl-s">${m.chapters.map((c) => `<option value="${c.id}">${N(c.id)}. ${esc(cname(c))} (${N(c.verses)})</option>`).join('')}</select>
      <button class="btn small gold" data-qa="dl" ${dl.busy ? 'disabled' : ''}>${icon('download')}${esc(qt('download'))}</button></div>
    <div id="qdl-prog" class="qdl-prog" hidden><div><i></i></div><span></span><button class="btn small ghost" data-qa="dl-cancel">${esc(qt('cancel'))}</button></div>
    <div class="qdl-list">${saved || `<p class="muted">${esc(qt('none_saved'))}</p>`}</div>
    ${dl.bytes ? `<p class="muted" style="margin:8px 0 0">${esc(qt('saved_size'))}: ${N((dl.bytes / 1048576).toFixed(1))} MB <button class="btn small ghost" data-qa="dl-del" data-s="0">${esc(qt('delete'))} (${esc(qt('all'))})</button></p>` : ''}
  </section>
  <section class="card sgroup"><h2>${icon('info')}${esc(qt('sources'))}</h2><p class="muted" style="margin:0">${esc(m.source)}<br>${esc(m.translations.map((x) => x.name_en || x.name).join(' · '))}<br>${esc(m.english_audio.name)} (EveryAyah.com)<br>Tafsir: Quran.com</p></section>`;
  qPreview();
  qVoiceNote();
}

function qLegend() {
  const L_ = L() === 'bn'
    ? [['ham_wasl', 'হামযাতুল ওয়াসল / নীরব'], ['madda_normal', 'মাদ্দ (২)'], ['madda_permissible', 'মাদ্দ জায়েয (২/৪/৬)'], ['madda_obligatory_mottasel', 'মাদ্দ ওয়াজিব (৪/৫)'], ['madda_necessary', 'মাদ্দ লাযিম (৬)'], ['ghunnah', 'গুন্নাহ'], ['ikhafa', 'ইখফা'], ['idgham_ghunnah', 'ইদগাম গুন্নাহসহ'], ['idgham_wo_ghunnah', 'ইদগাম গুন্নাহ ছাড়া'], ['iqlab', 'ইকলাব'], ['qalaqah', 'কলকলা']]
    : [['ham_wasl', 'Hamzat al-wasl / silent'], ['madda_normal', 'Normal madd (2)'], ['madda_permissible', 'Permissible madd (2/4/6)'], ['madda_obligatory_mottasel', 'Obligatory madd (4/5)'], ['madda_necessary', 'Necessary madd (6)'], ['ghunnah', 'Ghunnah'], ['ikhafa', 'Ikhfa'], ['idgham_ghunnah', 'Idgham with ghunnah'], ['idgham_wo_ghunnah', 'Idgham without ghunnah'], ['iqlab', 'Iqlab'], ['qalaqah', 'Qalqalah']];
  return `<div class="qlegend">${L_.map(([k, l]) => `<span><i class="tj-${k}">●</i>${esc(l)}</span>`).join('')}</div>`;
}

async function qPreview() {
  const st = Q.st;
  const a = (await qAr(1))[1];
  const el = $('#qprev-ar');
  if (!el) return;
  el.innerHTML = (st.script === 'indopak' ? a.i.map(esc) : a.u.map((w) => qWord(w, st.tajweed))).join(' ') + ` <span class="qend">${AR_DIGITS(2)}</span>`;
  const tid = L() === 'bn' ? st.bn || st.en : st.en || st.bn;
  $('#qprev-tr').textContent = tid ? (await qTr(tid, 1))[1] : '';
}

function qVoiceNote() {
  const box = $('#qvoice');
  if (!box || !Q.voices) return;
  const m = Q.st.meaning;
  const need = (m.includes('bn') && !Q.voices.bn) ? 'voice_bn_missing' : (m.includes('ent') && !Q.voices.en) ? 'voice_en_missing' : '';
  box.innerHTML = need ? `<div class="banner warn" style="margin:4px 0 8px">${icon('speaker')}<div><small>${esc(qt(need))}</small></div><button class="btn small" data-qa="voice-fix">${esc(qt('voice_fix'))}</button></div>` : '';
}

// ---------- Verse menu, word popup, tafsir ----------
function qSheet(html) {
  let sh = $('#qsheet');
  if (!sh) { sh = document.createElement('div'); sh.id = 'qsheet'; sh.className = 'qsheet'; document.body.appendChild(sh); }
  sh.innerHTML = `<div class="qsheet-bg" data-qa="sheet-close"></div><div class="qsheet-box">${html}</div>`;
  sh.hidden = false;
  return sh;
}
const qSheetClose = () => { const sh = $('#qsheet'); if (sh) sh.hidden = true; };
window.addEventListener('hashchange', qSheetClose);

async function qVerseMenu(s, v) {
  const key = `${s}:${v}`;
  const bm = Q.st.bm[key];
  const m = Q.meta;
  const mine = m.tafsirs.filter((x) => x.lang === L()).concat(m.tafsirs.filter((x) => x.lang !== L()));
  qSheet(`<div class="qsh-t">${esc(cname(m.chapters[s - 1]))} ${N(key)}</div>
    <button data-qa="play" data-s="${s}" data-v="${v}">${icon('play')}${esc(qt('play_here'))}</button>
    <button data-qa="memorize" data-s="${s}" data-v="${v}">${icon('repeat')}${esc(qt('memorize'))}</button>
    <button data-qa="bm" data-k="${key}">${icon(bm ? 'bmarked' : 'bmark')}${esc(bm ? qt('unbookmark') : qt('bookmark'))}</button>
    <button data-qa="copy" data-s="${s}" data-v="${v}">${icon('copy')}${esc(qt('copy'))}</button>
    <button data-qa="share" data-s="${s}" data-v="${v}">${icon('share')}${esc(qt('share'))}</button>
    <div class="qsh-t sm">${esc(qt('tafsir'))}</div>
    ${mine.map((x) => `<button data-qa="tafsir" data-id="${x.id}" data-k="${key}">${icon('book')}${esc(trName(x))}</button>`).join('')}`);
}

async function qVerseText(s, v) {
  const st = Q.st;
  const a = (await qAr(s))[v - 1];
  const parts = [a.u.map(plainAr).join(' ')];
  if (st.en) parts.push((await qTr(st.en, s))[v - 1]);
  if (st.bn) parts.push((await qTr(st.bn, s))[v - 1]);
  const c = Q.meta.chapters[s - 1];
  return `${parts.join('\n\n')}\n\n— ${c.en} (${c.ar}) ${s}:${v}`;
}

async function qTafsir(id, key) {
  const x = Q.meta.tafsirs.find((t) => t.id === id);
  const sh = qSheet(`<div class="qsh-t">${esc(trName(x))} · ${N(key)}</div><div class="qtafsir muted">${esc(qt('loading'))}</div>`);
  try {
    const r = await api(`/api/quran/tafsir?id=${id}&key=${key}`);
    const box = $('.qtafsir', sh);
    box.classList.remove('muted');
    box.innerHTML = qClean(r.html) || '—';
    if (x.lang === 'bn') box.lang = 'bn';
  } catch { $('.qtafsir', sh).textContent = qt('tafsir_offline'); }
}

/// Tafsir HTML with only harmless tags and no attributes but class/dir.
function qClean(html) {
  const d = new DOMParser().parseFromString(String(html), 'text/html');
  d.querySelectorAll('script,style,iframe,object,embed,link,meta,img,form,input,button').forEach((e) => e.remove());
  d.querySelectorAll('*').forEach((e) => { for (const at of [...e.attributes]) if (!['class', 'dir', 'lang'].includes(at.name)) e.removeAttribute(at.name); });
  d.querySelectorAll('a').forEach((a) => a.replaceWith(...a.childNodes));
  return d.body.innerHTML;
}

async function qWordPop(s, v, w) {
  const [a, en, bn] = await Promise.all([qAr(s), qWbw('en', s), qWbw('bn', s)]);
  const st = Q.st;
  const ar = st.script === 'indopak' ? esc(a[v - 1].i[w - 1]) : qWord(a[v - 1].u[w - 1], st.tajweed);
  qSheet(`<div class="qword"><div class="qa ${st.script === 'indopak' ? 'ip' : ''}" dir="rtl">${ar}</div><em>${esc(en[v - 1][w - 1]?.[1] || '')}</em>
    <p lang="en">${esc(en[v - 1][w - 1]?.[0] || '')}</p><p lang="bn">${esc(bn[v - 1][w - 1] || '')}</p>
    <button class="btn" data-qa="word-audio" data-s="${s}" data-v="${v}" data-w="${w}">${icon('speaker')}${esc(qt('play_word'))}</button></div>`);
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const word = e.target.closest('.qverses .qa .w');
  if (word && !e.target.closest('[data-qa]')) {
    const k = word.closest('.qa').dataset.k.split(':').map(Number);
    qWordPop(k[0], k[1], +word.dataset.w);
    return;
  }
  const a = e.target.closest('[data-qa]');
  if (!a) return;
  const d = a.dataset;
  const st = Q.st;
  switch (d.qa) {
    case 'tab': Q.tab = d.v; render(); break;
    case 'play': qSheetClose(); await qPlay(+d.s, +d.v); break;
    case 'memorize': qSheetClose(); await qPlay(+d.s, +d.v, { to: +d.v, repeat: 1, loop: -1 }); toast(qt('memorize')); break;
    case 'cmd':
      if (d.c === 'stop') { Q.p = { active: false }; qBar(); }
      await qCmd(d.c);
      break;
    case 'bm': {
      if (st.bm[d.k]) delete st.bm[d.k]; else st.bm[d.k] = Date.now();
      qSave();
      qSheetClose();
      $$(`.qv-acts [data-qa="bm"][data-k="${d.k}"]`).forEach((b) => { b.classList.toggle('on', !!st.bm[d.k]); b.innerHTML = icon(st.bm[d.k] ? 'bmarked' : 'bmark'); });
      if (Q.tab === 'bm' && !Q.view) render();
      nativeUi('haptic');
      break;
    }
    case 'vmore': qVerseMenu(+d.s, +d.v); break;
    case 'copy': await post('/api/quran/copy', { text: await qVerseText(+d.s, +d.v) }); qSheetClose(); toast(qt('copied')); break;
    case 'share': await post('/api/quran/share', { text: await qVerseText(+d.s, +d.v) }); qSheetClose(); break;
    case 'tafsir': qTafsir(+d.id, d.k); break;
    case 'sheet-close': qSheetClose(); break;
    case 'word-audio': {
      const u = Q.meta.word_audio.replace('{s}', pad3(d.s)).replace('{v}', pad3(d.v)).replace('{w}', pad3(d.w));
      new Audio(u).play().catch(() => toast(qt('offline')));
      break;
    }
    case 'qtog': st[d.k] = !st[d.k]; qSave(); render(); break;
    case 'qset': st[d.k] = d.v; qSave(); render(); break;
    case 'lopt': {
      st[d.k] = d.k === 'meaning' ? d.v : +d.v;
      qSave();
      if (d.k === 'speed' && Q.p.active) await post('/api/quran/options', { speed: +d.v });
      else if (Q.p.active) await qPlay(Q.p.s, Q.p.v);
      $('.ql-opts').innerHTML = qListenOpts();
      break;
    }
    case 'sleep': await post('/api/quran/options', { sleep: +d.v }); toast(`${qt('sleep')}: ${a.textContent}`); setTimeout(() => { const o = $('.ql-opts'); if (o) o.innerHTML = qListenOpts(); }, 400); break;
    case 'ql-start': await qPlay(+$('#ql-s').value, Math.max(1, +$('#ql-v').value || 1)); setTimeout(render, 300); break;
    case 'voice-fix': await post('/api/quran/voice-install', {}); break;
    case 'dl': {
      const s = +$('#qdl-s').value;
      a.disabled = true;
      $('#qdl-prog').hidden = false;
      try {
        await post('/api/quran/download', { r: st.reciter, s, en: st.meaning.split(',').includes('en') });
        toast(qt('dl_done'));
      } catch (err) { toast(err.message === 'cancelled' ? qt('cancel') : err.message === 'busy' ? qt('downloading') : qt('offline'), 4000); }
      if (Q.view?.settings) render();
      break;
    }
    case 'dl-cancel': await post('/api/quran/download/cancel', {}); break;
    case 'dl-del': await post('/api/quran/download/delete', { r: st.reciter, s: +d.s }); render(); break;
  }
});

document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-qa="search"]')) return;
  e.preventDefault();
  const q = $('#qs-q').value.trim();
  if (q) location.hash = `#/quran/search/${encodeURIComponent(q)}`;
});

document.addEventListener('change', async (e) => {
  const el = e.target.closest('[data-qk]');
  if (!el) return;
  const k = el.dataset.qk;
  const st = Q.st;
  let v = el.value;
  if (el.dataset.num || el.type === 'range') v = +v;
  if (k === 'en') { st.en = v; st.showEn = !!v; } else if (k === 'bn') { st.bn = v; st.showBn = !!v; } else st[k] = v;
  qSave();
  if (k === 'reciter' && Q.p.active) await qPlay(Q.p.s, Q.p.v);
  if (k === 'meaning' && Q.p.active) await qPlay(Q.p.s, Q.p.v);
  if (k === 'speed' && Q.p.active) await post('/api/quran/options', { speed: v });
  if (el.type !== 'range') render();
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.type !== 'range' || !el.dataset.qk) return;
  const k = el.dataset.qk;
  el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
  const box = $('.qpreview');
  if (box) box.style.setProperty(k === 'arSize' ? '--ars' : '--trs', `${el.value}px`);
  const lab = $(`#qsz-${k}`);
  if (lab) lab.textContent = N(el.value);
});

// While you scroll by hand, the page stops following the recitation for a moment.
['touchmove', 'wheel'].forEach((ev) => document.addEventListener(ev, () => { Q.scrollAt = performance.now(); }, { passive: true }));

window.onQuranDownload = (s, done, total) => {
  const box = $('#qdl-prog');
  if (!box) return;
  box.hidden = false;
  $('i', box).style.width = `${Math.round((done / total) * 100)}%`;
  $('span', box).textContent = `${qt('downloading')} ${N(s)} · ${N(done)}/${N(total)}`;
};

// Back from installing a voice: check again.
const qResume = window.onNativeResume;
window.onNativeResume = async () => {
  Q.voices = null;
  await qResume?.();
  if (Q.view?.settings) render();
};

// The audiobook may already be playing when the app opens.
api('/api/quran/player').then(window.onQuranTick).catch(() => {});
