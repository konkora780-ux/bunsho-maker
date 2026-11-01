// テストの どうぐ：ちいさな サーバー（http://localhost）で index.html を くばり、あたらしい ブラウザの がめんで ひらく
// BROWSER=webkit で Safari と おなじ エンジン（WebKit）でも ためせる（npx playwright install webkit が ひつよう）
const pw = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+$/, '/index.html'));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
let URL = '';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function eq(a, b, msg) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg || ''}\n  ほしい: ${B}\n  じっさい: ${A}`);
}
function ok(v, msg) { if (!v) throw new Error(msg || 'ok ではない'); }
async function openPage(browser, opt = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1024, height: 1366 }, hasTouch: true, acceptDownloads: true }, opt));
  const pg = await ctx.newPage();
  pg.errs = [];
  pg.on('pageerror', e => pg.errs.push(e.message));
  await pg.goto(URL);
  return pg;
}
async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  URL = `http://127.0.0.1:${server.address().port}/index.html`;
  const name = process.env.BROWSER || 'chromium';
  console.log(`（${name} ・ ${URL}）`);
  const browser = await pw[name].launch();
  let fail = 0;
  for (const t of tests) {
    try { await t.fn(browser); console.log('✓', t.name); }
    catch (e) { fail++; console.log('✗', t.name, '\n ', e.message); }
  }
  await browser.close(); server.close();
  return fail;
}
// がめんの エラーを あつめる（とおしの テスト用）。
// そとの フォント（fonts.googleapis.com・fonts.gstatic.com）が よめない ときは iPad の もじで かわりに でるので、合否には いれず「しんだん」に URL と りゆうを のこす。
// それを みわけるのは URL だけ。メッセージの もじに fonts.g が あっても、URL が そとの フォントで なければ エラーと して のこす（URL が わからない ものも のこす）
const isExtFont = u => /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u || '');
function errWatch() {
  const errs = [], diag = [];
  return {
    errs, diag,
    pageerror: e => errs.push('PAGEERR ' + e.message),
    console: m => {
      if (m.type() !== 'error') return;
      const u = (m.location() || {}).url || '', line = 'CONSOLE ' + m.text() + (u ? ' @ ' + u : '');
      (isExtFont(u) ? diag : errs).push(line);
    },
    requestfailed: r => { const line = 'REQFAIL ' + r.url() + ' ' + ((r.failure() || {}).errorText || ''); (isExtFont(r.url()) ? diag : errs).push(line); },
  };
}
module.exports = { test, eq, ok, openPage, run, errWatch, isExtFont, OUT, get URL_() { return URL; } };
