'use strict';
// Waqt Today and Hijri calendar, redesigned for phones. Today: the prayers
// in one card, led by a five-part bar that fills through each prayer's time
// (green once prayed), then a grid of widgets — the ayah, the Hijri date and
// moon, the Name of Allah, Qibla, the streak, what's coming and the other
// times of day. The calendar: a clean month with today, events and the white
// days marked, and a compact card for the chosen day. Loaded last: it
// replaces app.js's renderTimeline, renderWidgets, VIEWS.calendar and
// showCalDay, and tidies what other modules add to Today.

const HMT = {
  prayers: ['Today\'s prayers', 'আজকের নামাজ'], prayed: ['prayed', 'পড়া হয়েছে'],
  hijri: ['Hijri', 'হিজরি'], name: ['Name of Allah', 'আল্লাহর নাম'], qibla: ['Qibla', 'কিবলা'], streak: ['Streak', 'ধারাবাহিকতা'],
  days_row: ['days in a row', 'দিন একটানা'], start_streak: ['Mark a prayer to begin', 'নামাজ চিহ্নিত করে শুরু করুন'],
  coming: ['Coming up', 'সামনে যা আছে'], times: ['More times today', 'আজকের আরও সময়'], all: ['See the calendar', 'ক্যালেন্ডার দেখুন'],
  ayah: ['Ayah of the day', 'আজকের আয়াত'], in_days: ['days', 'দিন'], today: ['Today', 'আজ'], tomorrow: ['Tomorrow', 'আগামীকাল'],
  illum: ['lit', 'আলোকিত'], show_all: ['Show all', 'সব দেখুন'], show_less: ['Show less', 'কম দেখুন'], white: ['White days — sunnah fast', 'আইয়ামে বীজ — সুন্নত রোজা'],
  event: ['Event', 'বিশেষ দিন'], friday: ['Jumu\'ah', 'জুমা'], note: ['Dates are calculated; a local announcement can differ by a day. Settings → Hijri date to adjust.', 'তারিখ হিসাব করা; স্থানীয় ঘোষণার সাথে এক দিন পার্থক্য হতে পারে। মিলিয়ে নিতে সেটিংস → হিজরি তারিখ।'],
  sehri: ['Sehri ends', 'সাহরি শেষ'], iftar: ['Iftar', 'ইফতার'],
};
const hmt = (k) => HMT[k][L() === 'bn' ? 1 : 0];
/// A time without its "AM" or Bengali part of the day, where space is short.
const hmBare = (at, off) => fmtTime(at, off).replace(/\s*(AM|PM|am|pm|ভোর|সকাল|দুপুর|বিকাল|সন্ধ্যা|রাত)\s*/g, ' ').trim();
const HM_DIRS = { en: ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'], bn: ['উত্তর', 'উত্তর-পূর্ব', 'পূর্ব', 'দক্ষিণ-পূর্ব', 'দক্ষিণ', 'দক্ষিণ-পশ্চিম', 'পশ্চিম', 'উত্তর-পশ্চিম'] };

// =====================================================================
// Today
// =====================================================================
/// Each prayer's window: from its time to the next one's.
function hmWindows(d) {
  const T0 = d.today.times;
  return [['fajr', T0.fajr, T0.sunrise], ['dhuhr', T0.dhuhr, T0.asr], ['asr', T0.asr, T0.maghrib], ['maghrib', T0.maghrib, T0.isha], ['isha', T0.isha, T0.fajr + 86400000]];
}

// The five-part day bar, in place of the old coloured timeline.
renderTimeline = function () {
  const d = S.day, off = d.today.tz_offset, fri = d.today.friday;
  const segs = hmWindows(d).map(([k, a], i) => `<div class="hm-seg" data-k="${k}" data-i="${i}"><div class="hm-track"><i></i></div>
    <b>${esc(pname(k, fri))}</b></div>`).join('');
  $('#timeline').innerHTML = `<div class="hm-bar">${segs}</div>`;
  hmBarTick();
};

/// Fills each part by how much of its time has passed, coloured by what the tracker says.
function hmBarTick() {
  const d = S.day;
  if (!d || !$('.hm-bar')) return;
  const now = Date.now();
  hmWindows(d).forEach(([k, a, b], i) => {
    const el = $(`.hm-seg[data-i="${i}"]`);
    if (!el) return;
    const st = d.tracker[i];
    const frac = Math.min(1, Math.max(0, (now - a) / (b - a)));
    const state = now < a ? 'future' : now >= b ? 'past' : 'now';
    el.className = `hm-seg ${state} s${st}`;
    el.querySelector('i').style.width = `${(st >= 1 && st <= 3 ? 1 : frac) * 100}%`;
  });
}
const hmTickBase = tickToday;
tickToday = function (first) { hmTickBase(first); if (route() === 'today') hmBarTick(); };

function hmHead(d) {
  const prayed = d.tracker.filter((s) => s >= 1 && s <= 3).length;
  const C = 2 * Math.PI * 9;
  return `<div class="hm-head"><b>${esc(hmt('prayers'))}</b><span class="hm-prog"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" class="bg"/><circle cx="12" cy="12" r="9" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - prayed / 5)}"/></svg>${N(prayed)}/${N(5)} ${esc(hmt('prayed'))}</span></div>`;
}

// ---------- Widgets ----------
const hmW = (cls, color, href, ic, label, body, extra = '') => `<a class="hw ${cls}" style="--wc:${color}" href="${href}" ${extra}><span class="hw-l">${icon(ic)}${esc(label)}</span>${body}</a>`;

renderWidgets = async function (tok) {
  const d = S.day, off = d.today.tz_offset, T0 = d.today.times;
  const h = d.hijri_now, moon = d.moon;
  const q = d.qibla;
  const dir = HM_DIRS[L()][Math.round(q.bearing / 45) % 8];
  const compass = `<svg class="hw-compass" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" class="ring"/>${[0, 90, 180, 270].map((a) => `<line x1="32" y1="5" x2="32" y2="9" transform="rotate(${a} 32 32)"/>`).join('')}
    <text x="32" y="17" text-anchor="middle">N</text><g transform="rotate(${q.bearing} 32 32)"><path d="M32 8 36 32 32 29 28 32Z" class="ndl"/></g><circle cx="32" cy="32" r="3" class="hub"/></svg>`;
  const prayed = d.tracker.filter((s) => s >= 1 && s <= 3).length;
  const up = d.upcoming.slice(0, 3).map((u) => `<div class="hw-ev"><span class="dot k-${u.event.kind}"></span><span class="hw-ev-t"><b>${esc(L() === 'bn' ? u.event.bn : u.event.en)}</b><small>${esc(fmtGDate(u.date, false))}</small></span>
    <span class="hw-ev-n">${u.days_left === 0 ? esc(hmt('today')) : u.days_left === 1 ? esc(hmt('tomorrow')) : `${N(u.days_left)} ${esc(hmt('in_days'))}`}</span></div>`).join('');
  const times = [[['Sehri ends', 'সাহরি শেষ'], T0.imsak], [['Ishraq', 'ইশরাক'], T0.ishraq], [['Zawal', 'জাওয়াল'], T0.zawal], [['Sunset', 'সূর্যাস্ত'], T0.sunset], [['Midnight', 'মধ্যরাত'], T0.midnight], [['Tahajjud', 'তাহাজ্জুদ'], T0.last_third]]
    .map(([k, v]) => `<div class="hw-tm"><small>${esc(k[L() === 'bn' ? 1 : 0])}</small><b>${esc(fmtTime(v, off))}</b></div>`).join('');
  const ram = d.ramadan.active ? hmW('wide ram', '#8e6bf0', '#/ramadan', 'moon', `${t('ramadan')} · ${t('ramadan_day')} ${N(d.ramadan.day)}`,
    `<div class="hw-twin"><div><small>${esc(hmt('sehri'))}</small><b>${esc(fmtTime(d.ramadan.sehri, off))}</b></div><div><small>${esc(hmt('iftar'))}</small><b>${esc(fmtTime(d.ramadan.iftar, off))}</b></div></div>`) : '';
  const countdown = d.ramadan.active ? '' : `<div class="hw-big-ev"><span class="hw-num">${N(d.ramadan.days_left)}</span><span><b>${esc(t('ramadan_in'))}</b><small>${esc(fmtGDate(d.ramadan.starts, false))}</small></span></div>`;
  $('#widgets').innerHTML = `${ram}
    ${hmW('wide ayah', '#e0a82e', '#/quran', 'sparkle', hmt('ayah'), '<div class="hw-ayah" id="hw-ayah"><div class="hw-skel"></div><div class="hw-skel s"></div></div>', 'id="ayah-card"')}
    <div class="hw-grid">
      ${hmW('hijri', '#6c7cf0', '#/calendar', 'moon', hmt('hijri'), `<span class="hw-moon">${moonSvg(moon.phase, 'moon', 46)}</span><span class="hw-num">${N(h.d)}</span>
        <b class="hw-t">${esc(L() === 'bn' ? h.month_bn : h.month_en)}</b><small class="hw-s">${N(h.y)} · ${N(Math.round(moon.illumination * 100))}% ${esc(hmt('illum'))}</small>`)}
      ${hmW('name', '#2fae6b', '#/names', 'names', hmt('name'), '<span class="hw-ar" id="hw-name-ar"></span><b class="hw-t" id="hw-name-t"></b><small class="hw-s" id="hw-name-m"></small>')}
      ${hmW('qibla', '#18a999', '#/qibla', 'qibla', hmt('qibla'), `${compass}<span class="hw-num">${N(Math.round(q.bearing))}°</span><small class="hw-s">${esc(dir)} · ${N(Math.round(q.distance).toLocaleString('en-US'))} km</small>`)}
      ${hmW('streak', '#ff8a3d', '#/tracker', 'flame', hmt('streak'), `<span class="hw-dots">${d.tracker.map((s) => `<i class="s${s}"></i>`).join('')}</span><span class="hw-num" id="hw-streak">–</span>
        <small class="hw-s" id="hw-streak-s">${N(prayed)}/${N(5)} ${esc(hmt('prayed'))}</small>`)}
    </div>
    ${hmW('wide coming', '#e5577a', '#/calendar', 'star', hmt('coming'), `${countdown}<div class="hw-evs">${up}</div>`)}
    <div class="hw wide times" style="--wc:#3d9bff"><span class="hw-l">${icon('clock')}${esc(hmt('times'))}</span><div class="hw-tms">${times}</div></div>`;

  api('/api/ayah').then((a) => {
    const box = $('#hw-ayah');
    if (!live(tok) || !box) return;
    $('#ayah-card').href = `#/quran/${a.surah}/${a.ayah}`;
    box.innerHTML = `<div class="hw-ayah-ar" dir="rtl" lang="ar">${esc(a.arabic)}</div><p>${esc(L() === 'bn' ? a.bangla : a.english)}</p><small>${esc(L() === 'bn' && Q?.meta ? cname(Q.meta.chapters[a.surah - 1]) : a.surah_en)} · ${N(`${a.surah}:${a.ayah}`)}</small>`;
  }).catch(() => { const box = $('#hw-ayah'); if (box) box.innerHTML = `<p class="muted">${esc(t('offline_ayah'))}</p>`; });
  api('/api/tracker?days=30').then((r) => {
    if (!live(tok) || !$('#hw-streak')) return;
    const n = r.stats.streak || 0;
    $('#hw-streak').textContent = N(n);
    if (n) $('#hw-streak-s').textContent = hmt('days_row'); else if (!prayed) $('#hw-streak-s').textContent = hmt('start_streak');
  }).catch(() => {});
  if (typeof nmReady !== 'undefined') nmReady.then(() => {
    if (!live(tok) || !$('#hw-name-ar') || !NAMES.length) return;
    const x = nmOfDay();
    $('#hw-name-ar').textContent = x.ar;
    $('#hw-name-t').textContent = L() === 'bn' ? x.bnp : x.tr;
    $('#hw-name-m').textContent = L() === 'bn' ? x.bn : x.en;
  });
};

// Prayers in one card, under a header with the day's progress; the separate name card folds into the grid.
const hmTodayBase = VIEWS.today;
VIEWS.today = async (tok) => {
  await hmTodayBase(tok);
  if (!live(tok)) return;
  $('.nm-today')?.remove();
  const pr = $('.prayers'), tl = $('#timeline');
  if (pr && tl && !pr.closest('.hm-day')) {
    const card = document.createElement('section');
    card.className = 'hm-day';
    card.innerHTML = hmHead(S.day);
    pr.before(card);
    card.append(tl, pr);
    tl.classList.remove('card');
  }
};

// =====================================================================
// Hijri calendar
// =====================================================================
const HC = { showAll: false };

VIEWS.calendar = async (tok) => {
  const st = VIEWS.calendar.st || (VIEWS.calendar.st = {});
  const q = st.y ? `?y=${st.y}&m=${st.m}` : '';
  const [c, ev] = await Promise.all([api(`/api/hmonth${q}`), VIEWS.calendar.events || api('/api/events')]);
  if (!live(tok)) return;
  VIEWS.calendar.events = ev;
  st.y = c.y; st.m = c.m;
  VIEWS.calendar.data = c;
  const isThisMonth = c.days.some((x) => x.today);
  const blanks = Array.from({ length: c.first_weekday }, () => '<span class="hc-d empty"></span>').join('');
  let lastGm = 0;
  const cells = c.days.map((x, i) => {
    const [, gm, gd] = x.date.split('-').map(Number);
    // The Gregorian month's name only where it changes.
    const g = gm !== lastGm || gd === 1 ? `${N(gd)} ${esc(MONTHS[L()][gm - 1].slice(0, L() === 'bn' ? 4 : 3))}` : N(gd);
    lastGm = gm;
    const white = x.fasts.includes('white_days');
    const kinds = [...new Set(x.events.map((e) => e.kind))].slice(0, 3).map((k) => `<i class="k-${k}"></i>`).join('');
    return `<button class="hc-d ${x.today ? 'today' : ''} ${white ? 'white' : ''} ${x.weekday === 5 ? 'fri' : ''} ${st.sel === i ? 'sel' : ''}" data-act="cal-day" data-i="${i}">
      <b>${N(x.d)}</b><small>${g}</small><span class="hc-dots">${kinds}</span></button>`;
  }).join('');
  const wds = WD_SHORT[L()].map((w, i) => `<span class="hc-wd ${i === 5 ? 'fri' : ''}">${esc(w)}</span>`).join('');
  const last = c.days[c.days.length - 1].date;
  const list = ev.events;
  const shown = HC.showAll ? list : list.slice(0, 4);
  const rows = shown.map((u) => `<div class="hc-ev"><span class="hc-bar k-${u.event.kind}"></span><span class="hc-ev-t"><b>${esc(L() === 'bn' ? u.event.bn : u.event.en)}</b>
    <small>${esc(WD_SHORT[L()][u.weekday])}, ${esc(fmtGDate(u.date, false))} · ${esc(hijriText(u.hijri, false))}</small></span>
    <span class="hc-ev-n">${u.days_left === 0 ? esc(hmt('today')) : u.days_left === 1 ? esc(hmt('tomorrow')) : `<b>${N(u.days_left)}</b>${esc(hmt('in_days'))}`}</span></div>`).join('');
  view.innerHTML = `<div class="p-page hc">${ptitle(t('calendar'))}
    <div class="hc-month">
      <div class="hc-head"><button class="hc-nav" data-act="cal-prev" aria-label="previous">${icon('chevL')}</button>
        <div class="hc-title"><span class="ar" dir="rtl" lang="ar">${c.names.month_ar}</span><b>${esc(L() === 'bn' ? c.names.month_bn : c.names.month_en)} ${N(c.y)}</b>
          <small>${esc(fmtGDate(c.first, false))} – ${esc(fmtGDate(last, false))}</small></div>
        <button class="hc-nav" data-act="cal-next" aria-label="next">${icon('chevR')}</button></div>
      ${isThisMonth ? '' : `<button class="hc-today" data-hc="today">${esc(hmt('today'))}</button>`}
      <div class="hc-grid ${st.dir ? `slide-${st.dir}` : ''}">${wds}${blanks}${cells}</div>
      <div class="hc-legend"><span><i class="hc-lg today"></i>${esc(hmt('today'))}</span><span><i class="hc-lg ev"></i>${esc(hmt('event'))}</span><span><i class="hc-lg white"></i>${esc(hmt('white'))}</span></div>
    </div>
    <div class="hc-detail" id="cal-detail"></div>
    <div class="p-head">${esc(t('upcoming_year'))}</div>
    <div class="hc-evs">${rows}</div>
    ${list.length > 4 ? `<button class="hc-more" data-hc="all">${esc(HC.showAll ? hmt('show_less') : `${hmt('show_all')} (${N(list.length)})`)}</button>` : ''}
    <div class="p-foot">${esc(hmt('note'))}</div></div>`;
  st.dir = '';
  showCalDay(st.sel ?? c.days.findIndex((x) => x.today));
};

showCalDay = function (i) {
  const c = VIEWS.calendar.data, el = $('#cal-detail');
  if (!c || !el) return;
  if (i < 0) i = 0;
  const x = c.days[i];
  if (!x) return;
  const mn = { new_moon: ['New moon', 'অমাবস্যা'], waxing_crescent: ['Waxing crescent', 'বর্ধমান চাঁদ'], first_quarter: ['First quarter', 'প্রথম চতুর্থাংশ'], waxing_gibbous: ['Waxing gibbous', 'বর্ধমান কুঁজো চাঁদ'], full_moon: ['Full moon', 'পূর্ণিমা'], waning_gibbous: ['Waning gibbous', 'ক্ষয়িষ্ণু কুঁজো চাঁদ'], last_quarter: ['Last quarter', 'শেষ চতুর্থাংশ'], waning_crescent: ['Waning crescent', 'ক্ষয়িষ্ণু চাঁদ'] }[x.moon.name] || ['', ''];
  const items = [
    ...x.events.map((e) => `<div class="hc-item k-${e.kind}"><span class="hc-bar k-${e.kind}"></span><div><b>${esc(L() === 'bn' ? e.bn : e.en)} <span class="ar" lang="ar">${e.ar}</span></b><p>${esc(L() === 'bn' ? e.note_bn : e.note_en)}</p></div></div>`),
    ...x.fasts.map((f) => `<div class="hc-item"><span class="hc-bar k-fast"></span><div><b>${esc(t(f))}</b></div></div>`),
    x.weekday === 5 ? `<div class="hc-item"><span class="hc-bar k-eid"></span><div><b>${esc(hmt('friday'))}</b></div></div>` : '',
  ].join('');
  el.innerHTML = `<div class="hc-dtop"><span class="hc-dmoon">${moonSvg(x.moon.phase, 'moon', 56)}</span>
    <div class="hc-dt"><small>${esc(x.today ? hmt('today') : HM_WD[L()][x.weekday])}</small><b>${N(x.d)} ${esc(L() === 'bn' ? c.names.month_bn : c.names.month_en)} ${N(c.y)}</b>
      <span>${esc(fmtGDate(x.date))}</span><em>${esc(mn[L() === 'bn' ? 1 : 0])} · ${N(Math.round(x.moon.illumination * 100))}% ${esc(hmt('illum'))}</em></div></div>${items}`;
};
const HM_WD = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'] };

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-hc]');
  if (!a) return;
  if (a.dataset.hc === 'all') { HC.showAll = !HC.showAll; render(); }
  if (a.dataset.hc === 'today') { VIEWS.calendar.st = {}; render(); }
});
