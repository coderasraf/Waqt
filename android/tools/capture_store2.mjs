// Captures the raw Play Store screenshots (1.9+) from the emulator, debug
// build, in English and Bangla: Today, the Quran, the audiobook, Hadith,
// the Salah guide, Azkar, the khatm goal and the Adhan check.
// usage: node tools/capture_store2.mjs <out-dir>   (store/raw)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const out = process.argv[2];
const ADB = 'D:/Android/sdk/platform-tools/adb.exe';
const adb = (...a) => execFileSync(ADB, a, { encoding: 'latin1' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A clean status bar: 9:41, full battery, full signal.
const demo = (cmd, extra = []) => adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', cmd, ...extra);
adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1');
demo('enter');
demo('clock', ['-e', 'hhmm', '0941']);
demo('battery', ['-e', 'level', '100', '-e', 'plugged', 'false']);
demo('network', ['-e', 'wifi', 'show', '-e', 'level', '4']);
demo('network', ['-e', 'mobile', 'show', '-e', 'level', '4', '-e', 'datatype', 'none']);
demo('notifications', ['-e', 'visible', 'false']);

const pid = adb('shell', 'pidof', 'com.coderashraf.waqt').trim();
adb('forward', 'tcp:9333', `localabstract:webview_devtools_remote_${pid}`);
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(list.find((x) => x.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let n = 0;
const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const js = async (e) => {
  const r = await new Promise((res) => { const id = ++n; pend.set(id, res); ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: e, awaitPromise: true, returnByValue: true } })); });
  return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description;
};
const shot = (file) => fs.writeFileSync(file, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }));

// Demo data: a mosque's jamaat, a khatm a few days in, bookmarks, hifz.
console.log(await js(`(async () => {
  S.cfg.onboarded = true;
  Object.assign(S.cfg.phone, { jamaat: { fajr: '20', dhuhr: '13:30', asr: '15', maghrib: '5', isha: '19:45', jumuah: '13:15' }, walk_minutes: 10 });
  await put('/api/settings', S.cfg);
  document.querySelector('#welcome').hidden = true;
  localStorage.setItem('salah-who', 'm');
  localStorage.setItem('waqt-hero', 'madinah');
  setTheme('madinah');
  await qState();
  Q.st.goal = { days: 30, start: 1, startDate: addDays(todayISO(), -6), read: [...Array(118)].map((_, i) => i + 1), log: {} };
  for (let i = 6; i >= 1; i--) Q.st.goal.log[addDays(todayISO(), -i)] = i === 2 ? 12 : 21;
  Q.st.goal.log[todayISO()] = 6;
  Q.st.wbw = 'off'; Q.st.tajweed = true; Q.st.meaning = 'bn'; Q.st.reciter = 7;
  qSave();
  return 'seeded';
})()`));

// [name, hash, theme, prep]
const SHOTS = [
  ['1-today', '#/today', 'madinah', ''],
  ['2-quran', '#/quran/2/255', 'sepia', ''],
  ['3-audiobook', '#/quran/listen', 'madinah', "await qPlay(1, 2); await new Promise((r) => setTimeout(r, 10000)); location.hash = '#/x'; location.hash = '#/quran/listen';"],
  ['4-hadith', '#/hadith/tirmidhi/1/4', 'madinah', ''],
  ['5-salah', '#/salah/learn/6', 'madinah', ''],
  ['6-azkar', '#/azkar', 'madinah', ''],
  ['7-goal', '#/quran/goal', 'madinah', ''],
  ['8-adhan-check', '#/health', 'madinah', ''],
];

for (const lang of ['en', 'bn']) {
  fs.mkdirSync(path.join(out, lang), { recursive: true });
  await js(`(async () => { S.cfg.language = '${lang}'; await saveCfg(false); })()`);
  for (const [name, hash, theme, prep] of SHOTS) {
    await js(`(async () => { qSheetClose(); setTheme('${theme}'); location.hash = '#/x'; location.hash = '${hash}'; await new Promise((r) => setTimeout(r, 2600)); ${prep} await new Promise((r) => setTimeout(r, 1200)); document.querySelector('#scroll').scrollTop = 0; })()`);
    await sleep(1500);
    shot(path.join(out, lang, `${name}.png`));
    console.log(lang, name);
  }
  await js("qCmd('stop')");
}
await js(`(async () => { S.cfg.language = 'en'; await saveCfg(false); setTheme('madinah'); })()`);
demo('exit');
process.exit(0);
