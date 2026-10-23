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
    ['1-today', 'Every <em>waqt</em>, on time', 'Accurate prayer times, a live countdown and an adhan that really rings'],
    ['2-quran', 'The whole <em>Quran</em>, offline', 'Tajweed colours, word-by-word meaning, English and Bengali'],
    ['3-audiobook', 'Listen with <em>meaning</em>', 'Each word lights up as it is recited, then the meaning in Bengali or English'],
    ['4-hadith', 'Bukhari, Muslim and <em>36,000 hadith</em>', 'Arabic, English and Bengali, with grades and Bengali chapters'],
    ['5-salah', 'Learn to <em>pray</em>, step by step', 'Illustrated salah, wudu and ghusl, for men and for women'],
    ['6-azkar', 'Morning and evening <em>adhkar</em>', 'All of Hisnul Muslim — tap to count, with reminders after Fajr and Asr'],
    ['7-goal', 'Finish the Quran on a <em>plan</em>', 'Khatm goals, hifz with review, Ramadan and zakat tools'],
    ['8-adhan-check', 'Private. <em>No ads.</em>', 'A built-in check makes sure the adhan rings on every phone'],
  ],
  bn: [
    ['1-today', 'প্রতিটি <em>ওয়াক্ত</em>, সময়মতো', 'নির্ভুল নামাজের সময়, লাইভ কাউন্টডাউন ও আজান যা সত্যিই বাজে'],
    ['2-quran', 'পূর্ণ <em>কুরআন</em>, ইন্টারনেট ছাড়াই', 'তাজবীদ রং, শব্দে শব্দে অর্থ, বাংলা ও ইংরেজি'],
    ['3-audiobook', '<em>অর্থসহ</em> তিলাওয়াত শুনুন', 'পড়ার সাথে প্রতিটি শব্দ হাইলাইট, তারপর বাংলা অর্থ'],
    ['4-hadith', 'বুখারী, মুসলিমসহ <em>৩৬,০০০ হাদীস</em>', 'আরবি, বাংলা ও ইংরেজি — হাদীসের মান ও বাংলা অধ্যায়সহ'],
    ['5-salah', 'ধাপে ধাপে <em>নামাজ শিক্ষা</em>', 'ছবিসহ নামাজ, অজু ও গোসল — পুরুষ ও নারীর জন্য'],
    ['6-azkar', 'সকাল-সন্ধ্যার <em>যিকির</em>', 'পূর্ণ হিসনুল মুসলিম — গুনে গুনে পড়ুন, ফজর ও আসরের পর রিমাইন্ডার'],
    ['7-goal', 'পরিকল্পনা করে <em>খতম</em>', 'খতমের লক্ষ্য, হিফজ ও রিভিউ, রমজান ও যাকাত'],
    ['8-adhan-check', 'বিজ্ঞাপন নেই। <em>ট্র্যাকিং</em> নেই।', 'প্রতিটি ফোনে আজান বাজবে — অ্যাপের ভেতরেই পরীক্ষা'],
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
