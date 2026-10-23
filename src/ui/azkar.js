'use strict';
// Waqt Azkar (phones): Hisnul Muslim and the duas of the Quran, offline.
// Morning, evening, after-salah, sleep and waking sessions are guided: one
// dhikr per screen, tap to count, it moves on by itself when the count is
// done. Everything else is browsable by topic or chapter, with search.
// Loaded after salah.js (uses its helpers and the quran.js sheet).

const AZ = { meta: null, ch: {}, all: null };
const azDay = () => S.day?.today?.date || new Date().toISOString().slice(0, 10);
const azStore = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const AZT = {
  title: ['Azkar', 'যিকির ও দোয়া'], sub: ['Remembrance from Hisnul Muslim and the Quran', 'হিসনুল মুসলিম ও কুরআনের যিকির ও দোয়া'],
  morning: ['Morning adhkar', 'সকালের যিকির'], evening: ['Evening adhkar', 'সন্ধ্যার যিকির'], now: ['Now', 'এখন'], done: ['Done today', 'আজ সম্পন্ন'],
  after_salah: ['After salah', 'নামাজের পর'], sleep: ['Before sleep', 'ঘুমানোর আগে'], wake: ['On waking', 'ঘুম থেকে উঠে'],
  topics: ['Topics', 'বিষয়'], favourites: ['Favourites', 'প্রিয়'], all: ['All of Hisnul Muslim', 'পূর্ণ হিসনুল মুসলিম'], quran_duas: ['Duas from the Quran', 'কুরআনের দোয়া'],
  special: ['Special adhkar', 'বিশেষ যিকর ও দোয়া'], search_ph: ['Search duas…', 'দোয়া খুঁজুন…'], chapters: ['chapters', 'অধ্যায়'], duas: ['duas', 'দোয়া'],
  tap: ['Tap anywhere to count', 'গুনতে যেকোনো জায়গায় চাপুন'], of: ['of', '/'], skip: ['Skip', 'পরেরটি'], complete: ['Complete', 'সম্পন্ন'],
  complete_d: ['May Allah accept it from you.', 'আল্লাহ কবুল করুন।'], streak: ['day streak', 'দিন ধারাবাহিক'], close: ['Close', 'বন্ধ'],
  times: ['times', 'বার'], ref: ['Reference', 'সূত্র'], copy: ['Copy', 'কপি'], share: ['Share', 'শেয়ার'], fav: ['Favourite', 'প্রিয়'], copied: ['Copied', 'কপি হয়েছে'],
  no_fav: ['No favourites yet. Tap ♡ on any dua to keep it here.', 'এখনো কোনো প্রিয় দোয়া নেই। যেকোনো দোয়ায় ♡ চাপুন।'], results: ['results', 'ফলাফল'], none: ['Nothing found', 'কিছু পাওয়া যায়নি'],
  listen: ['Listen', 'শুনুন'], offline: ['The recitation needs internet.', 'তিলাওয়াত শুনতে ইন্টারনেট লাগবে।'], reminders: ['Morning and evening reminders', 'সকাল-সন্ধ্যার রিমাইন্ডার'],
  reminders_d: ['After Fajr and after Asr', 'ফজর ও আসরের পর'], steps: ['adhkar', 'যিকির'], show_tr: ['Transliteration', 'উচ্চারণ'], show_mean: ['Meaning', 'অর্থ'],
  virtue: ['Virtue', 'ফযীলত'], minutes: ['min', 'মিনিট'],
};
const azt = (k) => tr2(AZT[k]);

/// The guided sessions: which chapters, and for morning/evening which variant.
const SESSIONS = {
  morning: { ch: [27], when: 'm', title: AZT.morning, ic: 'sunrise', tone: 'm' },
  evening: { ch: [27], when: 'e', title: AZT.evening, ic: 'moon', tone: 'e' },
  salah: { ch: [25], title: AZT.after_salah, ic: 'mosque', tone: 's' },
  sleep: { ch: [28], title: AZT.sleep, ic: 'isha', tone: 'n' },
  wake: { ch: [1], title: AZT.wake, ic: 'fajr', tone: 'w' },
};

Object.assign(IC, {
  beads: '<circle cx="12" cy="4.5" r="1.8"/><circle cx="17.5" cy="7" r="1.8"/><circle cx="19" cy="12.5" r="1.8"/><circle cx="6.5" cy="7" r="1.8"/><circle cx="5" cy="12.5" r="1.8"/><path d="M7 16.5c1.2 2 3 3 5 3s3.8-1 5-3"/>',
  heartf: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>',
  sun2: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
});
/// An icon and colour for each topic.
const CAT_LOOK = { 1: ['isha', '#5b5bd6'], 2: ['sun2', '#f76b15'], 3: ['heart', '#e5484d'], 4: ['bubble', '#0091ff'], 5: ['moon', '#8e4ec6'], 6: ['kaaba', '#1d1d1f'],
  7: ['drop', '#12a594'], 8: ['pray', '#d99a1e'], 9: ['star', '#30a46c'], 10: ['sparkle', '#d99a1e'], 11: ['plane', '#0091ff'], 12: ['wave', '#12a594'],
  13: ['check', '#30a46c'], 14: ['shield', '#6b7690'], 15: ['bell', '#e5484d'], 16: ['mosque', '#30a46c'], 17: ['book', '#5b5bd6'], 18: ['book', '#d6409f'] };

const azj = async (p) => { const r = await fetch(p); if (!r.ok) throw new Error(String(r.status)); return r.json(); };
const azMeta = async () => (AZ.meta ??= await azj('/azkar/meta.json'));
const azCh = async (id) => (AZ.ch[id] ??= await azj(`/azkar/c${id}.json`));
const chInfo = (id) => { for (const b of AZ.meta.books) { const c = b.chapters.find((x) => x.id === id); if (c) return { ...c, book: b.id }; } return null; };
const chName = (c) => (B() ? c.bn : c.en || c.bn);

// ---------- Text of one dhikr ----------
/// The segments to show: for morning/evening, the matching variant.
function segsFor(d, when) {
  const segs = d.s.filter((x) => x.ar);
  if (!when) return segs;
  const m = /সকালে/, e = /বিকালে|সন্ধ্যায়|সন্ধ্যা/;
  const tagged = segs.filter((x) => m.test(x.n) || e.test(x.n));
  if (!tagged.length) return segs;
  return segs.filter((x) => (when === 'm' ? !e.test(x.n) || m.test(x.n) : !m.test(x.n) || e.test(x.n)));
}
const notes = (d) => d.s.map((x) => x.n).filter(Boolean).join(' ').trim();
const virtue = (d) => d.s.map((x) => x.after).filter(Boolean).join(' ').trim();
const meaning = (d, segs) => (B() ? segs.map((x) => x.bn).filter(Boolean).join(' ') : d.en || segs.map((x) => x.bn).join(' '));
const translit = (d, segs) => (B() ? segs.map((x) => x.tr).filter(Boolean).join(' ') : d.tren || '');
const favKey = (chId, id) => `${chId}:${id}`;

function dhikrCard(chId, d, opts = {}) {
  const segs = segsFor(d, opts.when);
  if (!segs.length && !notes(d)) return '';
  const favs = azStore.get('az-fav', {});
  const k = favKey(chId, d.id);
  const ar = segs.map((x) => `<div class="az-ar" dir="rtl" lang="ar">${esc(x.ar)}</div>`).join('');
  const v = virtue(d);
  return `<article class="az-card" data-k="${k}">
    <div class="az-card-h">${d.c ? `<span class="az-x">×${N(d.c)}</span>` : ''}${opts.title ? `<b>${esc(opts.title)}</b>` : ''}
      <span class="qv-acts">${d.au ? `<button data-za="play" data-u="${esc(d.au)}">${icon('play')}</button>` : ''}
        <button data-za="fav" data-k="${k}" class="${favs[k] ? 'on' : ''}">${icon(favs[k] ? 'heartf' : 'heart')}</button>
        <button data-za="more" data-k="${k}">${icon('more')}</button></span></div>
    ${!segs.length || B() ? (notes(d) && B() ? `<p class="az-note">${esc(notes(d))}</p>` : '') : ''}
    ${ar}
    ${translit(d, segs) ? `<p class="az-tr">${esc(translit(d, segs))}</p>` : ''}
    <p class="az-mean" ${B() ? 'lang="bn"' : ''}>${esc(meaning(d, segs))}</p>
    ${v && B() ? `<p class="az-virtue">${icon('sparkle')}${esc(v)}</p>` : ''}
    ${(B() ? d.ref : d.q) ? `<p class="az-ref">${esc(B() ? d.ref : d.q ? `Quran ${d.q}` : "")}</p>` : ''}
  </article>`;
}

// ---------- Router ----------
VIEWS.azkar = async (tok) => {
  await azMeta();
  if (!live(tok)) return;
  const p = location.hash.replace(/^#\/?azkar\/?/, '').split('/').filter(Boolean);
  document.body.classList.toggle('focus', p[0] === 's');
  if (p[0] === 's' && SESSIONS[p[1]]) return azSession(tok, p[1]);
  if (p[0] === 'c') return azCat(tok, +p[1]);
  if (p[0] === 'ch') return azChapter(tok, +p[1]);
  if (p[0] === 'b') return azBook(+p[1]);
  if (p[0] === 'fav') return azFavs(tok);
  if (p[0] === 'search') return azSearch(tok, decodeURIComponent(p.slice(1).join('/')));
  return azHome();
};

/// Which session fits the time: morning from Fajr to Dhuhr, evening from Asr to Isha.
function azNow() {
  const d = S.day; if (!d) return '';
  const T = d.today.times, now = Date.now();
  if (now >= T.fajr && now < T.dhuhr) return 'morning';
  if (now >= T.asr && now < T.isha + 3600000) return 'evening';
  return '';
}
const sessionLen = async (k) => {
  const s = SESSIONS[k];
  let n = 0;
  for (const c of s.ch) for (const d of await azCh(c)) if (segsFor(d, s.when).length) n++;
  return n;
};
const doneToday = (k) => azStore.get(`az-done-${azDay()}`, {})[k];
function azStreak(k) {
  let n = 0;
  const d = new Date(`${azDay()}T00:00:00Z`);
  if (!doneToday(k)) d.setUTCDate(d.getUTCDate() - 1);
  while (azStore.get(`az-done-${d.toISOString().slice(0, 10)}`, {})[k]) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

async function azHome() {
  const m = AZ.meta, now = azNow();
  const [nm, ne] = await Promise.all([sessionLen('morning'), sessionLen('evening')]);
  const hero = (k, n) => {
    const s = SESSIONS[k], done = doneToday(k);
    return `<a class="az-hero t-${s.tone} ${now === k ? 'now' : ''}" href="#/azkar/s/${k}">
      <span class="az-hero-art">${k === 'morning' ? azSunArt() : azMoonArt()}</span>
      ${now === k && !done ? `<span class="az-badge">${esc(azt('now'))}</span>` : ''}
      <b>${esc(tr2(s.title))}</b><small>${done ? `✓ ${esc(azt('done'))}` : `${N(n)} ${esc(azt('steps'))} · ${N(Math.round(n * 0.6))} ${esc(azt('minutes'))}`}</small>
      ${azStreak(k) > 1 ? `<i>${icon('flame')}${N(azStreak(k))}</i>` : ''}</a>`;
  };
  const quick = ['salah', 'sleep', 'wake'].map((k) => `<a class="az-quick" href="#/azkar/s/${k}">${tile(SESSIONS[k].ic, { salah: '#30a46c', sleep: '#5b5bd6', wake: '#f76b15' }[k])}<b>${esc(tr2(SESSIONS[k].title))}</b>${doneToday(k) ? '<em>✓</em>' : ''}</a>`).join('');
  const cats = m.cats.filter((c) => c.n).map((c) => { const [ic, col] = CAT_LOOK[c.id] || ['book', '#6b7690']; return `<a class="az-cat" href="#/azkar/c/${c.id}">${tile(ic, col)}<b>${esc(B() ? c.bn : c.en)}</b><small>${N(c.n)}</small></a>`; }).join('');
  const favN = Object.keys(azStore.get('az-fav', {})).length;
  view.innerHTML = `<div class="p-page az">${ptitle(azt('title'))}<p class="p-sub">${esc(azt('sub'))}</p>
    <div class="az-heroes">${hero('morning', nm)}${hero('evening', ne)}</div>
    <div class="az-quicks">${quick}</div>
    <form class="search-box qsearch" data-za="search">${icon('search')}<input class="input" id="az-q" placeholder="${esc(azt('search_ph'))}" autocomplete="off" spellcheck="false" enterkeyhint="search"></form>
    <div class="p-head">${esc(azt('topics'))}</div><div class="az-cats">${cats}</div>
    <div class="p-head"></div><div class="p-group">
      <a class="p-row tap" href="#/azkar/fav">${tile('heart', '#e5484d')}<span class="p-lab"><b>${esc(azt('favourites'))}</b></span><span class="p-val">${N(favN)}</span>${chev()}</a>
      ${m.books.map((b) => `<a class="p-row tap" href="#/azkar/b/${b.id}">${tile(b.id === 2 ? 'book' : b.id === 3 ? 'star' : 'beads', b.id === 2 ? '#30a46c' : b.id === 3 ? '#d99a1e' : '#5b5bd6')}<span class="p-lab"><b>${esc(B() ? b.bn : b.en)}</b><small>${N(b.chapters.length)} ${esc(azt('chapters'))}</small></span>${chev()}</a>`).join('')}
      <div class="p-row">${tile('bell', '#f76b15')}<span class="p-lab"><b>${esc(azt('reminders'))}</b><small>${esc(azt('reminders_d'))}</small></span><button class="toggle ${S.cfg.alerts?.azkar !== false ? 'on' : ''}" data-act="toggle" data-path="alerts.azkar" role="switch"></button></div></div>
    <div class="p-foot">${esc(m.source)}</div></div>`;
}

function azSunArt() {
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><defs><radialGradient id="azs"><stop offset="0" stop-color="#fff6d8"/><stop offset=".4" stop-color="#ffd36b"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient></defs>
    <circle cx="86" cy="40" r="34" fill="url(#azs)"/><circle cx="86" cy="40" r="13" fill="#fff3cf"/><path d="M0 66 Q30 54 60 62 T120 58 V80 H0Z" fill="rgba(255,255,255,.18)"/></svg>`;
}
function azMoonArt() {
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><defs><mask id="azm"><circle cx="88" cy="34" r="15" fill="#fff"/><circle cx="95" cy="28" r="13" fill="#000"/></mask></defs>
    ${[[20, 18], [44, 10], [60, 26], [30, 40], [110, 60], [70, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="88" cy="34" r="15" fill="#f6f0d8" mask="url(#azm)"/><path d="M0 66 Q30 56 60 63 T120 60 V80 H0Z" fill="rgba(255,255,255,.1)"/></svg>`;
}

// ---------- A guided session ----------
const SESS = { k: '', items: [], i: 0, n: 0, tr: true, mean: true };
async function azSession(tok, k) {
  const s = SESSIONS[k];
  const items = [];
  for (const c of s.ch) for (const d of await azCh(c)) { const segs = segsFor(d, s.when); if (segs.length) items.push({ c, d, segs }); }
  if (!live(tok)) return;
  Object.assign(SESS, { k, items, i: Math.min(azStore.get(`az-at-${azDay()}-${k}`, 0), items.length - 1), n: 0 });
  SESS.tr = azStore.get('az-tr', true); SESS.mean = azStore.get('az-mean', true);
  view.innerHTML = `<div class="az-sess t-${s.tone}">
    <div class="sg-bar"><a class="sg-close" href="#/azkar" aria-label="close">${icon('x')}</a><b>${esc(tr2(s.title))}</b><span id="az-pos"></span></div>
    <div class="az-prog"><i id="az-prog"></i></div>
    <div class="az-stage" id="az-stage"></div>
    <div class="az-dock">
      <div class="az-toggles"><button data-za="tg" data-v="tr" class="${SESS.tr ? 'on' : ''}">${esc(azt('show_tr'))}</button><button data-za="tg" data-v="mean" class="${SESS.mean ? 'on' : ''}">${esc(azt('show_mean'))}</button></div>
      <button class="az-counter" id="az-counter" data-za="count"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="az-ct"/><circle cx="60" cy="60" r="52" class="az-cb" id="az-cb" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"/></svg><span id="az-num"></span><small id="az-of"></small></button>
      <div class="az-side"><button data-za="prev">${icon('chevL')}</button><button data-za="skip">${esc(azt('skip'))}${icon('chevR')}</button></div>
    </div></div>`;
  azShow(0);
  // Tapping the text counts too; swiping moves between adhkar.
  const st = $('#az-stage');
  let x0 = null;
  st.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) azGo(dx < 0 ? 1 : -1);
    else if (!e.target.closest('button,a')) azCount();
  }, { passive: true });
}

function azShow(dir) {
  const it = SESS.items[SESS.i];
  if (!it) return;
  const { d, segs } = it;
  const target = d.c || 1;
  $('#az-pos').textContent = `${N(SESS.i + 1)} / ${N(SESS.items.length)}`;
  $('#az-prog').style.width = `${(SESS.i / SESS.items.length) * 100}%`;
  const tr = translit(d, segs), mean = meaning(d, segs), v = virtue(d);
  $('#az-stage').innerHTML = `<div class="az-slide ${dir > 0 ? 'fwd' : dir < 0 ? 'bwd' : ''}">
    ${d.c ? `<span class="az-x big">×${N(d.c)}</span>` : ''}
    ${B() && notes(d) ? `<p class="az-note">${esc(notes(d))}</p>` : ''}
    ${segs.map((x) => `<div class="az-ar big" dir="rtl" lang="ar">${esc(x.ar)}</div>`).join('')}
    ${SESS.tr && tr ? `<p class="az-tr">${esc(tr)}</p>` : ''}
    ${SESS.mean ? `<p class="az-mean" ${B() ? 'lang="bn"' : ''}>${esc(mean)}</p>` : ''}
    ${v && B() ? `<p class="az-virtue">${icon('sparkle')}${esc(v)}</p>` : ''}
    <div class="az-slide-f">${d.au ? `<button class="sg-play" data-za="play" data-u="${esc(d.au)}">${icon('play')}${esc(azt('listen'))}</button>` : ''}${(B() ? d.ref : d.q) ? `<span class="az-ref">${esc(B() ? d.ref : d.q ? `Quran ${d.q}` : "")}</span>` : ''}</div></div>`;
  $('#az-stage').scrollTop = 0;
  $('#scroll').scrollTop = 0;
  SESS.n = 0;
  azPaint(target);
}

function azPaint(target) {
  $('#az-num').textContent = N(SESS.n);
  $('#az-of').textContent = `${azt('of')} ${N(target)}`;
  $('#az-cb').style.strokeDashoffset = String(1000 - (SESS.n / target) * 1000);
}

function azCount() {
  const it = SESS.items[SESS.i];
  if (!it) return;
  const target = it.d.c || 1;
  if (SESS.n >= target) return;
  SESS.n++;
  azPaint(target);
  const btn = $('#az-counter');
  btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
  if (SESS.n < target) { nativeUi('haptic'); return; }
  nativeUi('haptic', 'long');
  btn.classList.add('done');
  setTimeout(() => { btn.classList.remove('done'); azGo(1); }, 520);
}

function azGo(dir) {
  const n = SESS.i + dir;
  if (n < 0) return;
  if (n >= SESS.items.length) { azFinish(); return; }
  SESS.i = n;
  azStore.set(`az-at-${azDay()}-${SESS.k}`, n);
  azShow(dir);
}

function azFinish() {
  const done = azStore.get(`az-done-${azDay()}`, {});
  done[SESS.k] = Date.now();
  azStore.set(`az-done-${azDay()}`, done);
  azStore.set(`az-at-${azDay()}-${SESS.k}`, 0);
  nativeUi('haptic', 'long');
  const s = SESSIONS[SESS.k], streak = azStreak(SESS.k);
  $('#az-prog').style.width = '100%';
  $('.az-dock').hidden = true;
  $('#az-stage').innerHTML = `<div class="az-finish"><div class="az-finish-art">${SESS.k === 'evening' || SESS.k === 'sleep' ? azMoonArt() : azSunArt()}</div>
    <h2>${esc(tr2(s.title))} · ${esc(azt('complete'))}</h2><p>${esc(azt('complete_d'))}</p>
    ${streak > 1 ? `<div class="az-streak">${icon('flame')}${N(streak)} ${esc(azt('streak'))}</div>` : ''}
    <a class="btn gold" href="#/azkar">${esc(azt('close'))}</a></div>`;
}

// ---------- Browsing ----------
async function azCat(tok, id) {
  const c = AZ.meta.cats.find((x) => x.id === id);
  if (!c) { location.hash = '#/azkar'; return; }
  const parts = [];
  let last = null;
  for (const key of c.items) {
    const [chId, did] = key.split(':');
    const ch = +chId;
    const d = (await azCh(ch)).find((x) => x.id === did);
    if (!live(tok)) return;
    if (!d) continue;
    if (ch !== last) { const info = chInfo(ch); parts.push(`<div class="p-head az-ch-h">${esc(chName(info))}</div>`); last = ch; }
    parts.push(dhikrCard(ch, d));
  }
  view.innerHTML = `<div class="p-page az">${ptitle(B() ? c.bn : c.en, '#/azkar')}<div class="az-list">${parts.join('')}</div></div>`;
}

async function azChapter(tok, id) {
  const info = chInfo(id);
  if (!info) { location.hash = '#/azkar'; return; }
  const items = await azCh(id);
  if (!live(tok)) return;
  view.innerHTML = `<div class="p-page az">${ptitle(chName(info), `#/azkar/b/${info.book}`)}<div class="az-list">${items.map((d) => dhikrCard(id, d)).join('')}</div></div>`;
}

function azBook(id) {
  const b = AZ.meta.books.find((x) => x.id === id);
  if (!b) { location.hash = '#/azkar'; return; }
  view.innerHTML = `<div class="p-page az">${ptitle(B() ? b.bn : b.en, '#/azkar')}<div class="qlist">${b.chapters.filter((c) => c.n).map((c, i) => `<a class="qs-row" href="#/azkar/ch/${c.id}"><span class="qs-n"><b>${N(i + 1)}</b></span>
    <div class="qs-t"><b>${esc(chName(c))}</b><small>${B() ? esc(c.en) + ' · ' : ''}${N(c.n)} ${esc(azt('duas'))}</small></div></a>`).join('')}</div></div>`;
}

async function azFavs(tok) {
  const favs = Object.entries(azStore.get('az-fav', {})).sort((a, b) => b[1] - a[1]);
  const cards = [];
  for (const [k] of favs) {
    const [ch, id] = k.split(':');
    const d = (await azCh(+ch)).find((x) => x.id === id);
    if (d) cards.push(dhikrCard(+ch, d, { title: chName(chInfo(+ch)) }));
  }
  if (!live(tok)) return;
  view.innerHTML = `<div class="p-page az">${ptitle(azt('favourites'), '#/azkar')}<div class="az-list">${cards.join('') || `<div class="card muted">${esc(azt('no_fav'))}</div>`}</div></div>`;
}

async function azSearch(tok, q) {
  view.innerHTML = `<div class="p-page az">${ptitle(`“${q}”`, '#/azkar')}<p class="p-sub" id="az-n">…</p><div class="az-list" id="az-r"></div></div>`;
  const term = q.trim().toLowerCase();
  const isAr = /[؀-ۿ]/.test(term);
  const nt = isAr ? normAr(term) : term;
  const hits = [];
  for (const b of AZ.meta.books) for (const c of b.chapters) {
    if (hits.length >= 80) break;
    const titleHit = `${c.bn} ${c.en}`.toLowerCase().includes(term);
    for (const d of await azCh(c.id)) {
      if (!live(tok)) return;
      const hay = isAr ? normAr(d.s.map((x) => x.ar).join(' ')) : `${d.en || ''} ${d.s.map((x) => `${x.bn} ${x.n}`).join(' ')} ${d.t}`.toLowerCase();
      if (titleHit || hay.includes(nt)) hits.push(dhikrCard(c.id, d, { title: chName(c) }));
      if (hits.length >= 80) break;
    }
  }
  $('#az-n').textContent = `${N(hits.length)}${hits.length >= 80 ? '+' : ''} ${azt('results')}`;
  $('#az-r').innerHTML = hits.join('') || `<div class="card muted">${esc(azt('none'))}</div>`;
}

// ---------- Today: a gentle prompt at the right time ----------
const azTodayBase = VIEWS.today;
VIEWS.today = async (tok) => {
  await azTodayBase(tok);
  if (!live(tok)) return;
  const k = azNow();
  if (!k || doneToday(k)) return;
  await azMeta();
  const n = await sessionLen(k);
  const box = document.getElementById('banners');
  if (!box || $('.az-prompt')) return;
  box.insertAdjacentHTML('beforebegin', `<a class="az-prompt t-${SESSIONS[k].tone}" href="#/azkar/s/${k}"><span class="az-prompt-art">${k === 'morning' ? azSunArt() : azMoonArt()}</span>
    <span class="az-prompt-t"><b>${esc(tr2(SESSIONS[k].title))}</b><small>${N(n)} ${esc(azt('steps'))} · ${N(Math.round(n * 0.6))} ${esc(azt('minutes'))}</small></span><span class="btn small gold">${icon('play')}</span></a>`);
};

// ---------- Events ----------
let azAudio = null;
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-za]');
  if (!a) return;
  const d = a.dataset;
  switch (d.za) {
    case 'count': azCount(); break;
    case 'skip': azGo(1); break;
    case 'prev': azGo(-1); break;
    case 'tg': SESS[d.v] = !SESS[d.v]; azStore.set(`az-${d.v}`, SESS[d.v]); a.classList.toggle('on', SESS[d.v]); { const n = SESS.n; azShow(0); SESS.n = n; azPaint(SESS.items[SESS.i].d.c || 1); } break;
    case 'play': {
      if (azAudio && !azAudio.paused && azAudio.dataset.u === d.u) { azAudio.pause(); a.classList.remove('on'); break; }
      azAudio?.pause();
      azAudio = new Audio(d.u); azAudio.dataset.u = d.u;
      $$('[data-za="play"].on').forEach((x) => x.classList.remove('on'));
      a.classList.add('on');
      azAudio.onended = () => a.classList.remove('on');
      azAudio.play().catch(() => { a.classList.remove('on'); toast(azt('offline')); });
      break;
    }
    case 'fav': {
      const f = azStore.get('az-fav', {});
      if (f[d.k]) delete f[d.k]; else f[d.k] = Date.now();
      azStore.set('az-fav', f);
      a.classList.toggle('on', !!f[d.k]); a.innerHTML = icon(f[d.k] ? 'heartf' : 'heart');
      nativeUi('haptic');
      break;
    }
    case 'more': {
      const [ch, id] = d.k.split(':');
      const it = (await azCh(+ch)).find((x) => x.id === id);
      const segs = it.s.filter((x) => x.ar);
      AZ.share = `${segs.map((x) => x.ar).join('\n')}\n\n${translit(it, segs)}\n\n${meaning(it, segs)}${it.ref ? `\n\n— ${B() ? it.ref : it.q ? `Quran ${it.q}` : it.ref}` : ''}`;
      qSheet(`<div class="qsh-t">${esc(chName(chInfo(+ch)))}</div><button data-za="copy">${icon('copy')}${esc(azt('copy'))}</button><button data-za="share">${icon('share')}${esc(azt('share'))}</button>`);
      break;
    }
    case 'copy': await post('/api/quran/copy', { text: AZ.share }); qSheetClose(); toast(azt('copied')); break;
    case 'share': await post('/api/quran/share', { text: AZ.share }); qSheetClose(); break;
  }
});
document.addEventListener('submit', (e) => {
  if (!e.target.matches('[data-za="search"]')) return;
  e.preventDefault();
  const q = $('#az-q').value.trim();
  if (q) location.hash = `#/azkar/search/${encodeURIComponent(q)}`;
});
