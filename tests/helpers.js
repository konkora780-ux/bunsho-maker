// テストの どうぐ：あたらしい ブラウザの がめんで index.html を ひらく
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.join(__dirname, '..', 'index.html');
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
  const browser = await chromium.launch();
  let fail = 0;
  for (const t of tests) {
    try { await t.fn(browser); console.log('✓', t.name); }
    catch (e) { fail++; console.log('✗', t.name, '\n ', e.message); }
  }
  await browser.close();
  return fail;
}
module.exports = { test, eq, ok, openPage, run, OUT, URL_: URL };
