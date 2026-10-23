// Captures the raw Play Store screenshots from the emulator (debug build,
// demo-mode status bar), in English and Bangla.
// usage: node tools/capture_store.mjs <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const out = process.argv[2];
const ADB = 'D:/Android/sdk/platform-tools/adb.exe';
const adb = (...a) => execFileSync(ADB, a, { encoding: 'latin1' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pid = adb('shell', 'pidof', 'com.coderashraf.waqt').trim();
adb('forward', 'tcp:9333', `localabstract:webview_devtools_remote_${pid}`);
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0;
const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const js = async (e) => {
  const r = await new Promise((res) => { const id = ++n; pend.set(id, res); ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: e, awaitPromise: true, returnByValue: true } })); });
  return r.result?.result?.value;
};
const shot = (file) => fs.writeFileSync(file, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }));

// Demo data: a mosque's jamaat times and a week of prayers.
await js(`(async () => {
  S.cfg.onboarded = true;
  Object.assign(S.cfg.phone, { jamaat: { fajr: '20', dhuhr: '13:30', asr: '15', maghrib: '5', isha: '19:45', jumuah: '13:15' }, walk_minutes: 10, auto_silent: true });
  await put('/api/settings', S.cfg);
  const today = S.day.today.date;
  const [y, m, d] = today.split('-').map(Number);
  for (let i = 1; i <= 9; i++) {
    const day = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10);
    for (let p = 0; p < 5; p++) await post('/api/tracker', { date: day, prayer: p, status: (p + i) % 3 === 0 ? 2 : 1 });
  }
  await post('/api/tracker', { date: today, prayer: 0, status: 2 });
  document.querySelector('#welcome').hidden = true;
  return 'seeded';
})()`).then(console.log);

const SHOTS = [
  ['1-today', '#/today', 0, ''],
  ['2-jamaat', '#/today', 330, ''],
  ['3-adhan-check', '#/health', 0, ''],
  ['4-qibla', '#/qibla', 0, "nativeUi('compass', 0); setTimeout(() => onHeading(277.6, 3), 400)"],
  ['5-hijri', '#/calendar', 0, ''],
  ['6-tasbih', '#/tasbih', 0, 'TB.count = 21; drawTasbih()'],
  ['7-tracker', '#/tracker', 0, ''],
  ['8-timetable', '#/timetable', 0, "document.querySelector('#scroll').scrollTop = 0"],
];

for (const lang of ['en', 'bn']) {
  fs.mkdirSync(path.join(out, lang), { recursive: true });
  await js(`(async () => { S.cfg.language = '${lang}'; await saveCfg(false); })()`);
  for (const [name, hash, scroll, prep] of SHOTS) {
    await js(`location.hash = '#/x'; location.hash = '${hash}'`);
    await sleep(3200);
    if (scroll) { await js(`document.querySelector('#scroll').scrollTop = ${scroll}`); await sleep(900); }
    if (prep) { await js(prep); await sleep(1600); }
    shot(path.join(out, lang, `${name}.png`));
    console.log(lang, name);
  }
}
await js(`(async () => { S.cfg.language = 'en'; await saveCfg(false); })()`);
process.exit(0);
