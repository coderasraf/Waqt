'use strict';
// Waqt Duas and Prayer tracker, redesigned for phones. Duas: the essential
// supplications as a scannable list; each opens on its own page with the
// Arabic, how to say it, its meaning and source, to copy or share. Tracker:
// today's five prayers as large buttons around a ring, the streak and
// consistency at a glance, the week as a grid of dots, each prayer's record,
// and six months of history. Replaces app.js's VIEWS.duas and VIEWS.tracker.

const DYT = {
  duas_sub: ['Essential supplications for prayer and daily life', 'নামাজ ও দৈনন্দিন জীবনের প্রয়োজনীয় দোয়া'],
  more: ['All duas and azkar', 'সব দোয়া ও যিকির'], more_d: ['Hisnul Muslim — morning, evening, sleep and every occasion', 'হিসনুল মুসলিম — সকাল, সন্ধ্যা, ঘুম ও সব উপলক্ষ'],
  how: ['How to say it', 'উচ্চারণ'], meaning: ['Meaning', 'অর্থ'], copy: ['Copy', 'কপি'], share: ['Share', 'শেয়ার'], copied: ['Copied', 'কপি হয়েছে'],
  tr_sub: ['Tap a prayer to mark it', 'চিহ্নিত করতে নামাজে চাপ দিন'], today: ['Today', 'আজ'], of5: ['prayed', 'পড়া হয়েছে'],
  streak: ['Streak', 'ধারাবাহিকতা'], days: ['days', 'দিন'], best: ['Best', 'সেরা'], week7: ['Last 7 days', 'গত ৭ দিন'], month30: ['Last 30 days', 'গত ৩০ দিন'],
  qada: ['Qada left', 'বাকি কাজা'], made_up: ['Made one up', 'একটি আদায় করেছি'], week: ['This week', 'এই সপ্তাহ'], per: ['Each prayer · 30 days', 'প্রতি নামাজ · ৩০ দিন'],
  history: ['Six months', 'ছয় মাস'], less: ['Less', 'কম'], more_h: ['More', 'বেশি'], jamaah: ['in jamaah this month', 'এই মাসে জামাতে'],
};
const dyt = (k) => DYT[k][L() === 'bn' ? 1 : 0];

// ---------- Duas ----------
const DUA_LOOK = {
  after_adhan: ['mosque', '#d99a1e'], after_salah: ['pray', '#30a46c'], iftar: ['moon', '#8e4ec6'], qadr: ['star', '#5b5bd6'],
  enter_mosque: ['open', '#12a594'], leave_mosque: ['back', '#0091ff'], sleep: ['moonz', '#3f3db8'], wake: ['sunrise', '#f76b15'],
};

VIEWS.duas = async () => {
  const id = location.hash.replace(/^#\/?duas\/?/, '').split('/')[0];
  const d = DUAS.find((x) => x.k === id);
  if (d) return duaPage(d);
  const rows = DUAS.map((x) => {
    const [ic, color] = DUA_LOOK[x.k] || ['dua', '#8e4ec6'];
    return `<a class="p-row tap dy-row" href="#/duas/${x.k}">${tile(ic, color)}<span class="p-lab"><b>${esc(x.title[L() === 'bn' ? 1 : 0])}</b>
      <small class="dy-prev" dir="rtl" lang="ar">${x.ar}</small></span>${chev()}</a>`;
  }).join('');
  view.innerHTML = `<div class="p-page dy">${ptitle(t('duas'))}<p class="p-sub">${esc(dyt('duas_sub'))}</p>
    <div class="p-group">${rows}</div>
    <a class="dy-more" href="#/azkar">${tile('beads', '#30a46c')}<span class="p-lab"><b>${esc(dyt('more'))}</b><small>${esc(dyt('more_d'))}</small></span>${chev()}</a></div>`;
};

function duaPage(d) {
  const [ic, color] = DUA_LOOK[d.k] || ['dua', '#8e4ec6'];
  const i = DUAS.indexOf(d), prev = DUAS[i - 1], next = DUAS[i + 1];
  view.innerHTML = `<div class="p-page dy">${ptitle(d.title[L() === 'bn' ? 1 : 0], '#/duas')}
    <div class="dy-card" style="--dc:${color}">
      <span class="dy-ic">${icon(ic)}</span>
      <div class="dy-ar" dir="rtl" lang="ar">${d.ar}</div>
      <div class="dy-sec"><small>${esc(dyt('how'))}</small><p class="dy-tr">${esc(d.tr)}</p></div>
      <div class="dy-sec"><small>${esc(dyt('meaning'))}</small><p class="dy-mn">${esc(L() === 'bn' ? d.bn : d.en)}</p></div>
      <div class="dy-src">${esc(d.src)}</div>
    </div>
    <div class="dy-acts"><button class="btn ghost" data-dy="copy" data-k="${d.k}">${icon('copy')}${esc(dyt('copy'))}</button><button class="btn ghost" data-dy="share" data-k="${d.k}">${icon('share')}${esc(dyt('share'))}</button></div>
    <div class="pr-nav">${prev ? `<a href="#/duas/${prev.k}">${icon('chevL')}<span><small>${esc(L() === 'bn' ? 'আগের' : 'Previous')}</small><b>${esc(prev.title[L() === 'bn' ? 1 : 0])}</b></span></a>` : '<span></span>'}
      ${next ? `<a class="nx" href="#/duas/${next.k}"><span><small>${esc(L() === 'bn' ? 'পরের' : 'Next')}</small><b>${esc(next.title[L() === 'bn' ? 1 : 0])}</b></span>${icon('chevR')}</a>` : '<span></span>'}</div></div>`;
}

// ---------- Prayer tracker ----------
VIEWS.tracker = async (tok) => {
  const r = await api('/api/tracker?days=190');
  if (!live(tok)) return;
  const today = r.today, st = r.stats;
  const dayKey = (i) => { const [y, m, d] = today.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10); };
  const todayS = r.days[today] || [0, 0, 0, 0, 0];
  const prayed = todayS.filter((v) => v >= 1 && v <= 3).length;
  const pct = (v) => `${N(Math.round(v * 100))}%`;
  const fri = new Date(`${today}T12:00:00Z`).getUTCDay() === 5;
  // Today: five buttons, and a ring for how many are done.
  const R = 44, C = 2 * Math.PI * R;
  const btns = PRAYERS.map((p, i) => `<button class="tk-p s${todayS[i]}" data-act="track" data-i="${i}" data-date="${today}" aria-label="${esc(pname(p, fri))}: ${esc(t('st' + todayS[i]))}">
    <span class="tk-c">${todayS[i] === 4 ? icon('x') : todayS[i] ? icon('check') : icon(p)}</span><b>${esc(pname(p, fri))}</b></button>`).join('');
  // The week: a row per day, a dot per prayer.
  let week = `<span></span>${PRAYERS.map((p) => `<span class="tk-wh">${esc(pname(p))}</span>`).join('')}`;
  for (let i = 6; i >= 0; i--) {
    const k = dayKey(i), s = r.days[k] || [0, 0, 0, 0, 0];
    const wd = new Date(`${k}T12:00:00Z`).getUTCDay();
    week += `<span class="tk-wd ${i === 0 ? 'on' : ''}">${esc(WD_SHORT[L()][wd])} <i>${N(+k.slice(8))}</i></span>` + s.map((v, j) => `<button class="tk-dot s${v}" data-act="track" data-i="${j}" data-date="${k}" aria-label="${esc(t('st' + v))}">${v === 4 ? icon('x') : v ? icon('check') : ''}</button>`).join('');
  }
  // Six months: a column per week.
  const [ty, tm, td] = today.split('-').map(Number);
  const total = 25 * 7 + new Date(Date.UTC(ty, tm - 1, td)).getUTCDay() + 1;
  const cells = [];
  for (let i = total - 1; i >= 0; i--) {
    const s = r.days[dayKey(i)];
    cells.push(`<i class="${s ? `l${s.filter((v) => v >= 1 && v <= 3).length}` : ''}"></i>`);
  }
  view.innerHTML = `<div class="p-page tk">${ptitle(t('tracker'))}<p class="p-sub">${esc(dyt('tr_sub'))}</p>
    <div class="tk-today">
      <div class="tk-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="${R}" class="bg"/><circle cx="50" cy="50" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - prayed / 5)}"/></svg>
        <div><b>${N(prayed)}<small>/${N(5)}</small></b><span>${esc(dyt('of5'))}</span></div></div>
      <div class="tk-ps">${btns}</div>
      <div class="tk-key">${[1, 2, 3, 4].map((s) => `<span><i class="s${s}"></i>${esc(t('st' + s))}</span>`).join('')}</div>
    </div>
    <div class="tk-stats">
      <div class="tk-st"><span class="tk-l">${icon('flame')}${esc(dyt('streak'))}</span><b>${N(st.streak)}<small> ${esc(dyt('days'))}</small></b><small>${esc(dyt('best'))} ${N(st.best_streak)}</small></div>
      <div class="tk-st"><span class="tk-l">${icon('chart')}${esc(dyt('week7'))}</span><b>${pct(st.week)}</b><span class="tk-bar"><i style="width:${st.week * 100}%"></i></span></div>
      <div class="tk-st"><span class="tk-l">${icon('calendar')}${esc(dyt('month30'))}</span><b>${pct(st.month)}</b><small>${N(st.jamaah_month)} ${esc(dyt('jamaah'))}</small></div>
      <div class="tk-st"><span class="tk-l">${icon('undo')}${esc(dyt('qada'))}</span><b>${N(st.qada_left)}</b>${st.qada_left ? `<button class="tk-mini" data-act="qada">${icon('check')}${esc(dyt('made_up'))}</button>` : '<small>—</small>'}</div>
    </div>
    <div class="p-head">${esc(dyt('week'))}</div>
    <div class="tk-card"><div class="tk-week">${week}</div></div>
    <div class="p-head">${esc(dyt('per'))}</div>
    <div class="tk-card tk-per">${PRAYERS.map((p, i) => `<div><span>${esc(pname(p))}</span><span class="tk-bar"><i style="width:${st.per_prayer[i] * 100}%"></i></span><b>${pct(st.per_prayer[i])}</b></div>`).join('')}</div>
    <div class="p-head">${esc(dyt('history'))}</div>
    <div class="tk-card"><div class="tk-heat">${cells.join('')}</div>
      <div class="tk-hk"><span>${esc(dyt('less'))}</span>${[0, 1, 2, 3, 4, 5].map((n) => `<i class="l${n}"></i>`).join('')}<span>${esc(dyt('more_h'))}</span></div></div></div>`;
  const heat = $('.tk-heat');
  if (heat) heat.scrollLeft = heat.scrollWidth;
};

document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-dy]');
  if (!a) return;
  const d = DUAS.find((x) => x.k === a.dataset.k);
  if (!d) return;
  const text = `${d.title[L() === 'bn' ? 1 : 0]}\n\n${d.ar}\n\n${d.tr}\n\n${L() === 'bn' ? d.bn : d.en}\n— ${d.src}`;
  try {
    if (a.dataset.dy === 'copy') { await post('/api/quran/copy', { text }); toast(dyt('copied')); }
    else await post('/api/quran/share', { text });
  } catch (err) { toast(err.message); }
});
