// Builds dist/ for king.arda.tr from src/game.html (the page body, also publishable as-is
// as a Claude artifact) plus the static files in public/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = 'https://king.arda.tr/';

let body = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');

// Lift <title>, <link> and <style> into <head>; drop the artifact-only meta.
const take = re => { const out = []; body = body.replace(re, m => { out.push(m); return ''; }); return out.join('\n'); };
take(/<meta name="claude:[^>]*>\n?/g);
const title = take(/<title>[\s\S]*?<\/title>\n?/);
const links = take(/<link [^>]*>\n?/g);
const style = take(/<style>[\s\S]*?<\/style>\n?/);

const description = 'King, the Turkish trick-taking card game. Play all 20 hands of cezalar and koz against three computer players. English, Türkçe, 日本語.';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${title.trim()}
<meta name="description" content="${description}">
<meta name="theme-color" content="#1f130e">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${SITE}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="icons/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="King">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}">
<meta property="og:title" content="King">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${SITE}og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" hreflang="en" href="${SITE}">
<link rel="alternate" hreflang="tr" href="${SITE}">
<link rel="alternate" hreflang="ja" href="${SITE}">
${links.trim()}
<style>
html{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);background:#1f130e}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>
${style.trim()}
</head>
<body>
${body.trim()}
<script>
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body>
</html>
`;

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);

// Stamp the service worker's cache name with a hash of everything it caches.
const hash = crypto.createHash('sha256');
const shell = JSON.parse(fs.readFileSync(path.join(dist, 'sw.js'), 'utf8').match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
for (const f of shell.filter(f => f !== './')) hash.update(fs.readFileSync(path.join(dist, f)));
const build = hash.digest('hex').slice(0, 10);
const swPath = path.join(dist, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replace('__BUILD__', build));

const size = f => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(1) + ' KB';
console.log(`dist/ built (cache ${build}): index.html ${size('index.html')}`);
