'use strict';
// Waqt Quran goals and Hifz (phones).
// Goals: a khatm plan by pages (604) — finish in N days, from the start or
// from where you are; the reader counts the pages you read; today's portion,
// catch-up, a daily reminder and a calendar of the plan.
// Hifz: passages you are memorising, practised verse by verse with hidden
// words, first-letter hints and the reciter on repeat; rated after each
// session and reviewed again on a spaced schedule (1, 3, 7, 14, 30, 60 days).
// Loaded after quran.js and salah.js.

const QP = { pages: null };
const QPT = {
  goal: ['Khatm goal', 'খতমের লক্ষ্য'], goal_d: ['Finish the Quran on a plan you can keep', 'নিয়মিত পরিকল্পনায় কুরআন খতম করুন'], set_goal: ['Set a goal', 'লক্ষ্য ঠিক করুন'],
  finish_in: ['Finish in', 'খতম করব'], days: ['days', 'দিনে'], day: ['Day', 'দিন'], of: ['of', '/'], pages: ['pages', 'পৃষ্ঠা'], page: ['Page', 'পৃষ্ঠা'], per_day: ['a day', 'প্রতিদিন'],
  week: ['A week', 'এক সপ্তাহ'], month: ['A month', 'এক মাস'], two_months: ['Two months', 'দুই মাস'], ramadan: ['By the end of Ramadan', 'রমজানের শেষে'], custom: ['Custom', 'নিজে ঠিক করুন'],
  from: ['Start from', 'শুরু'], from_start: ['The beginning', 'শুরু থেকে'], from_here: ['Where I am', 'যেখানে আছি'], remind: ['Daily reminder', 'প্রতিদিনের রিমাইন্ডার'], off: ['Off', 'বন্ধ'],
  start: ['Start', 'শুরু করুন'], today: ['Today', 'আজ'], continue: ['Continue reading', 'পড়া চালিয়ে যান'], read_today: ['read today', 'আজ পড়া হয়েছে'], ahead: ['ahead', 'এগিয়ে'], behind: ['behind', 'পিছিয়ে'],
  on_track: ['On track', 'ঠিকঠাক চলছে'], khatms: ['khatms completed', 'বার খতম'], change: ['Change plan', 'পরিকল্পনা বদলান'], end: ['End this goal', 'লক্ষ্য শেষ করুন'], plan: ['Your plan', 'আপনার পরিকল্পনা'],
  done_today: ['Today\'s portion is done — Masha\'Allah', 'আজকের অংশ শেষ — মাশাআল্লাহ'], khatm_done: ['Khatm complete', 'খতম সম্পন্ন'], khatm_d: ['May Allah accept it and make the Quran a light for you.', 'আল্লাহ কবুল করুন এবং কুরআনকে আপনার জন্য নূর বানিয়ে দিন।'],
  new_khatm: ['Start another khatm', 'আরেকটি খতম শুরু করুন'], to: ['to', 'থেকে'], end_q: ['End this goal? Your progress will be cleared.', 'লক্ষ্য শেষ করবেন? অগ্রগতি মুছে যাবে।'],
  hifz: ['Hifz', 'হিফজ'], hifz_d: ['Memorise and keep what you have learnt', 'মুখস্থ করুন ও ধরে রাখুন'], due: ['Due for review', 'আজ রিভিউ করুন'], review: ['Review', 'রিভিউ'],
  learning: ['Learning', 'শিখছি'], memorised: ['Memorised', 'মুখস্থ'], add: ['Add a passage', 'অংশ যোগ করুন'], suggest: ['Juz Amma — start here', 'আম্মা পারা — এখান থেকে শুরু'],
  by_juz: ['By juz', 'পারা অনুযায়ী'], verses: ['verses', 'আয়াত'], practise: ['Practise', 'অনুশীলন'], nothing_due: ['Nothing due — well done.', 'আজ রিভিউ বাকি নেই — চমৎকার।'],
  show: ['Show', 'দেখান'], hints: ['Hints', 'ইঙ্গিত'], hidden: ['Hidden', 'লুকানো'], reveal: ['Reveal', 'দেখুন'], listen3: ['Listen ×3', 'শুনুন ×৩'], play_all: ['Play all', 'সব শুনুন'],
  next: ['Next', 'পরবর্তী'], back: ['Back', 'পেছনে'], how: ['How did it go?', 'কেমন হলো?'], fluent: ['Fluent', 'সাবলীল'], some: ['Some mistakes', 'কিছু ভুল'], again: ['Again', 'আবার'],
  next_review: ['Next review', 'পরের রিভিউ'], in_days: ['in {n} days', '{n} দিন পর'], tomorrow: ['tomorrow', 'আগামীকাল'], surah: ['Surah', 'সূরা'], verses_from: ['Verses', 'আয়াত'],
  remove: ['Remove', 'সরান'], added: ['Added to your hifz', 'হিফজে যোগ হয়েছে'], tap_word: ['Tap a word to reveal it', 'দেখতে শব্দে চাপুন'], meaning: ['Meaning', 'অর্থ'],
  goals: ['Goals', 'লক্ষ্য'], your_hifz: ['Your hifz', 'আপনার হিফজ'], level: ['Level', 'লেভেল'],
};
const qpt = (k) => tr2(QPT[k]);
const todayISO = () => S.day?.today?.date || new Date().toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const qpPages = async () => (QP.pages ??= await (await fetch('/quran/pages.json')).json());
/// The page a verse is on.
const pageOf = async (s, v) => (await qAr(s))[v - 1]?.p || 1;

Object.assign(IC, {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3v.5A3 3 0 0 0 4 10.5 3 3 0 0 0 5 13a3 3 0 0 0 1 4.5A3 3 0 0 0 9 20a2 2 0 0 0 3-1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3v.5a3 3 0 0 1 2 3 3 3 0 0 1-1 2.5 3 3 0 0 1-1 4.5A3 3 0 0 1 15 20a2 2 0 0 1-3-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
});

// =====================================================================
// Khatm goal
// =====================================================================
/// Where the plan stands today.
async function goalNow() {
  const g = Q.st.goal;
  if (!g) return null;
  const total = 605 - g.start;
  const daily = Math.ceil(total / g.days);
  const dayIdx = Math.max(0, dayDiff(g.startDate, todayISO()));
  const read = new Set(g.read || []);
  const done = read.size;
  const expected = Math.min(total, (dayIdx + 1) * daily);
  let next = g.start;
  while (next <= 604 && read.has(next)) next++;
  const target = Math.min(604, g.start + expected - 1);
  const leftToday = Math.max(0, expected - done);
  const pages = await qpPages();
  return { g, total, daily, dayIdx, done, expected, next: Math.min(next, 604), target, leftToday, pct: done / total, finished: done >= total, todayRead: g.log?.[todayISO()] || 0, at: pages[Math.min(next, 604) - 1] };
}

/// The reader reports the verse at the top of the screen; count its page.
window.qOnRead = async (s, v) => {
  const g = Q.st.goal;
  if (!g) return;
  const p = await pageOf(s, v);
  if (p < g.start) return;
  g.read ??= [];
  if (g.read.includes(p)) return;
  // Only pages reached by reading on, not by jumping far ahead.
  const max = g.read.length ? Math.max(...g.read) : g.start - 1;
  if (p > max + 2 && p !== g.start) return;
  g.read.push(p);
  g.log ??= {};
  g.log[todayISO()] = (g.log[todayISO()] || 0) + 1;
  qSave();
  const x = await goalNow();
  if (x.finished && !g.celebrated) { g.celebrated = true; Q.st.khatms = (Q.st.khatms || 0) + 1; qSave(); toast(`${qpt('khatm_done')} ✓`, 5000); nativeUi('haptic', 'long'); }
  else if (x.leftToday === 0 && !g.log[`${todayISO()}!`]) { g.log[`${todayISO()}!`] = 1; qSave(); toast(qpt('done_today')); nativeUi('haptic', 'long'); }
};

function ring(pct, size = 120, label = '') {
  return `<svg class="qp-ring" viewBox="0 0 120 120" style="width:${size}px;height:${size}px"><circle cx="60" cy="60" r="52" class="qp-rt"/><circle cx="60" cy="60" r="52" class="qp-rb" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="${1000 - Math.min(1, pct) * 1000}"/></svg>${label}`;
}

async function qGoal(tok) {
  const x = await goalNow();
  if (!live(tok)) return;
  if (!x) return qGoalSetup();
  const g = x.g;
  if (x.finished) {
    view.innerHTML = `<div class="p-page qp">${ptitle(qpt('goal'), '#/quran')}
      <div class="qp-finish"><div class="qp-ringbox big">${ring(1, 180, `<div class="qp-in"><b>✓</b></div>`)}</div><h2>${esc(qpt('khatm_done'))}</h2><p>${esc(qpt('khatm_d'))}</p>
      <p class="muted">${N(Q.st.khatms || 1)} ${esc(qpt('khatms'))}</p><button class="btn gold" data-qp="again">${esc(qpt('new_khatm'))}</button></div></div>`;
    return;
  }
  const c = Q.meta.chapters[x.at[0] - 1];
  const status = x.done >= x.expected ? (x.done > x.expected ? `${N(x.done - x.expected)} ${qpt('pages')} ${qpt('ahead')}` : qpt('on_track')) : `${N(x.expected - x.done)} ${qpt('pages')} ${qpt('behind')}`;
  // The plan as a calendar: each day done, partly done, or still to come.
  const cells = [];
  for (let i = 0; i < g.days; i++) {
    const d = addDays(g.startDate, i), n = g.log?.[d] || 0;
    const cls = i > x.dayIdx ? 'f' : n >= x.daily ? 'ok' : n > 0 ? 'part' : i < x.dayIdx ? 'miss' : 'now';
    cells.push(`<i class="${cls} ${i === x.dayIdx ? 'today' : ''}" title="${d}">${N(i + 1)}</i>`);
  }
  const times = [['', qpt('off')], ['05:30', fmtClock('05:30')], ['07:00', fmtClock('07:00')], ['13:30', fmtClock('13:30')], ['21:00', fmtClock('21:00')]];
  const cur = S.cfg.alerts?.quran_time || '';
  view.innerHTML = `<div class="p-page qp">${ptitle(qpt('goal'), '#/quran')}
    <div class="qp-hero"><div class="qp-ringbox">${ring(x.pct, 132, `<div class="qp-in"><b>${N(Math.round(x.pct * 100))}%</b><small>${N(x.done)} / ${N(x.total)}</small></div>`)}</div>
      <div class="qp-hero-t"><small>${esc(qpt('day'))} ${N(x.dayIdx + 1)} ${esc(qpt('of'))} ${N(g.days)}</small><b>${esc(qpt('today'))}: ${N(Math.max(x.leftToday, 0))} ${esc(qpt('pages'))}</b>
        <span class="qp-chip ${x.done >= x.expected ? 'ok' : 'warn'}">${esc(status)}</span><span class="muted">${N(x.todayRead)} ${esc(qpt('read_today'))}</span></div></div>
    <a class="qp-cont" href="#/quran/${x.at[0]}/${x.at[1]}">${icon('book')}<span><b>${esc(qpt('continue'))}</b><small>${esc(qpt('page'))} ${N(x.next)} · ${esc(cname(c))} ${N(`${x.at[0]}:${x.at[1]}`)}</small></span>${icon('chevR')}</a>
    <div class="p-head">${esc(qpt('plan'))} · ${N(x.daily)} ${esc(qpt('pages'))} ${esc(qpt('per_day'))}</div>
    <div class="qp-cal">${cells.join('')}</div>
    <div class="p-head">${esc(qpt('remind'))}</div><div class="p-group pad"><div class="chips">${times.map(([v, l]) => `<button class="chip ${cur === v ? 'on' : ''}" data-qp="remind" data-v="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="p-group" style="margin-top:14px">
      <div class="p-row">${tile('star', '#d99a1e')}<span class="p-lab"><b>${N(Q.st.khatms || 0)} ${esc(qpt('khatms'))}</b></span></div>
      <button class="p-row tap" data-qp="change">${tile('target', '#5b5bd6')}<span class="p-lab"><b>${esc(qpt('change'))}</b></span>${chev()}</button>
      <button class="p-row tap" data-qp="end">${tile('x', '#e5484d')}<span class="p-lab"><b>${esc(qpt('end'))}</b></span></button></div></div>`;
}

/// "05:30" in the user's clock style.
function fmtClock(hm) {
  const [h, m] = hm.split(':').map(Number);
  if (S.cfg?.clock === 24) return N(hm);
  return N(`${h % 12 || 12}:${String(m).padStart(2, '0')}`) + (B() ? '' : h < 12 ? ' AM' : ' PM');
}

const GSET = { days: 30, from: 'start' };
async function qGoalSetup() {
  const lastPage = Q.st.last ? await pageOf(Q.st.last.s, Q.st.last.v) : 1;
  const r = S.day?.ramadan;
  const ramDays = r?.active ? Math.max(1, 30 - r.day + 1) : r?.days_left ? r.days_left + 29 : 0;
  const opts = [[7, qpt('week'), '4 juz'], [30, qpt('month'), '1 juz'], [60, qpt('two_months'), '½ juz'], ...(ramDays ? [[ramDays, qpt('ramadan'), '']] : [])];
  const start = GSET.from === 'here' ? lastPage : 1;
  const per = Math.ceil((605 - start) / GSET.days);
  view.innerHTML = `<div class="p-page qp">${ptitle(qpt('goal'), '#/quran')}<p class="p-sub">${esc(qpt('goal_d'))}</p>
    <div class="p-head">${esc(qpt('finish_in'))}</div>
    <div class="qp-opts">${opts.map(([d, l, sub]) => `<button class="qp-opt ${GSET.days === d ? 'on' : ''}" data-qp="days" data-v="${d}"><b>${esc(l)}</b><small>${N(d)} ${esc(qpt('days'))}${sub ? ` · ${sub}` : ''}</small></button>`).join('')}</div>
    <div class="p-group" style="margin-top:10px"><div class="p-row"><span class="p-lab"><b>${esc(qpt('custom'))}</b></span><span class="stepper"><button data-qp="step" data-d="-1">−</button><span>${N(GSET.days)}</span><button data-qp="step" data-d="1">+</button></span></div></div>
    <div class="p-head">${esc(qpt('from'))}</div>
    <div class="p-group pad"><div class="p-seg wide" style="margin:0"><button class="${GSET.from === 'start' ? 'on' : ''}" data-qp="from" data-v="start">${esc(qpt('from_start'))}</button><button class="${GSET.from === 'here' ? 'on' : ''}" data-qp="from" data-v="here">${esc(qpt('from_here'))} · ${esc(qpt('page'))} ${N(lastPage)}</button></div></div>
    <div class="qp-summary">${N(per)} <small>${esc(qpt('pages'))} ${esc(qpt('per_day'))}</small></div>
    <div class="p-center"><button class="btn gold" data-qp="go">${icon('play')}${esc(qpt('start'))}</button></div></div>`;
}

// =====================================================================
// Hifz
// =====================================================================
const SRS = [1, 3, 7, 14, 30, 60];
const hz = () => (Q.st.hifz ??= { items: {} });
const hKey = (s, a, b) => `${s}:${a}-${b}`;
function hItems() { return Object.entries(hz().items).map(([k, v]) => ({ k, ...v })); }
const hDue = () => hItems().filter((x) => x.next <= todayISO());
const hName = (x) => { const c = Q.meta.chapters[x.s - 1]; return `${cname(c)}${x.a === 1 && x.b === c.verses ? '' : ` ${N(`${x.a}–${x.b}`)}`}`; };

async function qHifz(tok) {
  const items = hItems(), due = hDue();
  // Juz progress: memorised verses in each juz.
  const per = Array(30).fill(0);
  for (const x of items.filter((i) => i.level >= 1)) {
    const ar = await qAr(x.s);
    for (let v = x.a; v <= x.b; v++) per[(ar[v - 1]?.j || 1) - 1]++;
  }
  if (!live(tok)) return;
  const juz = Q.meta.juz.map((j, i) => `<i style="--p:${Math.min(1, per[i] / j.verses) * 100}%" class="${per[i] ? 'on' : ''}"><b>${N(j.n)}</b></i>`).join('');
  const added = new Set(items.map((x) => x.s));
  const sugg = [];
  for (let s = 114; s >= 78 && sugg.length < 6; s--) if (!added.has(s)) sugg.push(s);
  const row = (x) => `<a class="p-row tap" href="#/quran/hifz/p/${encodeURIComponent(x.k)}">${tile(x.level >= 1 ? 'check' : 'brain', x.level >= 1 ? '#30a46c' : '#8e4ec6')}
    <span class="p-lab"><b>${esc(hName(x))}</b><small>${N(x.b - x.a + 1)} ${esc(qpt('verses'))} · ${esc(qpt('next_review'))}: ${esc(x.next <= todayISO() ? qpt('today') : dayDiff(todayISO(), x.next) === 1 ? qpt('tomorrow') : qpt('in_days').replace('{n}', N(dayDiff(todayISO(), x.next))))}</small></span>${chev()}</a>`;
  const learning = items.filter((x) => x.level < 1), mem = items.filter((x) => x.level >= 1);
  view.innerHTML = `<div class="p-page qp">${ptitle(qpt('hifz'), '#/quran')}<p class="p-sub">${esc(qpt('hifz_d'))}</p>
    <div class="qp-due ${due.length ? '' : 'none'}">${icon('brain')}<span><b>${due.length ? `${N(due.length)} · ${esc(qpt('due'))}` : esc(qpt('nothing_due'))}</b>${due.length ? `<small>${due.slice(0, 3).map(hName).map(esc).join(' · ')}</small>` : ''}</span>
      ${due.length ? `<a class="btn small gold" href="#/quran/hifz/p/${encodeURIComponent(due[0].k)}">${esc(qpt('review'))}</a>` : ''}</div>
    <div class="p-head">${esc(qpt('by_juz'))}</div><div class="qp-juz">${juz}</div>
    ${learning.length ? `<div class="p-head">${esc(qpt('learning'))}</div><div class="p-group">${learning.map(row).join('')}</div>` : ''}
    ${mem.length ? `<div class="p-head">${esc(qpt('memorised'))}</div><div class="p-group">${mem.map(row).join('')}</div>` : ''}
    ${sugg.length ? `<div class="p-head">${esc(qpt('suggest'))}</div><div class="qp-sugg">${sugg.map((s) => { const c = Q.meta.chapters[s - 1]; return `<button class="qp-sg" data-qp="hadd" data-s="${s}"><span class="ar">${c.ar}</span><b>${esc(cname(c))}</b><small>${N(c.verses)} ${esc(qpt('verses'))}</small><i>${icon('plus')}</i></button>`; }).join('')}</div>` : ''}
    <div class="p-head">${esc(qpt('add'))}</div>
    <div class="p-group pad qp-add"><select class="input" id="hz-s">${Q.meta.chapters.map((c) => `<option value="${c.id}">${N(c.id)}. ${esc(cname(c))}</option>`).join('')}</select>
      <div class="qp-range"><span>${esc(qpt('verses_from'))}</span><input class="input" id="hz-a" type="number" min="1" value="1" inputmode="numeric"><span>–</span><input class="input" id="hz-b" type="number" min="1" value="7" inputmode="numeric"></div>
      <button class="btn small gold" data-qp="hadd-custom">${icon('plus')}${esc(qpt('add'))}</button></div></div>`;
  $('#hz-s').addEventListener('change', (e) => { const n = Q.meta.chapters[e.target.value - 1].verses; $('#hz-a').value = 1; $('#hz-b').value = n; $('#hz-b').max = n; $('#hz-a').max = n; });
  $('#hz-s').value = '1';
  $('#hz-b').value = '7';
}

function hAdd(s, a, b) {
  const k = hKey(s, a, b);
  if (!hz().items[k]) hz().items[k] = { s, a, b, level: 0, next: todayISO(), added: Date.now() };
  qSave();
  toast(qpt('added'));
  nativeUi('haptic');
  return k;
}

// ---------- Practice ----------
const PR = { k: '', v: 0, mode: 'hints', revealed: new Set(), mean: false };
async function qPractice(tok, k) {
  const x = hz().items[k];
  if (!x) { location.hash = '#/quran/hifz'; return; }
  await qAr(x.s);
  if (!live(tok)) return;
  Object.assign(PR, { k, v: x.a, revealed: new Set() });
  PR.mode = azStore.get('hz-mode', 'hints');
  document.body.classList.add('focus');
  view.innerHTML = `<div class="qp-pr">
    <div class="sg-bar"><a class="sg-close" href="#/quran/hifz" aria-label="close">${icon('x')}</a><b>${esc(hName(x))}</b><span id="pr-pos"></span></div>
    <div class="az-prog"><i id="pr-prog"></i></div>
    <div class="p-seg wide" id="pr-mode">${['show', 'hints', 'hidden'].map((m) => `<button class="${PR.mode === m ? 'on' : ''}" data-qp="mode" data-v="${m}">${esc(qpt(m))}</button>`).join('')}</div>
    <div id="pr-stage"></div>
    <div class="qp-pr-dock" id="pr-dock"><button class="btn" data-qp="listen">${icon('speaker')}${esc(qpt('listen3'))}</button><button class="btn" data-qp="playall">${icon('repeat')}${esc(qpt('play_all'))}</button>
      <div class="qp-pr-nav"><button class="btn ghost" data-qp="pprev">${icon('chevL')}</button><button class="btn gold" data-qp="pnext" id="pr-next">${esc(qpt('next'))}${icon('chevR')}</button></div></div></div>`;
  qpShowVerse(0);
}

async function qpShowVerse(dir) {
  const x = hz().items[PR.k];
  const ar = await qAr(x.s);
  const a = ar[PR.v - 1];
  const n = x.b - x.a + 1, i = PR.v - x.a;
  $('#pr-pos').textContent = `${N(i + 1)} / ${N(n)}`;
  $('#pr-prog').style.width = `${(i / n) * 100}%`;
  const tr = await qTr(B() ? (Q.st.bn || 161) : (Q.st.en || 20), x.s);
  const words = a.u.map((w, wi) => {
    const plain = plainAr(w);
    const shown = PR.mode === 'show' || PR.revealed.has(wi);
    const hint = plain.replace(/[ً-ٰٟۖ-ۭ]/g, '').charAt(0);
    const face = shown ? qWord(w, Q.st.tajweed) : PR.mode === 'hints' ? `<span class="hz-hint">${esc(hint)}<i>ـ</i></span>` : '<span class="hz-blank"></span>';
    return `<span class="w hz-w ${shown ? 'on' : ''}" data-qp="word" data-i="${wi}">${face}</span>`;
  }).join(' ');
  $('#pr-stage').innerHTML = `<div class="az-slide qp-verse ${dir > 0 ? 'fwd' : dir < 0 ? 'bwd' : ''}"><div class="qv-k" style="display:inline-block">${N(`${x.s}:${PR.v}`)}</div>
    <div class="qa hz-ar" dir="rtl">${words} <span class="qend">${AR_DIGITS(PR.v)}</span></div>
    ${PR.mode !== 'show' ? `<p class="muted hz-tip">${esc(qpt('tap_word'))} · <button class="link" data-qp="revealall">${esc(qpt('reveal'))}</button></p>` : ''}
    <details class="hz-mean" ${PR.mean ? 'open' : ''}><summary>${esc(qpt('meaning'))}</summary><p ${B() ? 'lang="bn"' : ''}>${esc(tr[PR.v - 1] || '')}</p></details></div>`;
  $('details.hz-mean').addEventListener('toggle', (e) => { PR.mean = e.target.open; });
  $('#pr-next').innerHTML = PR.v >= x.b ? `${icon('check')}${esc(qpt('how'))}` : `${esc(qpt('next'))}${icon('chevR')}`;
}

function qpRate() {
  const x = hz().items[PR.k];
  $('#pr-dock').hidden = true;
  $('#pr-mode').hidden = true;
  $('#pr-prog').style.width = '100%';
  $('#pr-stage').innerHTML = `<div class="az-finish"><div class="qp-ringbox big">${ring(1, 140, `<div class="qp-in"><b>${icon('brain')}</b></div>`)}</div><h2>${esc(qpt('how'))}</h2>
    <div class="qp-rate"><button data-qp="rate" data-v="2" class="r2"><b>${esc(qpt('fluent'))}</b><small>${esc(qpt('next_review'))}: ${esc(qpt('in_days').replace('{n}', N(SRS[Math.min(SRS.length - 1, (x.level || 0))])))}</small></button>
      <button data-qp="rate" data-v="1" class="r1"><b>${esc(qpt('some'))}</b><small>${esc(qpt('tomorrow'))}</small></button>
      <button data-qp="rate" data-v="0" class="r0"><b>${esc(qpt('again'))}</b><small>${esc(qpt('today'))}</small></button></div></div>`;
}

// ---------- Hooks into the Quran section ----------
const quranView = VIEWS.quran;
VIEWS.quran = async (tok) => {
  const p = location.hash.replace(/^#\/?quran\/?/, '').split('/').filter(Boolean);
  if (p[0] === 'goal' || p[0] === 'hifz') {
    await Promise.all([qMeta(), qState()]);
    if (!live(tok)) return;
    if (p[0] === 'goal') return qGoal(tok);
    if (p[1] === 'p' && p[2]) return qPractice(tok, decodeURIComponent(p[2]));
    return qHifz(tok);
  }
  return quranView(tok);
};

const qHomeBase = qHome;
qHome = async function qHomePlus(tok) {
  await qHomeBase(tok);
  if (!live(tok)) return;
  const x = await goalNow();
  const due = hDue().length;
  const goalCard = x && !x.finished
    ? `<a class="qp-card" href="#/quran/goal"><span class="qp-ringbox sm">${ring(x.pct, 54)}</span><span class="qp-card-t"><small>${esc(qpt('goal'))} · ${esc(qpt('day'))} ${N(x.dayIdx + 1)}/${N(x.g.days)}</small><b>${x.leftToday ? `${esc(qpt('today'))}: ${N(x.leftToday)} ${esc(qpt('pages'))}` : esc(qpt('done_today'))}</b></span>${icon('chevR')}</a>`
    : `<a class="qp-card" href="#/quran/goal">${tile('target', '#d99a1e')}<span class="qp-card-t"><small>${esc(qpt('goal'))}</small><b>${esc(qpt('set_goal'))}</b></span>${icon('chevR')}</a>`;
  const hifzCard = `<a class="qp-card" href="#/quran/hifz">${tile('brain', '#8e4ec6')}<span class="qp-card-t"><small>${esc(qpt('hifz'))}</small><b>${due ? `${N(due)} · ${esc(qpt('due'))}` : esc(qpt('hifz_d'))}</b></span>${icon('chevR')}</a>`;
  $('.qh-cards')?.insertAdjacentHTML('afterend', `<div class="qp-cards">${goalCard}${hifzCard}</div>`);
};

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-qp]');
  if (!a) return;
  const d = a.dataset;
  switch (d.qp) {
    case 'days': GSET.days = +d.v; qGoalSetup(); break;
    case 'step': GSET.days = Math.max(3, Math.min(365, GSET.days + +d.d * (GSET.days >= 60 ? 10 : GSET.days >= 30 ? 5 : 1))); qGoalSetup(); break;
    case 'from': GSET.from = d.v; qGoalSetup(); break;
    case 'go': {
      const start = GSET.from === 'here' && Q.st.last ? await pageOf(Q.st.last.s, Q.st.last.v) : 1;
      const g = GSET.editing ? Q.st.goal : null;
      // Changing the plan keeps what has been read; a new plan starts fresh.
      Q.st.goal = g && g.start === start ? { ...g, days: GSET.days } : { days: GSET.days, start, startDate: todayISO(), read: [], log: {} };
      GSET.editing = false;
      qSave(); nativeUi('haptic', 'long'); location.hash = '#/quran/goal'; render();
      break;
    }
    case 'again': Q.st.goal = null; qSave(); GSET.from = 'start'; GSET.editing = false; render(); break;
    case 'change': GSET.days = Q.st.goal.days; GSET.editing = true; qGoalSetup(); break;
    case 'end': if (confirm(qpt('end_q'))) { Q.st.goal = null; qSave(); render(); } break;
    case 'remind': S.cfg.alerts.quran_time = d.v; await saveCfg(); render(); break;
    case 'hadd': { const s = +d.s; hAdd(s, 1, Q.meta.chapters[s - 1].verses); render(); break; }
    case 'hadd-custom': {
      const s = +$('#hz-s').value, n = Q.meta.chapters[s - 1].verses;
      const A = Math.max(1, Math.min(n, +$('#hz-a').value || 1)), Bv = Math.max(A, Math.min(n, +$('#hz-b').value || n));
      hAdd(s, A, Bv); render();
      break;
    }
    case 'mode': PR.mode = d.v; azStore.set('hz-mode', d.v); PR.revealed = new Set(); $$('#pr-mode button').forEach((b) => b.classList.toggle('on', b === a)); qpShowVerse(0); break;
    case 'word': if (PR.mode !== 'show') { PR.revealed.add(+d.i); nativeUi('haptic'); qpShowVerse(0); } break;
    case 'revealall': { const x = hz().items[PR.k]; (await qAr(x.s))[PR.v - 1].u.forEach((_, i) => PR.revealed.add(i)); qpShowVerse(0); break; }
    case 'listen': { const x = hz().items[PR.k]; qPlay(x.s, PR.v, { to: PR.v, repeat: 3 }); break; }
    case 'playall': { const x = hz().items[PR.k]; qPlay(x.s, x.a, { to: x.b, repeat: 1, loop: 2 }); break; }
    case 'pnext': { const x = hz().items[PR.k]; if (PR.v >= x.b) { qpRate(); break; } PR.v++; PR.revealed = new Set(); nativeUi('haptic'); qpShowVerse(1); break; }
    case 'pprev': { const x = hz().items[PR.k]; if (PR.v <= x.a) break; PR.v--; PR.revealed = new Set(); qpShowVerse(-1); break; }
    case 'rate': {
      const x = hz().items[PR.k], r = +d.v;
      if (r === 2) { x.next = addDays(todayISO(), SRS[Math.min(SRS.length - 1, x.level || 0)]); x.level = (x.level || 0) + 1; }
      else if (r === 1) x.next = addDays(todayISO(), 1);
      else { x.level = 0; x.next = todayISO(); }
      qSave(); nativeUi('haptic', 'long');
      qCmd('stop');
      location.hash = '#/quran/hifz';
      break;
    }
  }
});
