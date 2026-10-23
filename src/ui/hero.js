'use strict';
// Waqt on phones: the next-prayer card at the top of Today, in the style the
// user picks — Sky, Sun path, Ring, Minimal or Compact. Loaded after phone.js.

Object.assign(PT.en, {
  hero: 'Today widget', hero_d: 'Choose how the next prayer is shown on Today.',
  hx_sky: 'Sky', hx_sky_d: 'The live sky over the mosque', hx_arc: 'Sun path', hx_arc_d: 'Where the day is, from Fajr to Isha',
  hx_ring: 'Ring', hx_ring_d: 'A ring that fills until the next prayer', hx_minimal: 'Minimal', hx_minimal_d: "Big numbers and the day's times",
  hx_compact: 'Compact', hx_compact_d: 'One slim line, more room below',
});
Object.assign(PT.bn, {
  hero: 'আজকের উইজেট', hero_d: 'আজ পাতায় পরের নামাজ কীভাবে দেখাবে তা বেছে নিন।',
  hx_sky: 'আকাশ', hx_sky_d: 'মসজিদের ওপর জীবন্ত আকাশ', hx_arc: 'সূর্যের পথ', hx_arc_d: 'ফজর থেকে এশা — দিন কোথায়',
  hx_ring: 'রিং', hx_ring_d: 'পরের নামাজ পর্যন্ত ভরে ওঠা রিং', hx_minimal: 'মিনিমাল', hx_minimal_d: 'বড় সংখ্যা ও দিনের সময়গুলো',
  hx_compact: 'কমপ্যাক্ট', hx_compact_d: 'এক লাইনে, নিচে বেশি জায়গা',
});
Object.assign(IC, {
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5" opacity=".6"/>',
});

const HERO_STYLES = ['sky', 'arc', 'ring', 'minimal', 'compact'];
const heroStyle = () => { const v = tbGet('waqt-hero', 'arc'); return HERO_STYLES.includes(v) ? v : 'arc'; };
/// The sky behind each part of the day, for the sun-path card.
const HX_TINT = { fajr: ['#2a2a6e', '#7b5fa8'], sunrise: ['#2d4f9a', '#d98f52'], dhuhr: ['#1c5fae', '#4f97da'], asr: ['#28509a', '#c9814e'], maghrib: ['#33276a', '#c45f74'], isha: ['#0a1236', '#24346e'] };

/// What the card shows now: the next prayer, the period it ends, how far through it we are.
function heroNow() {
  const d = S.day, T0 = d.today.times, now = Date.now(), n = d.next;
  const fri = n.key === 'dhuhr' && isFridayAt(n.at);
  let start, end, cur;
  if (d.current) {
    start = d.current.at; end = n.at; cur = pname(d.current.key, d.current.key === 'dhuhr' && isFridayAt(d.current.at));
  } else { start = T0.sunrise; end = T0.dhuhr; cur = t('duha_time'); }
  const frac = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const [h, m, s] = hms(n.at - now);
  const cd = N(h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  return { d, T0, now, n, fri, frac, cd, cur, left: fmtDur(end - now), off: d.today.tz_offset, curKey: d.current?.key || 'sunrise' };
}

function heroChips(d) {
  const c = [];
  if (S.live?.muted) c.push(`<span class="hx-chip alert">${icon('mute')}${esc(t('muted'))}</span>`);
  if (d.ramadan.active) c.push(`<span class="hx-chip">${icon('moon')}${esc(t('ramadan_day'))} ${N(d.ramadan.day)}</span>`);
  for (const e of d.today.events) c.push(`<span class="hx-chip">${icon('star')}${esc(L() === 'bn' ? e.event?.bn || e.bn : e.en)}</span>`);
  return c.length ? `<div class="hx-chips">${c.join('')}</div>` : '';
}

/// The five prayers in a row, the next one lit.
function heroStrip(x) {
  const fri = x.d.today.friday;
  return `<div class="hx-strip">${PRAYERS.map((k) => {
    const at = x.T0[k];
    const next = x.n.key === k && x.n.at === at, past = at < x.now && !next;
    return `<span class="${next ? 'on' : ''} ${past ? 'past' : ''}"><i>${icon(k)}</i><b>${esc(pname(k, fri && k === 'dhuhr'))}</b><em>${fmtTime(at, x.off, { bare: true })}</em></span>`;
  }).join('')}</div>`;
}

const heroDate = (d) => `<b>${esc(fmtGDate(d.today.date))}</b><span>${esc(hijriText(d.hijri_now))}</span>`;
const heroBtn = () => `<button class="hx-style" data-pa="hero-pick" title="${esc(pt('hero'))}">${icon('layers')}</button>`;
const arcPt = (p) => [160 - 136 * Math.cos(Math.PI * p), 150 - 136 * Math.sin(Math.PI * p)];

function heroHTML(style) {
  const x = heroNow(), d = x.d;
  const name = `<b>${esc(pname(x.n.key, x.fri))}</b><span class="ar">${parab(x.n.key, x.fri)}</span>`;
  const at = `${t('at')} ${fmtTime(x.n.at, x.off)}`.trim();
  const leftLine = `<span id="hx-left">${esc(x.cur)} · ${esc(x.left)} ${esc(t('time_left'))}</span>`;
  if (style === 'sky') {
    return `<div class="hx-sky">${heroBtn()}
      <div class="hx-date">${heroDate(d)}</div>
      <div class="hx-lbl">${esc(t('next_prayer'))}</div>
      <div class="hx-name">${name}</div>
      <div class="hx-cd" id="hx-cd">${x.cd}</div>
      <div class="hx-at">${esc(at)}</div>
      <div class="hx-glass"><div class="hx-prog"><i id="hx-bar" style="width:${x.frac * 100}%"></i></div>${leftLine}</div></div>`;
  }
  if (style === 'arc') {
    const [a, b] = HX_TINT[x.curKey] || HX_TINT.isha;
    const T0 = x.T0, span = T0.isha - T0.fajr;
    const pos = (ms) => Math.min(1, Math.max(0, (ms - T0.fajr) / span));
    const dots = SIX6.map((k) => {
      const [cx, cy] = arcPt(pos(T0[k]));
      const nx = x.n.key === k && x.n.at === T0[k];
      return `<circle class="hx-m ${nx ? 'nx' : ''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${nx ? 5 : 3.5}"/>`;
    }).join('');
    const [sx, sy] = arcPt(pos(x.now));
    const day = x.now >= T0.sunrise && x.now < T0.maghrib;
    const [h1, hy] = arcPt(pos(T0.sunrise)), [h2] = arcPt(pos(T0.maghrib));
    return `<div class="hx-arc" style="--ta:${a};--tb:${b}">${heroBtn()}
      <div class="hx-date">${heroDate(d)}</div>
      <svg viewBox="0 0 320 158" class="hx-arcsvg"><defs>
        <radialGradient id="hxsun"><stop offset="0" stop-color="#fff6d8"/><stop offset=".45" stop-color="#ffd36b" stop-opacity=".8"/><stop offset="1" stop-color="#ffd36b" stop-opacity="0"/></radialGradient>
        <radialGradient id="hxmoon"><stop offset="0" stop-color="#f4f1ff"/><stop offset=".4" stop-color="#c9c4ff" stop-opacity=".7"/><stop offset="1" stop-color="#c9c4ff" stop-opacity="0"/></radialGradient></defs>
        <line x1="${h1.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${h2.toFixed(1)}" y2="${hy.toFixed(1)}" class="hx-hz"/>
        <path d="M24 150 A136 136 0 0 1 296 150" class="hx-track"/>
        <path d="M24 150 A136 136 0 0 1 296 150" class="hx-done" id="hx-done" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="${1000 - pos(x.now) * 1000}"/>
        ${dots}<g id="hx-body" transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"><circle r="22" fill="url(#${day ? 'hxsun' : 'hxmoon'})"/><circle r="7" fill="${day ? '#fff3cf' : '#eeeaff'}"/></g></svg>
      <div class="hx-under"><div class="hx-lbl">${esc(t('next_prayer'))}</div><div class="hx-name">${name}</div><div class="hx-cd" id="hx-cd">${x.cd}</div><div class="hx-at">${esc(at)}</div></div>
      ${heroStrip(x)}${heroChips(d)}</div>`;
  }
  if (style === 'ring') {
    return `<div class="hx-ringc">${heroBtn()}
      <div class="hx-date">${heroDate(d)}</div>
      <div class="hx-rwrap"><svg viewBox="0 0 220 220"><defs><linearGradient id="hxr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#e09a3a"/></linearGradient></defs>
        <circle cx="110" cy="110" r="96" class="hx-rtrack"/><circle cx="110" cy="110" r="96" class="hx-rbar" id="hx-rbar" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="${1000 - x.frac * 1000}"/></svg>
        <div class="hx-rin"><small>${esc(t('next_prayer'))}</small><div class="hx-name">${name}</div><div class="hx-cd" id="hx-cd">${x.cd}</div><small>${esc(at)}</small></div></div>
      <div class="hx-foot">${leftLine}</div>${heroChips(d)}</div>`;
  }
  if (style === 'compact') {
    return `<div class="hx-compact">
      <span class="hx-ic">${icon(x.n.key)}</span>
      <div class="hx-ct"><div class="hx-name">${name}</div><small>${esc(at)} · ${esc(hijriText(d.hijri_now))}</small></div>
      <div class="hx-cd" id="hx-cd">${x.cd}</div>${heroBtn()}
      <div class="hx-prog"><i id="hx-bar" style="width:${x.frac * 100}%"></i></div></div>`;
  }
  return `<div class="hx-min">${heroBtn()}
    <div class="hx-date">${heroDate(d)}</div>
    <div class="hx-row"><div><div class="hx-lbl">${esc(t('next_prayer'))}</div><div class="hx-name">${name}</div></div>
      <div class="hx-r"><div class="hx-cd" id="hx-cd">${x.cd}</div><div class="hx-at">${esc(at)}</div></div></div>
    <div class="hx-prog"><i id="hx-bar" style="width:${x.frac * 100}%"></i></div><div class="hx-foot">${leftLine}</div>
    ${heroStrip(x)}${heroChips(d)}</div>`;
}

/// Swaps the old card for the chosen style. The sky style keeps the live canvas.
function buildHero() {
  const old = $('#hero');
  if (!old || !S.day) return;
  const style = heroStyle();
  if (style === 'sky') {
    if (!$('#sky', old)) { old.outerHTML = '<section class="hero" id="hero"><canvas id="sky"></canvas></section>'; }
    const h = $('#hero');
    h.className = 'hero hx hx-skycard';
    h.dataset.style = 'sky';
    $('.hero-content', h)?.remove();
    $('.hx-sky', h)?.remove();
    h.insertAdjacentHTML('beforeend', heroHTML('sky'));
    if (!sky) { sky = new Sky($('#sky')); sky.setDay(S.day); sky.start(); }
  } else {
    if (sky) { sky.stop(); sky = null; }
    old.outerHTML = `<section id="hero" class="hx hxs-${style} ${style === 'arc' ? 'hx-dark' : ''}" data-style="${style}">${heroHTML(style)}</section>`;
  }
  const n = S.day.next;
  $('#hero').dataset.k = n.key + n.at;
}

/// Once a second: the countdown and progress; a new prayer rebuilds the card.
function heroTick() {
  const hero = $('#hero[data-style]');
  if (!hero || !S.day) return;
  const n = S.day.next;
  if (hero.dataset.k !== n.key + n.at) { buildHero(); return; }
  const x = heroNow();
  const cd = $('#hx-cd'); if (cd && cd.textContent !== x.cd) cd.textContent = x.cd;
  const bar = $('#hx-bar'); if (bar) bar.style.width = `${x.frac * 100}%`;
  const rb = $('#hx-rbar'); if (rb) rb.style.strokeDashoffset = String(1000 - x.frac * 1000);
  const lf = $('#hx-left');
  if (lf) { const v = `${x.cur} · ${x.left} ${t('time_left')}`; if (lf.textContent !== v) lf.textContent = v; }
  // The sun moves slowly: move it every 30 seconds.
  hero.tk = (hero.tk || 0) + 1;
  if (hero.dataset.style === 'arc' && hero.tk % 30 === 0) {
    const T0 = x.T0, p = Math.min(1, Math.max(0, (x.now - T0.fajr) / (T0.isha - T0.fajr)));
    const [sx, sy] = arcPt(p);
    $('#hx-done')?.setAttribute('stroke-dashoffset', String(1000 - p * 1000));
    $('#hx-body')?.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
  }
}

const todayBase = VIEWS.today;
VIEWS.today = async (tok) => {
  await todayBase(tok);
  if (!live(tok)) return;
  buildHero();
};
const tickTodayBase = tickToday;
tickToday = function tickTodayPhone(first = false) {
  if (!$('#hero[data-style]')) return tickTodayBase(first);
  heroTick();
  const mk = $('#tl-now');
  if (mk && S.tlStart) mk.style.left = `${Math.min(100, Math.max(0, ((Date.now() - S.tlStart) / 86400000) * 100))}%`;
};

function heroPicker() {
  const cur = heroStyle();
  qSheet(`<div class="tt-sheet"><div class="tt-sh-h"><b>${esc(pt('hero'))}</b><small>${esc(pt('hero_d'))}</small></div>
    <div class="hx-picks">${HERO_STYLES.map((k) => `<button class="hx-pick ${k === cur ? 'on' : ''}" data-pa="hero-set" data-v="${k}"><i class="hx-thumb th-${k}"><s></s><u></u></i><span><b>${esc(pt('hx_' + k))}</b><small>${esc(pt(`hx_${k}_d`))}</small></span>${k === cur ? `<span class="p-check">${icon('check')}</span>` : ''}</button>`).join('')}</div></div>`);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-pa="hero-pick"], [data-pa="hero-set"]');
  if (!a) return;
  if (a.dataset.pa === 'hero-pick') { heroPicker(); return; }
  tbSet('waqt-hero', a.dataset.v);
  qSheetClose();
  nativeUi('haptic');
  if (route() === 'today') buildHero(); else render();
});
