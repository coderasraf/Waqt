'use strict';
// Waqt 99 Names of Allah (phones): al-Asma al-Husna in the order narrated by
// at-Tirmidhi (3507), each with its meaning, a short explanation and a verse
// where the name or its attribute appears. Learn them with flashcards on a
// spaced schedule (like Hifz), test yourself, and meet one name each day on
// Today. Names are spoken by the phone's Arabic voice. Loaded after qaida.js
// (uses its voice, quiz styles and tr2/B from salah.js).

// The names live in names.json, which the home-screen widget reads too:
// [Arabic, transliteration, English meaning, Bengali pronunciation, Bengali meaning, English explanation, Bengali explanation, verse]
let NAMES = [];
const nmReady = fetch('/names.json').then((r) => r.json()).then((rows) => {
  NAMES = rows.map(([ar, tr, en, bnp, bn, xen, xbn, ref], i) => ({ n: i + 1, ar, tr, en, bnp, bn, xen, xbn, ref }));
}).catch(() => {});

const NMT = {
  title: ['99 Names of Allah', 'আল্লাহর ৯৯ নাম'], sub: ['Al-Asma al-Husna — the most beautiful names', 'আল-আসমাউল হুসনা — সবচেয়ে সুন্দর নামসমূহ'],
  hadith: ['"Allah has ninety-nine names, one hundred less one; whoever learns them by heart will enter Paradise."', '"আল্লাহর নিরানব্বইটি নাম আছে, এক কম একশো; যে তা মুখস্থ করবে, সে জান্নাতে প্রবেশ করবে।"'], hsrc: ['Sahih al-Bukhari 2736, Sahih Muslim 2677', 'সহীহ বুখারী ২৭৩৬, সহীহ মুসলিম ২৬৭৭'],
  today: ['Name of the day', 'আজকের নাম'], listen: ['Listen', 'শুনুন'], listen_all: ['Listen to all', 'সব শুনুন'], stop: ['Stop', 'থামুন'],
  learn: ['Memorise', 'মুখস্থ করুন'], quiz: ['Quiz', 'কুইজ'], learned: ['Learned', 'শেখা হয়েছে'], due: ['to review', 'টি রিভিউ'], new_n: ['new', 'টি নতুন'],
  search: ['Search a name or meaning', 'নাম বা অর্থ খুঁজুন'], all: ['All names', 'সব নাম'], none: ['No name matches', 'কোনো নাম মেলেনি'],
  open_quran: ['Read in the Quran', 'কুরআনে পড়ুন'], in_quran: ['In the Quran', 'কুরআনে'], mark: ['Mark as learned', 'শেখা হয়েছে'], unmark: ['Learned', 'শেখা হয়েছে'],
  tap_flip: ['Tap the card to see its meaning', 'অর্থ দেখতে কার্ডে চাপ দিন'], knew: ['I knew it', 'জানতাম'], again: ['Not yet', 'এখনো না'],
  session_done: ['Session complete', 'আজকের সেশন শেষ'], session_d: ['Come back tomorrow for the names due for review.', 'রিভিউয়ের নামগুলোর জন্য আগামীকাল আবার আসুন।'],
  nothing_due: ['All caught up', 'সব রিভিউ শেষ'], nothing_d: ['No names are due right now. Learn new ones, or take the quiz.', 'এখন রিভিউয়ের কোনো নাম নেই। নতুন নাম শিখুন, অথবা কুইজ দিন।'],
  learn_more: ['Learn 5 more', 'আরও ৫টি শিখুন'], back: ['Back to the names', 'নামের তালিকায়'],
  q_meaning: ['What does this name mean?', 'এই নামের অর্থ কী?'], q_name: ['Which name means this?', 'কোন নামের অর্থ এটি?'],
  score: ['Your score', 'আপনার স্কোর'], retry: ['Try again', 'আবার চেষ্টা করুন'], of: ['of', 'এর মধ্যে'],
  order: ['In the order narrated by at-Tirmidhi (3507). Verses show where the name, or the attribute it describes, appears in the Quran.', 'ইমাম তিরমিযী (৩৫০৭) বর্ণিত ক্রম অনুযায়ী। আয়াতে দেখানো হয়েছে কুরআনে নামটি বা তার গুণটি কোথায় এসেছে।'],
};
const nmt = (k) => tr2(NMT[k]);
const NM = { run: 0, playing: false, deck: null, quiz: null, q: '' };
const nmLoad = () => { try { return JSON.parse(localStorage.getItem('names') || '{}'); } catch { return {}; } };
/// Progress: per name, the review level (0-5) and when it is next due.
const nmSt = () => ({ c: {}, ...nmLoad() });
const nmSave = (st) => { try { localStorage.setItem('names', JSON.stringify(st)); } catch { /* private mode */ } };
const NM_DAYS = [1, 3, 7, 14, 30, 60];
const nmLearned = (st) => NAMES.filter((x) => st.c[x.n]).length;
const nmDue = (st) => NAMES.filter((x) => st.c[x.n] && st.c[x.n].due <= Date.now());
/// The same name all day, a different one each day, cycling through all 99.
const nmOfDay = () => { const d = new Date(); return NAMES[Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5)) % 99]; };
const nmMeaning = (x) => (B() ? x.bn : x.en);
const nmSay = (x) => qdVoice(x.ar);

Object.assign(IC, {
  names: '<path d="M12 3.5 14 8l4.8.5-3.6 3.2 1 4.8L12 14l-4.2 2.5 1-4.8L5.2 8.5 10 8z"/><path d="M5 20.5h14"/>',
  flip: '<rect x="4" y="7" width="12" height="14" rx="2.2"/><path d="M8 3.5h9.5A2.5 2.5 0 0 1 20 6v11"/>',
});

// =====================================================================
// Views
// =====================================================================
VIEWS.names = async (tok) => {
  nmStop();
  await nmReady;
  const page = location.hash.replace(/^#\/?names\/?/, '').split('/')[0];
  const focus = page === 'learn' || page === 'quiz';
  document.body.classList.toggle('focus', focus);
  if (page === 'learn') return nmLearn();
  if (page === 'quiz') return nmQuiz();
  return nmHome();
};
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/names')) nmStop(); });

function nmCard(x, st) {
  const lv = st.c[x.n]?.l;
  return `<button class="nm-card ${lv != null ? 'got' : ''}" data-nm="open" data-n="${x.n}">
    <span class="nm-no">${N(x.n)}</span>${lv != null ? `<span class="nm-got">${icon('check')}</span>` : ''}
    <span class="nm-ar" dir="rtl" lang="ar">${x.ar}</span><b>${esc(B() ? x.bnp : x.tr)}</b><small>${esc(nmMeaning(x))}</small></button>`;
}

function nmHome() {
  const st = nmSt();
  const d = nmOfDay();
  const got = nmLearned(st), due = nmDue(st).length;
  view.innerHTML = `<div class="p-page nm">${ptitle(nmt('title'))}<p class="p-sub">${esc(nmt('sub'))}</p>
    <div class="nm-hero">
      <small>${esc(nmt('today'))} · ${N(d.n)}</small>
      <div class="nm-hero-ar" dir="rtl" lang="ar">${d.ar}</div>
      <b>${esc(B() ? d.bnp : d.tr)}</b><span class="nm-hero-m">${esc(nmMeaning(d))}</span>
      <p>${esc(B() ? d.xbn : d.xen)}</p>
      <div class="nm-hero-b"><button class="btn gold small" data-nm="say" data-n="${d.n}">${icon('speaker')}${esc(nmt('listen'))}</button>
        <button class="btn ghost small" data-nm="open" data-n="${d.n}">${icon('info')}${esc(B() ? 'বিস্তারিত' : 'More')}</button></div></div>
    <div id="qd-voice"></div>
    <div class="nm-acts">
      <a class="nm-act" href="#/names/learn">${tile('flip', '#8e4ec6')}<b>${esc(nmt('learn'))}</b><small>${due ? `${N(due)} ${esc(nmt('due'))}` : `${N(got)} / ${N(99)}`}</small></a>
      <a class="nm-act" href="#/names/quiz">${tile('target', '#f76b15')}<b>${esc(nmt('quiz'))}</b><small>${esc(B() ? '১০টি প্রশ্ন' : '10 questions')}</small></a>
      <button class="nm-act" data-nm="all" id="nm-all">${tile('play', '#30a46c')}<b>${esc(nmt('listen_all'))}</b><small>${esc(B() ? '৯৯টি নাম' : '99 names')}</small></button></div>
    <div class="sg-progress"><div class="hx-prog"><i style="width:${(got / 99) * 100}%"></i></div><small>${esc(nmt('learned'))}: ${N(got)} / ${N(99)}</small></div>
    <blockquote class="nm-quote">${esc(nmt('hadith'))}<cite>${esc(nmt('hsrc'))}</cite></blockquote>
    <div class="nm-search">${icon('search')}<input id="nm-q" type="search" placeholder="${esc(nmt('search'))}" value="${esc(NM.q)}" autocomplete="off"></div>
    <div class="p-head">${esc(nmt('all'))}</div>
    <div class="nm-grid" id="nm-grid"></div>
    <div class="p-foot">${esc(nmt('order'))}</div></div>`;
  nmFilter();
  $('#nm-q').addEventListener('input', (e) => { NM.q = e.target.value; nmFilter(); });
  qdCheckVoice();
}

/// Search by number, Arabic, transliteration or meaning, ignoring marks and case.
const nmNorm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٰٟ'‘’ʿ-]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, ' ').trim();
function nmFilter() {
  const st = nmSt(), q = nmNorm(NM.q);
  const hits = q ? NAMES.filter((x) => String(x.n) === q || [x.ar, x.tr, x.en, x.bnp, x.bn].some((f) => nmNorm(f).includes(q))) : NAMES;
  $('#nm-grid').innerHTML = hits.map((x) => nmCard(x, st)).join('') || `<p class="nm-none">${esc(nmt('none'))}</p>`;
}

// ---------- One name, in a sheet ----------
async function nmOpen(n) {
  const x = NAMES[n - 1], st = nmSt();
  const got = st.c[n] != null;
  qSheet(`<div class="nm-sheet" data-n="${n}">
    <div class="nm-sh-top"><button class="nm-nav" data-nm="step" data-d="-1" aria-label="previous" ${n === 1 ? 'disabled' : ''}>${icon('chevL')}</button><span>${N(n)} / ${N(99)}</span><button class="nm-nav" data-nm="step" data-d="1" aria-label="next" ${n === 99 ? 'disabled' : ''}>${icon('chevR')}</button></div>
    <div class="nm-sh-ar" dir="rtl" lang="ar">${x.ar}</div>
    <b class="nm-sh-tr">${esc(x.tr)}${B() ? ` · ${esc(x.bnp)}` : ''}</b>
    <div class="nm-sh-m">${esc(nmMeaning(x))}</div>
    <p class="nm-sh-x">${esc(B() ? x.xbn : x.xen)}</p>
    <div id="nm-verse"></div>
    <div class="nm-sh-b"><button class="btn gold" data-nm="say" data-n="${n}">${icon('speaker')}${esc(nmt('listen'))}</button>
      <button class="btn ${got ? 'ghost on' : 'ghost'}" data-nm="mark" data-n="${n}">${icon('check')}${esc(got ? nmt('unmark') : nmt('mark'))}</button></div></div>`);
  if (!x.ref) return;
  const [s, v] = x.ref.split(':').map(Number);
  try {
    await qMeta();
    const [ar, tr] = await Promise.all([qAr(s), qTr(B() ? 161 : 20, s)]);
    const box = $('#nm-verse');
    if (!box || $('.nm-sheet')?.dataset.n !== String(n)) return;
    box.innerHTML = `<a class="nm-verse" href="#/quran/${s}/${v}"><small>${esc(nmt('in_quran'))} · ${esc(cname(Q.meta.chapters[s - 1]))} ${N(x.ref)}</small>
      <div class="nm-v-ar" dir="rtl" lang="ar">${ar[v - 1].u.map(plainAr).join(' ')}</div><div class="nm-v-tr">${esc(String(tr[v - 1]).replace(/<[^>]+>/g, ''))}</div>
      <span class="nm-v-go">${esc(nmt('open_quran'))}${icon('chevR')}</span></a>`;
  } catch { /* the verse is a bonus */ }
}

// ---------- Listen to all ----------
function nmStop() {
  NM.run++;
  NM.playing = false;
  $$('.nm-card.on').forEach((el) => el.classList.remove('on'));
  const b = $('#nm-all');
  if (b) b.innerHTML = `${tile('play', '#30a46c')}<b>${esc(nmt('listen_all'))}</b><small>${esc(B() ? '৯৯টি নাম' : '99 names')}</small>`;
}
async function nmPlayAll() {
  const run = ++NM.run;
  NM.playing = true;
  qdQuiet();
  const b = $('#nm-all');
  if (b) b.innerHTML = `${tile('stop', '#30a46c')}<b>${esc(nmt('stop'))}</b><small>${esc(B() ? '৯৯টি নাম' : '99 names')}</small>`;
  for (const el of $$('#nm-grid .nm-card')) {
    if (run !== NM.run || !el.isConnected) return;
    el.classList.add('on');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (!(await nmSay(NAMES[+el.dataset.n - 1]))) { nmStop(); return; }
    await qdSleep(700);
    el.classList.remove('on');
  }
  if (run === NM.run) nmStop();
}

// ---------- Memorise: flashcards on a spaced schedule ----------
function nmDeck(more) {
  const st = nmSt();
  const due = nmDue(st).sort((a, b) => st.c[a.n].due - st.c[b.n].due);
  const fresh = NAMES.filter((x) => !st.c[x.n]).slice(0, more || (due.length ? 3 : 5));
  return [...due.slice(0, 15), ...fresh];
}

function nmLearn(more) {
  const cards = nmDeck(more);
  NM.deck = { cards, i: 0, flipped: false, knew: 0 };
  view.innerHTML = `<div class="nm-learn">
    <div class="sg-bar"><a class="sg-close" href="#/names" aria-label="close">${icon('x')}</a><b>${esc(nmt('learn'))}</b><span id="nm-count"></span></div>
    <div class="sg-seg">${cards.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div><div id="nm-stage"></div></div>`;
  if (!cards.length) return nmLearnEnd(true);
  nmShowCard();
}

function nmShowCard() {
  const z = NM.deck, x = z.cards[z.i], st = nmSt();
  z.flipped = false;
  $$('.nm-learn .sg-seg i').forEach((el, k) => { el.classList.toggle('on', k === z.i); });
  $('#nm-count').textContent = `${N(z.i + 1)} / ${N(z.cards.length)}`;
  const isNew = !st.c[x.n];
  $('#nm-stage').innerHTML = `<div class="nm-flip" data-nm="flip"><div class="nm-face front">
      <span class="nm-tag ${isNew ? 'new' : ''}">${esc(isNew ? (B() ? 'নতুন' : 'New') : (B() ? 'রিভিউ' : 'Review'))} · ${N(x.n)}</span>
      <div class="nm-fl-ar" dir="rtl" lang="ar">${x.ar}</div><b>${esc(x.tr)}</b>${B() ? `<small>${esc(x.bnp)}</small>` : ''}
      <span class="nm-hint">${icon('flip')}${esc(nmt('tap_flip'))}</span></div>
    <div class="nm-face back"><div class="nm-fl-ar sm" dir="rtl" lang="ar">${x.ar}</div><div class="nm-fl-m">${esc(nmMeaning(x))}</div><p>${esc(B() ? x.xbn : x.xen)}</p>${x.ref ? `<small class="nm-fl-ref">${esc(nmt('in_quran'))} ${N(x.ref)}</small>` : ''}</div></div>
    <div class="nm-fl-b"><button class="btn ghost" data-nm="say" data-n="${x.n}">${icon('speaker')}</button>
      <button class="btn ghost" data-nm="grade" data-v="0" disabled>${esc(nmt('again'))}</button><button class="btn gold" data-nm="grade" data-v="1" disabled>${icon('check')}${esc(nmt('knew'))}</button></div>`;
  setTimeout(() => nmSay(x), 300);
}

function nmFlip() {
  const z = NM.deck;
  if (!z || z.flipped) return;
  z.flipped = true;
  $('.nm-flip')?.classList.add('on');
  $$('[data-nm="grade"]').forEach((b) => { b.disabled = false; });
  nativeUi('haptic');
}

function nmGrade(knew) {
  const z = NM.deck, x = z.cards[z.i], st = nmSt();
  const c = st.c[x.n] || { l: -1 };
  // Known: the next, longer gap. Not yet: start again, and see it once more this session.
  c.l = knew ? Math.min(c.l + 1, NM_DAYS.length - 1) : 0;
  c.due = Date.now() + NM_DAYS[c.l] * 864e5 - 3600e3;
  st.c[x.n] = c;
  nmSave(st);
  const seg = $(`.nm-learn .sg-seg i[data-k="${z.i}"]`);
  if (seg) seg.className = knew ? 'done' : 'miss';
  if (knew) z.knew++;
  else if (!z.cards.slice(z.i + 1).includes(x)) { z.cards.push(x); $('.nm-learn .sg-seg').insertAdjacentHTML('beforeend', `<i data-k="${z.cards.length - 1}"></i>`); }
  nativeUi('haptic', knew ? '' : 'long');
  if (++z.i < z.cards.length) nmShowCard(); else nmLearnEnd(false);
}

function nmLearnEnd(empty) {
  const st = nmSt();
  const left = NAMES.length - nmLearned(st);
  $('#nm-count').textContent = '';
  $('#nm-stage').innerHTML = `<div class="qd-res pass"><div class="nm-done">${icon(empty ? 'check' : 'sparkle')}</div>
    <h2>${esc(empty ? nmt('nothing_due') : nmt('session_done'))}</h2><p>${esc(empty ? nmt('nothing_d') : nmt('session_d'))}</p>
    <div class="sg-progress" style="width:100%;margin-top:22px"><div class="hx-prog"><i style="width:${(nmLearned(st) / 99) * 100}%"></i></div><small>${esc(nmt('learned'))}: ${N(nmLearned(st))} / ${N(99)}</small></div>
    <div class="qd-res-b">${left ? `<button class="btn gold" data-nm="more">${icon('plus')}${esc(nmt('learn_more'))}</button>` : ''}<a class="btn ghost" href="#/names/quiz">${icon('target')}${esc(nmt('quiz'))}</a><a class="btn ghost" href="#/names">${esc(nmt('back'))}</a></div></div>`;
  if (!empty) nativeUi('haptic', 'long');
}

// ---------- Quiz ----------
function nmQuiz() {
  const st = nmSt();
  // Mostly names already learned, topped up with others.
  const known = qdShuffle(NAMES.filter((x) => st.c[x.n]));
  const pool = [...known.slice(0, 7), ...qdShuffle(NAMES.filter((x) => !known.slice(0, 7).includes(x)))].slice(0, 10);
  const qs = qdShuffle(pool).map((ans, k) => ({ ans, name: k % 2 === 1, opts: qdShuffle([ans, ...qdShuffle(NAMES.filter((x) => x !== ans && x.en !== ans.en)).slice(0, 3)]) }));
  NM.quiz = { qs, i: 0, right: 0, locked: false };
  view.innerHTML = `<div class="qd-quiz nm-quiz">
    <div class="sg-bar"><a class="sg-close" href="#/names" aria-label="close">${icon('x')}</a><b>${esc(nmt('quiz'))}</b><span id="nm-count"></span></div>
    <div class="sg-seg">${qs.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div><div id="nm-q"></div></div>`;
  nmAsk();
}

function nmAsk() {
  const z = NM.quiz, q = z.qs[z.i];
  z.locked = false;
  $$('.nm-quiz .sg-seg i').forEach((el, k) => { if (k === z.i) el.classList.add('on'); });
  $('#nm-count').textContent = `${N(z.i + 1)} / ${N(z.qs.length)}`;
  // Odd questions: a meaning, and four names to choose from; even ones the reverse.
  const opt = (x, k) => q.name
    ? `<button class="qd-opt" data-nm="ans" data-k="${k}"><span dir="rtl" lang="ar" class="nm-opt-ar">${x.ar}</span></button>`
    : `<button class="qd-opt txt" data-nm="ans" data-k="${k}">${esc(nmMeaning(x))}</button>`;
  $('#nm-q').innerHTML = `<div class="qd-qbox"><p class="qd-prompt">${esc(q.name ? nmt('q_name') : nmt('q_meaning'))}</p>
    ${q.name ? `<div class="nm-q-m">${esc(nmMeaning(q.ans))}</div>` : `<button class="nm-q-ar" data-nm="say" data-n="${q.ans.n}" dir="rtl" lang="ar">${q.ans.ar}</button>`}
    <div class="qd-opts ${q.name ? '' : 'names'}">${q.opts.map(opt).join('')}</div></div>`;
  if (!q.name) setTimeout(() => nmSay(q.ans), 300);
}

async function nmAnswer(k, el) {
  const z = NM.quiz, q = z.qs[z.i];
  if (z.locked) return;
  z.locked = true;
  const ok = q.opts[k] === q.ans;
  $(`.nm-quiz .sg-seg i[data-k="${z.i}"]`).className = ok ? 'done' : 'miss';
  el.classList.add(ok ? 'right' : 'wrong');
  if (!ok) $$('.nm-quiz .qd-opt')[q.opts.indexOf(q.ans)].classList.add('right');
  nativeUi('haptic', ok ? '' : 'long');
  if (ok) z.right++;
  if (q.name) await nmSay(q.ans);
  await qdSleep(ok ? 700 : 1500);
  if (!$('#nm-q')) return;
  if (++z.i < z.qs.length) return nmAsk();
  const R = 52, C = 2 * Math.PI * R;
  $$('.nm-quiz .sg-seg i').forEach((s) => s.classList.remove('on'));
  $('#nm-count').textContent = '';
  $('#nm-q').innerHTML = `<div class="qd-res ${z.right >= 7 ? 'pass' : ''}">
    <svg class="qd-ring big" viewBox="0 0 120 120"><circle cx="60" cy="60" r="${R}" class="bg"/><circle cx="60" cy="60" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" style="--to:${C * (1 - z.right / z.qs.length)}"/>
      <text x="60" y="58" text-anchor="middle">${N(z.right)}</text><text x="60" y="78" text-anchor="middle" class="sm">/ ${N(z.qs.length)}</text></svg>
    <h2>${esc(z.right === z.qs.length ? (B() ? 'মাশাআল্লাহ — সব সঠিক' : 'Masha\'Allah — all correct') : nmt('score'))}</h2>
    <div class="qd-res-b"><button class="btn gold" data-nm="requiz">${icon('undo')}${esc(nmt('retry'))}</button><a class="btn ghost" href="#/names/learn">${icon('flip')}${esc(nmt('learn'))}</a><a class="btn ghost" href="#/names">${esc(nmt('back'))}</a></div></div>`;
  nativeUi('haptic', 'long');
}

// ---------- Today: the name of the day ----------
const nmTodayBase = VIEWS.today;
VIEWS.today = async (tok) => {
  await nmTodayBase(tok);
  await nmReady;
  if (!live(tok) || $('.nm-today') || !NAMES.length) return;
  const d = nmOfDay();
  const host = $('.p-page') || view;
  host.insertAdjacentHTML('beforeend', `<a class="nm-today" href="#/names"><span class="nm-today-t"><small>${esc(nmt('today'))}</small><b>${esc(B() ? d.bnp : d.tr)}</b><span>${esc(nmMeaning(d))}</span></span><span class="nm-today-ar" dir="rtl" lang="ar">${d.ar}</span></a>`);
};

// ---------- Events ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-nm]');
  if (!a) return;
  const d = a.dataset;
  switch (d.nm) {
    case 'open': nativeUi('haptic'); nmOpen(+d.n); break;
    case 'step': { const n = +$('.nm-sheet').dataset.n + +d.d; if (n >= 1 && n <= 99) nmOpen(n); break; }
    case 'say': { if (NM.playing) nmStop(); qdQuiet(); a.classList.add('on'); nmSay(NAMES[+d.n - 1]).finally(() => a.classList.remove('on')); break; }
    case 'mark': {
      const st = nmSt(), n = +d.n;
      if (st.c[n]) delete st.c[n]; else st.c[n] = { l: 0, due: Date.now() + NM_DAYS[0] * 864e5 };
      nmSave(st); nativeUi('haptic');
      nmOpen(n);
      if ($('#nm-grid')) nmFilter();
      break;
    }
    case 'all': if (NM.playing) nmStop(); else nmPlayAll(); break;
    case 'flip': nmFlip(); break;
    case 'grade': if (NM.deck?.flipped) nmGrade(d.v === '1'); break;
    case 'more': nmLearn(5); break;
    case 'ans': nmAnswer(+d.k, a); break;
    case 'requiz': nmQuiz(); break;
  }
});
