'use strict';
// Waqt on phones: the Timetable, Settings and Tasbih screens redesigned for
// a small screen — grouped lists that drill down instead of one long page,
// every prayer time of a day in one row, and a calmer, bigger tasbih.
// Loaded by app.js on Android only, after quran.js (it uses qSheet).

const PT = {
  en: {
    month: 'Month', ramadan: 'Ramadan', today: 'Today', day_details: 'Day details', events: 'On this day', begins: 'begins',
    ram_starts: 'Begins', ram_in: 'in', ram_day: 'Day', of: 'of', sehri: 'Sehri ends', iftar: 'Iftar', no_ram: 'Ramadan dates are not available.',
    g_prayer: 'Prayer times', g_phone: 'On this phone', g_calendar: 'Calendar', g_look: 'Appearance', g_more: 'More',
    calc: 'Calculation', adhan: 'Adhan & voices', alerts: 'Reminders & alarms', mosque: 'Mosque & jamaat', travel: 'Travel mode', hijri: 'Hijri calendar',
    theme: 'Theme', about: 'About Waqt', on: 'On', off: 'Off', per_prayer: 'Each prayer', mode: 'When it\'s time', voice: 'Voice', reminder: 'Reminder before',
    play: 'Play', stop: 'Stop', download_size: 'downloads', adjustments: 'Minute adjustments', loc_hint: 'Prayer times are calculated for this place.',
    voices_hint: 'Tap a voice to choose it; ▶ plays a sample.', version: 'Version',
    tb_after: 'After-prayer tasbih', tb_after_d: '33 · 33 · 34', round: 'Round', target: 'Target', no_limit: 'No limit', default_t: 'Default',
    tb_today: 'Today', tb_streak: 'Streak', tb_days: 'days', tb_day: 'day', tb_all: 'All time', tb_stats: 'Your dhikr', tb_30: 'Last 30 days', tb_sound: 'Sound',
    m_adhan: 'Adhan', m_chime: 'Chime', m_notify: 'Notify', m_off: 'Off',
    g_data: 'Your data', backup: 'Backup & restore', backup_d: 'Keep your progress when you change phones',
    bk_hero: 'Everything you keep in Waqt, saved in one small file.', bk_save: 'Save a backup', bk_load: 'Restore from a backup',
    bk_where: 'Choose Google Drive or any folder. To restore, open the same file on your new phone.', bk_what: 'What is saved',
    bk_i1: 'Settings, location, adhan voices and themes', bk_i2: 'Quran bookmarks, last read, khatm goal and hifz', bk_i3: 'Hadith bookmarks and reading',
    bk_i4: 'Prayer tracker, tasbih counts and azkar progress', bk_i5: 'Fasts, missed fasts, zakat and sadaqah', bk_i6: 'Every other choice you made in the app',
    bk_auto: 'Android also backs up Waqt to your Google account by itself when backup is on in your phone settings. Downloaded audio and hadith books download again.',
    bk_confirm: 'Restore this backup? What is on this phone now will be replaced.', bk_done: 'Restored — opening Waqt again…',
    tb_hint: 'Tap anywhere in the circle', tb_swipe: 'Swipe to change dhikr', complete: 'Complete', sets: 'sets',
  },
  bn: {
    month: 'মাস', ramadan: 'রমজান', today: 'আজ', day_details: 'দিনের বিস্তারিত', events: 'এই দিনে', begins: 'শুরু',
    ram_starts: 'শুরু', ram_in: 'আর', ram_day: 'দিন', of: '/', sehri: 'সাহরির শেষ', iftar: 'ইফতার', no_ram: 'রমজানের তারিখ পাওয়া যায়নি।',
    g_prayer: 'নামাজের সময়', g_phone: 'এই ফোনে', g_calendar: 'ক্যালেন্ডার', g_look: 'চেহারা', g_more: 'আরও',
    calc: 'হিসাব পদ্ধতি', adhan: 'আজান ও কণ্ঠ', alerts: 'রিমাইন্ডার ও অ্যালার্ম', mosque: 'মসজিদ ও জামাত', travel: 'সফর মোড', hijri: 'হিজরি ক্যালেন্ডার',
    theme: 'থিম', about: 'ওয়াক্ত সম্পর্কে', on: 'চালু', off: 'বন্ধ', per_prayer: 'প্রতিটি নামাজ', mode: 'সময় হলে', voice: 'কণ্ঠ', reminder: 'আগে রিমাইন্ডার',
    play: 'শুনুন', stop: 'থামান', download_size: 'ডাউনলোড', adjustments: 'মিনিট সমন্বয়', loc_hint: 'এই জায়গার জন্য নামাজের সময় হিসাব করা হয়।',
    voices_hint: 'কণ্ঠ বেছে নিতে চাপুন; ▶ চাপলে নমুনা শোনা যাবে।', version: 'সংস্করণ',
    tb_after: 'নামাজের পরের তাসবিহ', tb_after_d: '৩৩ · ৩৩ · ৩৪', round: 'রাউন্ড', target: 'লক্ষ্য', no_limit: 'সীমা নেই', default_t: 'স্বাভাবিক',
    tb_today: 'আজ', tb_streak: 'ধারাবাহিক', tb_days: 'দিন', tb_day: 'দিন', tb_all: 'মোট', tb_stats: 'আপনার যিকির', tb_30: 'গত ৩০ দিন', tb_sound: 'শব্দ',
    m_adhan: 'আজান', m_chime: 'চাইম', m_notify: 'নোটিফাই', m_off: 'বন্ধ',
    g_data: 'আপনার তথ্য', backup: 'ব্যাকআপ ও রিস্টোর', backup_d: 'ফোন বদলালেও অগ্রগতি থাকবে',
    bk_hero: 'ওয়াক্তে আপনার সবকিছু একটি ছোট ফাইলে সংরক্ষণ।', bk_save: 'ব্যাকআপ সংরক্ষণ করুন', bk_load: 'ব্যাকআপ থেকে ফিরিয়ে আনুন',
    bk_where: 'গুগল ড্রাইভ বা যেকোনো ফোল্ডার বেছে নিন। নতুন ফোনে একই ফাইল খুলে ফিরিয়ে আনুন।', bk_what: 'যা সংরক্ষিত হয়',
    bk_i1: 'সেটিংস, লোকেশন, আজানের কণ্ঠ ও থিম', bk_i2: 'কুরআনের বুকমার্ক, শেষ পড়া, খতমের লক্ষ্য ও হিফজ', bk_i3: 'হাদীসের বুকমার্ক ও পড়া',
    bk_i4: 'নামাজ ট্র্যাকার, তাসবিহ ও যিকিরের অগ্রগতি', bk_i5: 'রোজা, কাযা রোজা, যাকাত ও সদকা', bk_i6: 'অ্যাপে আপনার অন্য সব পছন্দ',
    bk_auto: 'ফোনের সেটিংসে ব্যাকআপ চালু থাকলে অ্যান্ড্রয়েড নিজেই ওয়াক্ত আপনার গুগল অ্যাকাউন্টে ব্যাকআপ রাখে। ডাউনলোড করা অডিও ও হাদীসের কিতাব আবার ডাউনলোড হবে।',
    bk_confirm: 'এই ব্যাকআপ ফিরিয়ে আনবেন? ফোনের বর্তমান তথ্য বদলে যাবে।', bk_done: 'ফিরিয়ে আনা হয়েছে — ওয়াক্ত আবার খুলছে…',
    tb_hint: 'বৃত্তের যেকোনো জায়গায় চাপুন', tb_swipe: 'যিকির বদলাতে সোয়াইপ করুন', complete: 'সম্পূর্ণ', sets: 'বার',
  },
};
const pt = (k) => PT[L()][k] ?? PT.en[k] ?? k;
const SIX6 = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

Object.assign(IC, {
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  hash: '<path d="M5 9h14M4 15h14M10 4 8 20M16 4l-2 16"/>',
  minus: '<path d="M6 12h12"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
});

/// A coloured icon tile, as in iOS settings.
const tile = (ic, color) => `<span class="p-tile" style="--tc:${color}">${icon(ic)}</span>`;
const chev = () => `<span class="p-chev">${icon('chevR')}</span>`;
const group = (head, rows, foot = '') => `${head ? `<div class="p-head">${esc(head)}</div>` : ''}<div class="p-group">${rows.join('')}</div>${foot ? `<div class="p-foot">${esc(foot)}</div>` : ''}`;
/// One row: a link (href), a native picker (select), or a control on the right.
function prow({ ic, color, label, help, value, href, control, select, badge }) {
  const left = `${ic ? tile(ic, color) : ''}<span class="p-lab"><b>${esc(label)}</b>${help ? `<small>${esc(help)}</small>` : ''}</span>`;
  const val = value != null ? `<span class="p-val">${esc(value)}</span>` : '';
  const bad = badge ? `<span class="badge">${esc(badge)}</span>` : '';
  if (href) return `<a class="p-row tap" href="${href}">${left}${bad}${val}${chev()}</a>`;
  if (select) return `<label class="p-row tap">${left}${val}${chev()}${select}</label>`;
  return `<div class="p-row">${left}${val}${control || ''}</div>`;
}
const ptog = (path, on, re) => `<button class="toggle ${on ? 'on' : ''}" data-act="toggle" data-path="${path}" ${re ? 'data-re="1"' : ''} role="switch" aria-checked="${!!on}"></button>`;
const psel = (path, opts, val) => `<select class="p-pick" data-act="select" data-path="${path}" data-re="1">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const optLabel = (opts, val) => (opts.find(([v]) => String(v) === String(val)) || [, ''])[1];
const pseg = (path, opts, val, num) => `<div class="p-seg">${opts.map(([v, l]) => `<button class="${String(v) === String(val) ? 'on' : ''}" data-act="set" data-path="${path}" data-v="${v}" ${num ? 'data-num="1"' : ''}>${esc(l)}</button>`).join('')}</div>`;
const pstep = (path, val, unit = '') => `<span class="stepper"><button data-act="step" data-path="${path}" data-d="-1">−</button><span>${N(val > 0 ? '+' + val : val)}${unit}</span><button data-act="step" data-path="${path}" data-d="1">+</button></span>`;
const ptitle = (title, back, sub = '') => `<div class="p-top">${back ? `<a class="p-back" href="${back}">${icon('chevL')}</a>` : ''}<h1 class="p-title">${esc(title)}</h1></div>${sub ? `<p class="p-sub">${esc(sub)}</p>` : ''}`;

// =====================================================================
// Timetable
// =====================================================================
const TT = { mode: 'month', days: [] };

VIEWS.timetable = async (tok) => {
  const st = VIEWS.timetable.st || (VIEWS.timetable.st = {});
  if (TT.mode === 'ramadan') return ttRamadan(tok);
  const d = await api(`/api/month${st.y ? `?y=${st.y}&m=${st.m}` : ''}`);
  if (!live(tok)) return;
  st.y = d.y; st.m = d.m;
  TT.days = d.days;
  const off = d.days[0]?.tz_offset ?? 0;
  const rows = [];
  let lastHm = null;
  d.days.forEach((x, i) => {
    // A new Hijri month starting inside this Gregorian month gets a divider.
    if (x.hijri.d === 1 && i > 0) rows.push(`<div class="tt-hm">${esc(hijriText(x.hijri))} ${esc(pt('begins'))}</div>`);
    lastHm = x.hijri.m;
    const past = x.date < d.today, today = x.date === d.today;
    const cells = SIX6.map((k) => `<span class="${k === 'dhuhr' && x.friday ? 'jum' : ''} ${k === 'sunrise' ? 'sr' : ''}">${fmtTime(x.times[k], x.tz_offset, { bare: true })}</span>`).join('');
    rows.push(`<button class="tt-row ${today ? 'today' : ''} ${past ? 'past' : ''} ${x.friday ? 'fri' : ''}" data-pa="tt-day" data-i="${i}" ${today ? 'id="tt-today"' : ''}>
      <span class="tt-date"><b>${N(+x.date.slice(8))}</b><small>${esc(WD_SHORT[L()][x.weekday])}</small><i>${N(x.hijri.d)}</i>${x.events.length ? `<em class="k-${x.events[0].kind}"></em>` : ''}</span>${cells}</button>`);
  });
  void lastHm; void off;
  const head = SIX6.map((k) => `<span>${icon(k)}<b>${esc(pname(k))}</b></span>`).join('');
  view.innerHTML = `<div class="p-page tt">
    <div class="p-top"><h1 class="p-title">${esc(t('timetable'))}</h1><span class="p-flex"></span><button class="icon-btn" data-act="export" title="${esc(t('export'))}">${icon('download')}</button></div>
    <p class="p-sub">${esc(S.cfg.location.name)} · ${esc(S.day?.method || '')} · ${esc(S.cfg.calc.asr === 'hanafi' ? t('hanafi') : t('standard'))}</p>
    <div class="p-seg wide"><button class="on" data-pa="tt-mode" data-v="month">${esc(pt('month'))}</button><button data-pa="tt-mode" data-v="ramadan">☾ ${esc(pt('ramadan'))}</button></div>
    <div class="tt-nav"><button class="icon-btn" data-act="tt-prev">${icon('chevL')}</button>
      <div class="tt-m"><b>${esc(MONTHS[L()][d.m - 1])} ${N(d.y)}</b><small>${esc(hijriText(d.days[0].hijri, false))} – ${esc(hijriText(d.days[d.days.length - 1].hijri))}</small></div>
      <button class="icon-btn" data-act="tt-next">${icon('chevR')}</button>
      ${d.days.some((x) => x.date === d.today) ? '' : `<button class="btn small" data-act="tt-now">${esc(pt('today'))}</button>`}</div>
    <div class="tt-table"><div class="tt-head"><span></span>${head}</div>${rows.join('')}</div>
  </div>`;
  const tr = $('#tt-today');
  if (tr) setTimeout(() => tr.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
};

/// Every time of one day, in a sheet.
function ttDay(x) {
  const off = x.tz_offset;
  const fri = x.friday;
  const items = [
    ['imsak', t('sehri_ends'), 'moon'], ['fajr', pname('fajr'), 'fajr'], ['sunrise', pname('sunrise'), 'sunrise'], ['ishraq', t('ishraq'), 'sunrise'],
    ['zawal', t('zawal'), 'dhuhr'], ['dhuhr', pname('dhuhr', fri), 'dhuhr'], ['asr', pname('asr'), 'asr'], ['sunset', t('sunset'), 'maghrib'],
    ['maghrib', pname('maghrib'), 'maghrib'], ['isha', pname('isha'), 'isha'], ['midnight', t('midnight'), 'isha'], ['last_third', t('tahajjud'), 'star'],
  ].filter(([k]) => x.times[k] != null);
  const main = new Set(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  const evs = x.events.map((e) => `<div class="tt-ev k-${e.kind}"><i></i>${esc(L() === 'bn' ? e.bn : e.en)}</div>`).join('');
  qSheet(`<div class="tt-sheet"><div class="tt-sh-h"><b>${esc(fmtGDate(x.date))}</b><small>${esc(hijriText(x.hijri))}</small></div>
    ${evs ? `<div class="tt-evs">${evs}</div>` : ''}
    <div class="p-group">${items.map(([k, label, ic]) => `<div class="p-row ${main.has(k) ? 'pm' : ''}">${tile(ic, main.has(k) ? 'var(--g3)' : '#6b7690')}<span class="p-lab"><b>${esc(label)}</b>${main.has(k) ? `<small class="ar">${parab(k, k === 'dhuhr' && fri)}</small>` : ''}</span><span class="p-val t">${fmtTime(x.times[k], off)}</span></div>`).join('')}</div></div>`);
}

async function ttRamadan(tok) {
  const r = S.day?.ramadan;
  let start;
  if (r?.active) {
    const d0 = new Date(`${S.day.today.date}T00:00:00Z`);
    start = new Date(d0.getTime() - (r.day - 1) * 86400000).toISOString().slice(0, 10);
  } else start = r?.starts;
  if (!start) { view.innerHTML = `<div class="p-page">${ptitle(t('timetable'))}<div class="card muted">${esc(pt('no_ram'))}</div></div>`; return; }
  const y = +start.slice(0, 4), m = +start.slice(5, 7);
  const [a, b] = await Promise.all([api(`/api/month?y=${y}&m=${m}`), api(`/api/month?y=${m === 12 ? y + 1 : y}&m=${m === 12 ? 1 : m + 1}`)]);
  if (!live(tok)) return;
  const days = [...a.days, ...b.days].filter((x) => x.date >= start && x.hijri.m === 9).slice(0, 30);
  TT.days = days;
  const today = a.today;
  const hy = days[0]?.hijri.y;
  const status = r.active ? `${pt('ram_day')} ${N(r.day)} ${pt('of')} ${N(days.length)}` : `${pt('ram_starts')} ${fmtGDate(start)} · ${pt('ram_in')} ${N(r.days_left)} ${t('days')}`;
  const rows = days.map((x, i) => `<button class="rm-row ${x.date === today ? 'today' : ''} ${x.date < today ? 'past' : ''}" data-pa="tt-day" data-i="${i}" ${x.date === today ? 'id="tt-today"' : ''}>
      <span class="rm-n">${N(x.hijri.d)}</span><span class="rm-d"><b>${esc(WD_SHORT[L()][x.weekday])}</b><small>${N(+x.date.slice(8))} ${esc(MONTHS[L()][+x.date.slice(5, 7) - 1].slice(0, L() === 'bn' ? 20 : 3))}</small></span>
      <span class="rm-t"><small>${esc(pt('sehri'))}</small><b>${fmtTime(x.times.imsak, x.tz_offset)}</b></span>
      <span class="rm-t if"><small>${esc(pt('iftar'))}</small><b>${fmtTime(x.times.maghrib, x.tz_offset)}</b></span></button>`).join('');
  view.innerHTML = `<div class="p-page tt">
    <div class="p-top"><h1 class="p-title">${esc(t('timetable'))}</h1></div>
    <p class="p-sub">${esc(S.cfg.location.name)} · ${esc(S.day?.method || '')}</p>
    <div class="p-seg wide"><button data-pa="tt-mode" data-v="month">${esc(pt('month'))}</button><button class="on" data-pa="tt-mode" data-v="ramadan">☾ ${esc(pt('ramadan'))}</button></div>
    <div class="rm-hero"><div class="ar">رَمَضَان</div><b>${esc(pt('ramadan'))} ${N(hy || '')}</b><small>${esc(status)}</small></div>
    <div class="rm-list">${rows}</div></div>`;
  const tr = $('#tt-today');
  if (tr) setTimeout(() => tr.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
}

// =====================================================================
// Settings
// =====================================================================
const THEME_NAME = (k) => t('th_' + k);

VIEWS.settings = async (tok) => {
  await loadSettings();
  if (!live(tok)) return;
  const parts = location.hash.replace(/^#\/?settings\/?/, '').split('/').filter(Boolean);
  const page = parts[0] || '';
  const pages = { backup: sBackup, location: sLocation, calc: sCalc, adhan: sAdhan, alerts: sAlerts, mosque: sMosque, travel: sTravel, hijri: sHijri, theme: sTheme, about: sAbout, widgets: sWidgets };
  if (page === 'adhan' && parts[1]) return sPrayer(parts[1]);
  return (pages[page] || sIndex)(tok);
};

// ---------- Home-screen widgets: a gallery of the real widgets ----------
const WIDGETS = {
  next: [['Next prayer', 'পরবর্তী নামাজ'], ['A live countdown, the dates and all five times', 'লাইভ কাউন্টডাউন, তারিখ ও পাঁচ ওয়াক্তের সময়'], '4 × 2'],
  small: [['Next prayer (small)', 'পরবর্তী নামাজ (ছোট)'], ['Just the next prayer and its countdown', 'শুধু পরবর্তী নামাজ ও কাউন্টডাউন'], '2 × 2'],
  verse: [['Ayah of the day', 'আজকের আয়াত'], ['A short verse with its meaning, new each day', 'প্রতিদিন একটি ছোট আয়াত, অর্থসহ'], '4 × 2'],
  name: [['Name of Allah', 'আল্লাহর নাম'], ['One of the 99 Names each day', 'প্রতিদিন আল্লাহর ৯৯ নামের একটি'], '2 × 2'],
  fast: [['Sehri & Iftar', 'সাহরি ও ইফতার'], ['Today\'s times, counting down to the next', 'আজকের সময়, পরেরটির কাউন্টডাউনসহ'], '4 × 1'],
  hijri: [['Hijri date', 'হিজরি তারিখ'], ['The Hijri, Bangla and Gregorian dates', 'হিজরি, বাংলা ও ইংরেজি তারিখ'], '3 × 1'],
};
const wtx = (pair) => pair[L() === 'bn' ? 1 : 0];

async function sWidgets(tok) {
  view.innerHTML = `<div class="p-page">${ptitle(wtx(['Home-screen widgets', 'হোম স্ক্রিন উইজেট']), '#/settings', wtx(['See Waqt at a glance, without opening the app.', 'অ্যাপ না খুলেই এক নজরে ওয়াক্ত দেখুন।']))}<div class="wg-list" id="wg"><div class="wg-load"></div></div></div>`;
  let d;
  try { d = await api('/api/widgets'); } catch (e) { $('#wg').innerHTML = `<div class="card">${esc(e.message)}</div>`; return; }
  if (!live(tok)) return;
  $('#wg').innerHTML = d.widgets.map((w) => {
    const [title, desc, size] = WIDGETS[w.kind];
    const btn = w.placed ? `<span class="wg-on">${icon('check')}${esc(wtx(['On your home screen', 'হোম স্ক্রিনে আছে']))}</span>`
      : d.pin ? `<button class="btn gold small" data-pa="wg-pin" data-k="${w.kind}">${icon('plus')}${esc(wtx(['Add', 'যোগ করুন']))}</button>` : '';
    return `<div class="wg-card"><div class="wg-shot wg-${w.kind}"><img src="${w.img}" alt=""></div>
      <div class="wg-row"><span class="p-lab"><b>${esc(wtx(title))}</b><small>${esc(wtx(desc))} · ${esc(N(size))}</small></span>${btn}</div></div>`;
  }).join('') + `<div class="p-foot">${esc(wtx(d.pin ? ['You can also long-press an empty part of your home screen, tap Widgets, and find Waqt.', 'হোম স্ক্রিনের খালি জায়গায় চেপে ধরে "উইজেট" থেকে ওয়াক্ত খুঁজেও যোগ করা যায়।'] : ['Long-press an empty part of your home screen, tap Widgets, and find Waqt.', 'হোম স্ক্রিনের খালি জায়গায় চেপে ধরে "উইজেট" থেকে ওয়াক্ত খুঁজে যোগ করুন।']))}</div>`;
}

function sIndex() {
  const c = S.cfg, p = c.phone || {};
  const loc = c.location;
  const method = S.methods.find((m) => m.id === c.calc.method);
  const fajrVoice = S.sounds.find((s) => s.id === c.adhan.dhuhr.sound);
  const failing = S.day?.health_failing || 0;
  const themePrefV = themePref();
  view.innerHTML = `<div class="p-page">${ptitle(t('settings'))}
    <a class="p-hero" href="#/settings/location"><span class="p-tile big" style="--tc:#2f7fe8">${icon('pin')}</span>
      <span class="p-lab"><b>${esc(loc.name)}</b><small>${esc(loc.country)} · ${esc(method?.name || '')}</small></span>${chev()}</a>
    ${group(pt('g_prayer'), [
      prow({ ic: 'calc', color: '#5b5bd6', label: pt('calc'), value: c.calc.asr === 'hanafi' ? t('hanafi') : t('standard'), href: '#/settings/calc' }),
      prow({ ic: 'mosque', color: '#d99a1e', label: pt('adhan'), value: fajrVoice ? (L() === 'bn' ? fajrVoice.name_bn : fajrVoice.name).split('·')[0].trim() : '', href: '#/settings/adhan' }),
      prow({ ic: 'bell', color: '#e5484d', label: pt('alerts'), href: '#/settings/alerts' }),
    ])}
    ${S.android ? group(pt('g_phone'), [
      prow({ ic: 'shield', color: failing ? '#e5484d' : '#30a46c', label: t('health'), href: '#/health', badge: failing ? N(failing) : '' }),
      prow({ ic: 'walk', color: '#12a594', label: pt('mosque'), href: '#/settings/mosque' }),
      prow({ ic: 'plane', color: '#0091ff', label: pt('travel'), value: p.travel ? pt('on') : pt('off'), href: '#/settings/travel' }),
      prow({ ic: 'sunrise', color: '#f76b15', label: t('fajr_wake'), control: ptog('phone.fajr_wake', p.fajr_wake) }),
      prow({ ic: 'tasbih', color: '#8e4ec6', label: t('volume_tasbih'), control: ptog('phone.volume_tasbih', p.volume_tasbih) }),
    ]) : ''}
    ${group(pt('g_calendar'), [
      prow({ ic: 'calendar', color: '#12a594', label: pt('hijri'), value: S.day ? hijriText(S.day.hijri_now) : '', href: '#/settings/hijri' }),
    ])}
    ${group(pt('g_look'), [
      prow({ ic: 'palette', color: '#d6409f', label: pt('theme'), value: THEME_NAME(themePrefV), href: '#/settings/theme' }),
      `<button class="p-row tap" data-pa="hero-pick">${tile('layers', '#f76b15')}<span class="p-lab"><b>${esc(pt('hero'))}</b></span><span class="p-val">${esc(pt('hx_' + heroStyle()))}</span>${chev()}</button>`,
      ...(S.android ? [prow({ ic: 'table', color: '#30a46c', label: L() === 'bn' ? 'হোম স্ক্রিন উইজেট' : 'Home-screen widgets', href: '#/settings/widgets' })] : []),
      prow({ ic: 'globe', color: '#0091ff', label: t('language'), control: pseg('language', [['en', 'English'], ['bn', 'বাংলা']], L()) }),
      prow({ ic: 'clock', color: '#6b7690', label: t('clock'), control: pseg('clock', [[12, '12h'], [24, '24h']], c.clock, true) }),
      prow({ ic: 'hash', color: '#6b7690', label: t('bn_digits'), help: '০১২৩', control: ptog('bangla_digits', c.bangla_digits) }),
    ])}
    ${group(pt('g_data'), [prow({ ic: 'shield', color: '#30a46c', label: pt('backup'), help: pt('backup_d'), href: '#/settings/backup' })])}
    ${group('', [prow({ ic: 'info', color: '#6b7690', label: pt('about'), href: '#/settings/about' })])}
  </div>`;
}

function sLocation() {
  const loc = S.cfg.location;
  view.innerHTML = `<div class="p-page">${ptitle(t('s_location'), '#/settings')}
    <div class="p-group"><div class="p-row loc">${tile('pin', '#2f7fe8')}<span class="p-lab"><b>${esc(loc.name)}</b><small>${esc(loc.country)} · ${N(loc.lat.toFixed(3))}, ${N(loc.lng.toFixed(3))}</small><small>${esc(loc.timezone || '')}</small></span></div>
      <div class="p-row"><button class="btn small gold" data-act="detect">${icon('locate')}${esc(t('detect'))}</button></div></div>
    <div class="p-foot">${esc(pt('loc_hint'))}</div>
    <div class="search-box p-search">${icon('search')}<input class="input" id="city-q" placeholder="${esc(t('search_city'))}" autocomplete="off" spellcheck="false"></div>
    <div class="results p-results" id="city-r"></div></div>`;
  let timer;
  $('#city-q').addEventListener('input', (e) => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    timer = setTimeout(() => searchCity(q, $('#city-r')), 350);
  });
}

function sCalc() {
  const c = S.cfg;
  const methods = S.methods.map((m) => [m.id, m.name]);
  const hl = [['angle_based', 'Angle based'], ['middle_of_night', 'Middle of the night'], ['one_seventh', 'One seventh of the night'], ['none', 'None']];
  view.innerHTML = `<div class="p-page">${ptitle(pt('calc'), '#/settings')}
    ${group('', [
      prow({ label: t('method'), help: S.methods.find((m) => m.id === c.calc.method)?.region || '', value: optLabel(methods, c.calc.method), select: psel('calc.method', methods, c.calc.method) }),
      `<div class="p-row col"><span class="p-lab"><b>${esc(t('asr_method'))}</b></span>${pseg('calc.asr', [['standard', t('standard')], ['hanafi', t('hanafi')]], c.calc.asr)}</div>`,
      prow({ label: t('high_lat'), value: optLabel(hl, c.calc.high_lat), select: psel('calc.high_lat', hl, c.calc.high_lat) }),
      prow({ label: t('imsak'), help: t('imsak_help'), control: pstep('calc.imsak_minutes', c.calc.imsak_minutes, ` ${t('min')}`) }),
    ])}
    ${group(pt('adjustments'), SIX.map((k) => prow({ ic: k, color: '#d99a1e', label: pname(k), control: pstep(`calc.offsets.${k}`, c.calc.offsets[k]) })), t('adjust_help'))}
  </div>`;
}

function soundName(s) { return (L() === 'bn' ? s.name_bn : s.name) || s.id; }

function sAdhan() {
  const c = S.cfg;
  const modeName = { adhan: t('mode_adhan'), chime: t('mode_chime'), notify: t('mode_notify'), off: t('mode_off') };
  const rows = PRAYERS.map((p) => {
    const a = c.adhan[p];
    const snd = S.sounds.find((s) => s.id === a.sound);
    const val = a.mode === 'adhan' ? soundName(snd || { id: a.sound }) : modeName[a.mode];
    return prow({ ic: p, color: a.mode === 'off' ? '#6b7690' : '#d99a1e', label: pname(p), help: a.reminder ? `${t('reminder')} ${N(a.reminder)} ${t('min')}` : '', value: val, href: `#/settings/adhan/${p}` });
  });
  view.innerHTML = `<div class="p-page">${ptitle(pt('adhan'), '#/settings')}
    ${group('', [
      `<div class="p-row col"><span class="p-lab"><b>${esc(t('volume'))}</b></span><div class="p-vol">${icon('speaker')}<input type="range" min="0" max="100" value="${c.adhan.volume}" data-act="range" data-path="adhan.volume" style="--p:${c.adhan.volume}%"><span>${N(c.adhan.volume)}%</span><button class="play-btn" data-act="preview" data-p="dhuhr">${icon('play')}</button></div></div>`,
      prow({ label: t('fade'), control: ptog('adhan.fade_in', c.adhan.fade_in) }),
      prow({ label: t('show_window'), control: ptog('adhan.show_window', c.adhan.show_window) }),
    ])}
    ${group(pt('per_prayer'), rows)}
    <div class="p-center"><button class="btn small" data-act="import-sound">${icon('download')}${esc(t('import_sound'))}</button></div>
  </div>`;
}

function sPrayer(p) {
  if (!PRAYERS.includes(p)) { location.hash = '#/settings/adhan'; return; }
  const a = S.cfg.adhan[p];
  const modes = [['adhan', pt('m_adhan')], ['chime', pt('m_chime')], ['notify', pt('m_notify')], ['off', pt('m_off')]];
  const voices = S.sounds.map((s) => `<div class="p-row tap voice-row ${a.sound === s.id ? 'sel' : ''}" data-pa="voice" data-p="${p}" data-id="${s.id}">
      <button class="play-btn sm" data-pa="vplay" data-id="${s.id}">${icon('play')}</button>
      <span class="p-lab"><b>${esc(soundName(s))}</b>${s.available === false ? `<small>${esc(pt('download_size'))} ${N((s.size / 1048576).toFixed(1))} MB</small>` : ''}</span>
      ${a.sound === s.id ? `<span class="p-check">${icon('check')}</span>` : ''}</div>`).join('');
  const rems = [0, 5, 10, 15, 20, 30].map((m) => `<button class="chip ${a.reminder === m ? 'on' : ''}" data-act="set" data-path="adhan.${p}.reminder" data-v="${m}" data-num="1">${m ? `${N(m)} ${esc(t('min'))}` : esc(t('none'))}</button>`).join('');
  view.innerHTML = `<div class="p-page">${ptitle(pname(p), '#/settings/adhan')}
    <div class="p-prayer-ar ar">${PN[p].ar}</div>
    <div class="p-head">${esc(pt('mode'))}</div>
    <div class="p-group pad">${pseg(`adhan.${p}.mode`, modes, a.mode)}</div>
    ${a.mode === 'adhan' ? `<div class="p-head">${esc(pt('voice'))}</div><div class="p-group">${voices}</div><div class="p-foot">${esc(pt('voices_hint'))}</div>` : ''}
    <div class="p-head">${esc(pt('reminder'))}</div>
    <div class="p-group pad"><div class="chips">${rems}</div></div>
    <div class="p-center"><button class="btn gold" data-act="preview" data-p="${p}">${icon('play')}${esc(t('test'))}</button></div>
  </div>`;
}

function sAlerts() {
  const c = S.cfg;
  const sun = [[0, t('off')], [10, `10 ${t('min')}`], [15, `15 ${t('min')}`], [20, `20 ${t('min')}`], [30, `30 ${t('min')}`]];
  const sehri = [['off', t('off')], ['ramadan', t('in_ramadan')], ['always', t('always')]];
  const sehriMin = [15, 20, 30, 45, 60, 90].map((m) => [m, `${N(m)} ${t('min')} ${t('before_fajr')}`]);
  view.innerHTML = `<div class="p-page">${ptitle(pt('alerts'), '#/settings')}
    ${group('', [
      prow({ ic: 'sunrise', color: '#f76b15', label: t('sunrise_warn'), value: optLabel(sun, c.alerts.sunrise_warning), select: psel('alerts.sunrise_warning', sun, c.alerts.sunrise_warning) }),
      prow({ ic: 'moon', color: '#5b5bd6', label: t('sehri_alarm'), value: optLabel(sehri, c.alerts.sehri), select: psel('alerts.sehri', sehri, c.alerts.sehri) }),
      ...(c.alerts.sehri !== 'off' ? [prow({ label: '', value: optLabel(sehriMin, c.alerts.sehri_minutes), select: psel('alerts.sehri_minutes', sehriMin, c.alerts.sehri_minutes) })] : []),
      prow({ ic: 'mosque', color: '#30a46c', label: t('jumuah_rem'), control: ptog('alerts.jumuah', c.alerts.jumuah) }),
      prow({ ic: 'star', color: '#8e4ec6', label: t('tahajjud_rem'), control: ptog('alerts.tahajjud', c.alerts.tahajjud) }),
    ])}</div>`;
}

function sMosque() {
  const p = S.cfg.phone || {};
  const mins = (list) => list.map((m) => [m, `${N(m)} ${t('min')}`]);
  const walk = [[0, t('off')], ...mins([3, 5, 10, 15, 20, 30])];
  const silent = mins([15, 20, 25, 30, 45, 60]);
  const jam = [...PRAYERS, 'jumuah'].map((k) => `<label class="p-row"><span class="p-lab"><b>${esc(k === 'jumuah' ? t('jumuah_t') : pname(k))}</b></span>
    <input class="input p-in" data-act="text" data-path="phone.jamaat.${k}" value="${esc(p.jamaat?.[k] || '')}" placeholder="${k === 'jumuah' ? '13:30' : '15'}"></label>`).join('');
  view.innerHTML = `<div class="p-page">${ptitle(pt('mosque'), '#/settings')}
    <div class="p-head">${esc(t('jamaat_times'))}</div><div class="p-group">${jam}</div><div class="p-foot">${esc(t('jamaat_help'))}</div>
    ${group('', [
      prow({ ic: 'walk', color: '#12a594', label: t('walk'), help: t('walk_d'), value: optLabel(walk, p.walk_minutes), select: psel('phone.walk_minutes', walk, p.walk_minutes) }),
      prow({ ic: 'mute', color: '#6b7690', label: t('auto_silent'), help: t('auto_silent_d'), control: ptog('phone.auto_silent', p.auto_silent, true) }),
      ...(p.auto_silent ? [prow({ label: t('silent_for'), value: optLabel(silent, p.silent_minutes), select: psel('phone.silent_minutes', silent, p.silent_minutes) })] : []),
      prow({ ic: 'speaker', color: '#d99a1e', label: t('in_silent'), help: t('in_silent_d'), control: ptog('phone.adhan_in_silent', p.adhan_in_silent) }),
    ])}</div>`;
}

function sTravel() {
  const p = S.cfg.phone || {};
  view.innerHTML = `<div class="p-page">${ptitle(pt('travel'), '#/settings')}
    ${group('', [
      prow({ ic: 'plane', color: '#0091ff', label: t('travel'), help: t('travel_help'), control: ptog('phone.travel', p.travel, true) }),
      ...(p.travel ? [prow({ ic: 'pin', color: '#2f7fe8', label: `${t('home')}: ${p.home?.name || '—'}`, control: `<button class="btn small" data-act="set-home">${esc(t('set_home'))}</button>` })] : []),
    ])}</div>`;
}

function sHijri() {
  const c = S.cfg;
  const rules = [['sighting', t('rule_sighting')], ['umm_al_qura', t('rule_uaq')], ['arithmetic', t('rule_arith')]];
  view.innerHTML = `<div class="p-page">${ptitle(pt('hijri'), '#/settings')}
    <div class="p-preview"><span class="ar">${esc(S.day?.hijri_now?.month_ar || '')}</span><b>${esc(S.day ? hijriText(S.day.hijri_now) : '')}</b><small>${esc(t('hijri_preview'))}</small></div>
    ${group('', [
      prow({ label: t('hijri_rule'), value: optLabel(rules, c.calc.hijri_rule), select: psel('calc.hijri_rule', rules, c.calc.hijri_rule) }),
      prow({ label: t('hijri_offset'), control: pstep('calc.hijri_offset', c.calc.hijri_offset) }),
      prow({ label: t('at_maghrib'), control: ptog('calc.hijri_at_maghrib', c.calc.hijri_at_maghrib, true) }),
    ])}</div>`;
}

function sTheme() {
  view.innerHTML = `<div class="p-page">${ptitle(pt('theme'), '#/settings')}<div class="p-group pad">${themeRow()}</div></div>`;
}

function sBackup() {
  const items = [['star', pt('bk_i1')], ['book', pt('bk_i2')], ['scroll', pt('bk_i3')], ['tracker', pt('bk_i4')], ['moon', pt('bk_i5')], ['palette', pt('bk_i6')]];
  view.innerHTML = `<div class="p-page">${ptitle(pt('backup'), '#/settings')}
    <div class="bk-hero">${tile('shield', '#30a46c').replace('p-tile', 'p-tile big')}<b>${esc(pt('backup'))}</b><small>${esc(pt('bk_hero'))}</small></div>
    <div class="p-group pad bk-acts"><button class="btn gold" data-pa="bk-save">${icon('download')}${esc(pt('bk_save'))}</button><button class="btn" data-pa="bk-load">${icon('undo')}${esc(pt('bk_load'))}</button></div>
    <div class="p-foot">${esc(pt('bk_where'))}</div>
    <div class="p-head">${esc(pt('bk_what'))}</div>
    <div class="p-group">${items.map(([ic, l]) => `<div class="p-row">${tile(ic, '#6b7690')}<span class="p-lab"><b>${esc(l)}</b></span></div>`).join('')}</div>
    <div class="p-foot">${esc(pt('bk_auto'))}</div></div>`;
}

function sAbout() {
  view.innerHTML = `<div class="p-page">${ptitle(pt('about'), '#/settings')}
    <div class="p-about"><img src="/logo.png" alt=""><b>Waqt</b><small>ওয়াক্ত · وقت</small></div>
    <div class="p-group pad"><p class="muted" style="margin:0">${esc(t('about'))}</p></div></div>`;
}

// =====================================================================
// Tasbih
// =====================================================================
const AFTER = [0, 1, 2]; // Subhan Allah 33, Alhamdulillah 33, Allahu Akbar 34
const tbGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const tbSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
/// The count to reach: the dhikr's own, or the one chosen (0 = no limit).
const tbTarget = () => {
  if (TB.seq) return DHIKR[TB.i].n;
  const v = tbGet(`tb-target-${DHIKR[TB.i].id}`, '');
  return v === '' ? DHIKR[TB.i].n : +v;
};
TB.round = 1;

drawTasbih = function drawTasbihPhone() {
  const dz = DHIKR[TB.i];
  const target = tbTarget();
  const cards = DHIKR.map((d, i) => `<button class="tb-card ${!TB.seq && i === TB.i ? 'on' : ''}" data-pa="tb-pick" data-i="${i}">
      <span class="ar">${d.ar}</span><b>${esc(d.tr)}</b><small>${esc(L() === 'bn' ? d.bn : d.en)}</small></button>`).join('') +
    `<button class="tb-card seq ${TB.seq ? 'on' : ''}" data-pa="tb-seq"><span class="ar">سُبْحَانَ اللَّهِ · الْحَمْدُ لِلَّهِ · اللَّهُ أَكْبَرُ</span><b>${esc(pt('tb_after'))}</b><small>${esc(pt('tb_after_d'))}</small></button>`;
  const steps = TB.seq ? `<div class="tb-steps">${AFTER.map((k, j) => `<span class="${TB.i === k ? 'on' : TB.i > k ? 'done' : ''}">${esc(DHIKR[k].tr)} · ${N(DHIKR[k].n)}</span>`).join('')}</div>` : '';
  const sound = tbGet('tb-sound', '1') === '1';
  view.innerHTML = `<div class="p-page tb">
    <div class="p-top"><h1 class="p-title">${esc(t('tasbih'))}</h1><span class="p-flex"></span><button class="icon-btn" data-pa="tb-stats" title="${esc(pt('tb_stats'))}">${icon('chart')}</button></div>
    <div class="tb-cards" id="tb-cards">${cards}</div>
    ${steps}
    <div class="tb-stage" id="beads">
      <svg viewBox="0 0 300 300" class="tb-ring"><defs><linearGradient id="tbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#d9a443"/></linearGradient></defs>
        <circle class="tb-track" cx="150" cy="150" r="128"/>
        <circle class="tb-arc" id="tb-arc" cx="150" cy="150" r="128" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"/>
        <g id="tb-ticks">${tbTicks(target)}</g></svg>
      <div class="tb-center"><span class="ar tb-ar">${dz.ar}</span><b class="count" id="tb-count">${N(TB.count)}</b><small id="tb-of">${tbOf(target)}</small></div>
    </div>
    <p class="tb-hint">${esc(pt('tb_hint'))}</p>
    <div class="tb-ctl">
      <button data-pa="tb-minus" title="${esc(t('undo'))}">${icon('minus')}</button>
      <button data-pa="tb-reset" title="${esc(t('reset'))}">${icon('reset')}</button>
      <button class="tb-target" data-pa="tb-target" ${TB.seq ? 'disabled' : ''}>${icon('target')}<span>${target ? N(target) : '∞'}</span></button>
      <button data-pa="tb-sound" class="${sound ? 'on' : ''}" title="${esc(pt('tb_sound'))}">${icon(sound ? 'speaker' : 'mute')}</button>
    </div>
    <div class="tb-stats">
      <div><small>${esc(pt('tb_today'))}</small><b id="tb-today">${N((TB.today || 0).toLocaleString('en-US'))}</b></div>
      <div><small>${esc(pt('tb_streak'))}</small><b>${tbDays(tbStreak())}</b></div>
      <div><small>${esc(pt('tb_all'))}</small><b id="tb-all">${N(tbAll().toLocaleString('en-US'))}</b></div>
    </div>
  </div>`;
  tbPaint(false);
  $('#beads').addEventListener('pointerdown', (e) => { e.preventDefault(); countTasbih(e); });
  // Keep the chosen card in view without fighting the user's own swipe.
  const on = $('.tb-card.on');
  if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
};

function tbTicks(target) {
  const n = target && target <= 100 ? Math.min(target, 34) : 33;
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    s += `<circle class="tb-tick" data-i="${i}" cx="${150 + Math.cos(a) * 146}" cy="${150 + Math.sin(a) * 146}" r="3.2"/>`;
  }
  return s;
}
/// Every dhikr counted, ever.
const tbAll = () => Object.values(TB.totals || {}).reduce((a, b) => a + b, 0);
const tbDays = (n) => `${N(n)} <i>${esc(n === 1 ? pt('tb_day') : pt('tb_days'))}</i>`;
const tbOf = (target) => (target ? `${pt('of')} ${N(target)}` : '∞') + (TB.round > 1 && !TB.seq ? ` · ${pt('round')} ${N(TB.round)}` : '');

/// Moves the ring and the ticks to the current count.
function tbPaint(bump) {
  const target = tbTarget();
  const frac = target ? Math.min(1, TB.count / target) : (TB.count % 100) / 100;
  const arc = $('#tb-arc');
  if (arc) arc.style.strokeDashoffset = String(1000 - frac * 1000);
  const ticks = $$('.tb-tick');
  const lit = Math.round(frac * ticks.length);
  ticks.forEach((el, i) => el.classList.toggle('lit', i < lit));
  const c = $('#tb-count');
  if (c) { c.textContent = N(TB.count); if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
  const of = $('#tb-of'); if (of) of.textContent = tbOf(target);
}

function tbStreak() {
  const days = new Map((TB.recent || []).map((r) => [r.date, r.count]));
  if (TB.today) days.set(S.day?.today?.date, TB.today);
  let n = 0;
  const d = new Date(`${S.day?.today?.date || new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  // Today not done yet doesn't break the streak.
  if (!days.get(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while ((days.get(d.toISOString().slice(0, 10)) || 0) > 0) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

countTasbih = function countTasbihPhone(e) {
  const dz = DHIKR[TB.i];
  const target = tbTarget();
  TB.count++;
  TB.history.push(TB.i);
  TB.today = (TB.today || 0) + 1;
  TB.totals[dz.id] = (TB.totals[dz.id] || 0) + 1;
  TB.pending[dz.id] = (TB.pending[dz.id] || 0) + 1;
  clearTimeout(TB.flushT);
  TB.flushT = setTimeout(flushTasbih, 1500);
  const td = $('#tb-today'); if (td) td.textContent = N(TB.today.toLocaleString('en-US'));
  const ta = $('#tb-all'); if (ta) ta.textContent = N(tbAll().toLocaleString('en-US'));
  const stage = $('#beads');
  if (stage && e && e.clientX != null) {
    const r = stage.getBoundingClientRect();
    const rp = document.createElement('div');
    rp.className = 'ripple';
    rp.style.left = `${e.clientX - r.left}px`; rp.style.top = `${e.clientY - r.top}px`; rp.style.transform = 'translate(-50%,-50%)';
    stage.appendChild(rp); setTimeout(() => rp.remove(), 800);
  }
  const done = target && TB.count >= target;
  nativeUi('haptic', done ? 'long' : '');
  if (tbGet('tb-sound', '1') === '1') click(done ? 660 : 1040, done ? 0.4 : 0.05, done ? 0.12 : 0.06);
  if (!done) { tbPaint(true); return; }
  tbPaint(true);
  celebrate();
  stage?.classList.add('complete');
  setTimeout(() => stage?.classList.remove('complete'), 900);
  if (TB.seq) {
    if (TB.i < 2) { TB.i++; TB.count = 0; setTimeout(drawTasbih, 700); }
    else { toast(`${pt('tb_after')} · ${pt('complete')} ✓`); TB.count = 0; TB.i = 0; setTimeout(drawTasbih, 900); }
    return;
  }
  toast(`${dz.tr} · ${N(target)} ✓`);
  setTimeout(() => { TB.count = 0; TB.round++; tbPaint(false); }, 700);
};

function tbStats() {
  const rec = [...(TB.recent || [])];
  const today = S.day?.today?.date;
  const map = new Map(rec.map((r) => [r.date, r.count]));
  if (today) map.set(today, TB.today || 0);
  const days = [];
  const d = new Date(`${today || new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  for (let i = 29; i >= 0; i--) { const x = new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10); days.push([x, map.get(x) || 0]); }
  const max = Math.max(1, ...days.map(([, n]) => n));
  const bars = days.map(([x, n]) => `<i style="--h:${Math.max(3, (n / max) * 100)}%" class="${n ? '' : 'z'} ${x === today ? 't' : ''}" title="${x}: ${n}"></i>`).join('');
  const all = DHIKR.map((z) => `<div class="p-row"><span class="p-lab"><b>${esc(z.tr)}</b><small class="ar">${z.ar}</small></span><span class="p-val t">${N((TB.totals?.[z.id] || 0).toLocaleString('en-US'))}</span></div>`).join('');
  qSheet(`<div class="tt-sheet"><div class="tt-sh-h"><b>${esc(pt('tb_stats'))}</b><small>${esc(pt('tb_streak'))}: ${tbDays(tbStreak())}</small></div>
    <div class="p-head">${esc(pt('tb_30'))}</div><div class="p-group pad"><div class="tb-bars">${bars}</div></div>
    <div class="p-head">${esc(pt('tb_all'))}</div><div class="p-group">${all}</div></div>`);
}

function tbTargetSheet() {
  const dz = DHIKR[TB.i];
  const cur = tbGet(`tb-target-${dz.id}`, '');
  const opts = [['', `${pt('default_t')} (${N(dz.n)})`], ['33', N(33)], ['99', N(99)], ['100', N(100)], ['500', N(500)], ['1000', N('1000')], ['0', `∞ ${pt('no_limit')}`]];
  qSheet(`<div class="qsh-t">${esc(pt('target'))} · ${esc(dz.tr)}</div>${opts.map(([v, l]) => `<button data-pa="tb-settarget" data-v="${v}">${icon(String(cur) === v ? 'check' : 'target')}${esc(l)}</button>`).join('')}`);
}

// Swiping the dhikr cards picks the one that settles in the middle.
document.addEventListener('scroll', (e) => {
  const box = e.target;
  if (!(box instanceof Element) || box.id !== 'tb-cards') return;
  clearTimeout(box.t);
  box.t = setTimeout(() => {
    const mid = box.getBoundingClientRect().left + box.clientWidth / 2;
    let best = null, dist = 1e9;
    $$('.tb-card', box).forEach((c) => { const r = c.getBoundingClientRect(); const dd = Math.abs(r.left + r.width / 2 - mid); if (dd < dist) { dist = dd; best = c; } });
    if (!best || best.classList.contains('on')) return;
    best.click();
  }, 160);
}, true);

// =====================================================================
// Events
// =====================================================================
document.addEventListener('click', async (e) => {
  const re = e.target.closest('[data-re]');
  if (re && re.matches('[data-act="toggle"]')) setTimeout(render, 60);
  const a = e.target.closest('[data-pa]');
  if (!a) return;
  const d = a.dataset;
  switch (d.pa) {
    case 'tt-mode': TT.mode = d.v; render(); break;
    case 'bk-save': {
      try { const r = await post('/api/backup/export', {}); if (r?.ok) toast(`✓ ${r.name}`, 4000); } catch (err) { toast(err.message, 5000); }
      break;
    }
    case 'bk-load': {
      if (!confirm(pt('bk_confirm'))) break;
      try {
        const r = await post('/api/backup/import', {});
        if (r?.cancelled) break;
        webStore.loading = true; webStore.load(r.web); webStore.loading = false;
        toast(pt('bk_done'), 3000);
        setTimeout(() => location.reload(), 900);
      } catch (err) { toast(err.message, 5000); }
      break;
    }
    case 'tt-day': ttDay(TT.days[+d.i]); break;
    case 'wg-pin': { const r = await post('/api/widgets/pin', { kind: d.k }); if (!r.ok) toast(wtx(['Your launcher cannot add widgets from apps — add it from the home screen.', 'আপনার লঞ্চার অ্যাপ থেকে উইজেট যোগ করতে পারে না — হোম স্ক্রিন থেকে যোগ করুন।'])); break; }
    case 'voice': {
      if (e.target.closest('[data-pa="vplay"]')) return;
      const s = S.sounds.find((x) => x.id === d.id);
      if (s?.available === false) {
        toast(t('downloading'), 60000);
        try { S.sounds = (await post('/api/sounds/download', { id: s.id })).sounds; toast('✓'); } catch (err) { toast(err.message, 5000); return; }
      }
      S.cfg.adhan[d.p].sound = d.id;
      await saveCfg();
      render();
      break;
    }
    case 'vplay': {
      e.stopPropagation();
      if (a.classList.contains('playing')) { await post('/api/stop'); a.classList.remove('playing'); a.innerHTML = icon('play'); break; }
      $$('.play-btn.playing').forEach((b) => { b.classList.remove('playing'); b.innerHTML = icon('play'); });
      try { await post('/api/play', { sound: d.id, volume: S.cfg.adhan.volume }); a.classList.add('playing'); a.innerHTML = icon('stop'); } catch (err) { toast(err.message); }
      break;
    }
    case 'tb-pick': flushTasbih(); TB.i = +d.i; TB.count = 0; TB.round = 1; TB.seq = false; nativeUi('haptic'); drawTasbih(); break;
    case 'tb-seq': flushTasbih(); TB.i = 0; TB.count = 0; TB.round = 1; TB.seq = true; nativeUi('haptic'); drawTasbih(); break;
    case 'tb-minus': if (TB.count > 0) { TB.count--; tbPaint(true); nativeUi('haptic'); } break;
    case 'tb-reset': TB.count = 0; TB.round = 1; tbPaint(false); nativeUi('haptic', 'long'); break;
    case 'tb-sound': tbSet('tb-sound', tbGet('tb-sound', '1') === '1' ? '0' : '1'); drawTasbih(); break;
    case 'tb-target': tbTargetSheet(); break;
    case 'tb-settarget': tbSet(`tb-target-${DHIKR[TB.i].id}`, d.v); qSheetClose(); TB.count = 0; TB.round = 1; drawTasbih(); break;
    case 'tb-stats': tbStats(); break;
  }
});
// A picker changed: show its new value.
document.addEventListener('change', (e) => {
  if (e.target.closest('select[data-re]')) setTimeout(render, 60);
});

// The tasbih page loads the last 30 days for the streak.
const tasbihView = VIEWS.tasbih;
VIEWS.tasbih = async (tok) => {
  const tot = await api('/api/tasbih');
  if (!live(tok)) return;
  TB.totals = tot.totals; TB.today = tot.today; TB.recent = tot.recent || [];
  drawTasbih();
  nativeUi('volumeTasbih', 1); nativeUi('keepScreenOn', 1);
};
void tasbihView;
// Back from placing a widget: show it as added.
const wgResume = window.onNativeResume;
window.onNativeResume = async () => { await wgResume?.(); if (location.hash === '#/settings/widgets') render(); };

// =====================================================================
// More: every other part of the app, as a sheet of app-style tiles
// =====================================================================
// Grouped by purpose, with a search, a grab handle and swipe-to-close; it
// never grows past the screen. Replaces app.js's plain list on phones.
const MORE_GROUPS = [
  ['learn', ['Learn', 'শিখুন'], ['salah', 'qaida', 'names', 'prophets']],
  ['worship', ['Worship', 'ইবাদত'], ['azkar', 'tasbih', 'duas', 'tracker']],
  ['season', ['Seasons & dates', 'মৌসুম ও তারিখ'], ['hajj', 'ramadan', 'zakat', 'calendar']],
];
/// Shown as rows under the tiles, with a line saying what each is for.
const MORE_ROWS = [['timetable', ['Prayer times for the whole month', 'পুরো মাসের নামাজের সময়']], ['health', null], ['settings', ['Location, adhan, theme and more', 'অবস্থান, আজান, থিম ও আরও']]];
// Each tile: its colours (top, bottom), the glyph's colour, and a short name.
const MORE_TILE = {
  salah: ['#ff9a4d', '#e8590c', '#fff', ['Salah guide', 'নামাজ শিক্ষা']], qaida: ['#2dd4bf', '#0d8a7c', '#fff', ['Qaida', 'নূরানী কায়দা']],
  names: ['#b77cf5', '#7c2fd1', '#fff', ['99 Names', '৯৯ নাম']], prophets: ['#e0b483', '#a8743f', '#fff', ['Prophets', 'নবীদের কাহিনি']],
  hajj: ['#3a3a44', '#111116', '#f3c66b', ['Hajj & Umrah', 'হজ ও উমরা']], azkar: ['#4cd471', '#1f9d45', '#fff', ['Azkar', 'যিকির ও দোয়া']],
  tasbih: ['#3d9bff', '#0062cc', '#fff', ['Tasbih', 'তাসবিহ']], duas: ['#ff7aa2', '#e0336a', '#fff', ['Duas', 'দোয়া']],
  tracker: ['#7d7bf0', '#3f3db8', '#fff', ['Tracker', 'ট্র্যাকার']], timetable: ['#4fc3f7', '#1b84b8', '#fff', ['Timetable', 'সময়সূচি']],
  calendar: ['#ff6b61', '#d42a20', '#fff', ['Calendar', 'ক্যালেন্ডার']], ramadan: ['#34489c', '#121d52', '#f3c66b', ['Ramadan', 'রমজান']],
  zakat: ['#ffd84d', '#e0a800', '#3b2a00', ['Zakat', 'যাকাত']],
};
const ROW_TINT = { timetable: ['#4fc3f7', '#1b84b8'], settings: ['#9aa3b5', '#5e6678'] };
const moreLabel = (k) => (MORE_TILE[k] ? MORE_TILE[k][3][L() === 'bn' ? 1 : 0] : t(k));

function moreTile(k) {
  const [a, b, g] = MORE_TILE[k] || ['#6b7690', '#4a5368', '#fff'];
  const on = route() === k;
  return `<a class="mx-tile ${on ? 'on' : ''}" href="#/${k}" aria-label="${esc(t(k))}"><span class="mx-ic" style="--t1:${a};--t2:${b};--tg:${g}">${icon(ROUTE_ICON[k])}</span><span class="mx-lb">${esc(moreLabel(k))}</span></a>`;
}

function moreBody(q) {
  const items = navRoutes().filter((k) => !tabs().includes(k));
  const failing = S.day?.health_failing || 0;
  ROW_TINT.health = failing ? ['#ff6b61', '#d42a20'] : ['#4cd471', '#1f9d45'];
  const row = (k, sub) => items.includes(k) ? `<a class="mx-row" href="#/${k}"><span class="mx-ic sm" style="--t1:${ROW_TINT[k]?.[0] || '#9aa3b5'};--t2:${ROW_TINT[k]?.[1] || '#5e6678'};--tg:#fff">${icon(ROUTE_ICON[k])}</span>
    <span class="mx-row-t"><b>${esc(t(k))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${k === 'health' && failing ? `<span class="badge">${N(failing)}</span>` : ''}${icon('chevR')}</a>` : '';
  if (q) {
    const n = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hits = items.filter((k) => [t(k), ...(MORE_TILE[k]?.[3] || [])].some((s) => n(s).includes(n(q))));
    const tiles = hits.filter((k) => MORE_TILE[k] && k !== 'timetable');
    const rows = hits.filter((k) => !MORE_TILE[k] || k === 'timetable');
    if (!hits.length) return `<p class="mx-none">${esc(L() === 'bn' ? 'কিছু পাওয়া যায়নি' : 'Nothing found')}</p>`;
    return `${tiles.length ? `<div class="mx-grid">${tiles.map(moreTile).join('')}</div>` : ''}${rows.length ? `<div class="mx-rows">${rows.map((k) => row(k)).join('')}</div>` : ''}`;
  }
  const grouped = new Set(MORE_GROUPS.flatMap((g) => g[2]));
  const extra = items.filter((k) => !grouped.has(k) && k !== 'kids' && !MORE_ROWS.some(([r]) => r === k));
  const kids = items.includes('kids') ? `<a class="mx-kids" href="#/kids"><img src="/kids/deeds.webp" alt=""><span><b>${esc(t('kids'))}</b><small>${esc(L() === 'bn' ? 'কুরআন, দোয়া, গল্প আর খেলা — ছোটদের জন্য' : 'Quran, duas, stories and games for children')}</small></span>${icon('chevR')}</a>` : '';
  const groups = MORE_GROUPS.map(([id, title, ks]) => {
    const here = ks.filter((k) => items.includes(k));
    return here.length ? `<section class="mx-sec"><h3>${esc(title[L() === 'bn' ? 1 : 0])}</h3><div class="mx-grid">${here.map(moreTile).join('')}</div></section>` : '';
  }).join('');
  return `${kids}${groups}${extra.length ? `<section class="mx-sec"><div class="mx-grid">${extra.map(moreTile).join('')}</div></section>` : ''}
    <div class="mx-rows">${MORE_ROWS.map(([k, sub]) => row(k, k === 'health'
      ? (failing ? (L() === 'bn' ? 'কিছু বিষয় ঠিক করতে হবে' : 'Something needs fixing') : (L() === 'bn' ? 'আজান ঠিকমতো বাজবে কি না দেখুন' : 'Make sure the adhan will sound'))
      : sub[L() === 'bn' ? 1 : 0])).join('')}</div>`;
}

openSheet = function () {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>
    <div class="mx" role="dialog" aria-modal="true" aria-label="${esc(t('more'))}">
      <div class="mx-grab" aria-hidden="true"><i></i></div>
      <div class="mx-head"><b>${esc(t('more'))}</b><button class="mx-x" data-act="sheet-close" aria-label="close">${icon('x')}</button></div>
      <label class="mx-search">${icon('search')}<input id="mx-q" type="search" autocomplete="off" placeholder="${esc(L() === 'bn' ? 'খুঁজুন' : 'Search')}"></label>
      <div class="mx-body" id="mx-body">${moreBody('')}</div></div>`;
  sh.hidden = false;
  sh.classList.remove('closing');
  nativeUi('haptic');
  $('#mx-q').addEventListener('input', (e) => { $('#mx-body').innerHTML = moreBody(e.target.value.trim()); });
  // Drag the sheet down by its top to close it.
  const box = $('.mx', sh), body = $('#mx-body', sh);
  // Any choice closes it, even the page already open.
  box.addEventListener('click', (e) => { if (e.target.closest('a[href]')) closeSheet(); });
  let y0 = null, dy = 0;
  box.addEventListener('touchstart', (e) => {
    const top = e.target.closest('.mx-grab, .mx-head');
    y0 = top || body.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0;
  }, { passive: true });
  box.addEventListener('touchmove', (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    if (dy > 4) { box.style.transition = 'none'; box.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });
  box.addEventListener('touchend', () => {
    if (y0 == null) return;
    y0 = null;
    box.style.transition = ''; box.style.transform = '';
    if (dy > 110) closeSheet();
  });
};
closeSheet = function () {
  const sh = $('#sheet');
  if (!sh || sh.hidden) return;
  if (sh.classList.contains('closing')) return;
  sh.classList.add('closing');
  setTimeout(() => { sh.hidden = true; sh.classList.remove('closing'); }, 220);
};
