// Renders the Play Store graphics (captioned screenshots, feature graphic)
// from the HTML templates in store/templates with headless Edge.
// usage: node tools/render_store.mjs   (run from android/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const store = path.resolve('store');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9400 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'waqt-store-'));
const proc = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--allow-file-access-from-files', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable');

async function render(url, w, h, file) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await sleep(1500);
  const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log('wrote', path.relative(store, file));
}

const CAPTIONS = {
  en: [
    ['1-today', 'Every <em>waqt</em>, on time', 'A live sky, countdown and accurate prayer times for every city'],
    ['2-jamaat', 'Your mosque\'s <em>jamaat</em>, built in', 'Leave-now reminders and auto-silent during prayer'],
    ['3-adhan-check', 'An adhan that <em>really rings</em>', 'Built-in check fixes battery settings on Xiaomi, Samsung, Vivo, Oppo and more'],
    ['4-qibla', 'Live <em>Qibla</em> compass', 'Plus the exact times the sun points towards the Kaaba'],
    ['5-hijri', 'Hijri dates as <em>Bangladesh</em> sees the moon', 'Ramadan, Eid and every Islamic date — with the Bangla calendar'],
    ['6-tasbih', 'Tasbih with your <em>volume buttons</em>', 'Count dhikr without looking at the screen'],
    ['7-tracker', 'Track <em>every prayer</em>', 'Streaks, jamaat count and a qada plan'],
    ['8-timetable', 'Private. <em>No ads.</em> Offline.', 'Prayer times are calculated on your phone'],
  ],
  bn: [
    ['1-today', 'প্রতিটি <em>ওয়াক্ত</em>, সময়মতো', 'জীবন্ত আকাশ, কাউন্টডাউন ও প্রতিটি শহরের নির্ভুল সময়'],
    ['2-jamaat', 'আপনার মসজিদের <em>জামাত</em>', 'রওনা দেওয়ার রিমাইন্ডার ও নামাজে স্বয়ংক্রিয় সাইলেন্ট'],
    ['3-adhan-check', 'আজান <em>বাজবেই</em>', 'শাওমি, স্যামসাং, ভিভো, অপোসহ সব ফোনে ব্যাটারি সেটিং ঠিক করে'],
    ['4-qibla', 'লাইভ <em>কিবলা</em> কম্পাস', 'সাথে সূর্য দেখে কিবলা খোঁজার নির্দিষ্ট সময়'],
    ['5-hijri', 'বাংলাদেশের চাঁদ দেখা অনুযায়ী <em>হিজরি</em>', 'রমজান, ঈদ ও সব ইসলামিক তারিখ — বাংলা সনসহ'],
    ['6-tasbih', '<em>ভলিউম বাটনে</em> তাসবিহ', 'স্ক্রিনে না তাকিয়েই জিকির গুনুন'],
    ['7-tracker', 'প্রতিটি <em>নামাজের</em> হিসাব', 'ধারাবাহিকতা, জামাতের হিসাব ও কাজা পরিকল্পনা'],
    ['8-timetable', 'বিজ্ঞাপন নেই। <em>ট্র্যাকিং</em> নেই।', 'নামাজের সময় আপনার ফোনেই হিসাব হয়, ইন্টারনেট ছাড়াই'],
  ],
};

const tpl = pathToFileURL(path.join(store, 'templates', 'shot.html')).href;
for (const [lang, list] of Object.entries(CAPTIONS)) {
  for (const [name, title, sub] of list) {
    const img = pathToFileURL(path.join(store, 'raw', lang, `${name}.png`)).href;
    const q = new URLSearchParams({ lang, t: title, s: sub, img });
    await render(`${tpl}?${q}`, 1080, 1920, path.join(store, 'screenshots', lang, `${name}.png`));
  }
}
await render(pathToFileURL(path.join(store, 'templates', 'feature.html')).href, 1024, 500, path.join(store, 'feature-graphic.png'));
ws.close();
proc.kill();
process.exit(0);
