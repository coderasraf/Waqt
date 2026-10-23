'use strict';
// Waqt: prayer times, adhan, Hijri calendar, Qibla, tracker, tasbih.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Not named `ipc`: the desktop window already defines that global.
const toNative = (msg) => { try { window.ipc && window.ipc.postMessage(msg); } catch { /* browser */ } };

// On Android the page is served from the APK and `/api` calls go to Kotlin
// through this bridge; answers come back via window.__nativeReply.
const NATIVE = window.WaqtNative || null;
const nativeWaiting = new Map();
let nativeSeq = 0;
window.__nativeReply = (id, status, body) => {
  const w = nativeWaiting.get(id);
  if (!w) return;
  nativeWaiting.delete(id);
  let data = null;
  try { data = JSON.parse(body); } catch { /* empty */ }
  if (status >= 200 && status < 300) w.res(data); else w.rej(new Error(data?.error || `Request failed (${status})`));
};
const nativeUi = (cmd, arg = '') => { try { NATIVE && NATIVE.ui(cmd, String(arg)); } catch { /* not android */ } };
if (NATIVE) document.documentElement.classList.add('android');

// Phones: the page's localStorage (themes, fasts, zakat, tasbih targets…) is
// mirrored into the app's files, so backups and a new phone keep it.
const webStore = {
  dump() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } } catch { /* blocked */ } return o; },
  load(o) { try { localStorage.clear(); for (const [k, v] of Object.entries(o || {})) localStorage.setItem(k, v); } catch { /* blocked */ } },
  sync() { clearTimeout(webStore.t); webStore.t = setTimeout(() => api('/api/webstore', { method: 'PUT', body: JSON.stringify(webStore.dump()) }).catch(() => {}), 900); },
};
if (NATIVE) {
  for (const m of ['setItem', 'removeItem', 'clear']) {
    const orig = Storage.prototype[m];
    Storage.prototype[m] = function (...a) { const r = orig.apply(this, a); if (this === window.localStorage && !webStore.loading) webStore.sync(); return r; };
  }
}

async function api(path, opts) {
  if (NATIVE) {
    return new Promise((res, rej) => {
      const id = `r${++nativeSeq}`;
      nativeWaiting.set(id, { res, rej });
      NATIVE.request(id, opts?.method || 'GET', path, opts?.body || '');
    });
  }
  const r = await fetch(path, opts);
  let data = null;
  try { data = await r.json(); } catch { /* empty */ }
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data;
}
const post = (p, b) => api(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b ?? {}) });
const put = (p, b) => api(p, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b ?? {}) });

// ---------- Icons (stroke, 24px) ----------
const IC = {
  shield: '<path d="M12 3 4 6v6c0 4.6 3.4 8.3 8 9 4.6-.7 8-4.4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  menu: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m10 21 2-6 3 3v3M8 12l2-4 4 1 2 3h3M10 8 7 9.5 6 13"/>',
  plane: '<path d="M10.2 21 12 15l-6-1-2 2-1.5-.5L4 12 2.5 8.5 4 8l2 2 6-1-1.8-6h2.3L17 9h3.5a1.5 1.5 0 0 1 0 3H17l-4.5 9z"/>',
  today: '<path d="M12 3v2M5.6 5.6 7 7M3 12h2M19 12h2M17 7l1.4-1.4"/><path d="M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M9 9v11M15 9v11"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M15.5 13.2a2.8 2.8 0 1 0 0 4.6 3.4 3.4 0 0 1 0-4.6z"/>',
  qibla: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
  tracker: '<path d="M4 12.5 9 17.5 20 6.5"/><path d="M4 6h6M4 20h16" opacity=".5"/>',
  tasbih: '<circle cx="12" cy="5" r="2"/><circle cx="17.5" cy="8" r="2"/><circle cx="18.5" cy="14" r="2"/><circle cx="6.5" cy="8" r="2"/><circle cx="5.5" cy="14" r="2"/><path d="M12 15v6M10 21h4"/><circle cx="12" cy="15" r="1.5"/>',
  dua: '<path d="M7 20c-2-1.5-3-4-3-6.5V8l3-3 1.5 1.5V12"/><path d="M17 20c2-1.5 3-4 3-6.5V8l-3-3-1.5 1.5V12"/><path d="M8.5 12 11 15M15.5 12 13 15"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  fajr: '<path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 7v3M6.2 10.2l1.6 1.6M17.8 10.2l-1.6 1.6"/><path d="M8 21h8" opacity=".5"/>',
  sunrise: '<path d="M3 18h18"/><path d="M6.5 18a5.5 5.5 0 0 1 11 0"/><path d="m9 6 3-3 3 3M12 3v7"/>',
  dhuhr: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  asr: '<circle cx="15" cy="8" r="3.5"/><path d="M15 2v1.5M20.5 8H22M19 4l1-1M10 4 9 3"/><path d="M3 20h18"/><path d="M6 20V12M6 20l9-3" opacity=".6"/>',
  maghrib: '<path d="M3 17h18"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="m9 6 3 3 3-3M12 9V2"/><path d="M6 21h12" opacity=".5"/>',
  isha: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="m17 3 .7 1.6L19.3 5l-1.6.7L17 7.3l-.7-1.6L14.7 5l1.6-.4z"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mosque: '<path d="M4 21V11h16v10"/><path d="M6.5 11a5.5 5.5 0 0 1 11 0"/><path d="M12 5.5V3"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/><path d="M2 21h20"/>',
  bell: '<path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  bubble: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5" opacity=".6"/>',
  off: '<path d="M18 16V11a6 6 0 0 0-9.3-5M6.4 7.6A6 6 0 0 0 6 11v5l-2 2h14"/><path d="M10 21a2 2 0 0 0 4 0"/><path d="m3 3 18 18"/>',
  check: '<path d="M5 12.5 10 17.5 19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  mini: '<rect x="3" y="5" width="18" height="14" rx="3"/><rect x="11" y="11" width="8" height="6" rx="1.5" fill="currentColor" opacity=".35"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  hide: '<path d="M5 12h14"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 5M22 9l-5 5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  kaaba: '<path d="M4 8 12 4l8 4v9l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v9"/><path d="M4 11l8 4 8-4" opacity=".6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  print: '<path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18h2M14 18h2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.2-1-1.5-1-2.6 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
  power: '<path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  flame: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.4 2.4-5.4 3.6-8 .9 2 2.2 3 3.4 3.2C12.3 6.5 13.5 4 15.5 3c-.3 3 3.5 5.5 3.5 11.5 0 3.8-3 6.5-7 6.5z"/>',
};
const icon = (name, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${IC[name] || ''}</svg>`;

// ---------- Words ----------
const PN = {
  fajr: { en: 'Fajr', bn: 'ফজর', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', bn: 'সূর্যোদয়', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', bn: 'যোহর', ar: 'الظهر' },
  jumuah: { en: "Jumu'ah", bn: 'জুমা', ar: 'الجمعة' },
  asr: { en: 'Asr', bn: 'আসর', ar: 'العصر' },
  maghrib: { en: 'Maghrib', bn: 'মাগরিব', ar: 'المغرب' },
  isha: { en: 'Isha', bn: 'এশা', ar: 'العشاء' },
  duha: { en: 'Duha', bn: 'চাশত', ar: 'الضحى' },
};
const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const SIX = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const T = {
  en: {
    today: 'Today', timetable: 'Timetable', calendar: 'Hijri Calendar', qibla: 'Qibla', tracker: 'Prayer Tracker', tasbih: 'Tasbih', duas: 'Duas', quran: 'Quran', hadith: 'Hadith', salah: 'Salah guide', azkar: 'Azkar', ramadan: 'Ramadan & fasting', zakat: 'Zakat & sadaqah', settings: 'Settings',
    next_prayer: 'Next prayer', at: 'at', now: 'Now', next: 'Next', ends: 'ends', remaining: 'remaining', time_left: 'left',
    duha_time: 'Duha time', no_prayer: 'Until Dhuhr',
    ayah: 'Verse of the day', moon: 'Moon & Hijri', events: 'Coming up', special: 'Special times', progress: "Today's prayers", qibla_short: 'Qibla',
    sehri_ends: 'Sehri ends', ishraq: 'Ishraq / Duha', zawal: 'Zawal (avoid prayer)', midnight: 'Islamic midnight', tahajjud: 'Tahajjud (last third)', sunset: 'Sunset',
    ramadan: 'Ramadan', ramadan_in: 'Ramadan in', days: 'days', day: 'day', today_l: 'today', tomorrow: 'tomorrow',
    sehri: 'Sehri', iftar: 'Iftar', ramadan_day: 'Ramadan day',
    illum: 'lit', streak: 'day streak', of5: 'of 5 prayed',
    mode_adhan: 'Adhan', mode_chime: 'Chime', mode_notify: 'Notification only', mode_off: 'Off',
    st0: 'Not marked', st1: 'Prayed on time', st2: 'Prayed in jamaah', st3: 'Prayed late (qada)', st4: 'Missed', clear: 'Clear',
    muted: 'Adhan silenced today', mute_tip: 'Silence adhan for today', unmute: 'Adhan is silenced today — click to turn it back on',
    mini_tip: 'Countdown on desktop',
    night: 'Night', fajr_seg: 'Fajr', forbidden: 'Forbidden time', duha_seg: 'Duha', dhuhr_seg: 'Dhuhr', asr_seg: 'Asr', maghrib_seg: 'Maghrib', isha_seg: 'Isha', tahajjud_seg: 'Tahajjud',
    export: 'Export', print: 'Print', ramadan_tt: 'Ramadan timetable', this_month: 'This month', date: 'Date', hijri: 'Hijri',
    upcoming_year: 'The year ahead', white_days: 'White days (fast 13–15)', monday: 'Monday fast (sunnah)', thursday: 'Thursday fast (sunnah)', friday: 'Friday — Jumu\'ah',
    calc_note: 'Dates are calculated; local announcements may differ by a day. Adjust in Settings → Hijri date.',
    qibla_title: 'Qibla direction', from_north: 'from true north', distance: 'to the Kaaba', sun_guide: 'Find it with the sun', sun_face: 'The sun is exactly in the Qibla direction — face the sun.', sun_back: 'The sun is directly behind the Qibla — turn your back to the sun.', no_align: "The sun doesn't line up with the Qibla today. Use a compass: face the gold arrow with N pointing north.", sun_now: 'Sun now', qibla_tip: 'Hold a compass (or your phone\'s compass) flat, turn until N points north, then face the gold arrow.',
    on_time_7: 'Last 7 days', on_time_30: 'Last 30 days', best: 'Best streak', jamaah: 'In jamaah this month', qada_left: 'Qada to make up', made_up: 'I made one up', week: 'This week', history: 'Last 6 months', per_prayer: 'Per prayer (30 days)', tap_mark: 'Tap a prayer to mark it',
    tap_count: 'Tap the circle, or press Space', reset: 'Reset', undo: 'Undo', after_prayer: 'After-prayer tasbih (33·33·34)', today_total: 'Today', lifetime: 'All time', target: 'Target', done_set: 'Completed!',
    s_location: 'Location', s_calc: 'Calculation', s_hijri: 'Hijri date', s_adhan: 'Adhan & alerts', s_display: 'Display', s_system: 'Startup', s_about: 'About',
    detect: 'Detect my location', search_city: 'Search any city or town…', method: 'Calculation method', asr_method: 'Asr time', standard: 'Standard (Shafi\'i, Maliki, Hanbali)', hanafi: 'Hanafi (later Asr)',
    high_lat: 'High-latitude rule', adjust: 'Minute adjustments', adjust_help: 'Match your local mosque timetable.', imsak: 'Sehri precaution', imsak_help: 'Minutes before Fajr that Sehri ends.',
    hijri_rule: 'Month start', rule_sighting: 'Local moon sighting (predicted)', rule_uaq: 'Saudi Arabia (Umm al-Qura)', rule_arith: 'Arithmetic (tabular)', hijri_offset: 'Adjust by days', hijri_preview: 'Today will show as', at_maghrib: 'New Hijri day at Maghrib',
    volume: 'Adhan volume', test: 'Test', fade: 'Fade in gently', show_window: 'Show the adhan screen', reminder: 'Remind before', none: 'None', min: 'min',
    sunrise_warn: 'Warn before sunrise (Fajr ending)', sehri_alarm: 'Sehri alarm', in_ramadan: 'In Ramadan', always: 'Every day', off: 'Off', before_fajr: 'before Sehri ends', jumuah_rem: "Friday reminder (Jumu'ah & Surah Al-Kahf)", tahajjud_rem: 'Tahajjud reminder',
    import_sound: 'Add your own adhan…', language: 'Language', clock: 'Clock', bn_digits: 'Bangla digits', theme: 'Theme', theme_help: 'Auto follows the light or dark setting of your device.', th_auto: 'Auto', th_night: 'Night', th_day: 'Day', th_sepia: 'Sepia', th_madinah: 'Madinah', th_rawdah: 'Rawdah', th_emerald: 'Emerald', th_ocean: 'Ocean', th_royal: 'Royal', th_black: 'Black', autostart: 'Start with Windows', autostart_help: 'Waqt starts quietly in the tray so the adhan always works.', close_tray: 'Close button keeps Waqt in the tray', overlay: 'Countdown on desktop', overlay_help: 'A small always-on-top timer to the next prayer. It stays when the window is closed; drag it to any screen.', overlay_lock: 'Lock countdown', overlay_lock_help: 'Clicks pass through it to the windows below. Unlock from the tray icon.',
    saved: 'Saved ✓', applied_method: 'Applied the method used in', about: 'Prayer times are calculated on this computer from the sun\'s position — no internet needed. Adhan recordings are public-domain recordings from the Internet Archive. City search uses Open-Meteo; daily verses come from alquran.cloud.',
    stop_adhan: 'Stop adhan', close: 'Close', time_for: "It's time for", dua_after: 'Dua after the adhan', iftar_dua: 'Dua at iftar',
    welcome: 'Welcome to Waqt', welcome_sub: 'Prayer times, adhan and the Hijri calendar — beautifully, and always on time.', choose_lang: 'Choose your language', where: 'Where do you pray?', detecting: 'Finding your location…', found: 'We found you in', calc_title: 'How times are calculated', voice: 'Choose an adhan voice', voice_reg: 'For Dhuhr, Asr, Maghrib and Isha', voice_fajr: 'For Fajr', finish: 'Start', back: 'Back', continue: 'Continue', all_set: 'All set!', all_set_sub: 'The adhan will sound five times a day, even when this window is closed.',
    mini_next: 'Next', loading: 'Loading…', offline_ayah: 'The verse of the day needs an internet connection once a day.',
    health: 'Adhan check', more: 'More', hc_ok: 'Your adhan is protected', hc_bad: '{n} setting(s) can stop the adhan',
    hc_sub: 'Phones save battery by stopping apps. These checks make sure the adhan still rings at the exact minute.',
    fix: 'Fix', done_it: "I've done this", open_settings: 'Open settings',
    hc_notifications: 'Notifications', hc_notifications_d: 'Lets the adhan and reminders appear on your screen.',
    hc_exact_alarm: 'Alarms & reminders', hc_exact_alarm_d: 'Lets Waqt ring at the exact minute, even while the phone sleeps.',
    hc_battery: 'Battery: unrestricted', hc_battery_d: "Stops Android pausing Waqt to save battery. Choose 'Unrestricted' or 'Don't optimise'.",
    hc_oem: 'Your phone brand\'s app killer', hc_alarm_volume: 'Alarm volume', hc_alarm_volume_d: 'The adhan plays at alarm volume, which is now 0.',
    hc_dnd: 'Do Not Disturb access', hc_dnd_d: 'Needed to put the phone on vibrate during jamaat.',
    oem_xiaomi: 'Xiaomi / Redmi / POCO: Settings → Apps → Manage apps → Waqt → turn on Autostart, and set Battery saver to “No restrictions”. Then lock Waqt in Recents.',
    oem_oppo: 'Oppo / Realme: Settings → Battery → Waqt → allow background activity and auto launch.',
    oem_oneplus: "OnePlus: Settings → Battery → Battery optimisation → Waqt → Don't optimise, and allow auto-launch.",
    oem_vivo: 'Vivo / iQOO: i Manager → App manager → Autostart → Waqt on; Settings → Battery → Background power use → Waqt → Allow.',
    oem_huawei: 'Huawei / Honor: Phone Manager → App launch → Waqt → Manage manually, with all three switches on.',
    oem_samsung: 'Samsung: Settings → Battery → Background usage limits → Never sleeping apps → add Waqt.',
    oem_transsion: "Tecno / Infinix / itel: Phone Master → App management → Auto-start → Waqt on, and turn off power saving for Waqt.",
    oem_asus: 'Asus: Mobile Manager → Auto-start manager → Waqt on.',
    test_title: 'Test the full adhan path', test_d: 'Plays a real test adhan in one minute through the same alarm the prayers use. Lock your phone and wait: if it plays, every prayer will too.',
    test_btn: 'Test in 1 minute', test_wait: 'Test adhan in', deliveries: 'Recent adhans', on_time: 'on time', late_by: 'late by', no_deliveries: 'No adhan has played yet.',
    next_alarm: 'Next alarm', exact: 'exact', inexact: 'may be delayed', hc_banner: 'Your adhan may not ring on time.', check_now: 'Check now',
    travel_on: "You're traveling", travel_d: '{km} km from home — Qasr: pray 2 rak\'ahs for Dhuhr, Asr and Isha.', travel_update: 'Prayer times are for {city}. Use where you are now?', update: 'Update',
    jamaat: 'Jamaat', wake_title: 'Wake up for Fajr', wake_d: 'Tap the circle {n} times to stop the alarm.', wake_done: 'May Allah accept your Fajr',
    s_phone: 'Phone', in_silent: 'Play the adhan even in silent mode', in_silent_d: 'Uses the alarm volume, like an alarm clock.',
    auto_silent: 'Auto-silent at the mosque', auto_silent_d: 'Puts the phone on vibrate for each jamaat, then turns the sound back on.', silent_for: 'for',
    jamaat_times: 'My mosque jamaat times', jamaat_help: 'Minutes after the adhan (like 15) or a fixed time (like 13:30). Leave empty if you don\'t know.',
    walk: 'Remind me to leave for the mosque', walk_d: 'How long it takes to walk there.',
    travel: 'Travel mode (Qasr)', travel_help: 'Tells you when you are far enough from home to shorten prayers. Uses your approximate location only while the app is open.',
    set_home: 'Set current location as home', home: 'Home', fajr_wake: 'Fajr wake-up alarm', fajr_wake_d: 'The Fajr adhan keeps ringing until you get up and finish a short tasbih.',
    volume_tasbih: 'Count tasbih with the volume buttons', download: 'Download', downloading: 'Downloading…', not_downloaded: 'download',
    facing: 'You are facing the Qibla', turn_left: 'Turn left', turn_right: 'Turn right', calibrate: 'Move your phone in a figure-8 to calibrate the compass.',
    permissions_title: 'Make sure the adhan rings', permissions_sub: 'Allow these so Waqt can ring at the exact minute, even when your phone sleeps.', jumuah_t: "Jumu'ah",
  },
  bn: {
    today: 'আজ', timetable: 'সময়সূচি', calendar: 'হিজরি ক্যালেন্ডার', qibla: 'কিবলা', tracker: 'নামাজ ট্র্যাকার', tasbih: 'তাসবিহ', duas: 'দোয়া', quran: 'কুরআন', hadith: 'হাদীস', salah: 'নামাজ শিক্ষা', azkar: 'যিকির ও দোয়া', ramadan: 'রমজান ও রোজা', zakat: 'যাকাত ও সদকা', settings: 'সেটিংস',
    next_prayer: 'পরবর্তী নামাজ', at: '', now: 'এখন', next: 'পরবর্তী', ends: 'শেষ', remaining: 'বাকি', time_left: 'বাকি',
    duha_time: 'চাশতের সময়', no_prayer: 'যোহর পর্যন্ত',
    ayah: 'আজকের আয়াত', moon: 'চাঁদ ও হিজরি', events: 'সামনে', special: 'বিশেষ সময়', progress: 'আজকের নামাজ', qibla_short: 'কিবলা',
    sehri_ends: 'সাহরির শেষ সময়', ishraq: 'ইশরাক / চাশত', zawal: 'জাওয়াল (নামাজ নিষেধ)', midnight: 'মধ্যরাত (ইসলামি)', tahajjud: 'তাহাজ্জুদ (শেষ তৃতীয়াংশ)', sunset: 'সূর্যাস্ত',
    ramadan: 'রমজান', ramadan_in: 'রমজান আসতে', days: 'দিন', day: 'দিন', today_l: 'আজ', tomorrow: 'আগামীকাল',
    sehri: 'সাহরি', iftar: 'ইফতার', ramadan_day: 'রমজানের দিন',
    illum: 'আলোকিত', streak: 'দিনের ধারা', of5: '৫ ওয়াক্তের মধ্যে',
    mode_adhan: 'আজান', mode_chime: 'ঘণ্টাধ্বনি', mode_notify: 'শুধু নোটিফিকেশন', mode_off: 'বন্ধ',
    st0: 'চিহ্নিত নয়', st1: 'সময়মতো পড়েছি', st2: 'জামাতে পড়েছি', st3: 'দেরিতে পড়েছি (কাজা)', st4: 'ছুটে গেছে', clear: 'মুছুন',
    muted: 'আজ আজান নীরব', mute_tip: 'আজকের জন্য আজান নীরব করুন', unmute: 'আজ আজান নীরব — চালু করতে ক্লিক করুন',
    mini_tip: 'ডেস্কটপে কাউন্টডাউন',
    night: 'রাত', fajr_seg: 'ফজর', forbidden: 'নিষিদ্ধ সময়', duha_seg: 'চাশত', dhuhr_seg: 'যোহর', asr_seg: 'আসর', maghrib_seg: 'মাগরিব', isha_seg: 'এশা', tahajjud_seg: 'তাহাজ্জুদ',
    export: 'এক্সপোর্ট', print: 'প্রিন্ট', ramadan_tt: 'রমজানের সময়সূচি', this_month: 'এই মাস', date: 'তারিখ', hijri: 'হিজরি',
    upcoming_year: 'সামনের বছর', white_days: 'আইয়ামে বীজ (১৩–১৫ রোজা)', monday: 'সোমবারের রোজা (সুন্নত)', thursday: 'বৃহস্পতিবারের রোজা (সুন্নত)', friday: 'শুক্রবার — জুমা',
    calc_note: 'তারিখগুলো হিসাব করা; স্থানীয় ঘোষণার সাথে এক দিন পার্থক্য হতে পারে। সেটিংস → হিজরি তারিখ থেকে মিলিয়ে নিন।',
    qibla_title: 'কিবলার দিক', from_north: 'উত্তর থেকে', distance: 'কাবা পর্যন্ত', sun_guide: 'সূর্য দেখে কিবলা', sun_face: 'সূর্য ঠিক কিবলার দিকে — সূর্যের দিকে মুখ করুন।', sun_back: 'সূর্য ঠিক কিবলার উল্টো দিকে — সূর্যকে পেছনে রাখুন।', no_align: 'আজ সূর্য কিবলার সাথে মেলে না। কম্পাস ব্যবহার করুন: N উত্তরে রেখে সোনালি তীরের দিকে মুখ করুন।', sun_now: 'এখন সূর্য', qibla_tip: 'কম্পাস (বা ফোনের কম্পাস) সমতলে রেখে N উত্তরে মিলিয়ে সোনালি তীরের দিকে মুখ করুন।',
    on_time_7: 'গত ৭ দিন', on_time_30: 'গত ৩০ দিন', best: 'সেরা ধারা', jamaah: 'এই মাসে জামাতে', qada_left: 'বাকি কাজা', made_up: 'একটি কাজা আদায় করেছি', week: 'এই সপ্তাহ', history: 'গত ৬ মাস', per_prayer: 'ওয়াক্ত অনুযায়ী (৩০ দিন)', tap_mark: 'চিহ্নিত করতে নামাজে চাপুন',
    tap_count: 'বৃত্তে চাপুন, অথবা Space চাপুন', reset: 'রিসেট', undo: 'ফেরত', after_prayer: 'নামাজের পর তাসবিহ (৩৩·৩৩·৩৪)', today_total: 'আজ', lifetime: 'সর্বমোট', target: 'লক্ষ্য', done_set: 'সম্পূর্ণ!',
    s_location: 'অবস্থান', s_calc: 'হিসাব পদ্ধতি', s_hijri: 'হিজরি তারিখ', s_adhan: 'আজান ও সতর্কতা', s_display: 'প্রদর্শন', s_system: 'স্টার্টআপ', s_about: 'সম্পর্কে',
    detect: 'আমার অবস্থান খুঁজুন', search_city: 'যেকোনো শহর বা এলাকা খুঁজুন…', method: 'হিসাব পদ্ধতি', asr_method: 'আসরের সময়', standard: 'সাধারণ (শাফেয়ি, মালেকি, হাম্বলি)', hanafi: 'হানাফি (পরে আসর)',
    high_lat: 'উচ্চ অক্ষাংশ নিয়ম', adjust: 'মিনিট সমন্বয়', adjust_help: 'স্থানীয় মসজিদের সময়ের সাথে মিলিয়ে নিন।', imsak: 'সাহরির সতর্কতা', imsak_help: 'ফজরের কত মিনিট আগে সাহরি শেষ।',
    hijri_rule: 'মাস শুরুর নিয়ম', rule_sighting: 'স্থানীয় চাঁদ দেখা (অনুমিত)', rule_uaq: 'সৌদি আরব (উম্মুল কুরা)', rule_arith: 'গাণিতিক (তাবুলার)', hijri_offset: 'দিন সমন্বয়', hijri_preview: 'আজ দেখাবে', at_maghrib: 'মাগরিবে নতুন হিজরি দিন',
    volume: 'আজানের ভলিউম', test: 'শুনুন', fade: 'ধীরে ধীরে শুরু', show_window: 'আজানের পর্দা দেখান', reminder: 'আগে মনে করান', none: 'না', min: 'মি',
    sunrise_warn: 'সূর্যোদয়ের আগে সতর্ক করুন (ফজর শেষ)', sehri_alarm: 'সাহরির অ্যালার্ম', in_ramadan: 'রমজানে', always: 'প্রতিদিন', off: 'বন্ধ', before_fajr: 'সাহরি শেষের আগে', jumuah_rem: 'শুক্রবারের রিমাইন্ডার (জুমা ও সূরা কাহফ)', tahajjud_rem: 'তাহাজ্জুদ রিমাইন্ডার',
    import_sound: 'নিজের আজান যোগ করুন…', language: 'ভাষা', clock: 'ঘড়ি', bn_digits: 'বাংলা সংখ্যা', theme: 'থিম', theme_help: 'স্বয়ংক্রিয়: ডিভাইসের লাইট বা ডার্ক সেটিং অনুযায়ী চলে।', th_auto: 'স্বয়ংক্রিয়', th_night: 'রাত', th_day: 'দিন', th_sepia: 'সেপিয়া', th_madinah: 'মদিনা', th_rawdah: 'রওজা', th_emerald: 'পান্না', th_ocean: 'সমুদ্র', th_royal: 'রাজকীয়', th_black: 'কালো', autostart: 'উইন্ডোজের সাথে চালু', autostart_help: 'আজান যেন সবসময় বাজে, তাই ওয়াক্ত ট্রেতে নীরবে চালু থাকে।', close_tray: 'বন্ধ করলে ট্রেতে থাকবে', overlay: 'ডেস্কটপে কাউন্টডাউন', overlay_help: 'পরের নামাজ পর্যন্ত ছোট একটি টাইমার, সব উইন্ডোর ওপরে। উইন্ডো বন্ধ করলেও থাকে; যেকোনো স্ক্রিনে টেনে নিন।', overlay_lock: 'কাউন্টডাউন লক', overlay_lock_help: 'ক্লিক এর ভেতর দিয়ে নিচের উইন্ডোতে যাবে। ট্রে আইকন থেকে আনলক করুন।',
    saved: 'সংরক্ষিত ✓', applied_method: 'যে পদ্ধতি ব্যবহৃত হয় তা প্রয়োগ করা হয়েছে:', about: 'নামাজের সময় এই কম্পিউটারেই সূর্যের অবস্থান থেকে হিসাব করা হয় — ইন্টারনেট লাগে না। আজানগুলো ইন্টারনেট আর্কাইভের পাবলিক-ডোমেইন রেকর্ডিং। শহর খোঁজা Open-Meteo দিয়ে; আজকের আয়াত alquran.cloud থেকে।',
    stop_adhan: 'আজান থামান', close: 'বন্ধ', time_for: 'ওয়াক্ত হয়েছে', dua_after: 'আজানের পরের দোয়া', iftar_dua: 'ইফতারের দোয়া',
    welcome: 'ওয়াক্তে স্বাগতম', welcome_sub: 'নামাজের সময়, আজান ও হিজরি ক্যালেন্ডার — সুন্দরভাবে, সবসময় সময়মতো।', choose_lang: 'ভাষা বেছে নিন', where: 'আপনি কোথায় নামাজ পড়েন?', detecting: 'আপনার অবস্থান খোঁজা হচ্ছে…', found: 'আপনার অবস্থান', calc_title: 'সময় কীভাবে হিসাব হবে', voice: 'আজানের কণ্ঠ বেছে নিন', voice_reg: 'যোহর, আসর, মাগরিব ও এশার জন্য', voice_fajr: 'ফজরের জন্য', finish: 'শুরু করুন', back: 'পেছনে', continue: 'পরবর্তী', all_set: 'সব প্রস্তুত!', all_set_sub: 'এই উইন্ডো বন্ধ থাকলেও দিনে পাঁচবার আজান বাজবে।',
    mini_next: 'পরবর্তী', loading: 'লোড হচ্ছে…', offline_ayah: 'আজকের আয়াতের জন্য দিনে একবার ইন্টারনেট লাগে।',
    health: 'আজান চেক', more: 'আরও', hc_ok: 'আপনার আজান সুরক্ষিত', hc_bad: '{n}টি সেটিং আজান বন্ধ করতে পারে',
    hc_sub: 'ব্যাটারি বাঁচাতে ফোন অ্যাপ বন্ধ করে দেয়। এই চেকগুলো নিশ্চিত করে আজান ঠিক মিনিটে বাজবে।',
    fix: 'ঠিক করুন', done_it: 'করেছি', open_settings: 'সেটিংস খুলুন',
    hc_notifications: 'নোটিফিকেশন', hc_notifications_d: 'আজান ও রিমাইন্ডার স্ক্রিনে দেখানোর জন্য।',
    hc_exact_alarm: 'অ্যালার্ম ও রিমাইন্ডার', hc_exact_alarm_d: 'ফোন ঘুমিয়ে থাকলেও ঠিক মিনিটে আজান বাজাতে।',
    hc_battery: 'ব্যাটারি: সীমাহীন', hc_battery_d: 'ব্যাটারি বাঁচাতে অ্যান্ড্রয়েড যেন ওয়াক্ত থামিয়ে না দেয়। “Unrestricted” বা “Don’t optimise” বেছে নিন।',
    hc_oem: 'আপনার ফোন কোম্পানির অ্যাপ-বন্ধকারী', hc_alarm_volume: 'অ্যালার্ম ভলিউম', hc_alarm_volume_d: 'আজান অ্যালার্ম ভলিউমে বাজে, যা এখন ০।',
    hc_dnd: 'বিরক্ত করবেন না (DND) অনুমতি', hc_dnd_d: 'জামাতের সময় ফোন ভাইব্রেশনে রাখতে লাগে।',
    oem_xiaomi: 'শাওমি / রেডমি / পোকো: Settings → Apps → Manage apps → Waqt → Autostart চালু করুন, Battery saver “No restrictions” করুন। তারপর Recents-এ ওয়াক্ত লক করুন।',
    oem_oppo: 'অপো / রিয়েলমি: Settings → Battery → Waqt → background activity ও auto launch চালু করুন।',
    oem_oneplus: 'ওয়ানপ্লাস: Settings → Battery → Battery optimisation → Waqt → Don’t optimise; auto-launch চালু করুন।',
    oem_vivo: 'ভিভো / iQOO: i Manager → App manager → Autostart → Waqt চালু; Settings → Battery → Background power use → Waqt → Allow।',
    oem_huawei: 'হুয়াওয়ে / অনার: Phone Manager → App launch → Waqt → Manage manually, তিনটি সুইচই চালু।',
    oem_samsung: 'স্যামসাং: Settings → Battery → Background usage limits → Never sleeping apps → Waqt যোগ করুন।',
    oem_transsion: 'টেকনো / ইনফিনিক্স / আইটেল: Phone Master → App management → Auto-start → Waqt চালু; ওয়াক্তের power saving বন্ধ করুন।',
    oem_asus: 'আসুস: Mobile Manager → Auto-start manager → Waqt চালু।',
    test_title: 'পুরো আজান পরীক্ষা করুন', test_d: 'নামাজের অ্যালার্মের মতোই এক মিনিট পরে একটি পরীক্ষামূলক আজান বাজবে। ফোন লক করে অপেক্ষা করুন: বাজলে প্রতিটি ওয়াক্তেই বাজবে।',
    test_btn: '১ মিনিটে পরীক্ষা', test_wait: 'পরীক্ষামূলক আজান', deliveries: 'সাম্প্রতিক আজান', on_time: 'সময়মতো', late_by: 'দেরি', no_deliveries: 'এখনো কোনো আজান বাজেনি।',
    next_alarm: 'পরবর্তী অ্যালার্ম', exact: 'নির্ভুল', inexact: 'দেরি হতে পারে', hc_banner: 'আপনার আজান সময়মতো নাও বাজতে পারে।', check_now: 'এখনই দেখুন',
    travel_on: 'আপনি সফরে আছেন', travel_d: 'বাড়ি থেকে {km} কিমি — কসর: যোহর, আসর ও এশা ২ রাকাত।', travel_update: 'নামাজের সময় {city}-এর। বর্তমান স্থানের সময় দেখাবেন?', update: 'বদলান',
    jamaat: 'জামাত', wake_title: 'ফজরের জন্য উঠুন', wake_d: 'অ্যালার্ম থামাতে বৃত্তে {n} বার চাপুন।', wake_done: 'আল্লাহ আপনার ফজর কবুল করুন',
    s_phone: 'ফোন', in_silent: 'সাইলেন্ট মোডেও আজান বাজুক', in_silent_d: 'অ্যালার্ম ঘড়ির মতো অ্যালার্ম ভলিউমে বাজে।',
    auto_silent: 'মসজিদে স্বয়ংক্রিয় সাইলেন্ট', auto_silent_d: 'প্রতিটি জামাতে ফোন ভাইব্রেশনে, পরে আবার শব্দ চালু।', silent_for: 'সময়',
    jamaat_times: 'আমার মসজিদের জামাতের সময়', jamaat_help: 'আজানের কত মিনিট পর (যেমন ১৫) বা নির্দিষ্ট সময় (যেমন 13:30)। না জানলে খালি রাখুন।',
    walk: 'মসজিদে রওনা দেওয়ার রিমাইন্ডার', walk_d: 'হেঁটে যেতে কত মিনিট লাগে।',
    travel: 'সফর মোড (কসর)', travel_help: 'বাড়ি থেকে যথেষ্ট দূরে গেলে কসরের কথা জানায়। শুধু অ্যাপ খোলা থাকলে আনুমানিক অবস্থান দেখে।',
    set_home: 'বর্তমান স্থানকে বাড়ি হিসেবে রাখুন', home: 'বাড়ি', fajr_wake: 'ফজরের জাগানোর অ্যালার্ম', fajr_wake_d: 'উঠে ছোট একটি তাসবিহ শেষ না করা পর্যন্ত ফজরের আজান বাজতে থাকবে।',
    volume_tasbih: 'ভলিউম বাটনে তাসবিহ গণনা', download: 'ডাউনলোড', downloading: 'ডাউনলোড হচ্ছে…', not_downloaded: 'ডাউনলোড',
    facing: 'আপনি কিবলামুখী', turn_left: 'বাঁয়ে ঘুরুন', turn_right: 'ডানে ঘুরুন', calibrate: 'কম্পাস ঠিক করতে ফোনটি ৮-এর মতো করে ঘোরান।',
    permissions_title: 'আজান যেন ঠিকমতো বাজে', permissions_sub: 'ফোন ঘুমিয়ে থাকলেও ঠিক মিনিটে আজান বাজাতে এগুলো চালু করুন।', jumuah_t: 'জুমা',
  },
};

const WEEKDAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], bn: ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'] };
const WD_SHORT = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'] };
const MONTHS = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'] };

const S = { cfg: null, day: null, live: null, sounds: [], methods: [], lastAlert: 0, overlay: null, mini: false };
const L = () => (S.cfg?.language === 'bn' ? 'bn' : 'en');
const t = (k) => T[L()][k] ?? T.en[k] ?? k;
const N = (s) => (L() === 'bn' && S.cfg?.bangla_digits !== false ? String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]) : String(s));
function pname(key, friday) { const k = key === 'dhuhr' && friday ? 'jumuah' : key; return PN[k]?.[L()] || key; }
function parab(key, friday) { const k = key === 'dhuhr' && friday ? 'jumuah' : key; return PN[k]?.ar || ''; }

/// Wall-clock time at the location (UTC offset in minutes).
function fmtTime(ms, off, opts = {}) {
  const mins = (((Math.floor(ms / 60000) + off) % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (S.cfg?.clock === 24) return N(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (opts.bare) return N(`${h12}:${String(m).padStart(2, '0')}`);
  if (L() === 'bn') {
    const part = h < 4 ? 'রাত' : h < 6 ? 'ভোর' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত';
    return opts.split ? [N(`${h12}:${String(m).padStart(2, '0')}`), part] : `${part} ${N(`${h12}:${String(m).padStart(2, '0')}`)}`;
  }
  const ap = h < 12 ? 'AM' : 'PM';
  return opts.split ? [`${h12}:${String(m).padStart(2, '0')}`, ap] : `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
function fmtDur(ms) {
  const total = Math.max(0, Math.ceil(ms / 60000));
  const h = Math.floor(total / 60), m = total % 60;
  if (L() === 'bn') return N(h ? `${h} ঘ ${m} মি` : `${m} মিনিট`);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
}
function hms(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}
function fmtGDate(iso, withDay = true) {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const s = `${N(d)} ${MONTHS[L()][m - 1]} ${N(y)}`;
  return withDay ? `${WEEKDAYS[L()][wd]}, ${s}` : s;
}
function hijriText(h, year = true) {
  const name = L() === 'bn' ? h.month_bn : h.month_en;
  return `${N(h.d)} ${name}${year ? ` ${N(h.y)}` : ''}`;
}

function toast(msg, ms = 3200) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, ms);
}

// ---------- Moon drawing ----------
/// SVG path of the lit part of the moon for a phase (0 new → .5 full → 1).
function moonPath(cx, cy, r, phase) {
  const k = Math.cos(2 * Math.PI * phase);
  const rx = Math.abs(k) * r;
  if (phase < 0.5) return `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${rx} ${r} 0 0 ${k > 0 ? 0 : 1} ${cx} ${cy - r}Z`;
  return `M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}A${rx} ${r} 0 0 ${k > 0 ? 1 : 0} ${cx} ${cy - r}Z`;
}
function moonSvg(phase, cls = 'moon', size = 100) {
  const r = size * 0.44, c = size / 2;
  const id = 'mg' + Math.random().toString(36).slice(2, 7);
  return `<svg class="${cls}" viewBox="0 0 ${size} ${size}"><defs><radialGradient id="${id}" cx="40%" cy="35%"><stop offset="0" stop-color="#fff8e1"/><stop offset="1" stop-color="#e9d39a"/></radialGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#1c2747"/><path d="${moonPath(c, c, r, phase)}" fill="url(#${id})"/></svg>`;
}

// ---------- The sky ----------
const PALETTE = {
  night: ['#040918', '#0a1633', '#14254d'],
  dawn1: ['#0b1235', '#2a2560', '#6a4a8a'],
  dawn2: ['#1d2a63', '#6a5aa0', '#f3a37a'],
  morning: ['#3d6fc2', '#8fb8e6', '#ffd6a6'],
  day: ['#2f7fd6', '#6fb0ec', '#bfe3ff'],
  noon: ['#2a7ee0', '#5aa9f0', '#a8dcff'],
  afternoon: ['#3a78c8', '#7fb0e0', '#f4dcae'],
  golden: ['#3c5aa8', '#c98a7a', '#ffbf74'],
  sunset: ['#2b2f6e', '#b0567a', '#ff8a5c'],
  dusk: ['#121c4a', '#3b2f6b', '#a0507a'],
  night2: ['#060c22', '#101c42', '#1d2a5a'],
};
const STARS_ALPHA = { night: 1, dawn1: .65, dawn2: .12, morning: 0, day: 0, noon: 0, afternoon: 0, golden: 0, sunset: .05, dusk: .55, night2: .95 };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, f) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`; };

function seeded(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

class Sky {
  constructor(canvas, opts = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    const rnd = seeded(42);
    this.stars = Array.from({ length: 170 }, () => ({ x: rnd(), y: rnd() * 0.75, r: rnd() * 1.3 + 0.3, p: rnd() * 6.28, s: 0.5 + rnd() * 1.5 }));
    this.clouds = Array.from({ length: 6 }, (_, i) => ({ x: rnd(), y: 0.12 + rnd() * 0.35, w: 0.12 + rnd() * 0.16, s: 0.004 + rnd() * 0.006, o: 0.35 + rnd() * 0.3, i }));
    this.shoot = null;
    this.last = 0;
    this.running = false;
  }
  setDay(d) { this.d = d; }
  start() { if (this.running) return; this.running = true; const loop = (ts) => { if (!this.running) return; if (ts - this.last > 33 && !document.hidden) { this.last = ts; this.draw(ts / 1000); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  stop() { this.running = false; }

  keyframes() {
    const d = this.d, T = d.today.times, Tm = d.tomorrow.times, m = 60000;
    const dayStart = Date.UTC(...d.today.date.split('-').map((v, i) => (i === 1 ? v - 1 : +v))) - d.today.tz_offset * m;
    return [
      [dayStart - 86400000, 'night'], [T.fajr - 25 * m, 'night'], [T.fajr, 'dawn1'], [T.sunrise - 12 * m, 'dawn2'], [T.sunrise + 25 * m, 'morning'],
      [T.sunrise + 100 * m, 'day'], [T.dhuhr, 'noon'], [T.asr + 20 * m, 'afternoon'], [T.maghrib - 40 * m, 'golden'], [T.maghrib, 'sunset'],
      [T.maghrib + 25 * m, 'dusk'], [T.isha, 'night2'], [T.isha + 90 * m, 'night'], [Tm.fajr - 25 * m, 'night'], [Tm.fajr, 'dawn1'], [Tm.sunrise, 'dawn2'],
    ];
  }

  colors(now) {
    const k = this.keyframes();
    let i = k.findIndex((e) => e[0] > now);
    if (i <= 0) i = i === 0 ? 1 : k.length - 1;
    const [t0, a] = k[i - 1], [t1, b] = k[i];
    const f = Math.min(1, Math.max(0, (now - t0) / (t1 - t0 || 1)));
    const pa = PALETTE[a], pb = PALETTE[b];
    return { top: mix(pa[0], pb[0], f), mid: mix(pa[1], pb[1], f), bot: mix(pa[2], pb[2], f), stars: STARS_ALPHA[a] + (STARS_ALPHA[b] - STARS_ALPHA[a]) * f };
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.c.clientWidth, h = this.c.clientHeight;
    if (!w || !h) return false;
    if (this.c.width !== Math.round(w * dpr) || this.c.height !== Math.round(h * dpr)) {
      this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
      this.dpr = dpr; this.W = w; this.H = h;
      this.buildSkyline();
    }
    return true;
  }

  /// A mosque skyline: low city blocks, a grand mosque with two minarets
  /// and a smaller one. Built once per size.
  buildSkyline() {
    const W = this.W, H = this.H;
    const base = H;
    const p = new Path2D();
    const windows = [];
    const rnd = seeded(9);
    const sc = Math.max(0.55, Math.min(1.2, H / 380)) * (this.opts.small ? 0.55 : 1);
    // City blocks.
    let x = -10;
    while (x < W + 10) {
      const w = (24 + rnd() * 50) * sc, h = (14 + rnd() * 34) * sc;
      p.rect(x, base - h, w + 1, h);
      if (rnd() > 0.35) for (let wy = base - h + 6 * sc; wy < base - 8 * sc; wy += 11 * sc) for (let wx = x + 5 * sc; wx < x + w - 6 * sc; wx += 10 * sc) if (rnd() > 0.55) windows.push([wx, wy, 3 * sc, 4 * sc]);
      x += w + rnd() * 6;
    }
    const mosque = (cx, s, minarets) => {
      const bw = 120 * s, bh = 46 * s, dr = 44 * s;
      p.rect(cx - bw / 2, base - bh, bw, bh);
      p.moveTo(cx - dr, base - bh); p.ellipse(cx, base - bh, dr, dr * 1.12, 0, Math.PI, 0); p.closePath();
      p.moveTo(cx - 3 * s, base - bh - dr * 1.12 + 2); p.lineTo(cx, base - bh - dr * 1.12 - 16 * s); p.lineTo(cx + 3 * s, base - bh - dr * 1.12 + 2); p.closePath();
      for (const side of [-1, 1]) {
        const sx = cx + side * 52 * s, sd = 18 * s;
        p.moveTo(sx - sd, base - bh); p.ellipse(sx, base - bh, sd, sd, 0, Math.PI, 0); p.closePath();
      }
      for (let i = -1; i <= 1; i++) windows.push([cx + i * 22 * s - 4 * s, base - bh + 10 * s, 8 * s, 18 * s, 'arch']);
      if (minarets) for (const side of [-1, 1]) {
        const mx = cx + side * 92 * s, mw = 11 * s, mh = 150 * s;
        p.rect(mx - mw / 2, base - mh, mw, mh);
        p.rect(mx - mw / 2 - 4 * s, base - mh * 0.72, mw + 8 * s, 5 * s);
        p.rect(mx - mw / 2 - 3 * s, base - mh * 0.92, mw + 6 * s, 4 * s);
        p.moveTo(mx - mw / 2, base - mh); p.lineTo(mx, base - mh - 22 * s); p.lineTo(mx + mw / 2, base - mh); p.closePath();
        windows.push([mx - 2 * s, base - mh * 0.55, 4 * s, 7 * s]);
      }
    };
    mosque(W * (this.opts.small ? 0.82 : 0.74), sc, true);
    if (!this.opts.small) mosque(W * 0.5, sc * 0.6, true);
    this.skyline = p;
    this.windows = windows;
    this.crescents = this.opts.small ? [] : [[W * 0.74, base - 46 * sc - 44 * sc * 1.12 - 22 * sc, 5 * sc]];
  }

  draw(time) {
    if (!this.d || !this.resize()) return;
    const ctx = this.ctx, W = this.W, H = this.H, now = Date.now();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const col = this.colors(now);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, col.top); g.addColorStop(0.55, col.mid); g.addColorStop(1, col.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Stars and the odd shooting star.
    if (col.stars > 0.02) {
      for (const s of this.stars) {
        const tw = 0.55 + 0.45 * Math.sin(time * s.s + s.p);
        ctx.globalAlpha = col.stars * tw * (1 - s.y * 0.6);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!this.opts.small) {
        if (!this.shoot && Math.random() < 0.004 * col.stars) this.shoot = { x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.3, t: 0 };
        if (this.shoot) {
          const s = this.shoot; s.t += 0.035;
          const len = 120, dx = -Math.cos(0.5) * len, dy = Math.sin(0.5) * len;
          const hx = s.x + dx * s.t * 2, hy = s.y + dy * s.t * 2;
          const gr = ctx.createLinearGradient(hx, hy, hx - dx * 0.6, hy - dy * 0.6);
          gr.addColorStop(0, `rgba(255,255,255,${(1 - s.t) * col.stars})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - dx * 0.6, hy - dy * 0.6); ctx.stroke();
          if (s.t >= 1) this.shoot = null;
        }
      }
    }

    const T = this.d.today.times, Tm = this.d.tomorrow.times;
    const horizon = H * 0.86, peak = H * (this.opts.small ? 0.2 : 0.16);
    const arcPos = (f) => [W * 0.06 + f * W * 0.88, horizon - Math.sin(Math.PI * Math.min(1, Math.max(0, f))) * (horizon - peak)];

    // The sun, from sunrise to sunset.
    if (!this.opts.small && now > T.sunrise - 15 * 60000 && now < T.sunset + 15 * 60000) {
      const f = (now - T.sunrise) / (T.sunset - T.sunrise);
      const [sx, sy] = arcPos(f);
      const low = 1 - Math.sin(Math.PI * Math.min(1, Math.max(0, f)));
      const r = (this.opts.small ? 12 : 22) * (1 + low * 0.15);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 6);
      glow.addColorStop(0, `rgba(255,${Math.round(236 - low * 70)},${Math.round(170 - low * 90)},.55)`);
      glow.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, r * 6, 0, 6.283); ctx.fill();
      const core = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 1, sx, sy, r);
      core.addColorStop(0, '#fffbe8'); core.addColorStop(1, low > 0.6 ? '#ffb05a' : '#ffe08a');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.283); ctx.fill();
    }

    // The moon, through the night.
    const nightStart = now < T.sunrise ? T.maghrib - 86400000 : T.maghrib;
    const nightEnd = now < T.sunrise ? T.sunrise : Tm.sunrise;
    if (!this.opts.small && now >= nightStart - 10 * 60000 && now <= nightEnd) {
      const f = (now - nightStart) / (nightEnd - nightStart);
      const [mx, my] = arcPos(f);
      const r = this.opts.small ? 10 : 18;
      const halo = ctx.createRadialGradient(mx, my, 0, mx, my, r * 5);
      halo.addColorStop(0, 'rgba(255,244,214,.22)'); halo.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, r * 5, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(30,40,70,.85)'; ctx.beginPath(); ctx.arc(mx, my, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff3cf';
      ctx.fill(new Path2D(moonPath(mx, my, r, this.d.moon?.phase ?? 0.5)));
    }

    // Clouds drift through the day.
    const dayness = Math.max(0, 1 - col.stars * 1.6);
    if (dayness > 0.05 && !this.opts.small) {
      for (const c of this.clouds) {
        c.x += c.s / 60; if (c.x > 1.2) c.x = -0.25;
        const cx = c.x * W, cy = c.y * H, w = c.w * W;
        ctx.globalAlpha = c.o * dayness;
        for (let i = 0; i < 4; i++) {
          const bx = cx + (i - 1.5) * w * 0.28, by = cy + Math.sin(i * 1.7 + c.i) * 6, br = w * (0.22 + (i % 2) * 0.08);
          const cg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          cg.addColorStop(0, 'rgba(255,255,255,.75)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.283); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Skyline, with warm windows lit after dark.
    const dark = Math.min(1, col.stars * 1.3);
    ctx.fillStyle = mix('#0b1430', '#03060f', dark);
    ctx.fill(this.skyline);
    if (dark > 0.05) {
      ctx.fillStyle = `rgba(255,200,110,${0.85 * dark})`;
      for (const [x, y, w, h, kind] of this.windows) {
        if (kind === 'arch') { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.fill(); }
        else ctx.fillRect(x, y, w, h);
      }
    }
    for (const [x, y, r] of this.crescents) {
      ctx.fillStyle = mix('#c99a4a', '#ffd88a', dark);
      ctx.fill(new Path2D(moonPath(x, y, r, 0.86)));
    }
  }
}

// ---------- Themes ----------
// [name, page, panel, accent] — the colours the picker's swatches show.
const THEMES = [
  ['auto', '', '', ''], ['night', '#060c1b', '#13224a', '#f3c66b'], ['day', '#f6f2ea', '#ffffff', '#d9a443'], ['sepia', '#f2e7cf', '#fffaf0', '#c48b30'],
  ['madinah', '#062419', '#13583c', '#47c486'], ['rawdah', '#eef4ec', '#ffffff', '#3fb97a'],
  ['emerald', '#03140f', '#0f3a2d', '#f3c66b'], ['ocean', '#03131b', '#0f3d52', '#f3c66b'], ['royal', '#0b0720', '#2a1c5c', '#f3c66b'], ['black', '#000000', '#1a1a1a', '#f3c66b'],
];
const LIGHT_THEMES = new Set(['day', 'sepia', 'rawdah']);
const lightMedia = matchMedia('(prefers-color-scheme: light)');
const themePref = () => { try { return localStorage.getItem('waqt-theme') || 'auto'; } catch { return 'auto'; } };

/// Paints the page in a theme; "auto" follows the device's light or dark setting.
function applyTheme() {
  const pref = themePref();
  const name = pref === 'auto' ? (lightMedia.matches ? 'day' : 'night') : pref;
  const root = document.documentElement;
  const light = LIGHT_THEMES.has(name);
  root.dataset.theme = name;
  root.toggleAttribute('data-light', light);
  const bg = THEMES.find((x) => x[0] === name)?.[1] || '#060c1b';
  // The phone's status bar icons and the window behind the page follow along.
  nativeUi('theme', `${light ? 'light' : 'dark'},${bg}`);
  toNative(`theme:${light ? 'light' : 'dark'}`);
}
function setTheme(v) {
  try { localStorage.setItem('waqt-theme', v); } catch { /* private mode */ }
  applyTheme();
}
lightMedia.addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });
applyTheme();

/// The theme picker, for Settings (and the Quran's reading settings).
function themeRow() {
  const pref = themePref();
  const sw = THEMES.map(([k, bg, panel, acc]) => {
    const look = k === 'auto' ? 'background:linear-gradient(135deg,#060c1b 50%,#f6f2ea 50%);--c-panel:rgba(255,255,255,.35);--c-acc:#f3c66b'
      : `background:${bg};--c-panel:${panel};--c-acc:${acc}`;
    return `<button class="theme-sw ${pref === k ? 'on' : ''}" data-act="theme" data-v="${k}"><i style="${look}"></i>${esc(t('th_' + k))}</button>`;
  }).join('');
  return `<div class="srow" style="flex-wrap:wrap"><div class="lab" style="flex-basis:100%"><b>${esc(t('theme'))}</b><small>${esc(t('theme_help'))}</small></div><div class="themes">${sw}</div></div>`;
}

// ---------- Data ----------
async function loadToday() {
  S.day = await api('/api/today');
  return S.day;
}
async function loadSettings() {
  const s = await api('/api/settings');
  S.cfg = s.config;
  S.sounds = s.sounds;
  S.methods = s.methods;
  S.desktop = s.desktop;
  S.android = !!s.android;
  document.documentElement.lang = L();
  return s;
}

async function saveCfg(note = true) {
  try {
    await put('/api/settings', S.cfg);
    VIEWS.calendar.events = null;
    document.documentElement.lang = L();
    if (note) { const el = $('#saved'); if (el) { el.classList.add('show'); clearTimeout(saveCfg.t); saveCfg.t = setTimeout(() => el.classList.remove('show'), 1600); } }
    await loadToday();
    renderChrome();
  } catch (e) { toast(e.message, 5000); }
}

// ---------- Chrome: rail, top bar ----------
const ROUTES = ['today', 'quran', 'hadith', 'azkar', 'salah', 'ramadan', 'zakat', 'timetable', 'calendar', 'qibla', 'tracker', 'tasbih', 'duas', 'health', 'settings', 'wake'];
const ROUTE_ICON = { today: 'today', timetable: 'table', calendar: 'calendar', qibla: 'qibla', tracker: 'tracker', tasbih: 'tasbih', duas: 'dua', quran: 'book', hadith: 'scroll', azkar: 'beads', salah: 'pray', ramadan: 'crescent', zakat: 'coin', health: 'shield', settings: 'settings' };
/// The pages listed in navigation: the Adhan check and the Quran are
/// phone-only; the Fajr wake-up page is reached from its alarm only.
const navRoutes = () => ROUTES.filter((k) => k !== 'wake' && (!['health', 'quran', 'hadith', 'salah', 'azkar', 'ramadan', 'zakat'].includes(k) || S.android));
const tabs = () => (S.android ? ['today', 'quran', 'hadith', 'qibla'] : ['today', 'calendar', 'qibla', 'tasbih']);
const route = () => { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; return ROUTES.includes(r) ? r : 'today'; };

function renderChrome() {
  const r = route();
  const badge = (k) => (k === 'health' && S.day?.health_failing ? `<span class="badge">${N(S.day.health_failing)}</span>` : '');
  $('#nav').innerHTML = navRoutes().map((k) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${icon(ROUTE_ICON[k])}<span>${t(k)}</span>${badge(k)}</a>`).join('');
  const more = !tabs().includes(r);
  $('#tabbar').innerHTML = tabs().map((k) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${icon(ROUTE_ICON[k])}<span>${t(k === 'calendar' ? 'hijri' : k)}</span></a>`).join('') +
    `<a data-act="more" class="${more ? 'on' : ''}">${icon('menu')}<span>${t('more')}</span>${S.day?.health_failing && S.android ? '<i class="dotb"></i>' : ''}</a>`;
  const muted = S.live?.muted;
  const loc = S.cfg?.location;
  $('#top').innerHTML = `
    <div class="where" data-act="goto-loc" title="${esc(t('s_location'))}">${icon('pin')}<span>${esc(loc?.name || '')}${loc?.country ? ', ' + esc(loc.country) : ''}</span></div>
    <div class="spacer"></div>
    <div class="seg" role="tablist"><button class="${L() === 'en' ? 'on' : ''}" data-lang="en">English</button><button class="${L() === 'bn' ? 'on' : ''}" data-lang="bn">বাংলা</button></div>
    <button class="icon-btn ${muted ? 'on' : ''}" data-act="mute" title="${esc(muted ? t('unmute') : t('mute_tip'))}">${icon(muted ? 'mute' : 'speaker')}</button>
    ${S.desktop ? `<button class="icon-btn" data-act="mini" title="${esc(t('mini_tip'))}">${icon('mini')}</button>` : ''}`;
  renderRailNext();
}

function renderRailNext() {
  const d = S.day; if (!d) return;
  const n = d.next, fri = n.key === 'dhuhr' && isFridayAt(n.at);
  const left = n.at - Date.now();
  const [h, m, s] = hms(left);
  $('#rail-foot').innerHTML = `<div class="next-mini"><div class="l">${esc(t('next_prayer'))}</div><div class="n">${esc(pname(n.key, fri))} <span class="ar gold">${parab(n.key, fri)}</span></div>
    <div class="c">${N(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)}</div></div>`;
}

function isFridayAt(ms) {
  const d = S.day; if (!d) return false;
  const local = new Date(ms + d.today.tz_offset * 60000);
  return local.getUTCDay() === 5;
}

// ---------- Router ----------
let sky = null;
let renderToken = 0;
const live = (tok) => tok === renderToken;

async function render() {
  const tok = ++renderToken;
  if (sky) { sky.stop(); sky = null; }
  nativeUi('compass', 0); nativeUi('volumeTasbih', 0); nativeUi('keepScreenOn', 0);
  closeSheet();
  renderChrome();
  $('#scroll').scrollTop = 0;
  view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
  try { await VIEWS[route()](tok); } catch (e) { if (live(tok)) view.innerHTML = `<div class="card" style="margin-top:20px">${esc(e.message)}</div>`; }
}

const VIEWS = {};

// ---------- Today ----------
function timeHTML(ms, off) {
  const p = fmtTime(ms, off, { split: true });
  if (!Array.isArray(p)) return p;
  return L() === 'bn' ? `${p[0]}<small>${p[1]}</small>` : `${p[0]}<small>${p[1]}</small>`;
}

VIEWS.today = async (tok) => {
  const d = await loadToday();
  if (!live(tok)) return;
  const T0 = d.today.times, off = d.today.tz_offset, fri = d.today.friday;
  const now = Date.now();
  const cards = SIX.map((k) => {
    const at = T0[k];
    const isCur = d.current && d.current.key === k && d.current.at === at;
    const isNext = d.next.key === k && d.next.at === at;
    const past = at < now && !isCur;
    const idx = PRAYERS.indexOf(k);
    const mode = idx >= 0 ? S.cfg.adhan[k].mode : null;
    const st = idx >= 0 ? d.tracker[idx] : 0;
    const mIcon = { adhan: 'mosque', chime: 'bell', notify: 'bubble', off: 'off' }[mode];
    return `<div class="pcard ${k === 'sunrise' ? 'sunrise' : ''} ${isCur ? 'current' : ''} ${past ? 'past' : ''}" data-p="${k}">
      ${isCur ? `<span class="tag now">${esc(t('now'))}</span>` : isNext ? `<span class="tag next">${esc(t('next'))}</span>` : ''}
      <div class="ico">${icon(k)}</div>
      <div class="nm"><b>${esc(pname(k, fri))}</b><span class="ar">${parab(k, fri)}</span></div>
      <div class="tm">${timeHTML(at, off)}</div>
      ${d.jamaat?.[k] ? `<div class="jm">${icon('walk')}${esc(t('jamaat'))} ${fmtTime(d.jamaat[k], off)}</div>` : ''}
      <div class="row">${idx >= 0 ? `<button class="mode m-${mode}" data-act="mode" data-p="${k}" title="${esc(t('mode_' + mode))}">${icon(mIcon)}</button>
        <button class="check s${st}" data-act="track" data-i="${idx}" data-date="${d.today.date}" title="${esc(t('st' + st))}">${icon(st === 4 ? 'x' : 'check')}</button>` : `<span class="faint" style="font-size:12.5px">${esc(t('ishraq'))} ${fmtTime(T0.ishraq, off)}</span>`}</div>
    </div>`;
  }).join('');

  view.innerHTML = `
    <section class="hero" id="hero">
      <canvas id="sky"></canvas>
      <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#f3a63b"/></linearGradient></defs></svg>
      <div class="hero-content">
        <div class="left">
          <div class="dates"><span class="greg">${esc(fmtGDate(d.today.date))}</span>
            <span class="hij">${esc(hijriText(d.hijri_now))} <span class="ar">${d.hijri_now.month_ar}</span></span>
            ${d.bangla ? `<span class="greg bdate">${esc(banglaText(d.bangla))}</span>` : ''}</div>
          <div class="label">${esc(t('next_prayer'))}</div>
          <div class="pname" id="h-name"></div>
          <div class="countdown" id="h-count"></div>
          <div class="at" id="h-at"></div>
        </div>
        <div class="right">
          <div class="ring" id="h-ring"><svg viewBox="0 0 168 168"><circle class="track" cx="84" cy="84" r="74" fill="none" stroke-width="8"/><circle class="bar" id="ring-bar" cx="84" cy="84" r="74" fill="none" stroke-width="8" stroke-dasharray="465" stroke-dashoffset="465"/></svg><div class="inner" id="ring-inner"></div></div>
          <div class="chips" id="h-chips"></div>
        </div>
      </div>
    </section>
    <div id="banners"></div>
    <div class="prayers stagger">${cards}</div>
    <div class="card timeline" id="timeline"></div>
    <div class="widgets stagger" id="widgets"></div>`;

  sky = new Sky($('#sky'));
  sky.setDay(d);
  sky.start();
  renderTimeline();
  renderWidgets(tok);
  renderBanners(tok);
  tickToday(true);
};

/// Updates the hero (countdown, ring), the timeline marker and the rail,
/// once a second.
function tickToday(first = false) {
  const d = S.day; if (!d || route() !== 'today' || !$('#h-count')) return;
  const now = Date.now(), off = d.today.tz_offset;
  const n = d.next, fri = n.key === 'dhuhr' && isFridayAt(n.at);
  if (first || $('#h-name').dataset.k !== n.key + n.at) {
    $('#h-name').dataset.k = n.key + n.at;
    $('#h-name').innerHTML = `<b>${esc(pname(n.key, fri))}</b><span class="ar">${parab(n.key, fri)}</span>`;
    $('#h-at').textContent = `${t('at')} ${fmtTime(n.at, off)}`.trim();
  }
  const [h, m, s] = hms(n.at - now);
  const str = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const el = $('#h-count');
  if (el.dataset.v !== str) {
    const prev = el.dataset.v || '';
    el.dataset.v = str;
    el.innerHTML = [...str].map((c, i) => c === ':' ? '<span class="sep">:</span>' : `<span class="digit ${prev[i] !== c && !first ? 'tick' : ''}"><span>${N(c)}</span></span>`).join('');
  }
  // The ring shows how much of the current prayer's time has passed.
  const T0 = d.today.times;
  let start, end, label, arab;
  if (d.current) { start = d.current.at; end = n.at; label = pname(d.current.key, d.current.key === 'dhuhr' && isFridayAt(d.current.at)); arab = parab(d.current.key, d.current.key === 'dhuhr' && isFridayAt(d.current.at)); }
  else { start = T0.sunrise; end = T0.dhuhr; label = t('duha_time'); arab = PN.duha.ar; }
  const frac = Math.min(1, Math.max(0, (now - start) / (end - start)));
  $('#ring-bar').style.strokeDashoffset = String(465 * (1 - frac));
  const left = fmtDur(end - now);
  $('#ring-inner').innerHTML = `<div><small>${esc(t('now'))}</small><div class="ar">${arab}</div><b>${esc(label)}</b><small>${esc(left)} ${esc(t('time_left'))}</small></div>`;
  // Chips: Ramadan, events today, silenced.
  const chips = [];
  if (S.live?.muted) chips.push(`<span class="hchip alert">${icon('mute')}${esc(t('muted'))}</span>`);
  if (d.ramadan.active) chips.push(`<span class="hchip">${icon('moon')}${esc(t('ramadan_day'))} ${N(d.ramadan.day)}</span>`);
  for (const e of d.today.events) chips.push(`<span class="hchip">${icon('star')}${esc(L() === 'bn' ? e.event?.bn || e.bn : e.en)}</span>`);
  if (d.today.friday) chips.push(`<span class="hchip">${icon('mosque')}${esc(PN.jumuah[L()])}</span>`);
  const ch = chips.join('');
  if ($('#h-chips').dataset.v !== ch) { $('#h-chips').dataset.v = ch; $('#h-chips').innerHTML = ch; }
  const mk = $('#tl-now');
  if (mk) mk.style.left = `${Math.min(100, Math.max(0, ((now - S.tlStart) / 86400000) * 100))}%`;
}

function renderTimeline() {
  const d = S.day, T0 = d.today.times, off = d.today.tz_offset, m = 60000;
  const [y, mo, da] = d.today.date.split('-').map(Number);
  const start = Date.UTC(y, mo - 1, da) - off * m, end = start + 86400000;
  S.tlStart = start;
  const tah = T0.fajr - (T0.fajr - (T0.maghrib - 86400000)) / 3;
  const segs = [
    [start, tah, '#1a2550', 'night'], [tah, T0.fajr, '#4b3fa0', 'tahajjud_seg'], [T0.fajr, T0.sunrise, '#6b5bc8', 'fajr_seg'],
    [T0.sunrise, T0.ishraq, null, 'forbidden'], [T0.ishraq, T0.zawal, '#d9b45e', 'duha_seg'], [T0.zawal, T0.dhuhr, null, 'forbidden'],
    [T0.dhuhr, T0.asr, '#4aa3df', 'dhuhr_seg'], [T0.asr, T0.sunset - 15 * m, '#e7a35a', 'asr_seg'], [T0.sunset - 15 * m, T0.maghrib, null, 'forbidden'],
    [T0.maghrib, T0.isha, '#d46b7b', 'maghrib_seg'], [T0.isha, Math.min(end, T0.last_third), '#3a4a8a', 'isha_seg'],
  ];
  if (T0.last_third < end) segs.push([T0.last_third, end, '#4b3fa0', 'tahajjud_seg']);
  const pct = (a, b) => `${Math.max(0, ((Math.min(b, end) - Math.max(a, start)) / 86400000) * 100)}%`;
  const bar = segs.map(([a, b, c, k]) => `<i class="${c ? '' : 'forbid'}" style="width:${pct(a, b)};background:${c || ''}" title="${esc(t(k))} · ${fmtTime(a, off)} – ${fmtTime(b, off)}"></i>`).join('');
  const lbl = SIX.map((k) => { const at = T0[k]; const x = ((at - start) / 86400000) * 100; return `<span style="left:${x}%"><b>${esc(pname(k, d.today.friday))}</b>${fmtTime(at, off)}</span>`; }).join('');
  const legend = [['#1a2550', 'night'], ['#6b5bc8', 'fajr_seg'], ['#d9b45e', 'duha_seg'], ['#4aa3df', 'dhuhr_seg'], ['#e7a35a', 'asr_seg'], ['#d46b7b', 'maghrib_seg'], ['#3a4a8a', 'isha_seg'], ['#4b3fa0', 'tahajjud_seg']]
    .map(([c, k]) => `<span><i style="background:${c}"></i>${esc(t(k))}</span>`).join('') + `<span><i class="forbid" style="background:repeating-linear-gradient(-45deg,#ff7d8e 0 3px,#ff7d8e55 3px 6px)"></i>${esc(t('forbidden'))}</span>`;
  $('#timeline').innerHTML = `<div class="tl-wrap"><div class="tl-bar">${bar}</div><div class="tl-now" id="tl-now"></div></div><div class="tl-labels">${lbl}</div><div class="tl-legend">${legend}</div>`;
}

async function renderWidgets(tok) {
  const d = S.day, off = d.today.tz_offset, T0 = d.today.times;
  const moon = d.moon;
  const moonNames = { new_moon: ['New moon', 'অমাবস্যা'], waxing_crescent: ['Waxing crescent', 'বর্ধমান চাঁদ'], first_quarter: ['First quarter', 'প্রথম চতুর্থাংশ'], waxing_gibbous: ['Waxing gibbous', 'বর্ধমান কুঁজো চাঁদ'], full_moon: ['Full moon', 'পূর্ণিমা'], waning_gibbous: ['Waning gibbous', 'ক্ষয়িষ্ণু কুঁজো চাঁদ'], last_quarter: ['Last quarter', 'শেষ চতুর্থাংশ'], waning_crescent: ['Waning crescent', 'ক্ষয়িষ্ণু চাঁদ'] };
  const mn = moonNames[moon.name] || ['', ''];
  const ev = d.upcoming.slice(0, 5).map((u) => `<div class="li"><span class="dot k-${u.event.kind}"></span><div class="t"><b>${esc(L() === 'bn' ? u.event.bn : u.event.en)}</b><small>${esc(fmtGDate(u.date, false))} · ${esc(hijriText(u.hijri, false))}</small></div><span class="daysleft">${N(u.days_left)} ${esc(t('days'))}</span></div>`).join('');
  const ram = d.ramadan.active
    ? `<div class="card ramadan-card"><h3>${icon('moon')}${esc(t('ramadan'))} · ${esc(t('ramadan_day'))} ${N(d.ramadan.day)}</h3>
        <div class="twin"><div><small>${esc(t('sehri'))}</small><b>${fmtTime(d.ramadan.sehri, off)}</b><i id="r-sehri"></i></div><div><small>${esc(t('iftar'))}</small><b>${fmtTime(d.ramadan.iftar, off)}</b><i id="r-iftar"></i></div></div>
        <div class="list" style="margin-top:12px">${ev}</div></div>`
    : `<div class="card"><h3>${icon('star')}${esc(t('events'))}</h3>
        <div class="li" style="background:rgba(243,198,107,.08);margin-bottom:6px"><span class="dot k-season"></span><div class="t"><b>${esc(t('ramadan_in'))} ${N(d.ramadan.days_left)} ${esc(t('days'))}</b><small>${esc(fmtGDate(d.ramadan.starts, false))}</small></div></div>
        <div class="list">${ev}</div></div>`;
  const extras = [
    ['sehri_ends', T0.imsak], ['sunrise', T0.sunrise], ['ishraq', T0.ishraq], ['zawal', T0.zawal], ['sunset', T0.sunset], ['midnight', T0.midnight], ['tahajjud', T0.last_third],
  ].map(([k, v]) => `<div class="li"><div class="t"><b>${esc(k === 'sunrise' ? pname('sunrise') : t(k))}</b></div><span class="v">${fmtTime(v, off)}</span></div>`).join('');
  const tr = d.tracker;
  const prayed = tr.filter((s) => s >= 1 && s <= 3).length;
  const q = d.qibla;
  const qSvg = `<svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="50" fill="rgba(0,0,0,.2)" stroke="rgba(255,255,255,.12)"/>
    <text x="55" y="16" text-anchor="middle" fill="#f3c66b" font-size="11" font-weight="700">N</text>
    <g style="transform-origin:55px 55px;transform:rotate(${q.bearing}deg);transition:transform 2s"><path d="M55 14 61 55 55 50 49 55Z" fill="#f3c66b"/><circle cx="55" cy="14" r="4" fill="#ffe2a0"/></g><circle cx="55" cy="55" r="4" fill="#fff"/></svg>`;

  $('#widgets').innerHTML = `
    <div class="card ayah wide" id="ayah-card"><h3>${icon('sparkle')}${esc(t('ayah'))}</h3><div class="muted">${esc(t('loading'))}</div></div>
    <div class="card"><h3>${icon('moon')}${esc(t('moon'))}</h3><div class="moon-card">${moonSvg(moon.phase)}
      <div><div class="ar">${d.hijri_now.month_ar}</div><div class="big">${N(d.hijri_now.d)}</div><div>${esc(L() === 'bn' ? d.hijri_now.month_bn : d.hijri_now.month_en)} ${N(d.hijri_now.y)}</div>
      <div class="muted" style="font-size:13px;margin-top:6px">${esc(mn[L() === 'bn' ? 1 : 0])} · ${N(Math.round(moon.illumination * 100))}% ${esc(t('illum'))}</div></div></div></div>
    ${ram}
    <div class="card extras"><h3>${icon('today')}${esc(t('special'))}</h3><div class="list">${extras}</div></div>
    <div class="card"><h3>${icon('tracker')}${esc(t('progress'))}</h3>
      <div class="dots5">${tr.map((s) => `<span class="s${s}"></span>`).join('')}</div>
      <div style="font-size:15px"><b style="font-size:26px">${N(prayed)}</b> ${esc(t('of5'))}</div>
      <div class="muted" id="streak-line" style="margin-top:4px"></div>
      <div class="qmini" style="margin-top:16px;cursor:pointer" data-go="qibla">${qSvg}<div><div class="faint" style="font-size:12px;text-transform:uppercase;letter-spacing:1px">${esc(t('qibla_short'))}</div><div class="deg">${N(Math.round(q.bearing))}°</div><div class="muted" style="font-size:13px">${N(Math.round(q.distance).toLocaleString('en-US'))} km ${esc(t('distance'))}</div></div></div>
    </div>`;

  api('/api/tracker?days=30').then((r) => {
    if (!live(tok) || !$('#streak-line')) return;
    $('#streak-line').innerHTML = r.stats.streak ? `<span class="flame">🔥</span> ${N(r.stats.streak)} ${esc(t('streak'))}` : '';
  }).catch(() => {});
  api('/api/ayah').then((a) => {
    if (!live(tok) || !$('#ayah-card')) return;
    const tr = L() === 'bn' ? a.bangla : a.english;
    $('#ayah-card').innerHTML = `<h3>${icon('sparkle')}${esc(t('ayah'))}</h3><div class="arabic">${esc(a.arabic)}</div><div class="trans">${esc(tr)}</div>
      <div class="ref"><span>${esc(a.surah_en)} ${N(a.surah)}:${N(a.ayah)}</span><span class="ar">${esc(a.surah_ar)}</span></div>`;
  }).catch(() => { if ($('#ayah-card')) $('#ayah-card').innerHTML = `<h3>${icon('sparkle')}${esc(t('ayah'))}</h3><p class="muted">${esc(t('offline_ayah'))}</p>`; });
}

// ---------- Timetable ----------
VIEWS.timetable = async (tok) => {
  const st = VIEWS.timetable.st || (VIEWS.timetable.st = {});
  const q = st.y ? `?y=${st.y}&m=${st.m}` : '';
  const d = await api(`/api/month${q}`);
  if (!live(tok)) return;
  st.y = d.y; st.m = d.m;
  const hasRamadan = d.days.some((x) => x.hijri.m === 9);
  const rows = d.days.map((x) => {
    const T0 = x.times, off = x.tz_offset;
    const evs = x.events.map((e) => `<span class="ev k-${e.kind}" title="${esc(L() === 'bn' ? e.bn : e.en)}"></span>`).join('');
    return `<tr class="${x.date === d.today ? 'today' : ''} ${x.friday ? 'fri' : ''}">
      <td><b>${N(x.date.slice(8))}</b> <span class="h">${esc(WD_SHORT[L()][x.weekday])}</span>${evs}</td>
      <td class="h">${esc(hijriText(x.hijri, false))}</td>
      <td ${x.hijri.m === 9 ? 'class="hl"' : ''}>${fmtTime(T0.imsak, off)}</td>
      <td>${fmtTime(T0.fajr, off)}</td><td class="h">${fmtTime(T0.sunrise, off)}</td><td>${fmtTime(T0.dhuhr, off)}</td>
      <td>${fmtTime(T0.asr, off)}</td><td ${x.hijri.m === 9 ? 'class="hl"' : ''}>${fmtTime(T0.maghrib, off)}</td><td>${fmtTime(T0.isha, off)}</td></tr>`;
  }).join('');
  const th = (k, label) => `<th>${esc(label)}${k ? `<span class="ar">${PN[k].ar}</span>` : ''}</th>`;
  view.innerHTML = `<h1>${esc(t('timetable'))}</h1><p class="sub">${esc(S.cfg.location.name)} · ${esc(S.day?.method || '')} · ${esc(S.cfg.calc.asr === 'hanafi' ? t('hanafi') : t('standard'))}</p>
    <div class="toolbar">
      <button class="icon-btn" data-act="tt-prev">${icon('chevL')}</button>
      <div class="title">${esc(MONTHS[L()][d.m - 1])} ${N(d.y)}</div>
      <button class="icon-btn" data-act="tt-next">${icon('chevR')}</button>
      <button class="btn small ghost" data-act="tt-now">${esc(t('this_month'))}</button>
      <div style="flex:1"></div>
      ${hasRamadan ? `<span class="hchip" style="text-shadow:none">${icon('moon')}${esc(t('ramadan'))}</span>` : `<button class="btn small" data-act="tt-ramadan">${icon('moon')}${esc(t('ramadan_tt'))}</button>`}
      <button class="btn small" data-act="export">${icon('download')}${esc(t('export'))}</button>
      ${S.android ? '' : `<button class="btn small" data-act="print">${icon('print')}${esc(t('print'))}</button>`}
    </div>
    <div class="table-wrap"><table class="tt"><thead><tr><th>${esc(t('date'))}</th><th>${esc(t('hijri'))}</th><th>${esc(t('sehri_ends'))}</th>${th('fajr', pname('fajr'))}${th('sunrise', pname('sunrise'))}${th('dhuhr', pname('dhuhr'))}${th('asr', pname('asr'))}${th('maghrib', pname('maghrib'))}${th('isha', pname('isha'))}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const today = $('tr.today');
  if (today) setTimeout(() => today.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
};

// ---------- Hijri calendar ----------
VIEWS.calendar = async (tok) => {
  const st = VIEWS.calendar.st || (VIEWS.calendar.st = {});
  const q = st.y ? `?y=${st.y}&m=${st.m}` : '';
  const [c, ev] = await Promise.all([api(`/api/hmonth${q}`), VIEWS.calendar.events || api('/api/events')]);
  if (!live(tok)) return;
  VIEWS.calendar.events = ev;
  st.y = c.y; st.m = c.m;
  const blanks = Array.from({ length: c.first_weekday }, () => '<div class="cday empty"></div>').join('');
  const cells = c.days.map((x, i) => {
    const white = x.fasts.includes('white_days');
    const evs = x.events.slice(0, 2).map((e) => `<span class="k-${e.kind}">${esc(L() === 'bn' ? e.bn : e.en)}</span>`).join('');
    const [gy, gm, gd] = x.date.split('-').map(Number);
    return `<div class="cday ${x.today ? 'today' : ''} ${white ? 'white' : ''} ${x.weekday === 5 ? 'fri' : ''} ${st.sel === i ? 'sel' : ''}" data-act="cal-day" data-i="${i}">
      ${moonSvg(x.moon.phase, 'moon', 20)}<div class="hd">${N(x.d)}</div><div class="gd">${N(gd)} ${esc(MONTHS[L()][gm - 1].slice(0, L() === 'bn' ? 8 : 3))}</div><div class="evs">${evs}</div></div>`;
  }).join('');
  const wds = WD_SHORT[L()].map((w, i) => `<div class="wd ${i === 5 ? 'fri' : ''}">${esc(w)}</div>`).join('');
  const last = c.days[c.days.length - 1].date;
  const span = `${fmtGDate(c.first, false)} – ${fmtGDate(last, false)}`;
  const list = ev.events.slice(0, 18).map((u) => `<div class="li"><span class="dot k-${u.event.kind}"></span><div class="t"><b>${esc(L() === 'bn' ? u.event.bn : u.event.en)}</b><small>${esc(WD_SHORT[L()][u.weekday])}, ${esc(fmtGDate(u.date, false))} · ${esc(hijriText(u.hijri))}</small></div><span class="daysleft">${u.days_left === 0 ? esc(t('today_l')) : u.days_left === 1 ? esc(t('tomorrow')) : `${N(u.days_left)} ${esc(t('days'))}`}</span></div>`).join('');
  view.innerHTML = `<h1>${esc(t('calendar'))}</h1><p class="sub">${esc(t('calc_note'))}</p>
    <div class="cal-layout"><div>
      <div class="cal-head"><button class="icon-btn" data-act="cal-prev">${icon('chevL')}</button>
        <div class="mname"><span class="ar">${c.names.month_ar}</span><b>${esc(L() === 'bn' ? c.names.month_bn : c.names.month_en)} ${N(c.y)}</b><small>${esc(span)}</small></div>
        <button class="icon-btn" data-act="cal-next">${icon('chevR')}</button></div>
      <div class="cal-grid ${st.dir ? 'slide-' + st.dir : ''}">${wds}${blanks}${cells}</div>
      <div class="card detail" id="cal-detail" style="margin-top:16px"></div>
    </div>
    <div class="card"><h3>${icon('star')}${esc(t('upcoming_year'))}</h3><div class="list">${list}</div></div></div>`;
  VIEWS.calendar.data = c;
  showCalDay(st.sel ?? c.days.findIndex((x) => x.today));
};

function showCalDay(i) {
  const c = VIEWS.calendar.data, el = $('#cal-detail');
  if (!c || !el) return;
  const x = c.days[i] || c.days[0];
  if (i < 0) { el.hidden = true; return; }
  el.hidden = false;
  const fasts = x.fasts.map((f) => `<div class="ev-card k-fast"><b>${esc(t(f))}</b></div>`).join('');
  const evs = x.events.map((e) => `<div class="ev-card k-${e.kind}"><span class="ar">${e.ar}</span><b>${esc(L() === 'bn' ? e.bn : e.en)}</b><p>${esc(L() === 'bn' ? e.note_bn : e.note_en)}</p></div>`).join('');
  const fri = x.weekday === 5 ? `<div class="ev-card k-eid"><b>${esc(t('friday'))}</b></div>` : '';
  el.innerHTML = `<h2>${N(x.d)} ${esc(L() === 'bn' ? c.names.month_bn : c.names.month_en)} ${N(c.y)} <span class="muted" style="font-size:14px;font-weight:400">· ${esc(fmtGDate(x.date))}</span></h2>
    <div style="display:flex;gap:16px;align-items:center">${moonSvg(x.moon.phase, 'moon', 54)}<span class="muted">${N(Math.round(x.moon.illumination * 100))}% ${esc(t('illum'))}</span></div>${evs}${fri}${fasts}`;
}

// ---------- Qibla ----------
VIEWS.qibla = async (tok) => {
  const q = await api('/api/qibla');
  if (!live(tok)) return;
  const b = q.bearing;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dir = dirs[Math.round(b / 22.5) % 16];
  let ticks = '';
  for (let a = 0; a < 360; a += 5) {
    const long = a % 30 === 0, r1 = long ? 206 : 214;
    const rad = (a - 90) * Math.PI / 180;
    ticks += `<line x1="${250 + Math.cos(rad) * r1}" y1="${250 + Math.sin(rad) * r1}" x2="${250 + Math.cos(rad) * 224}" y2="${250 + Math.sin(rad) * 224}" stroke="rgba(255,255,255,${long ? .55 : .2})" stroke-width="${long ? 2 : 1}"/>`;
    if (long && a % 90 !== 0) ticks += `<text x="${250 + Math.cos(rad) * 190}" y="${250 + Math.sin(rad) * 190 + 4}" text-anchor="middle" fill="rgba(255,255,255,.45)" font-size="12">${N(a)}</text>`;
  }
  const card = ['N', 'E', 'S', 'W'].map((c, i) => { const rad = (i * 90 - 90) * Math.PI / 180; return `<text x="${250 + Math.cos(rad) * 186}" y="${250 + Math.sin(rad) * 186 + 8}" text-anchor="middle" font-size="24" font-weight="700" fill="${c === 'N' ? '#f3c66b' : '#eef2fb'}">${c}</text>`; }).join('');
  const sunUp = q.sun.altitude > 0;
  const off = q.tz_offset;
  const aligns = q.alignments.length
    ? q.alignments.map((a) => `<div class="align-row"><div class="sun ${a.facing ? '' : 'back'}">${a.facing ? '☀' : '↺'}</div><div><b>${fmtTime(a.at, off)}</b><div class="muted">${esc(a.facing ? t('sun_face') : t('sun_back'))}</div></div></div>`).join('')
    : `<p class="muted">${esc(t('no_align'))}</p>`;
  view.innerHTML = `<h1>${esc(t('qibla'))}</h1><p class="sub">${esc(q.location.name)}${q.location.country ? ', ' + esc(q.location.country) : ''}</p>
    <div class="qibla-layout">
      <div class="compass"><svg viewBox="0 0 500 500">
        <defs><radialGradient id="cg" cx="50%" cy="45%"><stop offset="0" stop-color="#16264d"/><stop offset="1" stop-color="#0a1430"/></radialGradient>
          <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#c9953a"/></linearGradient></defs>
        <circle cx="250" cy="250" r="232" fill="url(#cg)" stroke="rgba(243,198,107,.35)" stroke-width="2"/>
        <circle class="glow" cx="250" cy="250" r="232" fill="none" stroke="rgba(243,198,107,.25)" stroke-width="10"/>
        <g id="dial" class="dial">${ticks}${card}
        <circle cx="250" cy="250" r="150" fill="none" stroke="rgba(255,255,255,.06)" stroke-dasharray="3 6"/>
        ${sunUp ? `<g class="sunmark" id="sunmark" style="transform:rotate(0deg)"><circle cx="250" cy="44" r="13" fill="#ffd36b"/><circle cx="250" cy="44" r="22" fill="rgba(255,211,107,.25)"/></g>` : ''}
        <g class="needle" id="needle" style="transform:rotate(0deg)">
          <path d="M250 62 268 250 250 236 232 250Z" fill="url(#ng)" style="filter:drop-shadow(0 0 12px rgba(243,198,107,.6))"/>
          <path d="M250 438 262 250 250 262 238 250Z" fill="rgba(255,255,255,.15)"/>
          <g transform="translate(232 18)"><rect width="36" height="36" rx="5" fill="#111" stroke="#f3c66b" stroke-width="2"/><rect y="10" width="36" height="5" fill="#f3c66b"/></g>
        </g></g>
        ${q.compass ? '<path d="M250 0 262 22 238 22Z" fill="#fff" opacity=".9"/>' : ''}
        <circle cx="250" cy="250" r="16" fill="#0a1430" stroke="#f3c66b" stroke-width="3"/><circle cx="250" cy="250" r="5" fill="#f3c66b"/>
      </svg></div>
      <div>
        ${q.compass ? `<div class="facing" id="facing">${esc(t('loading'))}</div>` : ''}
        <div class="faint" style="text-transform:uppercase;letter-spacing:1.5px;font-size:12px">${esc(t('qibla_title'))}</div>
        <div class="qstat">${N(b.toFixed(1))}°<small>${dir} · ${esc(t('from_north'))}</small></div>
        <div class="muted" style="font-size:17px;margin-top:6px">🕋 ${N(Math.round(q.distance).toLocaleString('en-US'))} km ${esc(t('distance'))}</div>
        <p class="muted" style="margin-top:18px;max-width:520px">${esc(t('qibla_tip'))}</p>
        <div class="card" style="margin-top:18px"><h3>${icon('dhuhr')}${esc(t('sun_guide'))}</h3>${aligns}
          ${sunUp ? `<div class="faint" style="margin-top:12px;font-size:13px">${esc(t('sun_now'))}: ${N(Math.round(q.sun.azimuth))}° · ${N(Math.round(q.sun.altitude))}° ↑</div>` : ''}</div>
      </div>
    </div>`;
  requestAnimationFrame(() => setTimeout(() => {
    const n = $('#needle'); if (n) n.style.transform = `rotate(${b}deg)`;
    const s = $('#sunmark'); if (s) s.style.transform = `rotate(${q.sun.azimuth}deg)`;
  }, 120));
  if (q.compass) { S.qibla = b; nativeUi('compass', 1); }
};

// ---------- Tracker ----------
const ST_COLOR = ['', 'var(--ok)', 'var(--gold)', 'var(--violet)', 'var(--rose)'];
VIEWS.tracker = async (tok) => {
  const r = await api('/api/tracker?days=190');
  if (!live(tok)) return;
  const today = r.today;
  const dayKey = (i) => { const [y, m, d] = today.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d - i)); return dt.toISOString().slice(0, 10); };
  const todayS = r.days[today] || [0, 0, 0, 0, 0];
  const st = r.stats;
  const chips = PRAYERS.map((p, i) => `<div class="tr-p s${todayS[i]}" data-act="track" data-i="${i}" data-date="${today}"><div class="ar">${PN[p].ar}</div><b>${esc(pname(p))}</b><span class="st">${esc(t('st' + todayS[i]))}</span></div>`).join('');
  let week = `<div></div>${PRAYERS.map((p) => `<div class="h">${esc(pname(p))}</div>`).join('')}`;
  for (let i = 6; i >= 0; i--) {
    const k = dayKey(i), s = r.days[k] || [0, 0, 0, 0, 0];
    const [y, m, d] = k.split('-').map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    week += `<div class="d"><b>${esc(WD_SHORT[L()][wd])}</b> ${N(d)}</div>` + s.map((v, j) => `<div class="wcell s${v}" data-act="track" data-i="${j}" data-date="${k}" title="${esc(t('st' + v))}">${v === 4 ? '✕' : v ? '✓' : ''}</div>`).join('');
  }
  // Heatmap: 26 weeks, columns of 7 days ending today.
  const cells = [];
  const [ty, tm, td] = today.split('-').map(Number);
  const todayWd = new Date(Date.UTC(ty, tm - 1, td)).getUTCDay();
  const total = 25 * 7 + todayWd + 1;
  for (let i = total - 1; i >= 0; i--) {
    const k = dayKey(i), s = r.days[k];
    const n = s ? s.filter((v) => v >= 1 && v <= 3).length : 0;
    cells.push(`<i class="${s ? 'l' + n : ''}" title="${esc(fmtGDate(k, false))}: ${N(n)}/5"></i>`);
  }
  const pct = (v) => `${N(Math.round(v * 100))}%`;
  view.innerHTML = `<h1>${esc(t('tracker'))}</h1><p class="sub">${esc(t('tap_mark'))}</p>
    <div class="tr-today stagger">${chips}</div>
    <div class="stats stagger">
      <div class="card stat"><div class="num"><span class="flame">🔥</span> ${N(st.streak)}</div><div class="lbl">${esc(t('streak'))} · ${esc(t('best'))} ${N(st.best_streak)}</div></div>
      <div class="card stat"><div class="num">${pct(st.week)}</div><div class="lbl">${esc(t('on_time_7'))}</div><div class="bar"><i style="width:${st.week * 100}%"></i></div></div>
      <div class="card stat"><div class="num">${pct(st.month)}</div><div class="lbl">${esc(t('on_time_30'))} · ${esc(t('jamaah'))} ${N(st.jamaah_month)}</div><div class="bar"><i style="width:${st.month * 100}%"></i></div></div>
      <div class="card stat"><div class="num">${N(st.qada_left)}</div><div class="lbl">${esc(t('qada_left'))}</div>${st.qada_left ? `<button class="btn small" style="margin-top:10px" data-act="qada">${icon('check')}${esc(t('made_up'))}</button>` : ''}</div>
    </div>
    <div class="widgets" style="grid-template-columns:1.3fr 1fr">
      <div class="card"><h3>${icon('calendar')}${esc(t('week'))}</h3><div class="week">${week}</div></div>
      <div class="card"><h3>${icon('tracker')}${esc(t('per_prayer'))}</h3><div class="perp">${PRAYERS.map((p, i) => `<div><span>${esc(pname(p))}</span><span class="bar"><i style="width:${st.per_prayer[i] * 100}%"></i></span><b>${pct(st.per_prayer[i])}</b></div>`).join('')}</div></div>
      <div class="card wide"><h3>${icon('flame')}${esc(t('history'))}</h3><div class="heat">${cells.join('')}</div></div>
    </div>`;
};

function trackMenu(anchor, date, i) {
  const items = [1, 2, 3, 4, 0].map((s) => ({ label: s ? t('st' + s) : t('clear'), s }));
  openPop(anchor, items.map((it) => `<button data-s="${it.s}"><i style="background:${ST_COLOR[it.s] || 'transparent'};border:1px solid var(--line-2)"></i>${esc(it.label)}</button>`).join(''), async (btn) => {
    try {
      await post('/api/tracker', { date, prayer: i, status: +btn.dataset.s });
      if (route() === 'today') { await loadToday(); render(); } else render();
    } catch (e) { toast(e.message); }
  });
}

// ---------- Tasbih ----------
const DHIKR = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ', tr: 'Subhan Allah', en: 'Glory be to Allah', bn: 'আল্লাহ পবিত্র', n: 33 },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah', bn: 'সমস্ত প্রশংসা আল্লাহর', n: 33 },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu Akbar', en: 'Allah is the Greatest', bn: 'আল্লাহ সর্বশ্রেষ্ঠ', n: 34 },
  { id: 'tahlil', ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ', tr: 'La ilaha illallah', en: 'There is no god but Allah', bn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই', n: 100 },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: "I seek Allah's forgiveness", bn: 'আমি আল্লাহর কাছে ক্ষমা চাই', n: 100 },
  { id: 'subhanallahi_wabihamdihi', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', tr: 'SubhanAllahi wa bihamdihi', en: 'Glory and praise be to Allah', bn: 'আল্লাহ পবিত্র ও সকল প্রশংসা তাঁর', n: 100 },
  { id: 'hawqala', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', tr: 'La hawla wa la quwwata illa billah', en: 'There is no power nor strength except with Allah', bn: 'আল্লাহর সাহায্য ছাড়া কোনো শক্তি ও সামর্থ্য নেই', n: 33 },
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', tr: 'Allahumma salli ala Muhammad', en: 'O Allah, send blessings upon Muhammad', bn: 'হে আল্লাহ, মুহাম্মাদ ﷺ-এর উপর রহমত বর্ষণ করুন', n: 100 },
];
const TB = { i: 0, count: 0, seq: false, pending: {}, history: [] };
let audioCtx = null;
function click(freq = 880, dur = 0.05, vol = 0.08) {
  try {
    audioCtx = audioCtx || new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + dur);
  } catch { /* no audio */ }
}

VIEWS.tasbih = async (tok) => {
  const tot = await api('/api/tasbih');
  if (!live(tok)) return;
  TB.totals = tot.totals; TB.today = tot.today;
  drawTasbih();
  nativeUi('volumeTasbih', 1); nativeUi('keepScreenOn', 1);
};

function drawTasbih() {
  const dz = DHIKR[TB.i];
  const target = dz.n, beads = Math.min(target, 33);
  const lit = target <= 33 ? TB.count : Math.round((TB.count / target) * 33);
  let ring = '';
  for (let i = 0; i < beads; i++) {
    const a = (i / beads) * Math.PI * 2 - Math.PI / 2;
    ring += `<circle class="bead ${i < lit ? 'lit' : ''}" cx="${250 + Math.cos(a) * 214}" cy="${250 + Math.sin(a) * 214}" r="${i < lit ? 12 : 10}" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.18)"/>`;
  }
  view.innerHTML = `<h1>${esc(t('tasbih'))}</h1><p class="sub">${esc(t('tap_count'))}</p>
    <div class="tasbih-layout"><div>
      <div class="chips">${DHIKR.map((d, i) => `<button class="chip ${i === TB.i && !TB.seq ? 'on' : ''}" data-act="dz" data-i="${i}">${esc(d.tr)}</button>`).join('')}
        <button class="chip ${TB.seq ? 'on' : ''}" data-act="dz-seq">${esc(t('after_prayer'))}</button></div>
      <div class="beads" id="beads"><svg viewBox="0 0 500 500"><defs><radialGradient id="beadGold" cx="35%" cy="35%"><stop offset="0" stop-color="#fff3cf"/><stop offset="1" stop-color="#e0a83e"/></radialGradient></defs>
        <circle cx="250" cy="250" r="214" fill="none" stroke="rgba(243,198,107,.18)" stroke-width="1.5"/>${ring}</svg>
        <div class="center"><div><div class="ar">${dz.ar}</div><div class="count" id="tb-count">${N(TB.count)}</div><small>/ ${N(target)}</small></div></div></div>
      <div class="dhikr-meta"><b>${esc(dz.tr)}</b><p>${esc(L() === 'bn' ? dz.bn : dz.en)}</p></div>
      <div class="actions" style="display:flex;gap:10px;justify-content:center;margin-top:14px">
        <button class="btn small" data-act="tb-undo">${icon('undo')}${esc(t('undo'))}</button>
        <button class="btn small" data-act="tb-reset">${icon('reset')}${esc(t('reset'))}</button></div>
    </div>
    <div class="card"><h3>${icon('tasbih')}${esc(t('today_total'))}</h3><div style="font-size:44px;font-weight:650" id="tb-today">${N(TB.today || 0)}</div>
      <h3 style="margin-top:18px">${icon('star')}${esc(t('lifetime'))}</h3><div class="list">${DHIKR.map((d) => `<div class="li"><div class="t"><b>${esc(d.tr)}</b><small class="ar" style="font-size:16px">${d.ar}</small></div><span class="v" id="tb-tot-${d.id}">${N((TB.totals?.[d.id] || 0).toLocaleString('en-US'))}</span></div>`).join('')}</div></div></div>`;
  $('#beads').addEventListener('pointerdown', countTasbih);
}

function countTasbih(e) {
  nativeUi('haptic');
  const dz = DHIKR[TB.i];
  TB.count++;
  TB.history.push(TB.i);
  TB.today = (TB.today || 0) + 1;
  TB.totals[dz.id] = (TB.totals[dz.id] || 0) + 1;
  TB.pending[dz.id] = (TB.pending[dz.id] || 0) + 1;
  clearTimeout(TB.flushT);
  TB.flushT = setTimeout(flushTasbih, 1500);
  const td = $('#tb-today'); if (td) td.textContent = N(TB.today);
  const tt = $(`#tb-tot-${dz.id}`); if (tt) tt.textContent = N(TB.totals[dz.id].toLocaleString('en-US'));
  const box = $('#beads');
  if (box && e) {
    const r = box.getBoundingClientRect();
    const rp = document.createElement('div');
    rp.className = 'ripple';
    const x = (e.clientX ?? r.left + r.width / 2) - r.left, y = (e.clientY ?? r.top + r.height / 2) - r.top;
    rp.style.left = `${x}px`; rp.style.top = `${y}px`; rp.style.transform = 'translate(-50%,-50%)';
    box.appendChild(rp); setTimeout(() => rp.remove(), 800);
  }
  const done = TB.count >= dz.n;
  click(done ? 660 : 1040, done ? 0.4 : 0.05, done ? 0.12 : 0.06);
  if (done) {
    celebrate();
    toast(`${dz.tr} · ${t('done_set')}`);
    if (TB.seq && TB.i < 2) { TB.i++; TB.count = 0; setTimeout(drawTasbih, 500); return; }
    TB.count = 0;
    setTimeout(drawTasbih, 600);
    return;
  }
  const beads = $$('.bead');
  const lit = dz.n <= 33 ? TB.count : Math.round((TB.count / dz.n) * 33);
  beads.forEach((b, i) => { const on = i < lit; if (b.classList.contains('lit') !== on) { b.classList.toggle('lit', on); b.setAttribute('r', on ? 12 : 10); } });
  const c = $('#tb-count');
  if (c) { c.textContent = N(TB.count); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}

function flushTasbih() {
  const p = TB.pending; TB.pending = {};
  for (const [id, n] of Object.entries(p)) post('/api/tasbih', { id, n }).catch(() => {});
}

function celebrate() {
  const box = $('#beads'); if (!box) return;
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = '50%'; s.style.top = '50%';
    box.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 160;
    s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d - 4}px,${Math.sin(a) * d - 4}px) scale(.3)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(() => s.remove(), 1500);
  }
}

// ---------- Duas ----------
const DUAS = [
  { k: 'after_adhan', title: ['Dua after the adhan', 'আজানের পরের দোয়া'], ar: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ', tr: "Allahumma rabba hadhihi-d-da'wati-t-tammah, wa-s-salati-l-qa'imah, ati Muhammadan al-wasilata wa-l-fadilah, wa-b'ath-hu maqaman mahmudan alladhi wa'adtah", en: 'O Allah, Lord of this perfect call and the prayer about to be established, grant Muhammad al-Wasilah and excellence, and raise him to the praised station You have promised him.', bn: 'হে আল্লাহ! এই পরিপূর্ণ আহ্বান ও প্রতিষ্ঠিতব্য সালাতের রব, মুহাম্মাদ ﷺ-কে ওয়াসিলা ও মর্যাদা দান করুন এবং তাঁকে সেই প্রশংসিত স্থানে পৌঁছে দিন, যার প্রতিশ্রুতি আপনি দিয়েছেন।', src: 'Sahih al-Bukhari 614' },
  { k: 'after_salah', title: ['After the obligatory prayer', 'ফরজ নামাজের পর'], ar: 'أَسْتَغْفِرُ اللَّهَ (٣) اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', tr: "Astaghfirullah (3×). Allahumma anta-s-salam wa minka-s-salam, tabarakta ya dha-l-jalali wa-l-ikram", en: 'I seek Allah\'s forgiveness (3×). O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of majesty and honour.', bn: 'আস্তাগফিরুল্লাহ (৩ বার)। হে আল্লাহ, আপনিই শান্তি, আপনার থেকেই শান্তি। আপনি বরকতময়, হে মহিমা ও সম্মানের অধিকারী।', src: 'Sahih Muslim 591' },
  { k: 'iftar', title: ['At iftar', 'ইফতারের সময়'], ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', tr: "Dhahaba-z-zama'u wa-btallati-l-'uruqu wa thabata-l-ajru in sha' Allah", en: 'The thirst has gone, the veins are moistened, and the reward is assured, if Allah wills.', bn: 'পিপাসা দূর হয়েছে, শিরাগুলো সিক্ত হয়েছে এবং আল্লাহ চাহে তো প্রতিদান নিশ্চিত হয়েছে।', src: 'Sunan Abi Dawud 2357' },
  { k: 'qadr', title: ['On Laylat al-Qadr', 'শবে কদরের দোয়া'], ar: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', tr: "Allahumma innaka 'afuwwun tuhibbu-l-'afwa fa'fu 'anni", en: 'O Allah, You are Pardoning and You love to pardon, so pardon me.', bn: 'হে আল্লাহ, আপনি ক্ষমাশীল, ক্ষমা করতে ভালোবাসেন, অতএব আমাকে ক্ষমা করুন।', src: 'Jami at-Tirmidhi 3513' },
  { k: 'enter_mosque', title: ['Entering the mosque', 'মসজিদে প্রবেশের দোয়া'], ar: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', tr: 'Allahumma-ftah li abwaba rahmatik', en: 'O Allah, open for me the doors of Your mercy.', bn: 'হে আল্লাহ, আমার জন্য আপনার রহমতের দরজাগুলো খুলে দিন।', src: 'Sahih Muslim 713' },
  { k: 'leave_mosque', title: ['Leaving the mosque', 'মসজিদ থেকে বের হওয়ার দোয়া'], ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', tr: "Allahumma inni as'aluka min fadlik", en: 'O Allah, I ask You of Your bounty.', bn: 'হে আল্লাহ, আমি আপনার অনুগ্রহ প্রার্থনা করছি।', src: 'Sahih Muslim 713' },
  { k: 'sleep', title: ['Before sleeping', 'ঘুমানোর আগে'], ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Bismika Allahumma amutu wa ahya', en: 'In Your name, O Allah, I die and I live.', bn: 'হে আল্লাহ, আপনার নামেই আমি মৃত্যুবরণ করি এবং জীবিত হই।', src: 'Sahih al-Bukhari 6324' },
  { k: 'wake', title: ['On waking up', 'ঘুম থেকে উঠে'], ar: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', tr: "Alhamdu lillahi-lladhi ahyana ba'da ma amatana wa ilayhi-n-nushur", en: 'All praise is for Allah, who gave us life after He had caused us to die, and to Him is the return.', bn: 'সমস্ত প্রশংসা আল্লাহর, যিনি আমাদের মৃত্যুর পর জীবিত করেছেন এবং তাঁর কাছেই প্রত্যাবর্তন।', src: 'Sahih al-Bukhari 6324' },
];
VIEWS.duas = async () => {
  view.innerHTML = `<h1>${esc(t('duas'))}</h1><p class="sub">${L() === 'bn' ? 'নামাজ ও দৈনন্দিন জীবনের সহিহ দোয়া' : 'Authentic supplications for prayer and daily life'}</p>
    <div class="duas stagger">${DUAS.map((d) => `<div class="card dua"><h3>${icon('dua')}${esc(d.title[L() === 'bn' ? 1 : 0])}</h3><div class="arabic">${d.ar}</div><div class="tr">${esc(d.tr)}</div><div class="mn">${esc(L() === 'bn' ? d.bn : d.en)}</div><div class="src">${esc(d.src)}</div></div>`).join('')}</div>`;
};

// ---------- Settings ----------
VIEWS.settings = async (tok) => {
  await loadSettings();
  if (!live(tok)) return;
  const c = S.cfg;
  const sec = (id, ic, title, body) => `<section class="card sgroup" id="sg-${id}"><h2>${icon(ic)}${esc(title)}</h2>${body}</section>`;
  const tog = (path, on) => `<button class="toggle ${on ? 'on' : ''}" data-act="toggle" data-path="${path}" role="switch" aria-checked="${on}"></button>`;
  const row = (label, help, control) => `<div class="srow"><div class="lab"><b>${esc(label)}</b>${help ? `<small>${esc(help)}</small>` : ''}</div>${control}</div>`;
  const sel = (path, opts, val) => `<select class="input" data-act="select" data-path="${path}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const step = (path, val, unit = '') => `<span class="stepper"><button data-act="step" data-path="${path}" data-d="-1">−</button><span>${N(val > 0 ? '+' + val : val)}${unit}</span><button data-act="step" data-path="${path}" data-d="1">+</button></span>`;
  const soundOpts = S.sounds.map((s) => [s.id, (L() === 'bn' ? s.name_bn : s.name) + (s.available === false ? ` (${t('not_downloaded')} ${(s.size / 1048576).toFixed(1)} MB)` : '')]);
  const modeOpts = [['adhan', t('mode_adhan')], ['chime', t('mode_chime')], ['notify', t('mode_notify')], ['off', t('mode_off')]];
  const remOpts = [[0, t('none')], [5, `5 ${t('min')}`], [10, `10 ${t('min')}`], [15, `15 ${t('min')}`], [20, `20 ${t('min')}`], [30, `30 ${t('min')}`]];
  const loc = c.location;
  const arows = PRAYERS.map((p) => `<div class="arow"><div class="pn"><b>${esc(pname(p))}</b><span class="ar">${PN[p].ar}</span></div>
      ${sel(`adhan.${p}.mode`, modeOpts, c.adhan[p].mode)}
      ${sel(`adhan.${p}.sound`, soundOpts, c.adhan[p].sound)}
      <button class="play-btn" data-act="preview" data-p="${p}" title="${esc(t('test'))}">${icon('play')}</button>
      ${sel(`adhan.${p}.reminder`, remOpts.map(([v, l]) => [v, v ? `${t('reminder')} ${N(l)}` : `${t('reminder')}: ${l}`]), c.adhan[p].reminder)}</div>`).join('');
  const hijriPreview = S.day ? hijriText(S.day.hijri_now) : '';

  view.innerHTML = `<h1>${esc(t('settings'))} <span class="saved" id="saved">${esc(t('saved'))}</span></h1><p class="sub">${esc(d_path(c))}</p>
  <div class="settings"><nav class="snav">${[['location', 's_location'], ['calc', 's_calc'], ['hijri', 's_hijri'], ['adhan', 's_adhan'], ...(S.android ? [['phone', 's_phone']] : []), ['display', 's_display'], ...(S.android ? [] : [['system', 's_system']]), ['about', 's_about']].map(([id, k]) => `<a data-act="sjump" data-id="${id}">${esc(t(k))}</a>`).join('')}</nav>
  <div>
    ${sec('location', 'pin', t('s_location'), `<div class="loc-card"><div class="pin">${icon('pin')}</div><div style="flex:1"><b>${esc(loc.name)}</b><div class="muted">${esc(loc.country)} · ${N(loc.lat.toFixed(4))}, ${N(loc.lng.toFixed(4))} · ${esc(loc.timezone || 'system time zone')}</div></div><button class="btn small" data-act="detect">${icon('locate')}${esc(t('detect'))}</button></div>
      <div class="search-box">${icon('search')}<input class="input" id="city-q" placeholder="${esc(t('search_city'))}" autocomplete="off" spellcheck="false"></div><div class="results" id="city-r"></div>`)}
    ${sec('calc', 'calc', t('s_calc'), row(t('method'), S.methods.find((m) => m.id === c.calc.method)?.region || '', sel('calc.method', S.methods.map((m) => [m.id, m.name]), c.calc.method)) +
      row(t('asr_method'), '', `<div class="seg"><button class="${c.calc.asr === 'standard' ? 'on' : ''}" data-act="set" data-path="calc.asr" data-v="standard">${esc(t('standard'))}</button><button class="${c.calc.asr === 'hanafi' ? 'on' : ''}" data-act="set" data-path="calc.asr" data-v="hanafi">${esc(t('hanafi'))}</button></div>`) +
      row(t('high_lat'), '', sel('calc.high_lat', [['angle_based', 'Angle based'], ['middle_of_night', 'Middle of the night'], ['one_seventh', 'One seventh of the night'], ['none', 'None']], c.calc.high_lat)) +
      row(t('imsak'), t('imsak_help'), step('calc.imsak_minutes', c.calc.imsak_minutes, ` ${t('min')}`)) +
      `<div class="srow" style="flex-wrap:wrap"><div class="lab" style="flex-basis:100%"><b>${esc(t('adjust'))}</b><small>${esc(t('adjust_help'))}</small></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">${SIX.map((p) => `<div style="text-align:center"><div class="muted" style="font-size:12.5px;margin-bottom:4px">${esc(pname(p))}</div>${step(`calc.offsets.${p}`, c.calc.offsets[p])}</div>`).join('')}</div></div>`)}
    ${sec('hijri', 'calendar', t('s_hijri'), row(t('hijri_rule'), '', sel('calc.hijri_rule', [['sighting', t('rule_sighting')], ['umm_al_qura', t('rule_uaq')], ['arithmetic', t('rule_arith')]], c.calc.hijri_rule)) +
      row(t('hijri_offset'), `${t('hijri_preview')}: ${hijriPreview}`, step('calc.hijri_offset', c.calc.hijri_offset)) +
      row(t('at_maghrib'), '', tog('calc.hijri_at_maghrib', c.calc.hijri_at_maghrib)))}
    ${sec('adhan', 'mosque', t('s_adhan'), row(t('volume'), '', `<input type="range" min="0" max="100" value="${c.adhan.volume}" data-act="range" data-path="adhan.volume" style="--p:${c.adhan.volume}%;width:200px"><span style="width:44px;text-align:right">${N(c.adhan.volume)}%</span><button class="btn small" data-act="preview" data-p="dhuhr">${icon('play')}${esc(t('test'))}</button>`) +
      row(t('fade'), '', tog('adhan.fade_in', c.adhan.fade_in)) + row(t('show_window'), '', tog('adhan.show_window', c.adhan.show_window)) +
      `<div class="adhan-rows" style="margin:10px 0 6px">${arows}</div><div style="margin:10px 0 4px"><button class="btn small" data-act="import-sound">${icon('download')}${esc(t('import_sound'))}</button></div>` +
      row(t('sunrise_warn'), '', sel('alerts.sunrise_warning', [[0, t('off')], [10, `10 ${t('min')}`], [15, `15 ${t('min')}`], [20, `20 ${t('min')}`], [30, `30 ${t('min')}`]], c.alerts.sunrise_warning)) +
      row(t('sehri_alarm'), '', `${sel('alerts.sehri', [['off', t('off')], ['ramadan', t('in_ramadan')], ['always', t('always')]], c.alerts.sehri)} ${sel('alerts.sehri_minutes', [15, 20, 30, 45, 60, 90].map((m) => [m, `${N(m)} ${t('min')} ${t('before_fajr')}`]), c.alerts.sehri_minutes)}`) +
      row(t('jumuah_rem'), '', tog('alerts.jumuah', c.alerts.jumuah)) + row(t('tahajjud_rem'), '', tog('alerts.tahajjud', c.alerts.tahajjud)))}
    ${sec('display', 'palette', t('s_display'), row(t('language'), '', `<div class="seg"><button class="${L() === 'en' ? 'on' : ''}" data-act="set" data-path="language" data-v="en">English</button><button class="${L() === 'bn' ? 'on' : ''}" data-act="set" data-path="language" data-v="bn">বাংলা</button></div>`) +
      row(t('clock'), '', `<div class="seg"><button class="${c.clock === 12 ? 'on' : ''}" data-act="set" data-path="clock" data-v="12" data-num="1">12h</button><button class="${c.clock === 24 ? 'on' : ''}" data-act="set" data-path="clock" data-v="24" data-num="1">24h</button></div>`) +
      row(t('bn_digits'), '০১২৩', tog('bangla_digits', c.bangla_digits)) + themeRow())}
    ${S.android ? phoneSettings(c, sec, tog, row, sel) : sec('system', 'power', t('s_system'), row(t('autostart'), t('autostart_help'), tog('startup.autostart', c.startup.autostart)) + row(t('close_tray'), '', tog('startup.close_to_tray', c.startup.close_to_tray)) + row(t('overlay'), t('overlay_help'), tog('overlay.enabled', c.overlay.enabled)) + row(t('overlay_lock'), t('overlay_lock_help'), tog('overlay.locked', c.overlay.locked)))}
    ${sec('about', 'info', t('s_about'), `<p class="muted" style="margin:0">${esc(t('about'))}</p>`)}
  </div></div>`;
  let timer;
  $('#city-q').addEventListener('input', (e) => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    timer = setTimeout(() => searchCity(q, $('#city-r')), 350);
  });
};
const d_path = (c) => `${c.location.name} · ${S.methods.find((m) => m.id === c.calc.method)?.name || ''}`;

async function searchCity(q, out, onPick) {
  if (q.length < 2) { out.innerHTML = ''; return; }
  out.innerHTML = `<div class="muted" style="padding:8px">${esc(t('loading'))}</div>`;
  try {
    const r = await api(`/api/geo/search?q=${encodeURIComponent(q)}`);
    S.cityResults = r.results;
    out.innerHTML = r.results.map((x, i) => `<button data-act="pick-city" data-i="${i}"><span><b>${esc(x.place.name)}</b> <small>${esc([x.place.region, x.place.country].filter(Boolean).join(', '))}</small></span><small>${N(x.place.lat.toFixed(2))}, ${N(x.place.lng.toFixed(2))}</small></button>`).join('') || `<div class="muted" style="padding:8px">—</div>`;
    S.onPick = onPick;
  } catch (e) { out.innerHTML = `<div class="muted" style="padding:8px">${esc(e.message)}</div>`; }
}

function applyPlace(x) {
  const p = x.place;
  S.cfg.location = { name: p.name, country: p.country, country_code: p.country_code, lat: p.lat, lng: p.lng, elevation: p.elevation || 0, timezone: p.timezone || '' };
  S.cfg.calc.method = x.method;
  S.cfg.calc.asr = x.asr;
  S.cfg.calc.hijri_rule = x.rule;
}

function setPath(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = val;
}
function getPath(obj, path) { return path.split('.').reduce((o, k) => o[k], obj); }

// ---------- Popover ----------
function openPop(anchor, html, onPick) {
  const p = $('#pop');
  p.innerHTML = html;
  p.hidden = false;
  const r = anchor.getBoundingClientRect();
  const w = p.offsetWidth, h = p.offsetHeight;
  p.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8))}px`;
  p.style.top = `${r.bottom + 8 + h > innerHeight ? r.top - h - 8 : r.bottom + 8}px`;
  p.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; p.hidden = true; onPick(b); };
}
document.addEventListener('mousedown', (e) => { if (!e.target.closest('#pop')) $('#pop').hidden = true; }, true);

// ---------- Adhan moment ----------
function showAdhan(alert) {
  const d = S.day; if (!d || !alert) return;
  S.overlay = alert;
  const p = alert.prayer, fri = alert.friday;
  const el = $('#adhan');
  el.hidden = false;
  const star = `<svg class="star" viewBox="0 0 200 200"><g fill="none" stroke="#f3c66b" stroke-width=".8">${Array.from({ length: 12 }, (_, i) => `<rect x="55" y="55" width="90" height="90" transform="rotate(${i * 7.5} 100 100)"/>`).join('')}<circle cx="100" cy="100" r="64"/><circle cx="100" cy="100" r="30"/></g></svg>`;
  el.innerHTML = `<div class="rings"><i></i><i></i><i></i></div>${star}
    <div class="content"><div class="takbir">اللَّهُ أَكْبَرُ · اللَّهُ أَكْبَرُ</div>
    <div class="big-ar">${parab(p, fri)}</div>
    <div class="name">${esc(L() === 'bn' ? `${pname(p, fri)}-এর ${t('time_for')}` : `${t('time_for')} ${pname(p, fri)}`)}</div>
    <div class="when">${fmtTime(alert.at, d.today.tz_offset)} · ${esc(S.cfg.location.name)}</div>
    <div id="adhan-dua"></div>
    <div class="actions" id="adhan-actions"></div></div>`;
  updateAdhan();
}

function updateAdhan() {
  const el = $('#adhan');
  if (el.hidden || !S.overlay) return;
  const playing = S.live?.playing && S.live.playing.label === S.overlay.prayer;
  const acts = $('#adhan-actions');
  const want = playing ? 'playing' : 'done';
  if (acts.dataset.v === want) return;
  acts.dataset.v = want;
  acts.innerHTML = playing
    ? `<button class="btn gold" data-act="adhan-stop"><span class="eq"><i></i><i></i><i></i><i></i></span>${esc(t('stop_adhan'))}</button><button class="btn ghost" data-act="adhan-close">${esc(t('close'))}</button>`
    : `<button class="btn gold" data-act="adhan-close">${icon('check')}${esc(t('close'))}</button>`;
  if (!playing) {
    const iftar = S.overlay.prayer === 'maghrib' && S.overlay.ramadan;
    const dz = DUAS.find((x) => x.k === (iftar ? 'iftar' : 'after_adhan'));
    $('#adhan-dua').innerHTML = `<div class="dua"><small>${esc(iftar ? t('iftar_dua') : t('dua_after'))}</small><div class="arabic">${dz.ar}</div><p>${esc(L() === 'bn' ? dz.bn : dz.en)}</p><small>${esc(dz.src)}</small></div>`;
  }
}

function closeAdhan() { $('#adhan').hidden = true; S.overlay = null; }

window.onAdhan = async () => { await refreshLive(); if (S.live?.alert) { S.lastAlert = S.live.alert.fired; showAdhan(S.live.alert); } };

// ---------- Live state ----------
async function refreshLive() {
  try {
    const l = await api('/api/live');
    const wasMuted = S.live?.muted;
    S.live = l;
    if (l.alert && l.alert.fired > S.lastAlert && l.alert.mode !== 'notify' && l.alert.mode !== 'off') {
      S.lastAlert = l.alert.fired;
      if (!S.mini) showAdhan(l.alert);
    }
    updateAdhan();
    if (wasMuted !== l.muted) renderChrome();
  } catch { /* server restarting */ }
}
window.refreshLive = refreshLive;

// ---------- Mini widget ----------
let miniSky = null;
window.onMini = (on) => {
  S.mini = on;
  document.body.classList.toggle('is-mini', on);
  $('#mini').hidden = !on;
  if (on) {
    $('#mini').innerHTML = `<canvas id="mini-sky"></canvas><div class="ico" id="mini-ico"></div><div class="txt"><small>${esc(t('mini_next'))}</small><b id="mini-name"></b><div class="cd" id="mini-cd"></div><div class="hj" id="mini-hj"></div></div>
      <div class="tools"><button data-act="mini-off" title="Expand">${icon('expand')}</button><button data-act="mini-hide" title="Hide">${icon('hide')}</button></div>`;
    if (sky) sky.stop();
    miniSky = new Sky($('#mini-sky'), { small: true });
    miniSky.setDay(S.day);
    miniSky.start();
    tickMini();
  } else {
    if (miniSky) { miniSky.stop(); miniSky = null; }
    render();
  }
};
function tickMini() {
  if (!S.mini || !S.day) return;
  const n = S.day.next, fri = n.key === 'dhuhr' && isFridayAt(n.at);
  const [h, m, s] = hms(n.at - Date.now());
  $('#mini-ico').innerHTML = icon(n.key);
  $('#mini-name').innerHTML = `${esc(pname(n.key, fri))}<span class="ar">${parab(n.key, fri)}</span> <span style="font-size:14px;font-weight:400;opacity:.85">· ${fmtTime(n.at, S.day.today.tz_offset)}</span>`;
  $('#mini-cd').textContent = N(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  $('#mini-hj').textContent = hijriText(S.day.hijri_now);
}
$('#mini').addEventListener('mousedown', (e) => { if (!e.target.closest('button')) toNative('drag'); });

// ---------- First run ----------
const W = { step: 0 };
async function showWelcome() {
  const el = $('#welcome');
  el.hidden = false;
  if (!W.sky) {
    el.innerHTML = '<canvas id="w-sky"></canvas><div class="wbox" id="wbox"></div>';
    W.sky = new Sky($('#w-sky'));
    W.sky.setDay(S.day);
    W.sky.start();
  }
  drawWelcome();
}

function drawWelcome() {
  const c = S.cfg, box = $('#wbox');
  const last = welcomeLast();
  const steps = `<div class="steps">${Array.from({ length: last + 1 }, (_, i) => `<i class="${i <= W.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const foot = (next, back = true) => `<div class="wfoot">${back && W.step > 0 ? `<button class="btn ghost" data-act="w-back">${esc(t('back'))}</button>` : '<span></span>'}<button class="btn gold" data-act="w-next">${esc(next)}</button></div>`;
  let body = '';
  if (W.step === 0) {
    body = `<div class="salam">السَّلَامُ عَلَيْكُمْ</div><h1>${esc(t('welcome'))}</h1><p class="sub">${esc(t('welcome_sub'))}</p>
      <h2 style="text-align:center">${esc(t('choose_lang'))}</h2><div class="choice"><button class="${L() === 'en' ? 'on' : ''}" data-act="w-lang" data-v="en">English</button><button class="${L() === 'bn' ? 'on' : ''}" data-act="w-lang" data-v="bn">বাংলা</button></div>${foot(t('continue'), false)}`;
  } else if (W.step === 1) {
    body = `<h1>${esc(t('where'))}</h1>
      <div class="loc-card" style="margin-top:14px"><div class="pin">${icon('pin')}</div><div style="flex:1"><b>${esc(c.location.name)}</b><div class="muted">${esc(c.location.country)} · ${esc(c.location.timezone)}</div></div><button class="btn small" data-act="w-detect">${icon('locate')}${esc(t('detect'))}</button></div>
      <div class="search-box">${icon('search')}<input class="input" id="w-q" placeholder="${esc(t('search_city'))}" autocomplete="off"></div><div class="results" id="w-r"></div>${foot(t('continue'))}`;
  } else if (W.step === 2) {
    const m = S.methods.find((x) => x.id === c.calc.method);
    body = `<h1>${esc(t('calc_title'))}</h1><p class="sub">${esc(c.location.name)}, ${esc(c.location.country)}</p>
      <div class="srow"><div class="lab"><b>${esc(t('method'))}</b><small>${esc(m?.region || '')}</small></div><select class="input" data-act="select" data-path="calc.method" style="max-width:260px">${S.methods.map((x) => `<option value="${x.id}" ${x.id === c.calc.method ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="srow"><div class="lab"><b>${esc(t('asr_method'))}</b></div><div class="seg"><button class="${c.calc.asr === 'standard' ? 'on' : ''}" data-act="set" data-path="calc.asr" data-v="standard">${esc(t('standard'))}</button><button class="${c.calc.asr === 'hanafi' ? 'on' : ''}" data-act="set" data-path="calc.asr" data-v="hanafi">${esc(t('hanafi'))}</button></div></div>
      <div class="srow"><div class="lab"><b>${esc(t('hijri_rule'))}</b></div><select class="input" data-act="select" data-path="calc.hijri_rule"><option value="sighting" ${c.calc.hijri_rule === 'sighting' ? 'selected' : ''}>${esc(t('rule_sighting'))}</option><option value="umm_al_qura" ${c.calc.hijri_rule === 'umm_al_qura' ? 'selected' : ''}>${esc(t('rule_uaq'))}</option><option value="arithmetic" ${c.calc.hijri_rule === 'arithmetic' ? 'selected' : ''}>${esc(t('rule_arith'))}</option></select></div>
      ${S.day ? `<div class="prayers" style="grid-template-columns:repeat(6,1fr);gap:8px;margin-top:14px">${SIX.map((k) => `<div class="pcard" style="padding:10px;text-align:center"><div class="muted" style="font-size:12px">${esc(pname(k))}</div><b>${fmtTime(S.day.today.times[k], S.day.today.tz_offset, { bare: true })}</b></div>`).join('')}</div>` : ''}${foot(t('continue'))}`;
  } else if (W.step === 3) {
    const voice = (id, s, sel) => s.available === false ? '' : `<div class="voice ${sel ? 'on' : ''}" data-act="w-voice" data-id="${s.id}" data-for="${id}"><button class="play-btn" data-act="w-play" data-id="${s.id}">${icon('play')}</button><span>${esc(L() === 'bn' ? s.name_bn : s.name)}</span>${sel ? icon('check') : ''}</div>`;
    body = `<h1>${esc(t('voice'))}</h1>
      <h2 style="font-size:14px;color:var(--muted);margin-top:16px">${esc(t('voice_reg'))}</h2><div class="voices">${S.sounds.filter((s) => !s.fajr && !s.custom).map((s) => voice('reg', s, c.adhan.dhuhr.sound === s.id)).join('')}</div>
      <h2 style="font-size:14px;color:var(--muted);margin-top:16px">${esc(t('voice_fajr'))}</h2><div class="voices">${S.sounds.filter((s) => s.fajr).map((s) => voice('fajr', s, c.adhan.fajr.sound === s.id)).join('')}</div>${foot(t('continue'))}`;
  } else if (W.step === 4 && S.android) {
    body = `<h1>${esc(t('permissions_title'))}</h1><p class="sub">${esc(t('permissions_sub'))}</p><div id="w-health">${esc(t('loading'))}</div>${foot(t('continue'))}`;
    api('/api/health').then((h) => { const el = $('#w-health'); if (el) el.innerHTML = healthItems(h, true); }).catch(() => {});
  } else {
    body = `<div class="salam">بِسْمِ اللَّهِ</div><h1>${esc(t('all_set'))}</h1><p class="sub">${esc(t('all_set_sub'))}</p>
      ${S.desktop ? `<div class="srow"><div class="lab"><b>${esc(t('autostart'))}</b><small>${esc(t('autostart_help'))}</small></div><button class="toggle ${c.startup.autostart ? 'on' : ''}" data-act="toggle" data-path="startup.autostart"></button></div>` : ''}${foot(t('finish'))}`;
  }
  box.innerHTML = steps + body;
  box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
  const q = $('#w-q');
  if (q) { let tm; q.addEventListener('input', (e) => { clearTimeout(tm); tm = setTimeout(() => searchCity(e.target.value.trim(), $('#w-r'), 'welcome'), 350); }); }
}

async function finishWelcome() {
  post('/api/stop').catch(() => {});
  S.cfg.onboarded = true;
  await saveCfg(false);
  $('#welcome').hidden = true;
  if (W.sky) W.sky.stop();
  render();
}

// ---------- Phone (Android) ----------
function banglaText(b) {
  return `${N(b.d)} ${L() === 'bn' ? b.month_bn : b.month_en} ${N(b.y)}${L() === 'bn' ? ' বঙ্গাব্দ' : ' BS'}`;
}
const welcomeLast = () => (S.android ? 5 : 4);

/// Today's warnings: the adhan might not ring, or the user is traveling.
async function renderBanners(tok) {
  const box = $('#banners');
  if (!box || !S.android) return;
  const parts = [];
  if (S.day.health_failing) {
    parts.push(`<a class="banner warn" href="#/health">${icon('shield')}<div><b>${esc(t('hc_banner'))}</b><small>${esc(t('hc_bad').replace('{n}', N(S.day.health_failing)))}</small></div><span class="btn small">${esc(t('check_now'))}</span></a>`);
  }
  box.innerHTML = parts.join('');
  if (!S.cfg.phone?.travel || !S.cfg.phone?.home) return;
  try {
    const tr = await api('/api/travel');
    if (!live(tok) || !$('#banners')) return;
    if (tr.traveler) {
      parts.push(`<div class="banner travel">${icon('plane')}<div><b>${esc(t('travel_on'))}</b><small>${esc(t('travel_d').replace('{km}', N(Math.round(tr.distance_km))))}</small></div></div>`);
    }
    if (tr.away_from_times_km > 30) {
      parts.push(`<div class="banner">${icon('pin')}<div><small>${esc(t('travel_update').replace('{city}', S.cfg.location.name))}</small></div><button class="btn small" data-act="travel-update">${esc(t('update'))}</button></div>`);
    }
    $('#banners').innerHTML = parts.join('');
  } catch { /* location unavailable */ }
}

function phoneSettings(c, sec, tog, row, sel) {
  const p = c.phone || {};
  const mins = (list) => list.map((m) => [m, `${N(m)} ${t('min')}`]);
  const jam = PRAYERS.map((k) => `<label class="jam"><span>${esc(pname(k))}</span><input class="input" data-act="text" data-path="phone.jamaat.${k}" value="${esc(p.jamaat?.[k] || '')}" placeholder="15" inputmode="text"></label>`).join('') +
    `<label class="jam"><span>${esc(t('jumuah_t'))}</span><input class="input" data-act="text" data-path="phone.jamaat.jumuah" value="${esc(p.jamaat?.jumuah || '')}" placeholder="13:30"></label>`;
  return sec('phone', 'shield', t('s_phone'),
    `<a class="banner" href="#/health" style="margin:0 0 6px">${icon('shield')}<div><b>${esc(t('health'))}</b><small>${esc(t('hc_sub'))}</small></div></a>` +
    row(t('in_silent'), t('in_silent_d'), tog('phone.adhan_in_silent', p.adhan_in_silent)) +
    `<div class="srow" style="flex-wrap:wrap"><div class="lab" style="flex-basis:100%"><b>${esc(t('jamaat_times'))}</b><small>${esc(t('jamaat_help'))}</small></div><div class="jams">${jam}</div></div>` +
    row(t('walk'), t('walk_d'), sel('phone.walk_minutes', [[0, t('off')], ...mins([3, 5, 10, 15, 20, 30])], p.walk_minutes)) +
    row(t('auto_silent'), t('auto_silent_d'), tog('phone.auto_silent', p.auto_silent)) +
    (p.auto_silent ? row(t('silent_for'), '', sel('phone.silent_minutes', mins([15, 20, 25, 30, 45, 60]), p.silent_minutes)) : '') +
    row(t('travel'), t('travel_help'), tog('phone.travel', p.travel)) +
    (p.travel ? row(`${t('home')}: ${p.home?.name || '—'}`, '', `<button class="btn small" data-act="set-home">${icon('pin')}${esc(t('set_home'))}</button>`) : '') +
    row(t('fajr_wake'), t('fajr_wake_d'), tog('phone.fajr_wake', p.fajr_wake)) +
    row(t('volume_tasbih'), '', tog('phone.volume_tasbih', p.volume_tasbih)));
}

// ---------- Adhan check ----------
const HC_ICON = { notifications: 'bell', exact_alarm: 'today', battery: 'power', oem: 'shield', alarm_volume: 'speaker', dnd: 'off' };

function healthItems(h, compact = false) {
  return `<div class="hc-list">${h.items.map((it) => {
    const ok = it.ok === true;
    const desc = it.id === 'oem' ? t('oem_' + it.family) : t(`hc_${it.id}_d`);
    const actions = ok ? '' : it.id === 'oem'
      ? `${it.can_open ? `<button class="btn small" data-act="hc-fix" data-id="oem">${esc(t('open_settings'))}</button>` : ''}<button class="btn small ghost" data-act="hc-confirm">${esc(t('done_it'))}</button>`
      : `<button class="btn small gold" data-act="hc-fix" data-id="${it.id}">${esc(t('fix'))}</button>`;
    return `<div class="hc-item ${ok ? 'ok' : 'bad'}"><div class="hc-ico">${icon(ok ? 'check' : HC_ICON[it.id] || 'info')}</div>
      <div class="t"><b>${esc(t('hc_' + it.id))}</b>${!ok ? `<small>${esc(desc)}</small>` : ''}</div><div class="hc-act">${actions}</div></div>`;
  }).join('')}</div>`;
}

VIEWS.health = async (tok) => {
  const h = await api('/api/health');
  if (!live(tok)) return;
  const off = S.day?.today.tz_offset ?? 0;
  const good = h.failing === 0;
  const dl = h.deliveries.length ? h.deliveries.map((d) => {
    const late = Math.round((d.played - d.due) / 1000);
    const name = d.key === 'test' ? t('test_btn') : pname(String(d.key).split('|')[0]);
    const err = String(d.how).startsWith('error');
    return `<div class="li"><span class="dot ${err ? 'k-season' : late <= 60 ? 'k-fast' : 'k-eid'}"></span><div class="t"><b>${esc(name)}</b><small>${esc(fmtGDate(new Date(d.due + off * 60000).toISOString().slice(0, 10), false))} · ${fmtTime(d.due, off)}</small></div>
      <span class="v">${err ? esc(d.how) : late <= 60 ? `✓ ${esc(t('on_time'))}` : `${esc(t('late_by'))} ${fmtDur(late * 1000)}`}</span></div>`;
  }).join('') : `<p class="muted">${esc(t('no_deliveries'))}</p>`;
  const na = h.next_alarm;
  const testIn = h.test_at ? Math.max(0, Math.round((h.test_at - Date.now()) / 1000)) : 0;
  view.innerHTML = `<h1>${esc(t('health'))}</h1><p class="sub">${esc(t('hc_sub'))}</p>
    <div class="hc-hero ${good ? 'good' : 'bad'}"><div class="hc-ring">${icon(good ? 'shield' : 'info')}</div>
      <div><b>${esc(good ? t('hc_ok') : t('hc_bad').replace('{n}', N(h.failing)))}</b><small>${esc(h.device.brand)} ${esc(h.device.model)} · Android ${esc(h.device.android)}</small></div></div>
    ${healthItems(h)}
    <div class="widgets" style="grid-template-columns:1fr 1fr">
      <div class="card"><h3>${icon('play')}${esc(t('test_title'))}</h3><p class="muted" style="margin-top:0">${esc(t('test_d'))}</p>
        ${testIn > 0 ? `<div class="test-count" id="test-count" data-at="${h.test_at}">${esc(t('test_wait'))} ${N(testIn)}s</div>` : `<button class="btn gold" data-act="hc-test">${icon('play')}${esc(t('test_btn'))}</button>`}
        ${na ? `<p class="faint" style="margin:14px 0 0;font-size:13px">${esc(t('next_alarm'))}: ${fmtTime(na.at, off)} · ${esc(na.exact ? t('exact') : t('inexact'))}</p>` : ''}</div>
      <div class="card"><h3>${icon('tracker')}${esc(t('deliveries'))}</h3><div class="list">${dl}</div></div>
    </div>`;
};

async function refreshHealth() {
  if (route() === 'health') render();
  const wh = $('#w-health');
  if (wh) { try { wh.innerHTML = healthItems(await api('/api/health'), true); } catch { /* ignore */ } }
}

// ---------- Fajr wake-up task ----------
const WK = { n: 0 };
VIEWS.wake = async () => {
  WK.n = 0;
  const need = S.cfg.phone?.wake_taps || 33;
  view.innerHTML = `<div class="wake"><div class="takbir ar">الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ</div><h1>${esc(t('wake_title'))}</h1>
    <p class="sub">${esc(t('wake_d').replace('{n}', N(need)))}</p>
    <button class="wake-btn" data-act="wake-tap"><span id="wake-n">${N(need)}</span></button></div>`;
  nativeUi('keepScreenOn', 1);
};
async function wakeTap() {
  const need = S.cfg.phone?.wake_taps || 33;
  WK.n++;
  nativeUi('haptic');
  const left = Math.max(0, need - WK.n);
  const el = $('#wake-n'); if (el) el.textContent = N(left);
  if (left === 0) {
    await post('/api/wake/done');
    const d = S.day;
    view.innerHTML = `<div class="wake"><div class="takbir ar">الْحَمْدُ لِلَّهِ</div><h1>${esc(t('wake_done'))}</h1>
      <p class="sub">${esc(pname('fajr'))} · ${esc(t('ends'))} ${fmtTime(d.today.times.sunrise, d.today.tz_offset)}</p>
      <div class="card dua" style="max-width:640px;margin:0 auto;text-align:left"><div class="arabic">${DUAS.find((x) => x.k === 'wake').ar}</div><div class="mn">${esc(L() === 'bn' ? DUAS.find((x) => x.k === 'wake').bn : DUAS.find((x) => x.k === 'wake').en)}</div></div>
      <a class="btn gold" href="#/today" style="margin-top:20px">${esc(t('today'))}</a></div>`;
  }
}

// ---------- "More" sheet (phones) ----------
function openSheet() {
  const sh = $('#sheet');
  const items = navRoutes().filter((k) => !tabs().includes(k));
  sh.innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div><div class="sheet-box">${items.map((k) => `<a href="#/${k}">${icon(ROUTE_ICON[k])}<span>${esc(t(k))}</span>${k === 'health' && S.day?.health_failing ? `<span class="badge">${N(S.day.health_failing)}</span>` : ''}</a>`).join('')}</div>`;
  sh.hidden = false;
}
function closeSheet() { const sh = $('#sheet'); if (sh) sh.hidden = true; }

// ---------- Native callbacks ----------
/// The phone's compass: the dial turns so N points north; the gold needle
/// then points at the Qibla.
window.onHeading = (deg, accuracy) => {
  const dial = $('#dial'), f = $('#facing');
  if (!dial || S.qibla == null) return;
  if (deg == null) { if (f) f.hidden = true; return; }
  dial.style.transform = `rotate(${-deg}deg)`;
  const diff = ((S.qibla - deg + 540) % 360) - 180;
  const facing = Math.abs(diff) < 4;
  if (facing && !S.wasFacing) nativeUi('haptic', 'long');
  S.wasFacing = facing;
  if (f) {
    f.className = `facing ${facing ? 'yes' : ''}`;
    f.textContent = accuracy < 2 ? t('calibrate') : facing ? `🕋 ${t('facing')}` : `${diff > 0 ? t('turn_right') : t('turn_left')} ${N(Math.abs(Math.round(diff)))}°`;
  }
};
window.onVolumeKey = (d) => {
  if (route() !== 'tasbih') return;
  if (d > 0) countTasbih(null);
  else if (TB.count > 0) { TB.count--; drawTasbih(); }
};
window.onNativeResume = async () => {
  try { await loadToday(); renderChrome(); } catch { /* ignore */ }
  if (route() === 'health') render();
  refreshHealth();
};
setInterval(() => {
  const el = $('#test-count');
  if (!el) return;
  const left = Math.round((+el.dataset.at - Date.now()) / 1000);
  if (left <= 0) { render(); return; }
  el.textContent = `${t('test_wait')} ${N(left)}s`;
}, 1000);

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { location.hash = '#/' + go.dataset.go; return; }
  const lang = e.target.closest('[data-lang]');
  if (lang) { S.cfg.language = lang.dataset.lang; await saveCfg(false); render(); return; }
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act;
  const c = S.cfg;
  switch (act) {
    case 'goto-loc': if (S.android) { location.hash = '#/settings/location'; break; } location.hash = '#/settings'; setTimeout(() => $('#sg-location')?.scrollIntoView({ behavior: 'smooth' }), 400); break;
    case 'theme': setTheme(a.dataset.v); render(); break;
    case 'mute': await post('/api/mute', { on: !S.live?.muted }); await refreshLive(); renderChrome(); if (route() === 'today') tickToday(true); toast(S.live?.muted ? t('muted') : '🔊'); break;
    case 'mini': toNative('mini:1'); break;
    case 'mini-off': toNative('mini:0'); break;
    case 'mini-hide': toNative('hide'); break;
    case 'mode': {
      const p = a.dataset.p, order = ['adhan', 'chime', 'notify', 'off'];
      const next = order[(order.indexOf(c.adhan[p].mode) + 1) % 4];
      c.adhan[p].mode = next;
      await post('/api/prayer-mode', { prayer: p, mode: next });
      a.className = `mode m-${next}`; a.innerHTML = icon({ adhan: 'mosque', chime: 'bell', notify: 'bubble', off: 'off' }[next]); a.title = t('mode_' + next);
      toast(`${pname(p)}: ${t('mode_' + next)}`);
      break;
    }
    case 'track': trackMenu(a, a.dataset.date, +a.dataset.i); break;
    case 'qada': await post('/api/qada', { delta: 1 }); render(); break;
    case 'tt-prev': case 'tt-next': { const st = VIEWS.timetable.st; let m = st.m + (act === 'tt-next' ? 1 : -1), y = st.y; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } st.m = m; st.y = y; render(); break; }
    case 'tt-now': VIEWS.timetable.st = {}; render(); break;
    case 'tt-ramadan': { const s = S.day.ramadan.starts; if (s) { VIEWS.timetable.st = { y: +s.slice(0, 4), m: +s.slice(5, 7) }; render(); } break; }
    case 'export': try { const r = await post('/api/export', VIEWS.timetable.st); if (r.path) toast(r.path); } catch (err) { toast(err.message); } break;
    case 'print': window.print(); break;
    case 'cal-prev': case 'cal-next': { const st = VIEWS.calendar.st; let m = st.m + (act === 'cal-next' ? 1 : -1), y = st.y; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } Object.assign(st, { m, y, sel: undefined, dir: act === 'cal-next' ? 'l' : 'r' }); render(); break; }
    case 'cal-day': VIEWS.calendar.st.sel = +a.dataset.i; $$('.cday.sel').forEach((x) => x.classList.remove('sel')); a.classList.add('sel'); showCalDay(+a.dataset.i); break;
    case 'dz': flushTasbih(); TB.i = +a.dataset.i; TB.count = 0; TB.seq = false; drawTasbih(); break;
    case 'dz-seq': flushTasbih(); TB.i = 0; TB.count = 0; TB.seq = true; drawTasbih(); break;
    case 'tb-reset': TB.count = 0; drawTasbih(); break;
    case 'tb-undo': if (TB.count > 0) { TB.count--; drawTasbih(); } break;
    case 'sjump': $(`#sg-${a.dataset.id}`)?.scrollIntoView({ behavior: 'smooth' }); $$('.snav a').forEach((x) => x.classList.toggle('on', x === a)); break;
    case 'toggle': { const v = !getPath(c, a.dataset.path); setPath(c, a.dataset.path, v); a.classList.toggle('on', v); await saveCfg(); break; }
    case 'set': { const v = a.dataset.num ? +a.dataset.v : a.dataset.v; setPath(c, a.dataset.path, v); await saveCfg(); if ($('#welcome').hidden) render(); else drawWelcome(); break; }
    case 'step': { const v = getPath(c, a.dataset.path) + +a.dataset.d; setPath(c, a.dataset.path, v); await saveCfg(); render(); break; }
    case 'preview': {
      const p = a.dataset.p;
      if (S.live?.playing) { await post('/api/stop'); S.live.playing = null; a.innerHTML = icon('play'); break; }
      await post('/api/play', { sound: c.adhan[p].mode === 'chime' ? 'chime' : c.adhan[p].sound, volume: c.adhan.volume });
      S.live = { ...(S.live || {}), playing: { label: 'test' } };
      a.innerHTML = icon('stop');
      setTimeout(() => { if (a.isConnected) a.innerHTML = icon('play'); }, 12000);
      break;
    }
    case 'import-sound': try { const r = await post('/api/sounds/import'); if (r.sounds) { S.sounds = r.sounds; toast('✓'); render(); } } catch (err) { toast(err.message); } break;
    case 'detect': case 'w-detect': {
      a.disabled = true; const old = a.innerHTML; a.innerHTML = `<span class="eq"><i></i><i></i><i></i></span>${esc(t('detecting'))}`;
      try { const r = await api('/api/geo/detect'); applyPlace(r); await saveCfg(); toast(`${t('found')} ${r.place.name}, ${r.place.country}`); if (act === 'w-detect') drawWelcome(); else render(); }
      catch (err) { toast(err.message); a.disabled = false; a.innerHTML = old; }
      break;
    }
    case 'pick-city': {
      const x = S.cityResults[+a.dataset.i]; applyPlace(x); await saveCfg();
      toast(`${x.place.name} · ${t('applied_method')} ${x.place.country}`);
      if (S.onPick === 'welcome') drawWelcome(); else render();
      break;
    }
    case 'w-lang': S.cfg.language = a.dataset.v; await saveCfg(false); drawWelcome(); renderChrome(); break;
    case 'w-next': if (W.step >= welcomeLast()) { finishWelcome(); } else { W.step++; post('/api/stop').catch(() => {}); drawWelcome(); } break;
    case 'w-back': W.step = Math.max(0, W.step - 1); drawWelcome(); break;
    case 'w-play': e.stopPropagation(); await post('/api/play', { sound: a.dataset.id }); break;
    case 'w-voice': {
      const id = a.dataset.id;
      if (a.dataset.for === 'fajr') c.adhan.fajr.sound = id; else for (const p of ['dhuhr', 'asr', 'maghrib', 'isha']) c.adhan[p].sound = id;
      await saveCfg(false); drawWelcome();
      break;
    }
    case 'adhan-stop': await post('/api/stop'); await refreshLive(); break;
    case 'adhan-close': closeAdhan(); break;
    case 'more': openSheet(); break;
    case 'sheet-close': closeSheet(); break;
    case 'hc-fix': try { await post('/api/health/fix', { id: a.dataset.id }); } catch (err) { toast(err.message); } break;
    case 'hc-confirm': await post('/api/health/confirm'); refreshHealth(); break;
    case 'hc-test': await post('/api/health/test', { in: 60 }); refreshHealth(); toast(t('test_wait')); break;
    case 'travel-update': {
      try { const r = await api('/api/geo/detect'); applyPlace(r); await saveCfg(); toast(`${t('found')} ${r.place.name}`); render(); } catch (err) { toast(err.message); }
      break;
    }
    case 'set-home': try { await post('/api/travel/home'); await loadSettings(); toast('✓'); render(); } catch (err) { toast(err.message); } break;
    case 'wake-tap': wakeTap(); break;
  }
});

document.addEventListener('change', async (e) => {
  const tx = e.target.closest('[data-act="text"]');
  if (tx) { setPath(S.cfg, tx.dataset.path, tx.value.trim()); await saveCfg(); return; }
  const a = e.target.closest('[data-act="select"]');
  if (!a) return;
  if (a.dataset.path.endsWith('.sound')) {
    const snd = S.sounds.find((x) => x.id === a.value);
    if (snd && snd.available === false) {
      toast(t('downloading'), 60000);
      try { const r = await post('/api/sounds/download', { id: snd.id }); S.sounds = r.sounds; toast('✓'); }
      catch (err) { toast(err.message, 5000); render(); return; }
    }
  }
  const cur = getPath(S.cfg, a.dataset.path);
  setPath(S.cfg, a.dataset.path, typeof cur === 'number' ? +a.value : a.value);
  await saveCfg();
  if (!$('#welcome').hidden) drawWelcome();
  else if (a.dataset.path.startsWith('calc')) render();
});
document.addEventListener('input', (e) => {
  const a = e.target.closest('[data-act="range"]');
  if (!a) return;
  a.style.setProperty('--p', `${a.value}%`);
  a.nextElementSibling.textContent = `${N(a.value)}%`;
  setPath(S.cfg, a.dataset.path, +a.value);
  clearTimeout(a.t); a.t = setTimeout(() => saveCfg(), 400);
});

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, select, textarea')) return;
  if (route() === 'tasbih' && (e.key === ' ' || e.key === 'Enter') && $('#beads')) { e.preventDefault(); if (!e.repeat) countTasbih(null); }
  if (e.key === 'Escape') { if (!$('#adhan').hidden) closeAdhan(); $('#pop').hidden = true; }
});

window.addEventListener('hashchange', render);
window.addEventListener('beforeunload', flushTasbih);

// ---------- Clock ----------
let lastReload = 0;
setInterval(async () => {
  if (!S.day) return;
  const now = Date.now();
  // A prayer just began, or midnight passed at the location: reload.
  const localDate = new Date(now + S.day.today.tz_offset * 60000).toISOString().slice(0, 10);
  if ((now >= S.day.next.at || localDate !== S.day.today.date) && now - lastReload > 10000) {
    lastReload = now;
    await loadToday();
    if (miniSky) miniSky.setDay(S.day);
    if (route() === 'today' && !S.mini) render();
  }
  tickToday();
  renderRailNext();
  tickMini();
}, 1000);
setInterval(refreshLive, 2000);

/// The Quran and Hadith (phones only) live in their own scripts and stylesheet.
async function loadQuran() {
  for (const href of ['/quran.css', '/phone.css', '/hero.css', '/salah.css', '/azkar.css', '/qplus.css', '/ramadan.css']) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = href;
    document.head.appendChild(css);
  }
  const script = (src) => new Promise((res) => {
    const js = document.createElement('script');
    js.src = src;
    js.onload = res; js.onerror = res;
    document.body.appendChild(js);
  });
  await script('/quran.js');
  await script('/hadith.js');
  // Phone layouts of the timetable, settings and tasbih.
  await script('/phone.js');
  await script('/hero.js');
  await script('/illus.js');
  await script('/salah.js');
  await script('/azkar.js');
  await script('/qplus.js');
  await script('/ramadan.js');
}

// ---------- Start ----------
(async function start() {
  try {
    await loadSettings();
    // A fresh install restored by Android, or a new phone: bring the page's data back.
    if (S.android) {
      try {
        const saved = await api('/api/webstore');
        if (localStorage.length === 0 && saved && Object.keys(saved).length) { webStore.loading = true; webStore.load(saved); webStore.loading = false; applyTheme(); }
        else if (localStorage.length && (!saved || !Object.keys(saved).length)) webStore.sync();
      } catch { /* first run */ }
    }
    if (S.android) await loadQuran();
    await loadToday();
    await refreshLive();
    if (S.live?.alert) S.lastAlert = S.live.alert.fired;
  } catch (e) {
    view.innerHTML = `<div class="card">${esc(e.message)}</div>`;
    return;
  }
  render();
  if (!S.cfg.onboarded) showWelcome();
})();
