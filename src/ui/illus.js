'use strict';
// Waqt on phones: illustrated Today cards — Madinah (the Green Dome), Makkah
// (the Kaaba, tawaf circling) and Al-Aqsa (the Dome of the Rock). The sky
// follows the real time of day: dawn, bright noon, golden Asr, Maghrib, and
// a starry night when the buildings light up. Loaded after hero.js.

Object.assign(PT.en, {
  hx_madinah: 'Madinah', hx_madinah_d: "The Green Dome under today's sky",
  hx_makkah: 'Makkah', hx_makkah_d: 'The Kaaba, with tawaf circling',
  hx_aqsa: 'Al-Aqsa', hx_aqsa_d: 'The Dome of the Rock, Jerusalem',
});
Object.assign(PT.bn, {
  hx_madinah: 'মদিনা', hx_madinah_d: 'আজকের আকাশের নিচে সবুজ গম্বুজ',
  hx_makkah: 'মক্কা', hx_makkah_d: 'কাবা ও তাওয়াফ',
  hx_aqsa: 'আল-আকসা', hx_aqsa_d: 'জেরুজালেমের কুব্বাতুস সাখরা',
});
HERO_STYLES.push('madinah', 'makkah', 'aqsa');

/// Sky colours (top, middle, horizon) for each part of the day.
const ILL_SKY = {
  fajr: ['#121842', '#3a3876', '#d39185'], sunrise: ['#3a6db6', '#86b3df', '#f5dcaa'], dhuhr: ['#2468bd', '#5b9de0', '#c4e3f6'],
  asr: ['#2c62b0', '#78a5d8', '#f3cf93'], maghrib: ['#211a50', '#7a4886', '#f2895a'], isha: ['#040920', '#0b1536', '#1b2a58'],
};
const f2 = (n) => n.toFixed(1);

/// Sky, sun or moon, and stars, as the time of day has them now.
function illSky(x, moonX = 330) {
  const k = x.curKey, [a, b, c] = ILL_SKY[k] || ILL_SKY.isha;
  const night = k === 'isha', dawn = k === 'fajr';
  let s = `<defs><linearGradient id="ilsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <radialGradient id="ilsun"><stop offset="0" stop-color="#fffbe8"/><stop offset=".25" stop-color="#ffe7a6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="ilglow"><stop offset="0" stop-color="#ffe09a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe09a" stop-opacity="0"/></radialGradient>
    <mask id="ilmoon"><circle cx="${moonX}" cy="62" r="14" fill="#fff"/><circle cx="${moonX + 6}" cy="57" r="12" fill="#000"/></mask></defs>
    <rect width="400" height="380" fill="url(#ilsky)"/>`;
  if (night || dawn) {
    const rnd = seeded(11);
    for (let i = 0; i < 46; i++) {
      const sx = 60 + rnd() * 340, sy = rnd() * 200, r = 0.4 + rnd() * 1.1;
      s += `<circle class="il-star" cx="${f2(sx)}" cy="${f2(sy)}" r="${f2(r)}" style="animation-delay:${f2(rnd() * 4)}s;opacity:${dawn ? 0.35 : 0.9}"/>`;
    }
  }
  if (night) s += `<circle cx="${moonX}" cy="62" r="34" fill="url(#ilglow)" opacity=".5"/><circle cx="${moonX}" cy="62" r="14" fill="#f6f0d8" mask="url(#ilmoon)"/>`;
  else if (!dawn) {
    const T0 = x.T0, f = Math.min(1, Math.max(0, (x.now - T0.sunrise) / (T0.maghrib - T0.sunrise)));
    const sx = 205 + 160 * f, sy = 236 - 176 * Math.sin(Math.PI * f), low = f < 0.12 || f > 0.86;
    s += `<circle cx="${f2(sx)}" cy="${f2(sy)}" r="${low ? 46 : 38}" fill="url(#ilsun)" opacity="${low ? 0.95 : 0.8}"/><circle cx="${f2(sx)}" cy="${f2(sy)}" r="${low ? 14 : 11}" fill="${low ? '#ffbe73' : '#fff6d6'}"/>`;
  }
  return s;
}

/// Light and stone colours: daylight, or lit up at night.
function illTone(x) {
  const night = x.curKey === 'isha' || x.curKey === 'fajr';
  return night
    ? { night, wall: '#e3cf9f', shade: '#c4ab74', line: '#a98f5a', win: '#ffd772', far: '#151b3c', floor: '#cfc6b0', dark: '#2b2946' }
    : { night, wall: '#f3ead6', shade: '#ddd0b2', line: '#c7b68d', win: '#8d7a55', far: '#9d8f7c', floor: '#ece6d8', dark: '#cbbb98' };
}

/// A minaret: shaft, two balconies, a pointed cap and a crescent; lit at night.
function illMinaret(cx, top, base, w, t, cap) {
  const h = base - top, b1 = top + h * 0.3, b2 = top + h * 0.55;
  return `<g><rect x="${cx - w / 2}" y="${top + 12}" width="${w}" height="${base - top - 12}" fill="${t.wall}"/>
    <rect x="${cx}" y="${top + 12}" width="${w / 2}" height="${base - top - 12}" fill="${t.shade}"/>
    <rect x="${cx - w / 2 - 3}" y="${f2(b1)}" width="${w + 6}" height="4" fill="${t.wall}"/><rect x="${cx - w / 2 - 3}" y="${f2(b2)}" width="${w + 6}" height="4" fill="${t.wall}"/>
    <rect x="${cx - w / 2 - 2}" y="${top + 10}" width="${w + 4}" height="4" fill="${t.wall}"/>
    <polygon points="${cx - w / 2 - 1},${top + 11} ${cx + w / 2 + 1},${top + 11} ${cx},${top - 10}" fill="${cap || t.shade}"/>
    <line x1="${cx}" y1="${top - 10}" x2="${cx}" y2="${top - 19}" stroke="#d6b25c" stroke-width="1.4"/><circle cx="${cx}" cy="${top - 20}" r="1.8" fill="#e2bf63"/>
    ${t.night ? `<rect x="${cx - w / 2 - 3}" y="${f2(b1 + 4)}" width="${w + 6}" height="2" fill="${t.win}" opacity=".9"/><rect x="${cx - w / 2 - 3}" y="${f2(b2 + 4)}" width="${w + 6}" height="2" fill="${t.win}" opacity=".9"/>` : ''}</g>`;
}

/// A row of pointed arches on a wall.
function illArches(x0, x1, y, h, step, t) {
  let s = '';
  for (let ax = x0 + step / 2; ax < x1 - 4; ax += step) {
    const w = step * 0.5;
    s += `<path d="M${f2(ax - w / 2)} ${y + h} V${f2(y + h * 0.42)} Q${f2(ax - w / 2)} ${y} ${f2(ax)} ${y - 2} Q${f2(ax + w / 2)} ${y} ${f2(ax + w / 2)} ${f2(y + h * 0.42)} V${y + h}Z" fill="${t.night ? t.win : t.line}" opacity="${t.night ? 0.85 : 0.55}"/>`;
  }
  return s;
}

/// The courtyard umbrellas of Masjid an-Nabawi: open by day, folded at night.
function illUmbrella(cx, y, t) {
  if (t.night) return `<g><rect x="${cx - 1.5}" y="${y - 30}" width="3" height="${380 - y + 30}" fill="#d7d0bf"/><path d="M${cx - 5} ${y - 6} L${cx} ${y - 44} L${cx + 5} ${y - 6}Z" fill="#efe9da"/><path d="M${cx} ${y - 44} L${cx + 5} ${y - 6} L${cx} ${y - 4}Z" fill="#cfc6b0"/></g>`;
  return `<g><rect x="${cx - 1.5}" y="${y - 22}" width="3" height="${380 - y + 22}" fill="#cfc6b2"/>
    <path d="M${cx - 38} ${y} Q${cx - 22} ${y - 6} ${cx} ${y - 26} Q${cx + 22} ${y - 6} ${cx + 38} ${y} Q${cx} ${y - 8} ${cx - 38} ${y}Z" fill="#fbf8f0"/>
    <path d="M${cx} ${y - 26} Q${cx + 22} ${y - 6} ${cx + 38} ${y} Q${cx + 18} ${y - 5} ${cx} ${y - 4}Z" fill="#e3dccb"/></g>`;
}

function illPalm(cx, base, h) {
  const top = base - h;
  let s = `<path d="M${cx} ${base} Q${cx - 4} ${base - h / 2} ${cx + 2} ${top}" stroke="#6b5233" stroke-width="4" fill="none"/>`;
  for (const [dx, dy] of [[-24, 8], [-18, -6], [0, -12], [18, -6], [24, 8], [-10, 14], [12, 14]]) s += `<path d="M${cx + 2} ${top} Q${cx + 2 + dx * 0.6} ${top + dy - 8} ${cx + 2 + dx} ${top + dy}" stroke="#2f6b3e" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  return s;
}

const ILL = {
  madinah(x) {
    const t = illTone(x);
    const dome = t.night ? ['#4fd18c', '#16804a'] : ['#41b878', '#136b3e'];
    let s = illSky(x);
    s += `<defs><linearGradient id="ildome" x1="0" x2="1"><stop offset="0" stop-color="${dome[0]}"/><stop offset="1" stop-color="${dome[1]}"/></linearGradient></defs>`;
    // Mount Uhud on the horizon.
    s += `<path d="M60 300 L100 262 L128 272 L168 238 L204 262 L236 252 L270 290 L270 310 L60 310Z" fill="${t.far}" opacity="${t.night ? 0.9 : 0.5}"/>`;
    s += illMinaret(344, 92, 300, 13, t, t.night ? '#cdb98a' : '#d9cfb8') + illMinaret(392, 120, 300, 12, t, t.night ? '#cdb98a' : '#d9cfb8');
    // The mosque wall, arches and parapet.
    s += `<rect x="150" y="272" width="250" height="74" fill="${t.wall}"/><rect x="150" y="268" width="250" height="5" fill="${t.shade}"/>`;
    for (let px = 152; px < 400; px += 9) s += `<rect x="${px}" y="263" width="5" height="6" fill="${t.wall}"/>`;
    s += illArches(150, 400, 288, 34, 22, t);
    // Small silver domes.
    s += `<path d="M216 272 A14 14 0 0 1 244 272Z" fill="${t.night ? '#d9d4c6' : '#cfd3d6'}"/><path d="M346 272 A15 15 0 0 1 376 272Z" fill="${t.night ? '#d9d4c6' : '#cfd3d6'}"/>`;
    // The Green Dome on its drum.
    s += `${t.night ? '<circle cx="290" cy="214" r="60" fill="url(#ilglow)" opacity=".55"/>' : ''}
      <rect x="262" y="230" width="56" height="42" fill="${t.wall}"/><rect x="290" y="230" width="28" height="42" fill="${t.shade}"/>
      ${[268, 279, 297, 308].map((wx) => `<path d="M${wx} 264 V250 Q${wx + 3} 244 ${wx + 6} 250 V264Z" fill="${t.night ? t.win : t.line}" opacity=".8"/>`).join('')}
      <rect x="258" y="226" width="64" height="6" fill="${t.wall}"/>
      <path d="M262 228 C260 196 280 180 290 164 C300 180 320 196 318 228Z" fill="url(#ildome)"/>
      <path d="M290 164 C285 186 280 206 278 228 M290 164 C295 186 300 206 302 228" stroke="rgba(0,0,0,.18)" stroke-width="1.2" fill="none"/>
      <path d="M268 210 C272 190 280 180 288 170" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="290" y1="164" x2="290" y2="148" stroke="#e2bf63" stroke-width="2"/><circle cx="290" cy="154" r="2.6" fill="#e2bf63"/>
      <path d="M286 145 A5 5 0 1 0 294 145 A3.8 3.8 0 1 1 286 145Z" fill="#e2bf63"/>`;
    // Marble courtyard, palms and umbrellas.
    s += `<rect x="0" y="342" width="400" height="38" fill="${t.floor}"/><rect x="0" y="342" width="400" height="2" fill="${t.shade}"/>`;
    s += illPalm(112, 342, 58);
    for (const ux of [150, 228, 306, 384]) s += illUmbrella(ux, 330, t);
    return s;
  },

  makkah(x) {
    const t = illTone(x);
    const tower = t.night ? ['#2e2c49', '#24223b'] : ['#d3c3a2', '#b9a682'];
    // The moon keeps clear of the clock tower's spire.
    let s = illSky(x, 382);
    // The mountains of Makkah.
    s += `<path d="M60 310 L104 262 L140 282 L178 248 L216 286 L216 310Z" fill="${t.far}" opacity="${t.night ? 0.95 : 0.55}"/><path d="M360 300 L400 270 L400 310 L360 310Z" fill="${t.far}" opacity="${t.night ? 0.95 : 0.55}"/>`;
    // The clock tower.
    let wins = '';
    if (t.night) for (let wy = 160; wy < 292; wy += 9) for (let wx = 309; wx < 352; wx += 7) if ((wx * 7 + wy * 3) % 5 < 3) wins += `<rect x="${wx}" y="${wy}" width="2.5" height="3" fill="${t.win}" opacity=".75"/>`;
    s += `<rect x="285" y="200" width="22" height="100" fill="${tower[1]}"/><rect x="354" y="214" width="26" height="86" fill="${tower[1]}"/>
      <rect x="304" y="150" width="52" height="150" fill="${tower[0]}"/><rect x="330" y="150" width="26" height="150" fill="${tower[1]}" opacity=".6"/>
      <rect x="313" y="104" width="34" height="48" fill="${tower[0]}"/>${wins}
      <circle cx="330" cy="127" r="13" fill="${t.night ? '#c9f7dc' : '#f6f2e6'}" ${t.night ? 'style="filter:drop-shadow(0 0 6px #8ff0b8)"' : ''}/>
      <line x1="330" y1="127" x2="330" y2="118" stroke="#2b2b2b" stroke-width="1.4"/><line x1="330" y1="127" x2="337" y2="129" stroke="#2b2b2b" stroke-width="1.4"/>
      <rect x="320" y="84" width="20" height="21" fill="${tower[0]}"/><polygon points="322,85 338,85 330,34" fill="${t.night ? '#d8b866' : '#c9a24e'}"/>
      <path d="M326 28 A5 5 0 1 0 334 28 A3.8 3.8 0 1 1 326 28Z" fill="#e2bf63"/>`;
    s += illMinaret(272, 150, 300, 9, t) + illMinaret(396, 140, 300, 9, t);
    // The Haram's arcades.
    s += `<rect x="60" y="292" width="340" height="34" fill="${t.wall}"/><rect x="60" y="289" width="340" height="4" fill="${t.shade}"/>` + illArches(60, 400, 300, 24, 16, t);
    // The mataf, tawaf and the Kaaba.
    s += `<ellipse cx="222" cy="362" rx="210" ry="34" fill="${t.night ? '#e9e4d6' : '#f5f2ea'}"/>`;
    s += [[52, 9, 0], [80, 14, 1], [112, 19, 2], [146, 25, 3]].map(([rx, ry, i]) => `<ellipse class="il-tawaf" cx="222" cy="350" rx="${rx}" ry="${ry}" style="animation-duration:${14 + i * 5}s" fill="none" stroke="${t.night ? '#6a6458' : '#7d776a'}" stroke-width="2.2" stroke-dasharray="1.4 3.6" stroke-linecap="round"/>`).join('');
    s += `<g>${t.night ? '<ellipse cx="222" cy="330" rx="46" ry="26" fill="url(#ilglow)" opacity=".5"/>' : ''}
      <polygon points="200,302 234,308 254,301 220,296" fill="#2c2c2c"/>
      <polygon points="200,302 234,308 234,352 200,346" fill="#111"/>
      <polygon points="234,308 254,301 254,345 234,352" fill="#1c1c1c"/>
      <polygon points="200,311 234,317 234,322 200,316" fill="#d4a841"/><polygon points="234,317 254,310 254,315 234,322" fill="#b48c31"/>
      ${[204, 210, 216, 222, 228].map((bx) => `<rect x="${bx}" y="${f2(313 + (bx - 200) * 0.18)}" width="3" height="1.2" fill="#2c2410" opacity=".7"/>`).join('')}
      <polygon points="222,330 229,331.2 229,349 222,347.8" fill="#d4a841"/>
      <path d="M256 338 Q272 344 266 352" stroke="#f2efe6" stroke-width="3" fill="none"/></g>`;
    return s;
  },

  aqsa(x) {
    const t = illTone(x);
    const tile = t.night ? ['#2c5aa6', '#1f437f', '#3d6fbf'] : ['#2f64b8', '#244f96', '#4a7fd0'];
    let s = illSky(x);
    s += `<defs><linearGradient id="ilgold" x1="0" x2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="#e5b443"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>`;
    // The Mount of Olives behind.
    s += `<path d="M90 300 Q170 252 250 272 T400 258 L400 310 L90 310Z" fill="${t.night ? '#1a2240' : '#8f9a78'}" opacity="${t.night ? 0.95 : 0.55}"/>`;
    // The stone platform and its arcade.
    const stone = t.night ? ['#cdbf9c', '#a9997a'] : ['#ece2c8', '#d3c5a3'];
    s += `<rect x="80" y="300" width="320" height="30" fill="${stone[0]}"/><rect x="80" y="300" width="320" height="3" fill="${stone[1]}"/>`;
    s += `<rect x="120" y="262" width="96" height="38" fill="${stone[0]}"/>` + illArches(120, 216, 270, 30, 24, { ...t, line: stone[1] });
    // Cypress and olive trees.
    const cy = (cx, h) => `<ellipse cx="${cx}" cy="${300 - h / 2}" rx="${h / 8}" ry="${h / 2}" fill="${t.night ? '#16352a' : '#2f5d3c'}"/>`;
    s += cy(236, 62) + cy(376, 74) + cy(396, 56);
    s += `<circle cx="104" cy="280" r="18" fill="${t.night ? '#22402f' : '#6f8c52'}"/><rect x="102" y="292" width="4" height="10" fill="#5b4630"/>`;
    // The Dome of the Rock.
    let win = '';
    for (let wx = 262; wx < 350; wx += 12) win += `<path d="M${wx} 292 V278 Q${wx + 3} 272 ${wx + 6} 278 V292Z" fill="${t.night ? t.win : '#e8f0fb'}" opacity="${t.night ? 0.9 : 0.75}"/>`;
    s += `${t.night ? '<circle cx="305" cy="214" r="70" fill="url(#ilglow)" opacity=".6"/>' : ''}
      <rect x="254" y="254" width="102" height="46" fill="${tile[0]}"/><rect x="254" y="254" width="20" height="46" fill="${tile[2]}"/><rect x="336" y="254" width="20" height="46" fill="${tile[1]}"/>
      <rect x="254" y="252" width="102" height="5" fill="#efe8d4"/><rect x="254" y="295" width="102" height="5" fill="#efe8d4"/>${win}
      <rect x="272" y="228" width="66" height="26" fill="${tile[0]}"/><rect x="272" y="228" width="12" height="26" fill="${tile[2]}"/><rect x="326" y="228" width="12" height="26" fill="${tile[1]}"/>
      ${[280, 292, 304, 316, 328].map((wx) => `<rect x="${wx}" y="236" width="4" height="10" rx="2" fill="${t.night ? t.win : '#e8f0fb'}" opacity=".8"/>`).join('')}
      <rect x="270" y="226" width="70" height="4" fill="#efe8d4"/>
      <path d="M272 228 C270 196 290 178 305 172 C320 178 340 196 338 228Z" fill="url(#ilgold)"/>
      <path d="M280 214 C284 196 294 184 302 178" stroke="rgba(255,255,255,.55)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <line x1="305" y1="172" x2="305" y2="158" stroke="#e2bf63" stroke-width="2"/><path d="M301 155 A5 5 0 1 0 309 155 A3.8 3.8 0 1 1 301 155Z" fill="#e2bf63"/>`;
    s += `<rect x="0" y="330" width="400" height="50" fill="${t.night ? '#a59777' : '#ddd0b3'}"/>`;
    for (let lx = 0; lx < 400; lx += 26) s += `<rect x="${lx}" y="${330 + ((lx / 26) % 2) * 12}" width="24" height="1" fill="rgba(0,0,0,.08)"/>`;
    return s;
  },
};

const heroHTMLBase = heroHTML;
heroHTML = function heroHTMLIllustrated(style) {
  if (!ILL[style]) return heroHTMLBase(style);
  const x = heroNow(), d = x.d;
  const name = `<b>${esc(pname(x.n.key, x.fri))}</b><span class="ar">${parab(x.n.key, x.fri)}</span>`;
  const at = `${t('at')} ${fmtTime(x.n.at, x.off)}`.trim();
  return `<svg class="il-art" viewBox="0 0 400 380" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${ILL[style](x)}</svg>
    <div class="il-shade"></div>
    <div class="hx-sky il-text">${heroBtn()}
      <div class="hx-date">${heroDate(d)}</div>
      <div class="hx-lbl">${esc(t('next_prayer'))}</div>
      <div class="hx-name">${name}</div>
      <div class="hx-cd" id="hx-cd">${x.cd}</div>
      <div class="hx-at">${esc(at)}</div>
      <div class="il-prog"><div class="hx-prog"><i id="hx-bar" style="width:${x.frac * 100}%"></i></div><span id="hx-left">${esc(x.cur)} · ${esc(x.left)} ${esc(t('time_left'))}</span></div>
    </div>`;
};
