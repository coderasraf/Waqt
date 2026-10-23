'use strict';
// Waqt Islamic baby names (phones): boys' and girls' names with their Arabic,
// Bengali and English spellings, meanings and origins — prophets, Companions,
// the women of the Quran and Sunnah, Abd- names, Quranic words and virtues.
// Browse by collection or letter, search (also by meaning), hear a name, keep
// a shortlist, find names by theme, match a name to the family (parents' and
// siblings' names), build the full name, and read the Sunnah of naming.

let BN_ALL = [];
const bnReady = fetch('/babynames.json').then((r) => r.json()).then((rows) => {
  BN_ALL = rows.map(([id, g, en, bn, ar, men, mbn, cat, oen, obn, th]) => ({ id, g, en, bn, ar, men, mbn, cat, oen, obn, th: th ? th.split(',') : [] }));
}).catch(() => {});
const BNM = { g: 'm', q: '', theme: '', letter: '', compare: [] };
const bnLoad = () => { try { return JSON.parse(localStorage.getItem('babynames') || '{}'); } catch { return {}; } };
const bnSt = () => ({ fav: {}, g: 'm', family: {}, ...bnLoad() });
const bnSave = (st) => { try { localStorage.setItem('babynames', JSON.stringify(st)); } catch { /* private mode */ } };
const bx = (pair) => pair[L() === 'bn' ? 1 : 0];

const BNT = {
  title: ['Islamic baby names', 'ইসলামিক নাম'], sub: ['Beautiful names with their meanings', 'অর্থসহ সুন্দর ইসলামিক নাম'],
  boy: ['Boy', 'ছেলে'], girl: ['Girl', 'মেয়ে'], boys: ['Boys', 'ছেলেদের নাম'], girls: ['Girls', 'মেয়েদের নাম'],
  search: ['Search a name or meaning', 'নাম বা অর্থ খুঁজুন'], today: ['Name of the day', 'আজকের নাম'],
  tools: ['Find the right name', 'সঠিক নাম খুঁজুন'], collections: ['Collections', 'সংগ্রহ'], letters: ['By first letter', 'প্রথম অক্ষর অনুযায়ী'],
  match: ['Family match', 'পরিবারের সাথে মিল'], match_d: ['Names that go with the parents\' and siblings\' names', 'বাবা-মা ও ভাইবোনের নামের সাথে মিলিয়ে'],
  finder: ['Name finder', 'নাম খোঁজার সহায়ক'], finder_d: ['By meaning and first letter', 'অর্থ ও প্রথম অক্ষর দিয়ে'],
  full: ['Full name builder', 'পূর্ণ নাম তৈরি'], full_d: ['First name, Muhammad and family name', 'নাম, মুহাম্মাদ ও পারিবারিক নাম'],
  twins: ['Twins & siblings', 'যমজ ও ভাইবোন'], twins_d: ['Pairs that go together', 'যে নামগুলো একসাথে মানায়'],
  check: ['Name checker', 'নামের অর্থ যাচাই'], check_d: ['What does a name mean?', 'একটি নামের অর্থ কী?'],
  favs: ['My shortlist', 'আমার পছন্দের তালিকা'], favs_d: ['Saved names, to share with family', 'সংরক্ষিত নাম, পরিবারের সাথে শেয়ার করুন'],
  sunnah: ['The Sunnah of naming', 'নাম রাখার সুন্নত'], sunnah_d: ['The best names, aqiqah and tahnik', 'সর্বোত্তম নাম, আকিকা ও তাহনিক'],
  meaning: ['Meaning', 'অর্থ'], origin: ['Origin', 'উৎস'], related: ['Similar names', 'কাছাকাছি নাম'], listen: ['Listen', 'শুনুন'],
  save: ['Save', 'সংরক্ষণ'], saved: ['Saved', 'সংরক্ষিত'], share: ['Share', 'শেয়ার'], use_full: ['Make the full name', 'পূর্ণ নাম তৈরি করুন'],
  names: ['names', 'টি নাম'], none: ['No names found', 'কোনো নাম পাওয়া যায়নি'], all: ['All', 'সব'],
  father: ['Father\'s name', 'বাবার নাম'], mother: ['Mother\'s name', 'মায়ের নাম'], siblings: ['Brothers\' and sisters\' names (optional)', 'ভাইবোনের নাম (ঐচ্ছিক)'],
  sib_ph: ['e.g. Sadia, Tahmid', 'যেমন: সাদিয়া, তাহমিদ'], baby: ['The baby is a', 'শিশু'], find: ['Find matching names', 'মিলিয়ে নাম খুঁজুন'],
  how: ['Matches by the first letter, the opening sound and the ending (rhyme). Write names in Bengali or English.', 'প্রথম অক্ষর, শুরুর ধ্বনি ও শেষের মিল (ছন্দ) দেখে নাম খোঁজা হয়। নাম বাংলা বা ইংরেজিতে লিখুন।'],
  r_first: ['Starts like', 'শুরু মিলে'], r_open: ['Sounds like', 'ধ্বনি মিলে'], r_rhyme: ['Rhymes with', 'ছন্দ মিলে'],
  theme_q: ['A meaning about…', 'যে অর্থের নাম চান…'], letter_q: ['Starting with', 'শুরুর অক্ষর'], results: ['Suggestions', 'প্রস্তাবিত নাম'],
  first: ['First name', 'নাম'], prefix: ['Before the name', 'নামের আগে'], family_n: ['Family name (optional)', 'পারিবারিক নাম (ঐচ্ছিক)'], none_p: ['None', 'নেই'],
  preview: ['The full name', 'পূর্ণ নাম'], pick: ['Choose a name', 'একটি নাম বেছে নিন'], copy: ['Copy', 'কপি'], copied: ['Copied', 'কপি হয়েছে'],
  type: ['Type a name', 'একটি নাম লিখুন'], found: ['In the list', 'তালিকায় আছে'], close: ['Close matches', 'কাছাকাছি নাম'],
  notfound: ['This name is not in our list. That does not make it wrong — ask a scholar about its meaning.', 'নামটি আমাদের তালিকায় নেই। এর মানে এটি ভুল নয় — অর্থের জন্য একজন আলেমকে জিজ্ঞেস করুন।'],
  compare: ['Compare', 'তুলনা'], share_list: ['Share the shortlist', 'তালিকা শেয়ার করুন'], empty_favs: ['Tap the heart on any name to save it here.', 'যেকোনো নামের হার্টে চাপ দিয়ে এখানে সংরক্ষণ করুন।'],
  note: ['Meanings are given as commonly understood. Choose a name with a good meaning, and ask a scholar if unsure.', 'অর্থগুলো প্রচলিত ব্যাখ্যা অনুযায়ী। সুন্দর অর্থের নাম রাখুন; সন্দেহ হলে একজন আলেমকে জিজ্ঞেস করুন।'],
};
const bt = (k) => bx(BNT[k]);
const BN_CATS = {
  m: [['prophet', ['Prophets', 'নবীদের নাম'], '#d99a1e'], ['sahabi', ['Companions', 'সাহাবিদের নাম'], '#30a46c'], ['abd', ['Servant of Allah (Abd-)', 'আব্দুল্লাহ ধরনের নাম'], '#5b5bd6'],
    ['quran', ['From the Quran', 'কুরআনের শব্দ'], '#12a594'], ['virtue', ['Good qualities', 'সুন্দর গুণের নাম'], '#0091ff'], ['nature', ['Nature', 'প্রকৃতি'], '#3fa34d'], ['righteous', ['Righteous men', 'নেককার ব্যক্তি'], '#a18072']],
  f: [['wife', ['Mothers of the Believers', 'উম্মুল মুমিনিন'], '#d6409f'], ['family', ['The Prophet\'s ﷺ family', 'নবী ﷺ-এর পরিবার'], '#e5484d'], ['sahabiya', ['Female Companions', 'মহিলা সাহাবি'], '#8e4ec6'],
    ['quran', ['From the Quran', 'কুরআনের শব্দ'], '#12a594'], ['virtue', ['Good qualities', 'সুন্দর গুণের নাম'], '#0091ff'], ['nature', ['Nature', 'প্রকৃতি'], '#3fa34d'], ['righteous', ['Righteous women', 'নেককার নারী'], '#a18072']],
};
const BN_THEMES = [['faith', ['Faith', 'ঈমান'], '🤲'], ['light', ['Light', 'আলো'], '✨'], ['peace', ['Peace', 'শান্তি'], '🕊'], ['knowledge', ['Knowledge', 'জ্ঞান'], '📖'],
  ['beauty', ['Beauty', 'সৌন্দর্য'], '🌸'], ['strength', ['Strength', 'শক্তি'], '🦁'], ['nature', ['Nature', 'প্রকৃতি'], '🌿'], ['kindness', ['Kindness', 'দয়া'], '💛'],
  ['joy', ['Joy', 'আনন্দ'], '☀️'], ['honour', ['Honour', 'মর্যাদা'], '👑'], ['gratitude', ['Gratitude', 'কৃতজ্ঞতা'], '🌙'], ['patience', ['Patience', 'ধৈর্য'], '⛰'], ['leader', ['Leadership', 'নেতৃত্ব'], '⭐']];
const catLabel = (g, c) => bx((BN_CATS[g].find((x) => x[0] === c) || [, ['', '']])[1]);
const nm2 = (x) => (L() === 'bn' ? x.bn : x.en);

// ---------- Helpers ----------
/// A name reduced to its letters, for matching; Bengali names keep their Bengali letters.
const bnKey = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zঀ-৿]/g, '');
const isBn = (s) => /[ঀ-৿]/.test(s);
/// The words of a parent's name that carry it (titles like Md., Mst., Sheikh dropped).
const BN_TITLES = ['md', 'mohammad', 'mohammed', 'muhammad', 'mohd', 'mst', 'most', 'mosammat', 'mosammad', 'sheikh', 'shaikh', 'syed', 'sayed', 'al', 'bin', 'binte', 'binti',
  'মো', 'মোঃ', 'মোহাম্মদ', 'মুহাম্মাদ', 'মুহাম্মদ', 'মোসাম্মত', 'মোছাঃ', 'মোসাঃ', 'শেখ', 'সৈয়দ', 'বিন', 'বিনতে'];
const coreWords = (name) => String(name).split(/[\s.,]+/).map((w) => w.trim()).filter((w) => w && !BN_TITLES.includes(bnKey(w)) && bnKey(w).length > 1);
/// The text to compare a dictionary name against: Bengali spelling for Bengali input.
const field = (x, bnScript) => bnKey(bnScript ? x.bn.split(' ').pop() : x.en.split(' ').pop());
const bnToday = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const bnOfDay = (g) => { const list = BN_ALL.filter((x) => x.g === g); return list[(bnToday() * 7 + (g === 'f' ? 3 : 0)) % list.length]; };
const bnRow = (x, extra = '') => {
  const fav = bnSt().fav[x.id];
  return `<a class="bb-row" href="#/babynames/n/${x.id}"><span class="bb-g ${x.g}">${esc((L() === 'bn' ? x.bn : x.en).slice(0, 1))}</span>
    <span class="bb-row-t"><b>${esc(nm2(x))}${L() === 'bn' ? '' : ` <em>${esc(x.bn)}</em>`}</b><small>${esc(L() === 'bn' ? x.mbn : x.men)}</small>${extra}</span>
    <span class="bb-ar" dir="rtl" lang="ar">${x.ar}</span>${fav ? `<span class="bb-heart">${icon('heartf')}</span>` : ''}</a>`;
};
const bnGseg = (g, act = 'g') => `<div class="p-seg wide bb-gseg"><button class="${g === 'm' ? 'on' : ''}" data-bn="${act}" data-v="m"><img src="/babynames/boy.webp" alt="">${esc(bt('boy'))}</button><button class="${g === 'f' ? 'on' : ''}" data-bn="${act}" data-v="f"><img src="/babynames/girl.webp" alt="">${esc(bt('girl'))}</button></div>`;

// =====================================================================
// Views
// =====================================================================
VIEWS.babynames = async (tok) => {
  await bnReady;
  if (!live(tok)) return;
  const [page, a, b] = location.hash.replace(/^#\/?babynames\/?/, '').split('/');
  const st = bnSt();
  BNM.g = st.g || 'm';
  if (page === 'n') return bnName(BN_ALL.find((x) => x.id === a));
  if (page === 'list') return bnList(a, decodeURIComponent(b || ''));
  if (page === 'match') return bnMatch();
  if (page === 'finder') return bnFinder();
  if (page === 'full') return bnFull(a);
  if (page === 'twins') return bnTwins();
  if (page === 'check') return bnCheck();
  if (page === 'favs') return bnFavs();
  if (page === 'sunnah') return bnSunnah();
  return bnHome();
};

function bnHome() {
  const g = BNM.g, st = bnSt();
  const d = bnOfDay(g);
  const count = BN_ALL.filter((x) => x.g === g).length;
  const tool = (href, img, title, sub, color) => `<a class="bb-tool" href="${href}" style="--tc:${color}"><span class="bb-ti">${img.startsWith('/') ? `<img src="${img}" alt="">` : icon(img)}</span><b>${esc(title)}</b><small>${esc(sub)}</small></a>`;
  const letters = [...new Set(BN_ALL.filter((x) => x.g === g).map((x) => (L() === 'bn' ? x.bn : x.en)[0]))].sort((x, y) => x.localeCompare(y, L() === 'bn' ? 'bn' : 'en'));
  const nfav = Object.keys(st.fav).length;
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('title'))}<p class="p-sub">${esc(bt('sub'))}</p>
    ${bnGseg(g)}
    <a class="bb-hero ${g}" href="#/babynames/n/${d.id}"><img src="/babynames/cradle.webp" alt="">
      <span class="bb-hero-t"><small>${esc(bt('today'))}</small><span class="bb-hero-ar" dir="rtl" lang="ar">${d.ar}</span><b>${esc(nm2(d))}</b><span>${esc(L() === 'bn' ? d.mbn : d.men)}</span></span></a>
    <label class="nm-search bb-search">${icon('search')}<input id="bb-q" type="search" autocomplete="off" placeholder="${esc(bt('search'))}" value="${esc(BNM.q)}"></label>
    <div id="bb-results"></div>
    <div id="bb-main">
      <h3 class="bb-h">${esc(bt('tools'))}</h3>
      <div class="bb-tools">
        ${tool('#/babynames/match', '/babynames/match.webp', bt('match'), bt('match_d'), '#e93d82')}
        ${tool('#/babynames/finder', 'sparkle', bt('finder'), bt('finder_d'), '#8e4ec6')}
        ${tool('#/babynames/full', 'list', bt('full'), bt('full_d'), '#0091ff')}
        ${tool('#/babynames/twins', 'heart', bt('twins'), bt('twins_d'), '#f76b15')}
        ${tool('#/babynames/check', 'check', bt('check'), bt('check_d'), '#30a46c')}
        ${tool('#/babynames/favs', 'heartf', `${bt('favs')}${nfav ? ` · ${N(nfav)}` : ''}`, bt('favs_d'), '#e5484d')}
      </div>
      <h3 class="bb-h">${esc(bt('collections'))} <small>${N(count)} ${esc(bt('names'))}</small></h3>
      <div class="p-group">${BN_CATS[g].map(([c, label, color]) => { const n = BN_ALL.filter((x) => x.g === g && x.cat === c).length; return n ? `<a class="p-row tap" href="#/babynames/list/${g}/${c}">${tile(c === 'abd' ? 'names' : c === 'prophet' ? 'scrollbook' : c === 'quran' ? 'book' : c === 'nature' ? 'sparkle' : c === 'wife' || c === 'family' ? 'heart' : 'star', color)}<span class="p-lab"><b>${esc(bx(label))}</b></span><span class="p-val">${N(n)}</span>${chev()}</a>` : ''; }).join('')}</div>
      <h3 class="bb-h">${esc(bt('letters'))}</h3>
      <div class="bb-letters">${letters.map((ch) => `<a href="#/babynames/list/${g}/~${encodeURIComponent(ch)}">${esc(ch)}</a>`).join('')}</div>
      <a class="dy-more" href="#/babynames/sunnah">${tile('moon', '#30a46c')}<span class="p-lab"><b>${esc(bt('sunnah'))}</b><small>${esc(bt('sunnah_d'))}</small></span>${chev()}</a>
      <div class="p-foot">${esc(bt('note'))}</div></div></div>`;
  const q = $('#bb-q');
  q.addEventListener('input', () => { BNM.q = q.value; bnSearch(); });
  if (BNM.q) bnSearch();
}

/// Search in all three scripts and in the meanings; exact starts first.
function bnSearch() {
  const q = bnKey(BNM.q), box = $('#bb-results'), main = $('#bb-main');
  if (!box) return;
  if (!q) { box.innerHTML = ''; main.hidden = false; return; }
  main.hidden = true;
  const ar = BNM.q.replace(/[ً-ٰٟ]/g, '');
  const score = (x) => {
    const en = bnKey(x.en), bnn = bnKey(x.bn);
    if (en.startsWith(q) || bnn.startsWith(q)) return 3;
    if (en.includes(q) || bnn.includes(q) || x.ar.replace(/[ً-ٰٟ]/g, '').includes(ar)) return 2;
    if (x.men.toLowerCase().includes(BNM.q.toLowerCase()) || x.mbn.includes(BNM.q)) return 1;
    return 0;
  };
  const hits = BN_ALL.map((x) => [score(x), x]).filter(([s]) => s).sort((a, b) => b[0] - a[0] || (a[1].g === BNM.g ? -1 : 1)).slice(0, 60).map(([, x]) => x);
  box.innerHTML = hits.length ? `<div class="bb-list">${hits.map((x) => bnRow(x)).join('')}</div>` : `<p class="bb-none">${esc(bt('none'))}</p>`;
}

function bnList(g, what) {
  const byLetter = what.startsWith('~');
  const ch = byLetter ? what.slice(1) : '';
  const list = BN_ALL.filter((x) => x.g === g && (byLetter ? (L() === 'bn' ? x.bn : x.en).startsWith(ch) : x.cat === what));
  const title = byLetter ? `${g === 'm' ? bt('boys') : bt('girls')} · ${ch}` : catLabel(g, what);
  view.innerHTML = `<div class="p-page bb">${ptitle(title, '#/babynames')}<p class="p-sub">${N(list.length)} ${esc(bt('names'))}</p>
    <div class="bb-list">${list.map((x) => bnRow(x)).join('') || `<p class="bb-none">${esc(bt('none'))}</p>`}</div></div>`;
}

function bnName(x) {
  if (!x) { location.hash = '#/babynames'; return; }
  const st = bnSt(), fav = !!st.fav[x.id];
  const k = bnKey(x.en.split(' ').pop());
  const related = BN_ALL.filter((y) => y !== x && y.g === x.g && (y.cat === x.cat || y.th.some((t) => x.th.includes(t))) && bnKey(y.en)[0] === k[0]).slice(0, 6);
  const more = related.length < 6 ? BN_ALL.filter((y) => y !== x && y.g === x.g && !related.includes(y) && y.th.some((t) => x.th.includes(t))).slice(0, 6 - related.length) : [];
  view.innerHTML = `<div class="p-page bb">${ptitle(nm2(x), '#/babynames')}
    <div class="bb-card ${x.g}">
      <span class="bb-chip">${esc(x.g === 'm' ? bt('boy') : bt('girl'))} · ${esc(catLabel(x.g, x.cat))}</span>
      <div class="bb-big" dir="rtl" lang="ar">${x.ar}</div>
      <b class="bb-n">${esc(x.bn)}</b><span class="bb-en">${esc(x.en)}</span>
      <button class="bb-listen" data-bn="say" data-id="${x.id}">${icon('speaker')}${esc(bt('listen'))}</button>
      <div class="bb-sec"><small>${esc(bt('meaning'))}</small><p>${esc(L() === 'bn' ? x.mbn : x.men)}</p>${L() === 'bn' ? `<p class="bb-alt">${esc(x.men)}</p>` : `<p class="bb-alt">${esc(x.mbn)}</p>`}</div>
      ${x.oen ? `<div class="bb-sec"><small>${esc(bt('origin'))}</small><p>${esc(L() === 'bn' ? x.obn || x.oen : x.oen)}</p></div>` : ''}
      ${x.th.length ? `<div class="bb-ths">${x.th.map((t) => { const th = BN_THEMES.find((y) => y[0] === t); return th ? `<a href="#/babynames/finder" data-bn="theme" data-v="${t}">${th[2]} ${esc(bx(th[1]))}</a>` : ''; }).join('')}</div>` : ''}
    </div>
    <div class="bb-acts"><button class="btn ${fav ? 'gold' : 'ghost'}" data-bn="fav" data-id="${x.id}">${icon(fav ? 'heartf' : 'heart')}${esc(fav ? bt('saved') : bt('save'))}</button>
      <button class="btn ghost" data-bn="share" data-id="${x.id}">${icon('share')}${esc(bt('share'))}</button></div>
    <a class="dy-more" href="#/babynames/full/${x.id}">${tile('list', '#0091ff')}<span class="p-lab"><b>${esc(bt('use_full'))}</b></span>${chev()}</a>
    ${related.length + more.length ? `<div class="p-head">${esc(bt('related'))}</div><div class="bb-list">${[...related, ...more].map((y) => bnRow(y)).join('')}</div>` : ''}</div>`;
}

// ---------- Family match: names that go with the family's names ----------
/// How a candidate relates to one family name: same first letter, same opening sound, or a rhyme.
function bnRelate(cand, word) {
  const bnScript = isBn(word);
  const w = bnKey(word), c = field(cand, bnScript);
  if (!w || !c || c === w) return null;
  const pre = (n) => c.slice(0, n) === w.slice(0, n);
  const suf = (n) => c.length > n && w.length > n && c.slice(-n) === w.slice(-n);
  if (pre(3)) return ['r_open', 5];
  if (suf(3)) return ['r_rhyme', 4];
  if (pre(2)) return ['r_open', 3];
  if (suf(2)) return ['r_rhyme', 2];
  if (pre(1)) return ['r_first', 2];
  return null;
}
function bnMatchList(g, family) {
  const people = [['father', family.father], ['mother', family.mother], ...String(family.sibs || '').split(/[,،;]+/).map((s) => ['sib', s.trim()])].filter(([, v]) => v);
  const taken = new Set(people.flatMap(([, v]) => coreWords(v).map(bnKey)));
  const out = [];
  for (const x of BN_ALL) {
    if (x.g !== g || taken.has(bnKey(x.en)) || taken.has(bnKey(x.bn))) continue;
    let score = 0; const why = [];
    for (const [who, full] of people) {
      let best = null;
      for (const w of coreWords(full)) { const r = bnRelate(x, w); if (r && (!best || r[1] > best[1])) best = [...r, w]; }
      if (best) { score += best[1] * (who === 'sib' ? 1.2 : 1); why.push([best[0], best[2], who]); }
    }
    if (score) out.push({ x, score: score + (x.cat === 'abd' && ['abdullah', 'abdurrahman'].includes(x.id) ? 0.5 : 0), why });
  }
  return out.sort((a, b) => b.score - a.score || a.x.en.localeCompare(b.x.en)).slice(0, 40);
}
function bnMatch() {
  const st = bnSt(), f = st.family || {};
  const g = BNM.g;
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('match'), '#/babynames')}
    <div class="bb-form">
      <img class="bb-art" src="/babynames/match.webp" alt="">
      <label><span>${esc(bt('father'))}</span><input id="bb-f" value="${esc(f.father || '')}" autocomplete="off" placeholder="${L() === 'bn' ? 'যেমন: রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}"></label>
      <label><span>${esc(bt('mother'))}</span><input id="bb-m" value="${esc(f.mother || '')}" autocomplete="off" placeholder="${L() === 'bn' ? 'যেমন: নুসরাত জাহান' : 'e.g. Nusrat Jahan'}"></label>
      <label><span>${esc(bt('siblings'))}</span><input id="bb-s" value="${esc(f.sibs || '')}" autocomplete="off" placeholder="${esc(bt('sib_ph'))}"></label>
      <span class="bb-flabel">${esc(bt('baby'))}</span>${bnGseg(g)}
      <button class="btn gold bb-go" data-bn="match">${icon('sparkle')}${esc(bt('find'))}</button>
      <p class="bb-how">${esc(bt('how'))}</p>
    </div>
    <div id="bb-match"></div></div>`;
  if (f.father || f.mother || f.sibs) bnMatchShow();
}
function bnMatchShow() {
  const st = bnSt(), f = st.family || {};
  const list = bnMatchList(BNM.g, f);
  const who = { father: bt('father'), mother: bt('mother'), sib: L() === 'bn' ? 'ভাইবোন' : 'sibling' };
  $('#bb-match').innerHTML = `<div class="p-head">${esc(bt('results'))} · ${N(list.length)}</div>${list.length ? `<div class="bb-list">${list.map(({ x, why }) => bnRow(x,
    `<span class="bb-why">${why.map(([r, w, p]) => `<i class="${r}">${esc(bt(r))} ${esc(w)}</i>`).join('')}</span>`)).join('')}</div>` : `<p class="bb-none">${esc(bt('none'))}</p>`}`;
  void who;
}

// ---------- Name finder: by theme and letter ----------
function bnFinder() {
  const g = BNM.g;
  const letters = [...new Set(BN_ALL.filter((x) => x.g === g).map((x) => (L() === 'bn' ? x.bn : x.en)[0]))].sort((a, b) => a.localeCompare(b, L() === 'bn' ? 'bn' : 'en'));
  const list = BN_ALL.filter((x) => x.g === g && (!BNM.theme || x.th.includes(BNM.theme)) && (!BNM.letter || (L() === 'bn' ? x.bn : x.en).startsWith(BNM.letter)));
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('finder'), '#/babynames')}${bnGseg(g)}
    <div class="p-head">${esc(bt('theme_q'))}</div>
    <div class="bb-themes">${[['', [bt('all'), bt('all')], '•'], ...BN_THEMES].map(([k, label, e]) => `<button class="${BNM.theme === k ? 'on' : ''}" data-bn="theme" data-v="${k}"><span>${e}</span>${esc(bx(label))}</button>`).join('')}</div>
    <div class="p-head">${esc(bt('letter_q'))}</div>
    <div class="bb-letters sm">${['', ...letters].map((ch) => `<button class="${BNM.letter === ch ? 'on' : ''}" data-bn="letter" data-v="${esc(ch)}">${esc(ch || bt('all'))}</button>`).join('')}</div>
    <div class="p-head">${esc(bt('results'))} · ${N(list.length)}</div>
    <div class="bb-list">${list.slice(0, 120).map((x) => bnRow(x)).join('') || `<p class="bb-none">${esc(bt('none'))}</p>`}</div></div>`;
}

// ---------- Full name builder ----------
function bnFull(id) {
  const st = bnSt();
  const x = BN_ALL.find((y) => y.id === (id || st.lastFull)) || null;
  if (x) { st.lastFull = x.id; bnSave(st); }
  const g = x ? x.g : BNM.g;
  const pre = st.prefix ?? (g === 'm' ? 'muhammad' : '');
  const fam = st.famname ?? (coreWords(st.family?.father || '').slice(-1)[0] || '');
  const P = g === 'm' ? [['', bt('none_p')], ['muhammad', L() === 'bn' ? 'মুহাম্মাদ' : 'Muhammad'], ['md', L() === 'bn' ? 'মোঃ' : 'Md.']] : [['', bt('none_p')], ['umme', L() === 'bn' ? 'উম্মে' : 'Umme']];
  const preTxt = (lang) => ({ muhammad: ['Muhammad', 'মুহাম্মাদ'], md: ['Md.', 'মোঃ'], umme: ['Umme', 'উম্মে'] }[pre]?.[lang === 'bn' ? 1 : 0] || '');
  const full = (lang) => x ? [preTxt(lang), lang === 'bn' ? x.bn : x.en, fam].filter(Boolean).join(' ') : '';
  const favs = BN_ALL.filter((y) => st.fav[y.id]);
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('full'), '#/babynames')}
    ${x ? `<div class="bb-full ${g}"><small>${esc(bt('preview'))}</small><b>${esc(full('bn'))}</b><span>${esc(full('en'))}</span>
      <p>${esc(L() === 'bn' ? x.mbn : x.men)}</p><button class="btn ghost small" data-bn="copyfull">${icon('copy')}${esc(bt('copy'))}</button></div>` : `<p class="bb-none">${esc(bt('pick'))}</p>`}
    <div class="p-head">${esc(bt('first'))}</div>
    <label class="nm-search">${icon('search')}<input id="bb-fq" type="search" autocomplete="off" placeholder="${esc(bt('search'))}" value="${x ? esc(nm2(x)) : ''}"></label>
    <div id="bb-fpick">${favs.length ? `<div class="bb-pills">${favs.map((y) => `<a href="#/babynames/full/${y.id}" class="${x === y ? 'on' : ''}">${esc(nm2(y))}</a>`).join('')}</div>` : ''}</div>
    <div class="p-head">${esc(bt('prefix'))}</div><div class="p-seg wide">${P.map(([k, l]) => `<button class="${pre === k ? 'on' : ''}" data-bn="prefix" data-v="${k}">${esc(l)}</button>`).join('')}</div>
    <div class="p-head">${esc(bt('family_n'))}</div>
    <label class="nm-search"><input id="bb-fam" autocomplete="off" value="${esc(fam)}" placeholder="${L() === 'bn' ? 'যেমন: ইসলাম, হোসেন, আহমেদ' : 'e.g. Islam, Hossain, Ahmed'}"></label></div>`;
  const fq = $('#bb-fq');
  fq.addEventListener('input', () => {
    const q = bnKey(fq.value);
    const hits = q ? BN_ALL.filter((y) => bnKey(y.en).startsWith(q) || bnKey(y.bn).startsWith(q)).slice(0, 12) : favs;
    $('#bb-fpick').innerHTML = `<div class="bb-pills">${hits.map((y) => `<a href="#/babynames/full/${y.id}">${esc(nm2(y))}</a>`).join('')}</div>`;
  });
  $('#bb-fam').addEventListener('change', (e) => { const s = bnSt(); s.famname = e.target.value.trim(); bnSave(s); render(); });
}

// ---------- Twins & siblings ----------
const BN_PAIRS = [['hasan', 'husain'], ['fatima', 'zainab'], ['musa', 'harun'], ['ibrahim', 'ismail'], ['yaqub', 'yusuf'], ['dawud', 'sulaiman'], ['zakariya', 'yahya'],
  ['abdullah', 'abdurrahman'], ['aisha', 'khadija'], ['maryam', 'asiya'], ['hajar', 'sara'], ['umar', 'uthman'], ['abubakr', 'umar'], ['ali', 'fatima'], ['safa', 'marwa']];
function bnTwins() {
  const by = Object.fromEntries(BN_ALL.map((x) => [x.id.replace(/-f$/, ''), x]));
  const find = (k) => by[k] || BN_ALL.find((x) => x.id === `${k}-f`);
  const pairs = BN_PAIRS.map(([a, b]) => [find(a), find(b)]).filter(([a, b]) => a && b);
  // Rhyming pairs from the list itself: same ending, same gender.
  const rhymes = [];
  for (const g of ['m', 'f']) {
    const list = BN_ALL.filter((x) => x.g === g && x.cat !== 'abd');
    const ends = {};
    for (const x of list) (ends[bnKey(x.en).slice(-3)] ||= []).push(x);
    for (const arr of Object.values(ends)) if (arr.length >= 2) rhymes.push([arr[0], arr[1]]);
  }
  const card = ([a, b]) => `<div class="bb-pair"><a href="#/babynames/n/${a.id}"><span class="bb-ar" dir="rtl" lang="ar">${a.ar}</span><b>${esc(nm2(a))}</b><small>${esc(L() === 'bn' ? a.mbn : a.men)}</small></a>
    <span class="bb-amp">&</span><a href="#/babynames/n/${b.id}"><span class="bb-ar" dir="rtl" lang="ar">${b.ar}</span><b>${esc(nm2(b))}</b><small>${esc(L() === 'bn' ? b.mbn : b.men)}</small></a></div>`;
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('twins'), '#/babynames')}<p class="p-sub">${esc(L() === 'bn' ? 'ইসলামের ইতিহাসে একসাথে স্মরণীয় নাম, আর ছন্দে মেলানো নাম' : 'Names remembered together in Islamic history, and names that rhyme')}</p>
    <div class="p-head">${esc(L() === 'bn' ? 'ইতিহাসে একসাথে' : 'Together in history')}</div><div class="bb-pairs">${pairs.map(card).join('')}</div>
    <div class="p-head">${esc(L() === 'bn' ? 'ছন্দে মেলানো' : 'Rhyming pairs')}</div><div class="bb-pairs">${rhymes.slice(0, 24).map(card).join('')}</div></div>`;
}

// ---------- Name checker ----------
function bnCheck() {
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('check'), '#/babynames')}
    <label class="nm-search bb-search">${icon('search')}<input id="bb-cq" autocomplete="off" placeholder="${esc(bt('type'))}"></label><div id="bb-cres"></div></div>`;
  const q = $('#bb-cq');
  q.focus();
  q.addEventListener('input', () => {
    const v = q.value.trim(), box = $('#bb-cres');
    if (!v) { box.innerHTML = ''; return; }
    const words = coreWords(v), keys = words.map(bnKey);
    const exact = BN_ALL.filter((x) => keys.includes(bnKey(x.en)) || keys.includes(bnKey(x.bn)) || keys.includes(bnKey(x.en.split(' ').pop())));
    const close = exact.length ? [] : BN_ALL.filter((x) => words.some((w) => bnRelate(x, w)?.[1] >= 4)).slice(0, 12);
    box.innerHTML = exact.length ? `<div class="p-head">${esc(bt('found'))}</div><div class="bb-list">${exact.map((x) => bnRow(x)).join('')}</div>`
      : `<p class="bb-note">${esc(bt('notfound'))}</p>${close.length ? `<div class="p-head">${esc(bt('close'))}</div><div class="bb-list">${close.map((x) => bnRow(x)).join('')}</div>` : ''}`;
  });
}

// ---------- Shortlist ----------
function bnFavs() {
  const st = bnSt();
  const list = BN_ALL.filter((x) => st.fav[x.id]).sort((a, b) => st.fav[b.id] - st.fav[a.id]);
  const cmp = BNM.compare.map((id) => BN_ALL.find((x) => x.id === id)).filter(Boolean);
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('favs'), '#/babynames')}
    ${list.length ? `<button class="btn gold bb-go" data-bn="sharelist">${icon('share')}${esc(bt('share_list'))}</button>` : `<div class="bb-empty"><img src="/babynames/cradle.webp" alt=""><p>${esc(bt('empty_favs'))}</p></div>`}
    ${cmp.length === 2 ? `<div class="p-head">${esc(bt('compare'))}</div><div class="bb-cmp">${cmp.map((x) => `<div><span class="bb-ar" dir="rtl" lang="ar">${x.ar}</span><b>${esc(nm2(x))}</b><small>${esc(L() === 'bn' ? x.mbn : x.men)}</small><em>${esc(catLabel(x.g, x.cat))}</em><i>${esc(L() === 'bn' ? x.obn || x.oen : x.oen)}</i></div>`).join('')}</div>` : ''}
    <div class="bb-list">${list.map((x) => `<div class="bb-frow">${bnRow(x)}<button class="bb-pickc ${BNM.compare.includes(x.id) ? 'on' : ''}" data-bn="cmp" data-id="${x.id}" aria-label="${esc(bt('compare'))}">${icon('check')}</button></div>`).join('')}</div>
    ${list.length > 1 ? `<p class="bb-how">${esc(L() === 'bn' ? 'দুটি নাম বেছে নিলে পাশাপাশি তুলনা দেখা যাবে।' : 'Tick two names to compare them side by side.')}</p>` : ''}</div>`;
}

// ---------- The Sunnah of naming ----------
function bnSunnah() {
  const items = [
    [['Give a good name', 'সুন্দর নাম রাখুন'], ['"You will be called on the Day of Resurrection by your names and your fathers\' names, so make your names good."', '"কিয়ামতের দিন তোমাদেরকে তোমাদের নাম ও তোমাদের পিতার নাম ধরে ডাকা হবে, তাই সুন্দর নাম রাখো।"'], 'Abu Dawud 4948'],
    [['The most beloved names', 'সবচেয়ে প্রিয় নাম'], ['"The most beloved of your names to Allah are Abdullah and Abdur Rahman."', '"আল্লাহর কাছে তোমাদের সবচেয়ে প্রিয় নাম হলো আব্দুল্লাহ ও আব্দুর রহমান।"'], 'Sahih Muslim 2132'],
    [['Names of the prophets', 'নবীদের নাম'], ['The Prophet ﷺ named his son Ibrahim, after the prophet Ibrahim (AS), and said: "Name yourselves with my name."', 'নবী ﷺ তাঁর ছেলের নাম রেখেছিলেন ইবরাহিম, নবী ইবরাহিম (আ.)-এর নামে, এবং বলেছেন: "আমার নামে নাম রাখো।"'], 'Sahih Muslim 2315, Sahih al-Bukhari 3539'],
    [['Aqiqah on the seventh day', 'সপ্তম দিনে আকিকা'], ['"Every child is held in pledge for his aqiqah, which is slaughtered for him on the seventh day; his head is shaved and he is given a name." For a boy two sheep, for a girl one.', '"প্রত্যেক শিশু তার আকিকার সাথে বন্ধক থাকে; সপ্তম দিনে তার পক্ষ থেকে জবাই করা হয়, মাথা মুণ্ডন করা হয় এবং নাম রাখা হয়।" ছেলের জন্য দুটি, মেয়ের জন্য একটি ছাগল।'], 'Abu Dawud 2838, Tirmidhi 1513'],
    [['Tahnik', 'তাহনিক'], ['When a child was born, the Prophet ﷺ chewed a date and put a little of it in the baby\'s mouth, and prayed for blessing for him.', 'শিশু জন্মের পর নবী ﷺ খেজুর চিবিয়ে তার সামান্য শিশুর মুখে দিতেন এবং বরকতের দোয়া করতেন।'], 'Sahih al-Bukhari 5467'],
    [['Changing a name with a bad meaning', 'খারাপ অর্থের নাম বদলানো'], ['The Prophet ﷺ changed names with bad meanings to good ones — he changed \'Asiyah (disobedient) to Jamilah (beautiful).', 'নবী ﷺ খারাপ অর্থের নাম বদলে সুন্দর নাম রাখতেন — তিনি "আসিয়া" (অবাধ্য) নাম বদলে "জামিলা" (সুন্দর) রেখেছিলেন।'], 'Sahih Muslim 2139'],
    [['Names to avoid', 'যে নাম রাখা উচিত নয়'], ['Avoid names that mean servant of anyone other than Allah (such as Abdun Nabi), names of Allah alone that belong only to Him (such as Ar-Rahman, Al-Khaliq), and names with bad or proud meanings.', 'আল্লাহ ছাড়া অন্য কারও বান্দা অর্থের নাম (যেমন আব্দুন নবী), শুধু আল্লাহর জন্য নির্দিষ্ট নাম (যেমন আর-রহমান, আল-খালিক) এবং খারাপ বা অহংকারী অর্থের নাম এড়িয়ে চলুন।'], ''],
  ];
  view.innerHTML = `<div class="p-page bb">${ptitle(bt('sunnah'), '#/babynames')}<img class="bb-art" src="/babynames/cradle.webp" alt="">
    ${items.map(([t, p, s]) => `<div class="bb-sun"><b>${esc(bx(t))}</b><p>${esc(bx(p))}</p>${s ? `<small>${esc(s)}</small>` : ''}</div>`).join('')}</div>`;
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-bn]');
  if (!a) return;
  const d = a.dataset, st = bnSt();
  const x = d.id ? BN_ALL.find((y) => y.id === d.id) : null;
  switch (d.bn) {
    case 'g': st.g = d.v; BNM.g = d.v; bnSave(st); if (location.hash.includes('/match')) { bnMatch(); } else render(); nativeUi('haptic'); break;
    case 'fav': if (st.fav[x.id]) delete st.fav[x.id]; else st.fav[x.id] = Date.now(); bnSave(st); nativeUi('haptic'); render(); break;
    case 'say': a.classList.add('on'); try { await post('/api/qaida/say', { text: x.ar, rate: 0.8, lang: 'ar' }); } catch { toast(L() === 'bn' ? 'আরবি ভয়েস ইনস্টল করুন' : 'Install the Arabic voice'); } a.classList.remove('on'); break;
    case 'share': await post('/api/quran/share', { text: `${x.bn} · ${x.en}\n${x.ar}\n\n${x.mbn}\n${x.men}${x.oen ? `\n\n${L() === 'bn' ? x.obn || x.oen : x.oen}` : ''}\n\n— Waqt` }).catch(() => {}); break;
    case 'match': {
      st.family = { father: $('#bb-f').value.trim(), mother: $('#bb-m').value.trim(), sibs: $('#bb-s').value.trim() };
      bnSave(st); nativeUi('haptic'); bnMatchShow();
      $('#bb-match').scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'theme': BNM.theme = d.v; if (location.hash !== '#/babynames/finder') return; render(); break;
    case 'letter': BNM.letter = d.v; render(); break;
    case 'prefix': st.prefix = d.v; bnSave(st); render(); break;
    case 'copyfull': await post('/api/quran/copy', { text: `${$('.bb-full b').textContent}\n${$('.bb-full span').textContent}` }); toast(bt('copied')); break;
    case 'cmp': {
      BNM.compare = BNM.compare.includes(d.id) ? BNM.compare.filter((i) => i !== d.id) : [...BNM.compare, d.id].slice(-2);
      render(); break;
    }
    case 'sharelist': {
      const list = BN_ALL.filter((y) => st.fav[y.id]);
      await post('/api/quran/share', { text: `${bt('favs')}\n\n${list.map((y) => `• ${y.bn} (${y.en}) — ${L() === 'bn' ? y.mbn : y.men}`).join('\n')}\n\n— Waqt` }).catch(() => {});
      break;
    }
  }
});
