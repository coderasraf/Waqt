'use strict';
// Waqt Stories of the Prophets (phones): the 25 prophets named in the Quran,
// told from the Quran and authentic hadith, in Bengali and English. Each story
// is an audiobook — narrated recordings, one per paragraph, played by the
// native player (so it goes on with the screen off), with the paragraph being
// read highlighted; stories without recordings fall back to the phone's own
// voice. Each links to the passages of the Quran where it is told. Pictures are scenes only: no
// prophet or person is ever shown. Loaded after qaida.js (uses its voice).

const STY = { list: null, run: 0, playing: false, auto: false, autoStart: false, native: false, timer: 0, lang: null, pos: 0, posId: '' };
const prLoad = () => { try { return JSON.parse(localStorage.getItem('prophets') || '{}'); } catch { return {}; } };
const prSt = () => ({ read: {}, ...prLoad() });
const prSave = (st) => { try { localStorage.setItem('prophets', JSON.stringify(st)); } catch { /* private mode */ } };
const prList = async () => (STY.list ??= await (await fetch('/prophets.json')).json());

const PRT = {
  title: ['Stories of the Prophets', 'নবীদের কাহিনি'], sub: ['The 25 prophets named in the Quran', 'কুরআনে নাম উল্লেখিত ২৫ জন নবী'],
  listen: ['Listen', 'শুনুন'], pause: ['Pause', 'থামুন'], listen_all: ['Listen to all, from the beginning', 'শুরু থেকে সব শুনুন'], cont: ['Continue', 'চালিয়ে যান'],
  story: ['The story', 'কাহিনি'], lessons: ['Lessons', 'শিক্ষা'], where: ['In the Quran', 'কুরআনে যেখানে আছে'], key: ['A verse from the story', 'কাহিনির একটি আয়াত'],
  read: ['Read', 'পড়া হয়েছে'], of: ['of', '/'], prev: ['Previous', 'আগের'], next: ['Next', 'পরের'], open: ['Read in the Quran', 'কুরআনে পড়ুন'],
  voice_missing: ['Install the phone\'s Bengali voice to hear the stories.', 'কাহিনি শুনতে ফোনে বাংলা ভয়েস ইনস্টল করুন।'], voice_missing_en: ['Install the phone\'s English voice to hear the stories.', 'কাহিনি শুনতে ফোনে ইংরেজি ভয়েস ইনস্টল করুন।'], install: ['Install', 'ইনস্টল'],
  note: ['Told from the Quran and authentic hadith. Pictures show places and symbols only — the prophets are never pictured. The narration is by an AI voice.', 'কুরআন ও সহীহ হাদীসের আলোকে বর্ণিত। ছবিতে শুধু স্থান ও প্রতীক দেখানো হয়েছে — নবীদের ছবি কখনো দেখানো হয় না। কাহিনির বর্ণনা কৃত্রিম (এআই) কণ্ঠে।'],
  in_lang: ['Read in', 'ভাষা'],
};
const prt = (k) => tr2(PRT[k]);
const prImg = (id) => `/prophets/${id}.webp`;
/// The language the story is shown and read in (the app's, unless switched on the page).
const prLang = () => STY.lang || (B() ? 'bn' : 'en');
const prf = (p, k) => p[`${k}_${prLang()}`];

/// The story as the voice should say it: honorifics spelled out, references dropped.
function prSpeech(text, lang) {
  let s = text.replace(/\s*\((?:[^()]*[\d\u09E6-\u09EF]+:[\d\u09E6-\u09EF]+[^()]*)\)/g, '');
  if (lang === 'bn') s = s.replace(/\(আ\.\)/g, 'আলাইহিস সালাম').replace(/\(রা\.\)/g, 'রাদিয়াল্লাহু আনহু').replace(/ﷺ/g, 'সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম');
  else s = s.replace(/ﷺ/g, 'peace be upon him');
  return s;
}

/// Verse references in a story — "(2:30)", "(২:৩০-৩৯, ৭:১১)" — become small links into the Quran.
const PR_REF = /\(([^()]*[\d\u09E6-\u09EF]+:[\d\u09E6-\u09EF]+[^()]*)\)/g;
const prAscii = (t) => t.replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6));
function prText(text) {
  return esc(text).replace(PR_REF, (all, inner) => {
    const refs = inner.split(/[,;،]\s*/).map((r) => {
      const m = prAscii(r).match(/(\d+):(\d+)/);
      return m && +m[1] >= 1 && +m[1] <= 114 ? `<a class="pr-ref" href="#/quran/${m[1]}/${m[2]}">${r.trim()}</a>` : r;
    });
    return `<span class="pr-refs">${refs.join(', ')}</span>`;
  });
}

Object.assign(IC, {
  scrollbook: '<path d="M5 4.5h11a3 3 0 0 1 3 3V19a1.5 1.5 0 0 1-1.5 1.5H8A3 3 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19"/><path d="M9 8.5h6M9 11.5h4"/>',
});

// =====================================================================
// Views
// =====================================================================
VIEWS.prophets = async (tok) => {
  if (!STY.native) prStop();
  const list = await prList();
  if (!live(tok)) return;
  const id = location.hash.replace(/^#\/?prophets\/?/, '').split('/')[0];
  const p = list.find((x) => x.id === id);
  if (p) return prStory(p, list, tok);
  STY.lang = null;
  return prHome(list);
};
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/prophets/')) { if (!STY.native) prStop(); STY.auto = false; } });

function prHome(list) {
  const st = prSt();
  const n = list.filter((p) => st.read[p.id]).length;
  const last = list.find((p) => p.id === st.last);
  const feature = last || list[0];
  const lang = B() ? 'bn' : 'en';
  const rows = list.map((p, i) => `<a class="pr-row ${st.read[p.id] ? 'done' : ''}" href="#/prophets/${p.id}">
      <span class="pr-thumb" style="background-image:url('${prImg(p.id)}')"><i>${N(i + 1)}</i></span>
      <span class="pr-row-t"><b>${esc(p[lang === 'bn' ? 'bn' : 'en'])}${lang === 'en' && p.en_alt !== p.en ? ` <em>${esc(p.en_alt)}</em>` : ''}</b><small>${esc(p[`title_${lang}`])}</small></span>
      <span class="pr-row-ar" dir="rtl" lang="ar">${p.ar}</span>${st.read[p.id] ? `<span class="pr-tick">${icon('check')}</span>` : ''}</a>`).join('');
  view.innerHTML = `<div class="p-page pr">${ptitle(prt('title'))}<p class="p-sub">${esc(prt('sub'))}</p>
    <a class="pr-hero" href="#/prophets/${feature.id}" style="--img:url('${prImg(feature.id)}')">
      <span class="pr-hero-t"><small>${esc(last ? prt('cont') : `${N(1)} / ${N(list.length)}`)}</small><b>${esc(feature[lang === 'bn' ? 'bn' : 'en'])}</b><span>${esc(feature[`title_${lang}`])}</span></span>
      <span class="btn gold small">${icon('book')}${esc(B() ? 'পড়ুন' : 'Read')}</span></a>
    <button class="pr-all" data-pr="all">${tile('headphones', '#8e4ec6')}<span class="p-lab"><b>${esc(prt('listen_all'))}</b><small>${esc(B() ? 'আদম (আ.) থেকে মুহাম্মাদ ﷺ পর্যন্ত, অডিওবুকের মতো' : 'From Adam to Muhammad ﷺ, like an audiobook')}</small></span>${icon('play')}</button>
    <div class="sg-progress"><div class="hx-prog"><i style="width:${(n / list.length) * 100}%"></i></div><small>${esc(prt('read'))}: ${N(n)} / ${N(list.length)}</small></div>
    <div class="pr-list">${rows}</div>
    <div class="p-foot">${esc(prt('note'))}</div></div>`;
}

async function prStory(p, list, tok) {
  const i = list.indexOf(p), prev = list[i - 1], next = list[i + 1];
  const lang = prLang();
  const st = prSt(); st.last = p.id; prSave(st);
  if (STY.posId !== p.id) STY.pos = 0;
  const paras = prf(p, 'story').map((t, k) => `<p class="pr-p" data-k="${k}">${prText(t)}</p>`).join('');
  const passages = p.passages.map((x) => `<a class="pr-pass" href="#/quran/${x.s}/${x.from}">${icon('book')}<span><b>${esc(lang === 'bn' ? x.bn : x.en)}</b><small>${N(`${x.s}:${x.from}${x.to !== x.from ? `–${x.to}` : ''}`)}</small></span>${chev()}</a>`).join('');
  view.innerHTML = `<div class="pr-page">
    <div class="pr-cover" style="--img:url('${prImg(p.id)}')">
      <a class="pr-back" href="#/prophets" aria-label="back">${icon('chevL')}</a>
      <div class="pr-cover-t"><small>${N(i + 1)} ${esc(prt('of'))} ${N(list.length)}</small><div class="pr-ar" dir="rtl" lang="ar">${p.ar}</div><h1>${esc(lang === 'bn' ? p.bn : p.en)}</h1><span>${esc(prf(p, 'title'))}</span></div></div>
    <div class="p-page pr pr-body">
      <p class="pr-tag">${esc(prf(p, 'tag'))}</p>
      <div class="pr-tools"><button class="btn gold" id="pr-play" data-pr="play">${icon('play')}${esc(prt('listen'))}</button>
        <div class="p-seg"><button class="${lang === 'bn' ? 'on' : ''}" data-pr="lang" data-v="bn">বাংলা</button><button class="${lang === 'en' ? 'on' : ''}" data-pr="lang" data-v="en">English</button></div></div>
      <div id="pr-voice"></div>
      <div class="pr-story" lang="${lang}">${paras}</div>
      <div class="pr-key" id="pr-key"></div>
      <div class="p-head">${esc(prt('lessons'))}</div>
      <div class="pr-lessons">${prf(p, 'lessons').map((l, k) => `<div class="pr-lesson"><span>${N(k + 1)}</span><p>${esc(l)}</p></div>`).join('')}</div>
      <div class="p-head">${esc(prt('where'))}</div><div class="p-group">${passages}</div>
      <div class="pr-nav">${prev ? `<a href="#/prophets/${prev.id}">${icon('chevL')}<span><small>${esc(prt('prev'))}</small><b>${esc(lang === 'bn' ? prev.bn : prev.en)}</b></span></a>` : '<span></span>'}
        ${next ? `<a class="nx" href="#/prophets/${next.id}"><span><small>${esc(prt('next'))}</small><b>${esc(lang === 'bn' ? next.bn : next.en)}</b></span>${icon('chevR')}</a>` : '<span></span>'}</div>
      <div class="p-foot">${esc(prt('note'))}</div></div></div>`;
  $('#scroll').scrollTop = 0;
  prMarkOnEnd(p);
  // The key verse, from the Quran in the app.
  const [s, v] = p.key.split(':').map(Number);
  try {
    await qMeta();
    const [ar, tr] = await Promise.all([qAr(s), qTr(lang === 'bn' ? 161 : 20, s)]);
    if (!live(tok)) return;
    $('#pr-key').innerHTML = `<a class="nm-verse" href="#/quran/${s}/${v}"><small>${esc(prt('key'))} · ${esc(cname(Q.meta.chapters[s - 1]))} ${N(p.key)}</small>
      <div class="nm-v-ar" dir="rtl" lang="ar">${ar[v - 1].u.map(plainAr).join(' ')}</div><div class="nm-v-tr">${esc(String(tr[v - 1]).replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, ''))}</div>
      <span class="nm-v-go">${esc(prt('open'))}${icon('chevR')}</span></a>`;
  } catch { /* the verse is a bonus */ }
  if (STY.autoStart) { STY.autoStart = false; setTimeout(() => prPlay(p), 600); }
  if (STY.native) prPoll();
}

/// Reaching the lessons counts as having read the story.
function prMarkOnEnd(p) {
  const target = $('.pr-lessons');
  if (!target || !('IntersectionObserver' in window)) return;
  const ob = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { const st = prSt(); st.read[p.id] = Date.now(); prSave(st); ob.disconnect(); }
  });
  ob.observe(target);
}

// ---------- The audiobook ----------
function prStop() {
  STY.run++;
  STY.playing = false;
  post('/api/qaida/stop').catch(() => {});
  const b = $('#pr-play');
  if (b) b.innerHTML = `${icon('play')}${esc(prt('listen'))}`;
}

function prButton(playing) {
  const b = $('#pr-play');
  if (b) b.innerHTML = playing ? `${icon('pause')}${esc(prt('pause'))}` : `${icon('play')}${esc(prt('listen'))}`;
}

/// The narrated recordings: this story, or every story from here on when listening to all.
async function prNarrate(p, from) {
  const list = await prList(), lang = prLang();
  const queue = STY.auto ? list.slice(list.indexOf(p)).filter((q) => q.audio?.[lang]) : [p];
  const clips = queue.flatMap((q) => Array.from({ length: q[`story_${lang}`].length + 1 }, (_, k) => ({
    id: `${q.id}|${lang}|${k}`, file: `prophets/audio/${q.id}-${lang}-${k}.opus`, title: lang === 'bn' ? q.bn : q.en, art: `prophets/${q.id}.webp`,
  })));
  qdQuiet();
  post('/api/qaida/stop').catch(() => {});
  await post('/api/story/play', { clips, start: from ? from + 1 : 0, album: prt('title') });
  STY.native = true; STY.playing = true; STY.posId = p.id;
  prButton(true);
  prPoll();
}

/// Follows the native player: highlights the paragraph being read, and turns the page when listening to all.
function prPoll() {
  if (STY.timer) return;
  let last = '';
  STY.timer = setInterval(async () => {
    if (!STY.native) { clearInterval(STY.timer); STY.timer = 0; return; }
    if (document.hidden) return;
    let s;
    try { s = await api('/api/story/state'); } catch { return; }
    const here = (id) => location.hash === `#/prophets/${id}`;
    if (!s.active || s.ended) {
      if (s.ended && STY.posId) { const st = prSt(); st.read[STY.posId] = Date.now(); prSave(st); }
      STY.native = false; STY.playing = false; STY.pos = 0;
      if (here(STY.posId)) { prButton(false); $$('.pr-p.on').forEach((el) => el.classList.remove('on')); }
      return;
    }
    const [id, lang, k] = s.id.split('|');
    const list = await prList();
    const p = list.find((x) => x.id === id);
    STY.playing = s.playing; STY.posId = id; STY.pos = Math.max(0, +k - 1);
    if (p && +k === p[`story_${lang}`].length) { const st = prSt(); st.read[id] = Date.now(); prSave(st); }
    if (!here(id)) {
      if (STY.auto && location.hash.startsWith('#/prophets/')) { STY.lang = lang; location.hash = `#/prophets/${id}`; }
      return;
    }
    prButton(s.playing);
    if (prLang() !== lang || s.id === last) return;
    last = s.id;
    $$('.pr-p.on').forEach((el) => el.classList.remove('on'));
    const el = +k > 0 && $(`.pr-p[data-k="${+k - 1}"]`);
    if (el) { el.classList.add('on'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }, 500);
}

async function prPlay(p, from = 0) {
  if (p.audio?.[prLang()]) return prNarrate(p, from);
  const run = ++STY.run;
  const lang = prLang();
  STY.playing = true;
  qdQuiet();
  const b = $('#pr-play');
  if (b) b.innerHTML = `${icon('pause')}${esc(prt('pause'))}`;
  const say = async (text) => {
    try { await post('/api/qaida/say', { text: prSpeech(text, lang), rate: 0.95, lang }); return true; }
    catch { prVoiceBanner(lang); return false; }
  };
  // The name and title first, then each paragraph.
  if (from === 0 && !(await say(`${lang === 'bn' ? p.bn : p.en}. ${prf(p, 'title')}.`))) { prStop(); return; }
  const paras = $$('.pr-p');
  for (let k = from; k < paras.length; k++) {
    if (run !== STY.run || !paras[k].isConnected) return;
    STY.pos = k; STY.posId = p.id;
    $$('.pr-p.on').forEach((el) => el.classList.remove('on'));
    paras[k].classList.add('on');
    paras[k].scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (!(await say(prf(p, 'story')[k]))) { prStop(); return; }
  }
  if (run !== STY.run) return;
  STY.pos = 0;
  $$('.pr-p.on').forEach((el) => el.classList.remove('on'));
  const st = prSt(); st.read[p.id] = Date.now(); prSave(st);
  prStop();
  // Listening to all: on to the next prophet.
  const list = await prList();
  const next = list[list.indexOf(p) + 1];
  if (STY.auto && next) setTimeout(() => { if (STY.auto) { STY.autoStart = true; location.hash = `#/prophets/${next.id}`; } }, 1500);
  else STY.auto = false;
}

async function prVoiceBanner(lang) {
  const box = $('#pr-voice');
  if (!box) return;
  box.innerHTML = `<div class="banner warn">${icon('speaker')}<div><small>${esc(lang === 'bn' ? prt('voice_missing') : prt('voice_missing_en'))}</small></div><button class="btn small" data-pr="voice">${esc(prt('install'))}</button></div>`;
}

// ---------- Events ----------
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-pr]');
  if (!a) return;
  const d = a.dataset;
  const list = await prList();
  const p = list.find((x) => location.hash === `#/prophets/${x.id}`);
  switch (d.pr) {
    case 'play':
      // Narration of this story: pause or carry on. Otherwise start it (or stop the phone's voice).
      if (STY.native && STY.posId === p?.id) { STY.playing = !STY.playing; prButton(STY.playing); await post('/api/quran/cmd', { cmd: STY.playing ? 'play' : 'pause' }); }
      else if (STY.playing && !STY.native) { prStop(); STY.auto = false; }
      else if (p) prPlay(p, STY.posId === p.id ? STY.pos : 0);
      break;
    case 'all': STY.auto = true; STY.autoStart = true; location.hash = `#/prophets/${list[0].id}`; break;
    case 'lang': if (STY.native) await post('/api/quran/cmd', { cmd: 'pause' }); STY.native = false; prStop(); STY.lang = d.v; render(); break;
    case 'voice': await post('/api/quran/voice-install'); break;
  }
});
