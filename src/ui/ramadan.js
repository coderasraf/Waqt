'use strict';
// Waqt Ramadan, fasting and Zakat (phones).
// Ramadan: during the month, the Sehri / Iftar countdown, a 30-day fasting
// and taraweeh tracker, the last ten nights, and the duas; before it, a
// countdown with preparation (khatm plan, missed fasts) and the next sunnah
// fasts from the Hijri calendar.
// Zakat: a calculator on the silver or gold nisab with Bangladeshi units
// (vori), Zakat al-Fitr for the family, and a sadaqah log.
// Loaded after azkar.js (uses azStore) and qplus.js.

const RT = {
  ramadan: ['Ramadan & fasting', 'রমজান ও রোজা'], zakat: ['Zakat & sadaqah', 'যাকাত ও সদকা'], day: ['Day', 'দিন'], of: ['of', '/'],
  iftar_in: ['Iftar in', 'ইফতার বাকি'], sehri_in: ['Sehri ends in', 'সাহরি শেষ হতে বাকি'], sehri: ['Sehri ends', 'সাহরির শেষ সময়'], iftar: ['Iftar', 'ইফতার'],
  fasts: ['Your fasts', 'আপনার রোজা'], fasted: ['Fasted', 'রোজা রেখেছি'], missed: ['Missed', 'রাখা হয়নি'], taraweeh: ['Taraweeh', 'তারাবীহ'], tap_day: ['Tap a day to mark it', 'দিন চিহ্নিত করতে চাপুন'],
  last10: ['The last ten nights', 'শেষ দশ রাত'], odd: ['Seek Laylat al-Qadr in the odd nights', 'বেজোড় রাতে লাইলাতুল কদর তালাশ করুন'], tonight: ['Tonight', 'আজ রাত'],
  duas: ['Duas of Ramadan', 'রমজানের দোয়া'], iftar_dua: ['At iftar', 'ইফতারের সময়'], qadr_dua: ['On Laylat al-Qadr', 'লাইলাতুল কদরে'],
  until: ['until Ramadan', 'রমজান আসতে'], days: ['days', 'দিন'], begins: ['Ramadan 1448 is expected to begin', 'রমজান ১৪৪৮ শুরু হতে পারে'],
  prepare: ['Prepare', 'প্রস্তুতি'], plan_khatm: ['Plan a khatm by the end of Ramadan', 'রমজানের শেষে খতমের পরিকল্পনা'], qada: ['Missed fasts to make up', 'কাযা রোজা'],
  qada_d: ['Fasts you owe from before', 'আগের বাকি রোজা'], sunnah: ['Coming sunnah fasts', 'আগামী সুন্নত রোজা'], monday: ['Monday', 'সোমবার'], thursday: ['Thursday', 'বৃহস্পতিবার'],
  white_days: ['White days (13–15)', 'আইয়ামে বীয (১৩–১৫)'], sehri_alarm: ['Sehri alarm', 'সাহরির অ্যালার্ম'], set: ['Set', 'চালু'], fitrah: ['Zakat al-Fitr', 'ফিতরা'],
  calc: ['Calculate zakat', 'যাকাত হিসাব'], assets: ['What you own', 'আপনার সম্পদ'], debts: ['Debts due now', 'পরিশোধযোগ্য ঋণ'], cash: ['Cash and bank balance', 'নগদ ও ব্যাংক'],
  gold: ['Gold', 'স্বর্ণ'], silver: ['Silver', 'রূপা'], business: ['Business stock', 'ব্যবসার পণ্য'], receivable: ['Money others owe you', 'পাওনা টাকা'], invest: ['Shares and savings schemes', 'শেয়ার ও সঞ্চয়পত্র'],
  vori: ['vori', 'ভরি'], price: ['Price per vori', 'প্রতি ভরির দাম'], nisab: ['Nisab', 'নিসাব'], nisab_by: ['Nisab by', 'নিসাবের মাপ'], silver_n: ['Silver (52.5 tola)', 'রূপা (৫২.৫ তোলা)'], gold_n: ['Gold (7.5 tola)', 'স্বর্ণ (৭.৫ তোলা)'],
  total: ['Zakatable wealth', 'যাকাতযোগ্য সম্পদ'], due: ['Zakat due', 'প্রদেয় যাকাত'], below: ['Below the nisab — no zakat is due.', 'নিসাবের কম — যাকাত ফরজ নয়।'],
  above: ['Above the nisab, held for a lunar year: 2.5% is due.', 'নিসাব পরিমাণ, এক চান্দ্র বছর পূর্ণ হলে ২.৫% যাকাত ফরজ।'], prices_note: ['Enter today\'s prices from your jeweller or BAJUS.', 'আজকের দাম জুয়েলার্স বা বাজুস থেকে দেখে লিখুন।'],
  members: ['People in the family', 'পরিবারের সদস্য'], per_person: ['Per person (taka)', 'জনপ্রতি (টাকা)'], fitrah_note: ['Islamic Foundation announces the amount each Ramadan; the minimum is shown — those who can, give more (dates, raisins, cheese).', 'ইসলামিক ফাউন্ডেশন প্রতি রমজানে পরিমাণ ঘোষণা করে; এখানে সর্বনিম্ন দেখানো হলো — সামর্থ্যবানরা খেজুর, কিসমিস বা পনির হিসেবে বেশি দিন।'],
  sadaqah: ['Sadaqah log', 'সদকার হিসাব'], add: ['Add', 'যোগ করুন'], amount: ['Amount', 'পরিমাণ'], note: ['For what (optional)', 'কিসের জন্য (ঐচ্ছিক)'], this_year: ['This year', 'এই বছর'],
  disclaimer: ['A guide for common cases. For land, gold given as mahr, or a business, ask a scholar.', 'সাধারণ ক্ষেত্রে সহায়িকা। জমি, মোহরের গহনা বা ব্যবসার জটিল হিসাবে আলেমের পরামর্শ নিন।'],
  remove: ['Remove', 'মুছুন'], taka: ['৳', '৳'],
};
const rt = (k) => tr2(RT[k]);
/// The sun or moon art, kept to the right so the text has room.
const rArt = (night) => (night ? azMoonArt() : azSunArt()).replace('<svg viewBox="0 0 120 80"', '<svg viewBox="0 0 120 80" preserveAspectRatio="xMaxYMin slice"');
const tk = (n) => `৳${N(Math.round(n).toLocaleString('en-IN'))}`;
const VORI = 11.664; // grams in a vori (tola)

const RDUAS = {
  iftar: { ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللّٰهُ', tr: "Dhahaba-ẓ-ẓama'u wa-btallati-l-'urūqu wa thabata-l-ajru in shā' Allāh", en: 'The thirst has gone, the veins are moistened, and the reward is assured, if Allah wills.', bn: 'পিপাসা দূর হয়েছে, শিরাগুলো সিক্ত হয়েছে এবং আল্লাহ চাহে তো প্রতিদান নিশ্চিত হয়েছে।', src: 'Abu Dawud 2357' },
  qadr: { ar: 'اللّٰهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي', tr: "Allāhumma innaka 'afuwwun tuḥibbu-l-'afwa fa'fu 'annī", en: 'O Allah, You are Pardoning and You love to pardon, so pardon me.', bn: 'হে আল্লাহ, আপনি ক্ষমাশীল, ক্ষমা করতে ভালোবাসেন, অতএব আমাকে ক্ষমা করুন।', src: 'Tirmidhi 3513' },
};
const rDua = (d, title) => `<div class="sg-rec"><div class="sg-rec-h"><b>${esc(title)}</b></div><div class="sg-ar" dir="rtl" lang="ar">${d.ar}</div><div class="sg-tr">${esc(d.tr)}</div><div class="sg-mean">${esc(B() ? d.bn : d.en)}</div><div class="sg-src">${esc(d.src)}</div></div>`;

Object.assign(IC, {
  crescent: '<path d="M15 3a9 9 0 1 0 6 15.5A7.5 7.5 0 0 1 15 3z"/>',
  coin: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1s4 1 6 1zm0 0c2-4 6-4 6-1s-4 1-6 1z"/>',
});

// =====================================================================
// Ramadan
// =====================================================================
VIEWS.ramadan = async (tok) => {
  const d = S.day || await loadToday();
  if (!live(tok)) return;
  return d.ramadan.active ? ramActive(tok) : ramBefore(tok);
};

function ramClock() {
  const d = S.day, r = d.ramadan, now = Date.now();
  // Before iftar today: count to iftar; after it: count to the next sehri.
  const toIftar = r.iftar - now, toSehri = r.sehri - now;
  const iftarFirst = toIftar > 0 && (toSehri <= 0 || r.iftar < r.sehri);
  const left = iftarFirst ? toIftar : toSehri;
  const [h, m, s] = hms(Math.max(0, left));
  return { label: iftarFirst ? rt('iftar_in') : rt('sehri_in'), cd: N(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`), iftarFirst };
}

async function ramActive(tok) {
  const d = S.day, r = d.ramadan, off = d.today.tz_offset;
  const y = d.hijri_now.y;
  const log = azStore.get(`fast-${y}`, {});
  const tar = azStore.get(`taraweeh-${y}`, {});
  const c = ramClock();
  const cells = [];
  for (let i = 1; i <= 30; i++) {
    const st = log[i], t = tar[i];
    cells.push(`<button class="rm-day ${st === 1 ? 'ok' : st === 2 ? 'miss' : ''} ${i === r.day ? 'today' : ''} ${i > r.day ? 'f' : ''} ${i > 20 ? 'l10' : ''}" data-ra="fast" data-i="${i}" ${i > r.day ? 'disabled' : ''}>
      <b>${N(i)}</b>${t ? '<i></i>' : ''}</button>`);
  }
  const night = r.day >= 20 ? r.day + 1 : 0;
  view.innerHTML = `<div class="p-page rm">${ptitle(rt('ramadan'))}
    <div class="rm-hero ${c.iftarFirst ? 'day' : 'night'}">${rArt(!c.iftarFirst)}
      <div class="rm-hero-t"><small>${esc(rt('day'))} ${N(r.day)} ${esc(rt('of'))} ${N(30)} · ${esc(hijriText(d.hijri_now))}</small><span>${esc(c.label)}</span><b id="rm-cd">${c.cd}</b>
        <div class="rm-two"><div><small>${esc(rt('sehri'))}</small><b>${fmtTime(r.sehri, off)}</b></div><div><small>${esc(rt('iftar'))}</small><b>${fmtTime(r.iftar, off)}</b></div></div></div></div>
    <div class="hx-prog rm-month"><i style="width:${(r.day / 30) * 100}%"></i></div>
    <div class="p-head">${esc(rt('fasts'))}</div>
    <div class="rm-grid">${cells.join('')}</div>
    <div class="rm-legend"><span><i class="ok"></i>${esc(rt('fasted'))}</span><span><i class="miss"></i>${esc(rt('missed'))}</span><span><i class="tw"></i>${esc(rt('taraweeh'))}</span><span class="muted">${esc(rt('tap_day'))}</span></div>
    ${night ? `<div class="rm-qadr">${icon('star')}<span><b>${esc(rt('last10'))}</b><small>${esc(rt('odd'))}${night % 2 ? ` · ${esc(rt('tonight'))}: ${N(night)}` : ''}</small></span></div>` : ''}
    <a class="qp-cont" href="#/quran/goal">${icon('book')}<span><b>${esc(rt('plan_khatm'))}</b></span>${icon('chevR')}</a>
    <div class="p-head">${esc(rt('duas'))}</div>${rDua(RDUAS.iftar, rt('iftar_dua'))}${rDua(RDUAS.qadr, rt('qadr_dua'))}</div>`;
  clearInterval(RT.tick);
  RT.tick = setInterval(() => { const el = $('#rm-cd'); if (!el || !S.day.ramadan.active) { clearInterval(RT.tick); return; } el.textContent = ramClock().cd; }, 1000);
}

async function ramBefore(tok) {
  const d = S.day, r = d.ramadan;
  // The next sunnah fasts, from this Hijri month and the next.
  const m1 = await api('/api/hmonth');
  const nm = m1.m === 12 ? [m1.y + 1, 1] : [m1.y, m1.m + 1];
  const m2 = await api(`/api/hmonth?y=${nm[0]}&m=${nm[1]}`);
  if (!live(tok)) return;
  const today = d.today.date;
  const fasts = [...m1.days, ...m2.days].filter((x) => x.date >= today && x.fasts.length).slice(0, 6);
  const events = (d.upcoming || []).filter((u) => u.event.kind === 'fast').slice(0, 3);
  const qada = azStore.get('qada-fasts', 0);
  const sehriOn = S.cfg.alerts?.sehri && S.cfg.alerts.sehri !== 'off';
  view.innerHTML = `<div class="p-page rm">${ptitle(rt('ramadan'))}
    <div class="rm-hero night">${rArt(true)}<div class="rm-hero-t"><small>${esc(rt('begins'))}</small><span>${esc(fmtGDate(r.starts))}</span><b>${N(r.days_left)}</b><small>${esc(rt('days'))} ${esc(rt('until'))}</small></div></div>
    <div class="p-head">${esc(rt('prepare'))}</div><div class="p-group">
      <a class="p-row tap" href="#/quran/goal">${tile('book', '#30a46c')}<span class="p-lab"><b>${esc(rt('plan_khatm'))}</b></span>${chev()}</a>
      <div class="p-row">${tile('moon', '#8e4ec6')}<span class="p-lab"><b>${esc(rt('qada'))}</b><small>${esc(rt('qada_d'))}</small></span><span class="stepper"><button data-ra="qada" data-d="-1">−</button><span>${N(qada)}</span><button data-ra="qada" data-d="1">+</button></span></div>
      <a class="p-row tap" href="#/settings/alerts">${tile('bell', '#e5484d')}<span class="p-lab"><b>${esc(rt('sehri_alarm'))}</b></span><span class="p-val">${esc(sehriOn ? t('in_ramadan') : t('off'))}</span>${chev()}</a></div>
    <div class="p-head">${esc(rt('sunnah'))}</div><div class="p-group">
      ${events.map((u) => `<div class="p-row">${tile('star', '#d99a1e')}<span class="p-lab"><b>${esc(L() === 'bn' ? u.event.bn : u.event.en)}</b><small>${esc(fmtGDate(u.date))}</small></span><span class="daysleft">${N(u.days_left)} ${esc(t('days'))}</span></div>`).join('')}
      ${fasts.map((x) => `<div class="p-row">${tile('crescent', '#5b5bd6')}<span class="p-lab"><b>${esc(x.fasts.map((f) => rt(f)).join(' · '))}</b><small>${esc(fmtGDate(x.date))} · ${N(x.d)} ${esc(L() === 'bn' ? m1.names.month_bn : m1.names.month_en)}</small></span></div>`).join('')}</div>
    <div class="p-head">${esc(rt('duas'))}</div>${rDua(RDUAS.iftar, rt('iftar_dua'))}</div>`;
}

// =====================================================================
// Zakat
// =====================================================================
const ZDEF = { cash: 0, goldV: 0, goldP: 145000, silverV: 0, silverP: 2400, business: 0, receivable: 0, invest: 0, debts: 0, by: 'silver', members: 1, fitrah: 110 };
const zk = () => ({ ...ZDEF, ...azStore.get('zakat', {}) });

function zCalc(z) {
  const gold = z.goldV * z.goldP, silver = z.silverV * z.silverP;
  const total = z.cash + gold + silver + z.business + z.receivable + z.invest - z.debts;
  // Nisab: 52.5 tola (612.36 g) silver or 7.5 tola (87.48 g) gold.
  const nisab = z.by === 'gold' ? 7.5 * z.goldP : 52.5 * z.silverP;
  return { total, nisab, due: total >= nisab ? total * 0.025 : 0 };
}

VIEWS.zakat = async () => {
  const z = zk(), c = zCalc(z);
  const row = (k, label, help) => `<label class="p-row zk-row">${help ? tile(help[0], help[1]) : ''}<span class="p-lab"><b>${esc(label)}</b></span><span class="zk-in"><i>৳</i><input class="input" inputmode="decimal" data-zk="${k}" value="${z[k] || ''}" placeholder="0"></span></label>`;
  const metal = (k, label, ic, col) => `<div class="p-row zk-metal">${tile(ic, col)}<div class="zk-m"><b>${esc(label)}</b>
    <div class="zk-mrow"><span class="zk-in sm"><input class="input" inputmode="decimal" data-zk="${k}V" value="${z[k + 'V'] || ''}" placeholder="0"><i>${esc(rt('vori'))}</i></span>
    <i class="zk-x">×</i><span class="zk-in"><i>৳</i><input class="input" inputmode="decimal" data-zk="${k}P" value="${z[k + 'P'] || ''}"></span></div>
    <small>${esc(rt('price'))}</small></div></div>`;
  const sad = azStore.get('sadaqah', []);
  const year = new Date().getFullYear();
  const yearTotal = sad.filter((x) => x.d.startsWith(String(year))).reduce((a, x) => a + x.a, 0);
  view.innerHTML = `<div class="p-page zk">${ptitle(rt('zakat'))}
    <div class="zk-result ${c.due ? 'due' : ''}" id="zk-result">${zResult(c)}</div>
    <div class="p-head">${esc(rt('nisab_by'))}</div><div class="p-group pad"><div class="p-seg wide" style="margin:0"><button class="${z.by === 'silver' ? 'on' : ''}" data-ra="by" data-v="silver">${esc(rt('silver_n'))}</button><button class="${z.by === 'gold' ? 'on' : ''}" data-ra="by" data-v="gold">${esc(rt('gold_n'))}</button></div></div>
    <div class="p-head">${esc(rt('assets'))}</div><div class="p-group">
      ${row('cash', rt('cash'), ['coin', '#30a46c'])}${metal('gold', rt('gold'), 'star', '#d99a1e')}${metal('silver', rt('silver'), 'star', '#8b9aab')}
      ${row('business', rt('business'), ['gift', '#0091ff'])}${row('receivable', rt('receivable'), ['undo', '#12a594'])}${row('invest', rt('invest'), ['chart', '#5b5bd6'])}</div>
    <div class="p-foot">${esc(rt('prices_note'))}</div>
    <div class="p-head">${esc(rt('debts'))}</div><div class="p-group">${row('debts', rt('debts'), ['minus', '#e5484d'])}</div>
    <div class="p-head">${esc(rt('fitrah'))}</div><div class="p-group">
      <div class="p-row"><span class="p-lab"><b>${esc(rt('members'))}</b></span><span class="stepper"><button data-ra="mem" data-d="-1">−</button><span>${N(z.members)}</span><button data-ra="mem" data-d="1">+</button></span></div>
      ${row('fitrah', rt('per_person'))}
      <div class="p-row"><span class="p-lab"><b>${esc(rt('fitrah'))}</b></span><span class="p-val t" id="zk-fitrah">${tk(z.members * z.fitrah)}</span></div></div>
    <div class="p-foot">${esc(rt('fitrah_note'))}</div>
    <div class="p-head">${esc(rt('sadaqah'))} · ${esc(rt('this_year'))} ${tk(yearTotal)}</div>
    <div class="p-group pad zk-sad"><input class="input" id="sd-a" inputmode="decimal" placeholder="${esc(rt('amount'))}"><input class="input" id="sd-n" placeholder="${esc(rt('note'))}"><button class="btn small gold" data-ra="sadd">${icon('plus')}${esc(rt('add'))}</button></div>
    ${sad.length ? `<div class="p-group" style="margin-top:8px">${sad.slice().reverse().slice(0, 20).map((x, i) => `<div class="p-row"><span class="p-lab"><b>${tk(x.a)}</b><small>${esc(x.n || '')} · ${esc(fmtGDate(x.d, false))}</small></span><button class="icon-btn" data-ra="sdel" data-i="${sad.length - 1 - i}">${icon('x')}</button></div>`).join('')}</div>` : ''}
    <div class="p-foot">${esc(rt('disclaimer'))}</div></div>`;
};

function zResult(c) {
  return `<small>${esc(rt('due'))}</small><b>${tk(c.due)}</b>
    <div class="zk-two"><div><small>${esc(rt('total'))}</small><span>${tk(Math.max(0, c.total))}</span></div><div><small>${esc(rt('nisab'))}</small><span>${tk(c.nisab)}</span></div></div>
    <p>${esc(c.due ? rt('above') : rt('below'))}</p>`;
}

// ---------- Events ----------
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-zk]');
  if (!el) return;
  const z = zk();
  z[el.dataset.zk] = parseFloat(String(el.value).replace(/[^\d.]/g, '')) || 0;
  azStore.set('zakat', z);
  const c = zCalc(z);
  const box = $('#zk-result'); if (box) { box.innerHTML = zResult(c); box.classList.toggle('due', !!c.due); }
  const f = $('#zk-fitrah'); if (f) f.textContent = tk(z.members * z.fitrah);
});

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-ra]');
  if (!a) return;
  const d = a.dataset;
  switch (d.ra) {
    case 'fast': {
      const y = S.day.hijri_now.y, i = +d.i;
      const log = azStore.get(`fast-${y}`, {}), tar = azStore.get(`taraweeh-${y}`, {});
      // Fasted → fasted + taraweeh → missed → clear.
      const st = log[i] || 0, tw = !!tar[i];
      if (!st) { log[i] = 1; tar[i] = 0; }
      else if (st === 1 && !tw) tar[i] = 1;
      else if (st === 1 && tw) { log[i] = 2; tar[i] = 0; }
      else { delete log[i]; delete tar[i]; }
      azStore.set(`fast-${y}`, log); azStore.set(`taraweeh-${y}`, tar);
      nativeUi('haptic'); render();
      break;
    }
    case 'qada': azStore.set('qada-fasts', Math.max(0, azStore.get('qada-fasts', 0) + +d.d)); nativeUi('haptic'); render(); break;
    case 'by': { const z = zk(); z.by = d.v; azStore.set('zakat', z); render(); break; }
    case 'mem': { const z = zk(); z.members = Math.max(1, z.members + +d.d); azStore.set('zakat', z); render(); break; }
    case 'sadd': {
      const amt = parseFloat($('#sd-a').value.replace(/[^\d.]/g, ''));
      if (!amt) return;
      const sad = azStore.get('sadaqah', []);
      sad.push({ a: amt, n: $('#sd-n').value.trim(), d: S.day?.today?.date || new Date().toISOString().slice(0, 10) });
      azStore.set('sadaqah', sad); nativeUi('haptic', 'long'); render();
      break;
    }
    case 'sdel': { const sad = azStore.get('sadaqah', []); sad.splice(+d.i, 1); azStore.set('sadaqah', sad); render(); break; }
  }
});
