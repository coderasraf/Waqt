'use strict';
// Waqt Hadith (phones): the six books and the Muwatta in Arabic, English and
// Bengali, saved on the phone chapter by chapter as they're read (or a whole
// book at once), plus the three Forty Hadith books built in. Uses quran.js's
// sheet and icons; loaded after it on Android only.

const H = { meta: null, st: null, status: {}, cache: {}, tab: 'books' };

const HDEF = () => ({ ar: true, en: true, bn: true, arSize: 22, size: 16, bm: {}, last: null });

const HT = {
  en: {
    title: 'Hadith', sub: 'The six books and more, in Arabic, English and Bengali.', books: 'Books', bookmarks: 'Bookmarks', hadiths: 'hadiths', chapters: 'chapters',
    of_day: 'Hadith of the day', continue: 'Continue reading', search_ph: 'Search hadith, or e.g. "Bukhari 52"', saved: 'Saved offline', read_online: 'Reads online',
    save: 'Save for offline', saving: 'Saving', delete: 'Remove from phone', about: 'about', offline_need: 'This chapter isn\'t saved yet and there\'s no internet. Save the book once to read it anywhere.',
    loading: 'Loading…', no_bm: 'No bookmarks yet. Tap ☆ on any hadith to keep it here.', results: 'results', no_results: 'Nothing found', searching: 'Searching…',
    search_scope: 'Searches the books saved on this phone and the built-in ones.', settings: 'Hadith settings', show_ar: 'Arabic text', show_en: 'English translation',
    show_bn: 'Bengali translation', ar_size: 'Arabic size', size: 'Translation size', copy: 'Copy', share: 'Share', bookmark: 'Bookmark', unbookmark: 'Remove bookmark',
    copied: 'Copied', grade: 'Grade', cancel: 'Cancel', built_in: 'Built in', not_in_lang: 'No Bengali translation for this book; showing English.', sources: 'Sources',
    open_book: 'Open book', chapter: 'Chapter', next_ch: 'Next chapter', prev_ch: 'Previous chapter', removed: 'Removed', done: 'Saved for offline reading',
  },
  bn: {
    title: 'হাদীস', sub: 'সিহাহ সিত্তাহ ও আরও কিতাব — আরবি, বাংলা ও ইংরেজিতে।', books: 'কিতাব', bookmarks: 'বুকমার্ক', hadiths: 'হাদীস', chapters: 'অধ্যায়',
    of_day: 'আজকের হাদীস', continue: 'পড়া চালিয়ে যান', search_ph: 'হাদীস খুঁজুন, বা যেমন "বুখারী ৫২"', saved: 'অফলাইনে সংরক্ষিত', read_online: 'অনলাইনে পড়া যায়',
    save: 'অফলাইনের জন্য সংরক্ষণ', saving: 'সংরক্ষণ হচ্ছে', delete: 'ফোন থেকে মুছুন', about: 'প্রায়', offline_need: 'এই অধ্যায় এখনো সংরক্ষিত নয়, আর ইন্টারনেটও নেই। যেকোনো জায়গায় পড়তে একবার কিতাবটি সংরক্ষণ করুন।',
    loading: 'লোড হচ্ছে…', no_bm: 'এখনো কোনো বুকমার্ক নেই। যেকোনো হাদীসে ☆ চাপুন।', results: 'ফলাফল', no_results: 'কিছু পাওয়া যায়নি', searching: 'খোঁজা হচ্ছে…',
    search_scope: 'এই ফোনে সংরক্ষিত ও অ্যাপের ভেতরের কিতাবে খোঁজে।', settings: 'হাদীস সেটিংস', show_ar: 'আরবি পাঠ', show_en: 'ইংরেজি অনুবাদ',
    show_bn: 'বাংলা অনুবাদ', ar_size: 'আরবি লেখার আকার', size: 'অনুবাদের আকার', copy: 'কপি', share: 'শেয়ার', bookmark: 'বুকমার্ক', unbookmark: 'বুকমার্ক সরান',
    copied: 'কপি হয়েছে', grade: 'মান', cancel: 'বাতিল', built_in: 'অ্যাপের ভেতরে', not_in_lang: 'এই কিতাবের বাংলা অনুবাদ নেই; ইংরেজি দেখানো হচ্ছে।', sources: 'উৎস',
    open_book: 'কিতাব খুলুন', chapter: 'অধ্যায়', next_ch: 'পরের অধ্যায়', prev_ch: 'আগের অধ্যায়', removed: 'মুছে ফেলা হয়েছে', done: 'অফলাইনে পড়ার জন্য সংরক্ষিত',
  },
};
const ht = (k) => HT[L()][k] ?? HT.en[k] ?? k;
const bname = (b) => (L() === 'bn' ? b.bn : b.en);
const sname = (s) => (L() === 'bn' ? s.bn : s.en);
/// Bengali digits typed in a search become numbers.
const enDigits = (s) => String(s).replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d));
/// Roughly how much a book takes on the phone (Arabic, English, Bengali text).
const bookMB = (b) => Math.max(1, Math.round((b.count * (b.langs.includes('ben') ? 3.9 : 1.9)) / 1024));

Object.assign(IC, {
  scroll: '<path d="M6 4h11a3 3 0 0 1 3 3v1h-4"/><path d="M16 8v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1h10v1a3 3 0 0 0 3 3"/><path d="M6 4a3 3 0 0 0-3 3v10M8 9h5M8 13h5" opacity=".7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
});

const hj = async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(String(r.status)); return r.json(); };
const hMeta = async () => (H.meta ??= await hj('/hadith/meta.json'));
const hBook = (id) => H.meta.books.find((b) => b.id === id);
async function hState() {
  if (!H.st) {
    let s = {};
    try { s = await api('/api/hadith/state'); } catch { /* first run */ }
    H.st = { ...HDEF(), ...s };
    H.st.bm ??= {};
  }
  return H.st;
}
function hSave() { clearTimeout(hSave.t); hSave.t = setTimeout(() => put('/api/hadith/state', H.st).catch(() => {}), 600); }
async function hStatus() { try { H.status = await api('/api/hadith/status'); } catch { /* ignore */ } return H.status; }
/// Every chapter file a book needs (with section 0 for its unassigned hadiths).
const hNeed = (b) => [...new Set([...b.sections.map((s) => s.n), ...(b.extra ? [0] : [])])];
const hSaved = (b) => b.bundled || (H.status[b.id]?.sections?.length || 0) >= hNeed(b).length;

/// One chapter in every language, merged by hadith number. Fetches and keeps it if it isn't on the phone yet.
async function hChapter(b, sec) {
  const key = `${b.id}:${sec.n}`;
  if (H.cache[key]) return H.cache[key];
  const langs = b.langs;
  const secs = b.bundled ? [1] : [...new Set([sec.n, ...(b.extra ? [0] : [])])];
  const base = b.bundled ? '/hadith' : '/hcache';
  const load = () => Promise.all(langs.map(async (l) => (await Promise.all(secs.map((s) => hj(`${base}/${b.id}/${s}/${l}.json`)))).flat()));
  let data;
  try { data = await load(); } catch {
    await post('/api/hadith/ensure', { b: b.id, s: secs, langs });
    data = await load();
  }
  const by = new Map();
  langs.forEach((l, i) => {
    for (const h of data[i]) {
      // Unassigned hadiths belong to the chapter whose range holds them.
      if (!b.bundled && (h.n < sec.from || h.n > sec.to)) continue;
      const o = by.get(h.n) || { n: h.n };
      // Some texts open with a stray full stop or danda.
      o[l] = h.t.replace(/^[\s।.]+/, '');
      if (h.g && !o.g) o.g = h.g;
      if (h.a && !o.a) o.a = h.a;
      by.set(h.n, o);
    }
  });
  const list = [...by.values()].filter((h) => h.ara || h.eng || h.ben).sort((x, y) => x.n - y.n);
  H.cache[key] = list;
  return list;
}

// ---------- Router ----------
VIEWS.hadith = async (tok) => {
  await Promise.all([hMeta(), hState(), hStatus()]);
  if (!live(tok)) return;
  const parts = location.hash.replace(/^#\/?hadith\/?/, '').split('/').filter(Boolean);
  if (!parts.length) return hHome(tok);
  if (parts[0] === 'search') return hSearch(tok, decodeURIComponent(parts.slice(1).join('/')));
  if (parts[0] === 'settings') return hSettings();
  const b = hBook(parts[0]);
  if (!b) return hHome(tok);
  if (!parts[1]) return hBookView(tok, b);
  return hRead(tok, b, +parts[1], +parts[2] || 0);
};

// ---------- Home ----------
async function hHome(tok) {
  const st = H.st, m = H.meta;
  const day = await hOfDay();
  if (!live(tok)) return;
  const last = st.last && hBook(st.last.b);
  const books = m.books.map((b) => {
    const saved = hSaved(b);
    return `<a class="hb-row" href="#/hadith/${b.id}"><div class="hb-ar ar">${b.ar}</div><div class="hb-t"><b>${esc(bname(b))}</b>
      <small>${esc(L() === 'bn' ? b.by_bn : b.by_en)} · ${N(b.count.toLocaleString('en'))} ${esc(ht('hadiths'))}</small>
      <span class="hb-st ${saved ? 'ok' : ''}">${b.bundled ? esc(ht('built_in')) : saved ? `✓ ${esc(ht('saved'))}` : `${esc(ht('read_online'))} · ${esc(ht('about'))} ${N(bookMB(b))} MB`}</span></div></a>`;
  }).join('');
  view.innerHTML = `<div class="qh-head"><div><h1>${esc(ht('title'))} <span class="ar gold qh-ar">الحديث الشريف</span></h1><p class="sub">${esc(ht('sub'))}</p></div>
      <a class="icon-btn" href="#/hadith/settings">${icon('sliders')}</a></div>
    ${day}
    ${last ? `<a class="qh-card read hd-last" href="#/hadith/${st.last.b}/${st.last.s}/${st.last.n}">${icon('scroll')}<div><small>${esc(ht('continue'))}</small><b>${esc(bname(last))} ${N(st.last.n)}</b></div></a>` : ''}
    <form class="search-box qsearch" data-ha="search">${icon('search')}<input class="input" id="hs-q" placeholder="${esc(ht('search_ph'))}" autocomplete="off" spellcheck="false" enterkeyhint="search"></form>
    <div class="seg qtabs"><button class="${H.tab === 'books' ? 'on' : ''}" data-ha="tab" data-v="books">${esc(ht('books'))}</button><button class="${H.tab === 'bm' ? 'on' : ''}" data-ha="tab" data-v="bm">${esc(ht('bookmarks'))}</button></div>
    <div class="qlist">${H.tab === 'bm' ? hBmList() : books}</div>`;
}

/// A different hadith each day from the built-in Forty Hadith books.
async function hOfDay() {
  try {
    const [nw, qd] = [hBook('nawawi'), hBook('qudsi')];
    const pool = [...(await hChapter(nw, nw.sections[0])).map((h) => [nw, h]), ...(await hChapter(qd, qd.sections[0])).map((h) => [qd, h])];
    const d = Math.floor(Date.now() / 86400000);
    const [b, h] = pool[d % pool.length];
    const text = (L() === 'bn' && h.ben) || h.eng || h.ben || '';
    return `<a class="card hd-day" href="#/hadith/${b.id}/1/${h.n}"><h3>${icon('scroll')}${esc(ht('of_day'))}</h3>
      <p>${esc(text.length > 320 ? text.slice(0, 320) + '…' : text)}</p><small>${esc(bname(b))} ${N(h.n)}</small></a>`;
  } catch { return ''; }
}

function hBmList() {
  const keys = Object.keys(H.st.bm).sort((a, b) => H.st.bm[b].t - H.st.bm[a].t);
  if (!keys.length) return `<div class="card muted" style="margin-top:8px">${esc(ht('no_bm'))}</div>`;
  return keys.map((k) => {
    const x = H.st.bm[k], b = hBook(x.b);
    if (!b) return '';
    return `<div class="qs-row bm"><a class="qs-t" href="#/hadith/${x.b}/${x.s}/${x.n}"><b>${esc(bname(b))} ${N(x.n)}</b><small>${esc(x.p || '')}</small></a>
      <button class="icon-btn" data-ha="bm" data-k="${k}">${icon('bmarked')}</button></div>`;
  }).join('');
}

// ---------- A book's chapters ----------
async function hBookView(tok, b) {
  const saved = hSaved(b);
  const have = new Set(H.status[b.id]?.sections || []);
  const bytes = H.status[b.id]?.bytes || 0;
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/hadith">${icon('back')}</a><div class="qr-t"><b>${esc(bname(b))}</b><small>${N(b.count.toLocaleString('en'))} ${esc(ht('hadiths'))} · ${N(b.sections.length)} ${esc(ht('chapters'))}</small></div></div>
    <div class="qr-head hb-head"><div class="ar qr-name">${b.ar}</div><b>${esc(bname(b))}</b><small>${esc(L() === 'bn' ? b.by_bn : b.by_en)}</small>
      ${b.bundled ? '' : `<div class="hb-save">${saved ? `<span class="hb-st ok">✓ ${esc(ht('saved'))} · ${N((bytes / 1048576).toFixed(1))} MB</span><button class="btn small ghost" data-ha="delete" data-b="${b.id}">${icon('trash')}${esc(ht('delete'))}</button>`
        : `<button class="btn small gold" data-ha="download" data-b="${b.id}" ${H.status.busy ? 'disabled' : ''}>${icon('download')}${esc(ht('save'))} · ${esc(ht('about'))} ${N(bookMB(b))} MB</button>`}
        <div class="qdl-prog" id="hdl-prog" hidden><div><i></i></div><span></span><button class="btn small ghost" data-ha="cancel">${esc(ht('cancel'))}</button></div></div>`}
      ${L() === 'bn' && !b.langs.includes('ben') ? `<p class="muted" style="margin:8px 0 0;font-size:13px">${esc(ht('not_in_lang'))}</p>` : ''}</div>
    <div class="qlist">${b.sections.map((s) => `<a class="qs-row" href="#/hadith/${b.id}/${s.n}"><span class="qs-n"><b>${N(s.n)}</b></span>
      <div class="qs-t"><b>${esc(sname(s))}</b><small>${L() === 'bn' ? esc(s.en) + ' · ' : ''}${N(s.from)}–${N(s.to)} · ${N(s.count)} ${esc(ht('hadiths'))}</small></div>${b.bundled || have.has(s.n) ? '<span class="hb-tick">✓</span>' : ''}</a>`).join('')}</div>`;
}

// ---------- Reading a chapter ----------
async function hRead(tok, b, sn, n) {
  const sec = b.sections.find((s) => s.n === sn) || b.sections[0];
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/hadith/${b.id}">${icon('back')}</a><div class="qr-t"><b>${esc(sname(sec))}</b><small>${esc(bname(b))} · ${N(sec.from)}–${N(sec.to)}</small></div><a class="icon-btn" href="#/hadith/settings">${icon('sliders')}</a></div>
    <div class="muted" style="padding:20px 4px">${esc(ht('loading'))}</div>`;
  let list;
  try { list = await hChapter(b, sec); } catch {
    if (live(tok)) view.querySelector('.muted').textContent = ht('offline_need');
    return;
  }
  if (!live(tok)) return;
  const i = b.sections.indexOf(sec);
  const prev = b.sections[i - 1], next = b.sections[i + 1];
  view.innerHTML = `<div class="hread" style="--hars:${H.st.arSize}px;--hs:${H.st.size}px">
    <div class="qr-bar"><a class="icon-btn" href="#/hadith/${b.id}">${icon('back')}</a><div class="qr-t"><b>${esc(sname(sec))}</b><small>${esc(bname(b))} · ${N(sec.from)}–${N(sec.to)}</small></div><a class="icon-btn" href="#/hadith/settings">${icon('sliders')}</a></div>
    <div class="hlist">${list.map((h) => hCard(b, sec, h)).join('')}</div>
    <div class="qr-nav">${prev ? `<a class="btn" href="#/hadith/${b.id}/${prev.n}">${icon('chevL')}${esc(sname(prev))}</a>` : '<span></span>'}${next ? `<a class="btn" href="#/hadith/${b.id}/${next.n}">${esc(sname(next))}${icon('chevR')}</a>` : ''}</div></div>`;
  if (n) hScrollTo(n);
  hWatch(b, sec);
}

/// Like the Quran reader: keep correcting until the hadith stays put (cards
/// off screen are laid out lazily, and the Arabic font arrives late).
function hScrollTo(n) {
  const token = (Q.jump = {});
  let k = 0, still = 0;
  const go = () => {
    // A number the source has no text for: the next hadith after it.
    const el = document.getElementById(`h-${String(n).replace('.', '_')}`) || $$('.hd').find((e) => +e.dataset.n >= n);
    if (!el || Q.jump !== token) return;
    const top = el.getBoundingClientRect().top;
    el.scrollIntoView({ block: 'start' });
    still = Math.abs(el.getBoundingClientRect().top - top) < 3 ? still + 1 : 0;
    if (++k < 30 && still < 3) setTimeout(go, 100);
  };
  go();
  document.fonts?.ready.then(() => { if (Q.jump === token) { k = 0; still = 0; go(); } });
}

const gradeClass = (g) => (/da.?if|munkar|mawdu|fabricat|weak|shadh/i.test(g) ? 'weak' : /hasan/i.test(g) ? 'hasan' : /sahih/i.test(g) ? 'sahih' : '');

function hCard(b, sec, h) {
  const st = H.st;
  const key = `${b.id}:${h.n}`;
  const bm = st.bm[key];
  const bnText = h.ben, enText = h.eng;
  const showBn = st.bn && bnText, showEn = st.en && enText;
  const grades = (h.g || []).slice(0, 3).map(([who, g]) => `<span class="hg ${gradeClass(g)}" title="${esc(who)}">${esc(g)}<i>${esc(who)}</i></span>`).join('');
  return `<article class="hd" id="h-${String(h.n).replace('.', '_')}" data-n="${h.n}">
    <div class="qv-h"><span class="qv-k">${esc(bname(b))} ${N(h.n)}</span><span class="qv-acts">
      <button data-ha="bm" data-k="${key}" data-s="${sec.n}" class="${bm ? 'on' : ''}">${icon(bm ? 'bmarked' : 'bmark')}</button>
      <button data-ha="more" data-b="${b.id}" data-s="${sec.n}" data-n="${h.n}">${icon('more')}</button></span></div>
    ${grades ? `<div class="hgs">${grades}</div>` : ''}
    ${st.ar && h.ara ? `<div class="hd-ar" dir="rtl" lang="ar">${esc(h.ara)}</div>` : ''}
    ${showEn ? `<p class="hd-tx" lang="en">${esc(enText)}</p>` : ''}
    ${showBn ? `<p class="hd-tx bn" lang="bn">${esc(bnText)}</p>` : ''}
    ${!showEn && !showBn && (enText || bnText) ? `<p class="hd-tx">${esc(enText || bnText)}</p>` : ''}
  </article>`;
}

/// Remembers where you are for "continue reading".
function hWatch(b, sec) {
  H.obs?.disconnect();
  const seen = new Set();
  H.obs = new IntersectionObserver((ents) => {
    for (const e of ents) { if (e.isIntersecting) seen.add(+e.target.dataset.n); else seen.delete(+e.target.dataset.n); }
    if (!seen.size) return;
    const n = Math.min(...seen);
    if (H.st.last?.n !== n || H.st.last?.b !== b.id) { H.st.last = { b: b.id, s: sec.n, n }; hSave(); }
  }, { root: $('#scroll'), rootMargin: '-20% 0px -60% 0px' });
  $$('.hd').forEach((el) => H.obs.observe(el));
}

// ---------- Search ----------
async function hSearch(tok, q) {
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/hadith">${icon('back')}</a><div class="qr-t"><b>“${esc(q)}”</b><small id="hs-n">${esc(ht('searching'))}</small></div></div>
    <p class="muted" style="margin:0 0 10px;font-size:13px">${esc(ht('search_scope'))}</p><div id="hs-r" class="qresults"></div>`;
  const term = enDigits(q.trim()).toLowerCase();
  // "Bukhari 52" / "বুখারী ৫২" / "muslim 1.2": straight to the hadith.
  const jump = term.match(/^(.+?)\s*[: ]\s*(\d+(?:\.\d+)?)$/);
  if (jump) {
    const name = jump[1].trim();
    const b = H.meta.books.find((x) => [x.id, x.en, x.bn, x.ar].some((s) => s.toLowerCase().includes(name)) || x.bn.includes(name));
    const num = +jump[2];
    const sec = b?.sections.find((s) => num >= s.from && num <= s.to);
    if (b && sec) { location.hash = `#/hadith/${b.id}/${sec.n}/${num}`; return; }
  }
  const isAr = /[؀-ۿ]/.test(term);
  const nt = isAr ? normAr(term) : term;
  const snippet = (h) => {
    const txt = isAr ? h.ara : ((h.eng || '').toLowerCase().includes(term) ? h.eng : h.ben) || '';
    const i = isAr ? -1 : txt.toLowerCase().indexOf(term);
    if (i < 0) return esc(txt.slice(0, 220)) + (txt.length > 220 ? '…' : '');
    const a = Math.max(0, i - 80), end = i + term.length + 120;
    return (a ? '…' : '') + esc(txt.slice(a, i)) + `<mark>${esc(txt.slice(i, i + term.length))}</mark>` + esc(txt.slice(i + term.length, end)) + (end < txt.length ? '…' : '');
  };
  const paint = (done) => {
    $('#hs-n').textContent = `${N(hits.length)}${hits.length >= 200 ? '+' : ''} ${ht('results')}`;
    $('#hs-r').innerHTML = hits.map(([b, sec, h]) => `<a class="qres" href="#/hadith/${b.id}/${sec.n}/${h.n}"><b>${esc(bname(b))} ${N(h.n)} · ${esc(sname(sec))}</b><p ${isAr ? 'class="ar" dir="rtl"' : ''}>${snippet(h)}</p></a>`).join('') ||
      `<div class="card muted">${esc(ht('no_results'))}</div>`;
    if (!done) $('#hs-n').textContent += ' · ' + ht('searching');
  };
  const hits = [];
  const books = H.meta.books.filter(hSaved);
  for (const b of books) {
    for (const sec of b.sections) {
      if (hits.length >= 200) break;
      let list;
      try { list = await hChapter(b, sec); } catch { continue; }
      if (!live(tok)) return;
      for (const h of list) {
        if (hits.length >= 200) break;
        const hay = isAr ? normAr(h.ara || '') : `${h.eng || ''} ${h.ben || ''}`.toLowerCase();
        if (hay.includes(nt)) hits.push([b, sec, h]);
      }
    }
    paint(false);
  }
  paint(true);
}

// ---------- Settings ----------
function hSettings() {
  const st = H.st;
  const row = (label, control) => `<div class="srow"><div class="lab"><b>${esc(label)}</b></div>${control}</div>`;
  const tog = (k) => `<button class="toggle ${st[k] ? 'on' : ''}" data-ha="tog" data-k="${k}" role="switch" aria-checked="${!!st[k]}"></button>`;
  const range = (k, min, max) => `<input type="range" min="${min}" max="${max}" value="${st[k]}" data-hk="${k}" style="--p:${((st[k] - min) / (max - min)) * 100}%;width:150px"><span class="qsz" id="hsz-${k}">${N(st[k])}</span>`;
  view.innerHTML = `<div class="qr-bar"><a class="icon-btn" href="#/hadith">${icon('back')}</a><div class="qr-t"><b>${esc(ht('settings'))}</b></div></div>
    <section class="card sgroup">${row(ht('show_ar'), tog('ar'))}${row(ht('show_en'), tog('en'))}${row(ht('show_bn'), tog('bn'))}
      <div class="hpreview" style="--hars:${st.arSize}px;--hs:${st.size}px"><div class="hd-ar" dir="rtl">إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</div><p class="hd-tx">${L() === 'bn' ? 'সমস্ত কাজের ফলাফল নির্ভর করে নিয়্যতের উপর।' : 'Actions are judged by intentions.'}</p></div>
      ${row(ht('ar_size'), range('arSize', 16, 36))}${row(ht('size'), range('size', 13, 24))}</section>
    <section class="card sgroup"><h2>${icon('info')}${esc(ht('sources'))}</h2><p class="muted" style="margin:0">${esc(H.meta.source)}</p></section>`;
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-ha]');
  if (!a) return;
  const d = a.dataset, st = H.st;
  switch (d.ha) {
    case 'tab': H.tab = d.v; render(); break;
    case 'tog': st[d.k] = !st[d.k]; hSave(); render(); break;
    case 'bm': {
      if (st.bm[d.k]) delete st.bm[d.k];
      else {
        const [b, n] = d.k.split(':');
        const card = a.closest('.hd');
        const p = card?.querySelector(L() === 'bn' ? '.hd-tx.bn' : '.hd-tx')?.textContent || card?.querySelector('.hd-tx')?.textContent || '';
        st.bm[d.k] = { b, n: +n, s: +d.s, t: Date.now(), p: p.slice(0, 160) };
      }
      hSave();
      if (a.closest('.qv-acts')) { a.classList.toggle('on', !!st.bm[d.k]); a.innerHTML = icon(st.bm[d.k] ? 'bmarked' : 'bmark'); } else render();
      nativeUi('haptic');
      break;
    }
    case 'more': {
      const b = hBook(d.b), sec = b.sections.find((s) => s.n === +d.s);
      const h = (await hChapter(b, sec)).find((x) => String(x.n) === d.n);
      const text = [h.ara, L() === 'bn' ? (h.ben || h.eng) : (h.eng || h.ben)].filter(Boolean).join('\n\n') + `\n\n— ${b.en} ${h.n}`;
      H.share = text;
      qSheet(`<div class="qsh-t">${esc(bname(b))} ${N(h.n)}</div>
        <button data-ha="copy">${icon('copy')}${esc(ht('copy'))}</button><button data-ha="share">${icon('share')}${esc(ht('share'))}</button>`);
      break;
    }
    case 'copy': await post('/api/quran/copy', { text: H.share }); qSheetClose(); toast(ht('copied')); break;
    case 'share': await post('/api/quran/share', { text: H.share }); qSheetClose(); break;
    case 'download': {
      const b = hBook(d.b);
      a.disabled = true;
      $('#hdl-prog').hidden = false;
      try {
        await post('/api/hadith/download', { b: b.id, s: hNeed(b), langs: b.langs });
        toast(ht('done'));
      } catch (err) { toast(err.message === 'cancelled' ? ht('cancel') : qt('offline'), 4000); }
      await hStatus();
      if (route() === 'hadith') render();
      break;
    }
    case 'cancel': await post('/api/hadith/download/cancel', {}); break;
    case 'delete': {
      await post('/api/hadith/delete', { b: d.b });
      for (const k of Object.keys(H.cache)) if (k.startsWith(`${d.b}:`)) delete H.cache[k];
      await hStatus(); toast(ht('removed')); render();
      break;
    }
  }
});

document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-ha="search"]')) return;
  e.preventDefault();
  const q = $('#hs-q').value.trim();
  if (q) location.hash = `#/hadith/search/${encodeURIComponent(q)}`;
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.type !== 'range' || !el.dataset.hk) return;
  const k = el.dataset.hk;
  el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
  $('.hpreview')?.style.setProperty(k === 'arSize' ? '--hars' : '--hs', `${el.value}px`);
  const lab = $(`#hsz-${k}`); if (lab) lab.textContent = N(el.value);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.type !== 'range' || !el.dataset.hk) return;
  H.st[el.dataset.hk] = +el.value; hSave();
});

window.onHadithDownload = (b, done, total) => {
  const box = $('#hdl-prog');
  if (!box) return;
  box.hidden = false;
  $('i', box).style.width = `${Math.round((done / total) * 100)}%`;
  $('span', box).textContent = `${ht('saving')} ${N(Math.round((done / total) * 100))}%`;
};
