// Takes screenshots with headless Chrome over the DevTools protocol.
//   node tools/screenshots.mjs         → docs/*.jpg for the README
//   node tools/screenshots.mjs store   → docs/store/{tr,en}-{1..4}.jpg, 1080x1920 Play Store phone shots
// Needs the built site served on :8417 (npm run serve) or KING_URL.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.KING_URL || 'http://localhost:8417/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const phone = { w: 360, h: 640, scale: 3, mobile: true };
const SETS = {
  readme: [
    { file: 'docs/desktop-en.jpg', w: 1440, h: 900, scale: 1, mobile: false, lang: 'en', state: 'trick' },
    { file: 'docs/phone-tr.jpg', w: 390, h: 844, scale: 2, mobile: true, lang: 'tr', state: 'trick' },
    { file: 'docs/phone-ja.jpg', w: 390, h: 844, scale: 2, mobile: true, lang: 'ja', state: 'choose' },
  ],
  store: ['tr', 'en'].flatMap(lang => ['trick', 'choose', 'sheet', 'edit'].map((state, i) =>
    ({ file: `docs/store/${lang}-${i + 1}.jpg`, ...phone, lang, state }))),
};
const shots = SETS[process.argv[2] || 'readme'];
if (!shots) { console.error('unknown set; use readme or store'); process.exit(2); }

// A plausible half-played score sheet, entered through the engine so it is always legal.
const NAMES = { tr: ['Ayşe', 'Burak', 'Cem', 'Deniz'], en: ['Alex', 'Bea', 'Chris', 'Dana'], ja: ['あやか', 'けんた', 'さくら', 'たくみ'] };
const SHEET = `[
  ['kupa',null,{counts:[3,1,5,4]}], ['koz','S',{counts:[4,5,2,2]}], ['kiz',null,{counts:[1,0,2,1]}],
  ['el',null,{counts:[2,4,3,4]}], ['rifki',null,{who:2}], ['koz','H',{counts:[3,2,6,2]}],
  ['erkek',null,{counts:[2,3,1,2]}], ['soniki',null,{t12:0,t13:3}]
]`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'king-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); }
    catch { await sleep(200); }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const waiting = new Map();
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const run = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

  await send('Page.enable');
  for (const s of shots) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: s.scale, mobile: s.mobile });
    await send('Emulation.setTouchEmulationEnabled', { enabled: s.mobile });
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    // Fresh state in the chosen language, sound off.
    await run(`localStorage.clear(); localStorage.setItem('king-table-v1-lang','${s.lang}'); localStorage.setItem('king-table-v1-sound','0'); location.reload()`);
    await sleep(2500);
    if (s.state === 'trick') {
      await run(`(async()=>{
        fast=true; humanChoose('kiz');
        const wait=ms=>new Promise(r=>setTimeout(r,ms));
        for(let n=0;n<200;n++){
          if(S.phase==='play'&&S.turn===0&&!S.auto){ if(S.trickNo>=2){ break } const c=botCard(S,0); selected=cid(c); tapCard(cid(c)); }
          await wait(100);
        }
        for(let n=0;n<60&&!(S.phase==='play'&&S.turn===0&&S.trick.length>=2);n++){ await wait(100);
          if(S.phase==='play'&&S.turn===0&&S.trick.length<2){ const c=botCard(S,0); selected=cid(c); tapCard(cid(c)); } }
      })()`);
      await sleep(600);
    } else if (s.state === 'sheet' || s.state === 'edit') {
      await run(`(()=>{
        G=tableNew(${JSON.stringify(NAMES[s.lang])},0);
        for(const [k,t,e] of ${SHEET}) tableAdd(G,k,t,e);
        ${s.state === 'edit' ? "G.cur={i:G.hands.length,k:'kupa',trump:null,entry:{counts:[2,0,4,0]}};" : ''}
        saveG(); setMode('score'); render(); return G.hands.length;
      })()`);
      await sleep(500);
    }
    await run(`document.fonts.ready.then(()=>{document.getAnimations().forEach(a=>{try{a.finish()}catch(e){}});return true})`);
    await sleep(300);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    fs.mkdirSync(path.dirname(path.join(root, s.file)), { recursive: true });
    fs.writeFileSync(path.join(root, s.file), Buffer.from(shot.result.data, 'base64'));
    console.log('wrote ' + s.file);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  fs.rmSync(profile, { recursive: true, force: true });
}
