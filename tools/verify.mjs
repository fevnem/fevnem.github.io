#!/usr/bin/env node
/**
 * tools/verify.mjs — the Notebook's own test suite.
 *
 * Zero dependencies: drives a real headless Chromium over raw CDP using Node's
 * built-in WebSocket. Checks the contract in docs/NOTEBOOK.md, not the author's
 * intentions.
 *
 *   python3 -m http.server 8140 --bind 127.0.0.1      # in another shell
 *   node tools/verify.mjs
 *   node tools/verify.mjs --only articles             # one page
 *   node tools/verify.mjs --url http://127.0.0.1:8140/index.html
 *
 * Exits non-zero if anything fails. Pages that do not exist yet are reported as
 * skipped, so the harness is usable from the first day of the build.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i === -1 ? d : args[i + 1]; };

const BASE = opt('url', 'http://127.0.0.1:8140/index.html');
const ORIGIN = new URL(BASE).origin;
const ONLY = opt('only', null);
const ROOT = process.cwd();

/* ---------- the contract, as data ---------- */

// budget in bytes (docs/NOTEBOOK.md §0.5)
const BUDGET = { page: 6 * 1024, css: 12 * 1024, js: 8 * 1024 };

const PAGES = [
  { file: 'index.html',            page: 'index' },
  { file: 'articles.html',         page: 'articles' },
  { file: 'biodata.html',          page: 'biodata' },
  { file: 'projects.html',         page: 'projects' },
  { file: 'uses.html',             page: 'uses' },
  { file: 'contact.html',          page: 'contact' },
  { file: '404.html',              page: '404' },
  { file: 'styleguide.html',       page: 'styleguide' }
];

const WIDTHS = [1440, 1024, 900, 390];

/* ---------- chromium ---------- */

const CHROME = [
  path.join(homedir(), '.cache/ms-playwright/chromium-1148/chrome-linux/chrome'),
  path.join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell'),
  '/usr/bin/chromium', '/usr/bin/google-chrome'
].find((p) => existsSync(p));
if (!CHROME) { console.error('no chromium found'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9601 + (process.pid % 190);

const child = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-gl=angle',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
  '--hide-scrollbars', '--force-color-profile=srgb', '--mute-audio',
  '--remote-debugging-port=' + PORT, '--window-size=1440,900', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });

let chromeErr = '';
child.stderr.on('data', (d) => { chromeErr += d.toString(); });

async function target() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = list.find((t) => t.type === 'page');
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('chromium never exposed a page target\n' + chromeErr.slice(-500));
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.logs = []; this.reqs = []; }
  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
    const cdp = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && cdp.pending.has(m.id)) {
        const { resolve, reject } = cdp.pending.get(m.id);
        cdp.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      } else if (m.method === 'Runtime.consoleAPICalled') {
        cdp.logs.push({ level: m.params.type, text: (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ') });
      } else if (m.method === 'Runtime.exceptionThrown') {
        cdp.logs.push({ level: 'exception', text: m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text });
      } else if (m.method === 'Network.requestWillBeSent') {
        cdp.reqs.push(m.params.request.url);
      } else if (m.method === 'Network.loadingFailed') {
        cdp.logs.push({ level: 'netfail', text: (m.params.errorText || 'failed') + ' ' + (m.params.requestId || '') });
      }
    };
    return cdp;
  }
  send(method, params = {}, t = 60000) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error(method + ' timed out')); } }, t);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, 90000);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async viewport(w, h) {
    await this.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  }
  async goto(url, ready = 'document.readyState === "complete"') {
    this.logs = []; this.reqs = [];
    await this.send('Page.navigate', { url });
    for (let i = 0; i < 60; i++) {
      await sleep(150);
      if (await this.eval(ready).catch(() => false)) return true;
    }
    return false;
  }
  reset() { this.logs = []; this.reqs = []; }
}

/* ---------- reporting ---------- */

let pass = 0;
const problems = [];
const skipped = [];
const warnings = [];
const check = (label, ok, extra) => {
  if (ok) { pass++; console.log('  ok   ' + label + (extra ? '  ' + extra : '')); }
  else { problems.push(label + (extra ? '  — ' + extra : '')); console.log('  FAIL ' + label + (extra ? '  ' + extra : '')); }
};
const warn = (label, extra) => { warnings.push(label + (extra ? ' — ' + extra : '')); console.log('  warn ' + label + (extra ? '  ' + extra : '')); };

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const sizeOf = async (rel) => { try { return (await stat(path.join(ROOT, rel))).size; } catch { return null; } };

/* ---------- run ---------- */

const asked = ONLY ? PAGES.filter((p) => p.page === ONLY || p.file === ONLY) : PAGES;
const present = [];
for (const p of asked) {
  if (await sizeOf(p.file)) present.push(p);
  else skipped.push(p.file);
}

const cdp = await CDP.open(await target());
await cdp.send('Runtime.enable');
await cdp.send('Page.enable');
await cdp.send('Network.enable');

console.log('driving ' + BASE);
console.log('pages present: ' + (present.map((p) => p.file).join(', ') || '(none)') +
  (skipped.length ? '  | not written yet: ' + skipped.join(', ') : ''));

let offOrigin = 0;
const offOriginSeen = new Set();

for (const page of present) {
  const url = ORIGIN + '/' + page.file;
  console.log('\n── ' + page.file);
  await cdp.viewport(1440, 900);
  const loaded = await cdp.goto(url);
  check(page.file + ' loads', loaded);

  // console + network hygiene
  const errors = cdp.logs.filter((l) => l.level === 'error' || l.level === 'exception');
  check('no console errors', errors.length === 0, errors.length ? errors[0].text.slice(0, 90) : '');
  for (const r of cdp.reqs) {
    try { if (new URL(r).origin !== ORIGIN) { offOrigin++; offOriginSeen.add(new URL(r).origin); } } catch { /* data: urls */ }
  }

  // structure
  const info = await cdp.eval(`(() => {
    const q = (s) => document.querySelector(s);
    const tabs = [...document.querySelectorAll('.tabs a, nav a')].map((a) => a.getAttribute('href') || '');
    return {
      title: document.title,
      desc: (q('meta[name="description"]') || {}).content || '',
      page: (q('.page') || {}).dataset ? q('.page').dataset.page : null,
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 60)),
      anchors: tabs.filter((h) => h.startsWith('#')),
      tabHrefs: tabs,
      sheet: !!q('.sheet'), main: !!q('#main'), colophon: !!q('.colophon'),
      margins: document.querySelectorAll('.margin').length
    };
  })()`);

  check('has a title', !!info.title && info.title !== 'Untitled', JSON.stringify(info.title).slice(0, 60));
  check('has a meta description', info.desc.length > 20, kb(Buffer.byteLength(info.desc)));
  check('data-page matches the file', info.page === page.page, 'got ' + JSON.stringify(info.page));
  check('no same-page anchors in the nav', info.anchors.length === 0, info.anchors.join(' '));
  if (!info.sheet || !info.main) warn('page skeleton incomplete', '.sheet=' + info.sheet + ' #main=' + info.main);
  if (info.h1.length === 0) warn('no <h1> on the page');
  if (info.h1.length > 1) warn('more than one <h1>', String(info.h1.length));

  // overflow at four widths
  for (const w of WIDTHS) {
    await cdp.viewport(w, 900);
    await sleep(140);
    const m = await cdp.eval('({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, bw: document.body.scrollWidth })');
    check('no horizontal overflow at ' + w + 'px', m.sw <= m.iw + 1 && m.bw <= m.iw + 1, m.sw + ' vs ' + m.iw);
  }
  await cdp.viewport(1440, 900);
}

/* ---------- deep link through the router ---------- */

let manifest = [];
try { manifest = JSON.parse(await readFile(path.join(ROOT, 'articles/manifest.json'), 'utf8')); } catch { /* none yet */ }

const routable = manifest.filter((m) => !m.draft);
if (routable.length && await sizeOf('404.html')) {
  const slug = routable[0].slug;
  console.log('\n── router: /a/' + slug);
  // Locally a plain static server cannot emulate the Pages fallback, so the
  // router must also accept ?a=<slug> (documented in the site.js brief).
  const loaded = await cdp.goto(ORIGIN + '/404.html?a=' + slug);
  check('router page loads', loaded);
  const r = await cdp.eval(`(async () => {
    for (let i = 0; i < 60; i++) {
      const el = document.querySelector('.entry h1, .prose h1, .entry-title');
      if (el && el.textContent.trim().length > 3) break;
      await new Promise((res) => setTimeout(res, 150));
    }
    const h1 = document.querySelector('.entry h1, .prose h1, .entry-title');
    return { title: document.title, heading: h1 ? h1.textContent.trim() : '', path: location.pathname + location.search };
  })()`);
  check('deep link renders the entry', !!r.heading, JSON.stringify(r.heading).slice(0, 60));
  check('deep link sets the document title', !!r.title && r.title !== 'Untitled', JSON.stringify(r.title).slice(0, 60));
  const errs = cdp.logs.filter((l) => l.level === 'error' || l.level === 'exception');
  check('router: no console errors', errs.length === 0, errs.length ? errs[0].text.slice(0, 90) : '');
} else if (!routable.length) {
  console.log('\n── router: skipped (no manifest entries)');
}

/* ---------- budgets ---------- */

console.log('\n── budgets (docs/NOTEBOOK.md §0.5)');
for (const p of asked) {
  const s = await sizeOf(p.file);
  if (s === null) continue;
  check(p.file + ' ≤ ' + kb(BUDGET.page), s <= BUDGET.page, kb(s));
}
const css = await sizeOf('css/notebook.css');
if (css !== null) check('css/notebook.css ≤ ' + kb(BUDGET.css), css <= BUDGET.css, kb(css));
const md = await sizeOf('js/md.js'); const site = await sizeOf('js/site.js');
if (md !== null) check('js/md.js ≤ 6 KB', md <= 6 * 1024, kb(md));
if (site !== null) check('js/site.js ≤ 4 KB', site <= 4 * 1024, kb(site));
if (md !== null && site !== null) check('js/md.js + js/site.js ≤ ' + kb(BUDGET.js), md + site <= BUDGET.js, kb(md + site));
check('no package.json (no build step)', !(await sizeOf('package.json')));

/* ---------- third-party requests ---------- */

console.log('\n── network');
check('zero off-origin requests', offOrigin === 0, offOrigin ? [...offOriginSeen].join(' ') : 'none');

/* ---------- reduced motion ---------- */

console.log('\n── reduced motion');
await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (present.length) {
  await cdp.goto(ORIGIN + '/' + present[0].file);
  const rm = await cdp.eval(`(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    anims: document.getAnimations ? document.getAnimations().length : 0,
    hidden: [...document.querySelectorAll('.prose > *')].filter((n) => {
      const s = getComputedStyle(n); return s.opacity === '0' || s.visibility === 'hidden' || s.display === 'none';
    }).length
  }))()`);
  check('prefers-reduced-motion is emulated', rm.matches === true);
  check('nothing animates under reduced motion', rm.anims === 0, String(rm.anims));
  check('nothing is hidden under reduced motion', rm.hidden === 0, String(rm.hidden));
} else {
  console.log('  (skipped — no pages)');
}
await cdp.send('Emulation.setEmulatedMedia', { features: [] });

/* ---------- summary ---------- */

console.log('\n' + (problems.length ? '  ' + problems.length + ' failed' : '  all checks passed') +
  '  ·  ' + pass + ' passed' + (warnings.length ? '  ·  ' + warnings.length + ' warnings' : '') +
  (skipped.length ? '  ·  ' + skipped.length + ' pages not written yet' : ''));
if (warnings.length) { console.log('  warnings:'); warnings.forEach((w) => console.log('    · ' + w)); }
if (problems.length) { console.log('  failures:'); problems.forEach((p) => console.log('    ✗ ' + p)); }

child.kill('SIGKILL');
process.exit(problems.length ? 1 : 0);
