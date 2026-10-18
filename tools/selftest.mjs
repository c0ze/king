// Plays full games with four computer players and checks the rules engine,
// then checks that every language has every translation key.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/game.html'), 'utf8');
const between = (a, b) => src.split(a)[1].split(b)[0];
const ctx = vm.createContext({ Math, console });
vm.runInContext(between('/*ENGINE-START*/', '/*ENGINE-END*/') + between('/*I18N-START*/', '/*I18N-END*/') +
  ';globalThis.E={newGame,startDeal,botChoose,choose,botCard,applyPlay,resolveTrick,nextDeal,cid,legal,I18N,tableNew,tableView,tableAdd,tableEntry,tableValid,options,NEED,SUITS};', ctx);
const E = ctx.E;

const GAMES = Number(process.argv[2] || 300);
let failures = 0;
const fail = (...m) => { failures++; if (failures < 10) console.log('FAIL', ...m); };

for (let g = 0; g < GAMES; g++) {
  const S = E.newGame(); E.startDeal(S);
  while (S.phase !== 'gameEnd') {
    if (S.phase === 'choose') { const b = E.botChoose(S, S.chooser); E.choose(S, S.chooser, b.k, b.trump); }
    else if (S.phase === 'play') {
      const c = E.botCard(S, S.turn);
      if (!E.applyPlay(S, S.turn, E.cid(c))) { fail('illegal card', E.cid(c), 'game', g); break; }
    }
    else if (S.phase === 'trickEnd') E.resolveTrick(S);
    else if (S.phase === 'handEnd') E.nextDeal(S);
  }
  const sum = S.scores.reduce((a, b) => a + b, 0);
  if (sum !== 0) fail('scores do not sum to zero', sum);
  if (S.history.length !== 20) fail('history length', S.history.length);
  if (Object.values(S.penUsed).some(v => v !== 2)) fail('penalty use', JSON.stringify(S.penUsed));
  if (S.quota.some(q => q.pen !== 3 || q.koz !== 2)) fail('quotas', JSON.stringify(S.quota));
}

// Real-table score mode: random legal tables must finish after 20 hands and sum to zero;
// bad entries (wrong totals, used-up picks, missing trump) must be refused.
const rnd = n => Math.floor(Math.random() * n);
for (let g = 0; g < GAMES; g++) {
  const G = E.tableNew(['A', 'B', 'C', 'D'], rnd(4));
  while (!E.tableView(G).done) {
    const V = E.tableView(G);
    const ok = E.options({ quota: V.quota, penUsed: V.penUsed }, V.chooser).filter(o => o.ok);
    const bad = E.options({ quota: V.quota, penUsed: V.penUsed }, V.chooser).filter(o => !o.ok);
    const k = ok[rnd(ok.length)].k, e = E.tableEntry(k);
    if (k === 'rifki') e.who = rnd(4);
    else if (k === 'soniki') { e.t12 = rnd(4); e.t13 = rnd(4); }
    else { for (let i = 0; i < E.NEED[k]; i++) e.counts[rnd(4)]++; }
    if (e.counts && E.tableAdd(G, k, 'S', { counts: e.counts.map((c, i) => i ? c : c + 1) })) fail('accepted wrong total');
    if (bad.length && E.tableAdd(G, bad[0].k, 'S', E.tableEntry(bad[0].k))) fail('accepted used-up pick');
    if (k === 'koz' && E.tableAdd(G, k, null, e)) fail('accepted koz without trump');
    if (!E.tableAdd(G, k, E.SUITS[rnd(4)], e)) { fail('refused a valid hand', k, JSON.stringify(e)); break; }
  }
  const V = E.tableView(G), sum = V.scores.reduce((a, b) => a + b, 0);
  if (G.hands.length !== 20) fail('table hands', G.hands.length);
  if (sum !== 0) fail('table not zero-sum', sum);
  if (E.tableAdd(G, 'koz', 'S', { counts: [13, 0, 0, 0] })) fail('accepted a 21st hand');
}

// Translation keys: every language must define what English defines.
const shape = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? shape(v, p + k + '.') : [p + k]);
const en = new Set(shape(E.I18N.en));
for (const [lang, t] of Object.entries(E.I18N)) {
  const have = new Set(shape(t));
  for (const k of en) if (!have.has(k)) fail(`missing ${lang}.${k}`);
  for (const k of ['rGameL', 'rPenL', 'rKozL', 'names'])
    if (t[k].length !== E.I18N.en[k].length) fail(`${lang}.${k} has ${t[k].length} items`);
}

console.log(failures ? `${failures} failure(s)` : `ok: ${GAMES} bot games legal and zero-sum, ${GAMES} score-mode tables zero-sum, translations complete (${Object.keys(E.I18N).join(', ')})`);
process.exit(failures ? 1 : 0);
