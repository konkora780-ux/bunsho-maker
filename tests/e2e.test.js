// iPad の 6つの がめんの おおきさで、①〜③・もじとうろく・せってい・じどうせいと モードを とおしで ためす
// はみでた ボタンや エラーが あれば しっぱい。がめんの しゃしんは tests/out/ に できる
const path = require('path');
const { test, URL_, OUT } = require('./helpers');
const VPS = [[768, 1024, 'mini-tate'], [1024, 768, 'mini-yoko'], [810, 1080, '10.2-tate'], [1080, 810, '10.2-yoko'], [1024, 1366, 'pro-tate'], [1366, 1024, 'pro-yoko']];
test('とおしで うごかす（iPad 6がめん）', async b => {
  const issues = [];
  for (const [w, h, name] of VPS) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    const ovf = async label => {
      const r = await pg.evaluate(() => {
        const out = [];
        const W = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > W + 1) out.push('page-hscroll ' + document.documentElement.scrollWidth + '>' + W);
        document.querySelectorAll('button,select,input,label,.chip,.slot').forEach(e => {
          if (!e.offsetParent) return;
          const b = e.getBoundingClientRect();
          if (b.width && (b.right > W + 1 || b.left < -1)) out.push('offscreen ' + (e.id || e.textContent.trim().slice(0, 12)) + ' ' + Math.round(b.left) + '-' + Math.round(b.right));
        });
        return out;
      });
      r.forEach(x => issues.push(`[${name}] ${label}: ${x}`));
    };
    await pg.goto(URL_);
    await ovf('make');
    // ① 文づくり（タップ）
    await pg.locator('.tpl', { hasText: 'たのしかったこと' }).tap();
    for (const t of ['きょう', 'ともだち', 'うた', 'うれしかったです。']) await pg.locator('.chip', { hasText: t }).first().tap();
    await pg.locator('#btnAddSent').tap();
    await pg.locator('.tpl', { hasText: 'じゆうに' }).tap();
    await pg.fill('#freeText', 'また いきたいです。'); await pg.locator('#btnAddSent').tap();
    await ovf('make-filled');
    const doc = await pg.evaluate(() => P().doc);
    if (doc.length !== 2) issues.push(`[${name}] doc length ${doc.length}`);
    // ② タイピング（画面キーボードをタップ）
    await pg.locator('#goType').tap(); await ovf('type'); await pg.screenshot({ path: path.join(OUT, `E_${name}_type.png`) });
    let n = 0, guard = 0;
    while (guard++ < 400) {
      const st = await pg.evaluate(() => ({ done: ty.done, all: ty.done && ty.si >= ty.sents.length - 1, k: ty.done ? null : nextKeyKana() }));
      if (st.all) break;
      if (st.done) { await pg.locator('#bigNow button', { hasText: 'つぎへ' }).tap(); continue; }
      await pg.locator(`#kb .key[data-k="${st.k}"]`).dispatchEvent('pointerdown'); n++;
    }
    const miss = await pg.evaluate(() => ty.miss);
    if (miss) issues.push(`[${name}] typing miss ${miss}`);
    await ovf('type-done');
    // ③ しあげ：すべての つかいみち × 3モード
    await pg.locator('#steps button[data-v=finish]').tap();
    for (const m of ['font', 'glyph', 'hand']) {
      await pg.locator(`.mode[data-m=${m}]`).tap();
      for (const u of ['free', 'genko', 'sakubun', 'renraku', 'keiji', 'card', 'tanzaku']) {
        await pg.selectOption('#optUse', u); await pg.waitForTimeout(60);
        await ovf(`finish-${m}-${u}`);
        const cssW = await pg.evaluate(() => $('#sheet').getBoundingClientRect().width);
        if (cssW < 100) issues.push(`[${name}] sheet too small ${m}-${u} ${cssW}`);
      }
    }
    // てがき：おおきな わく
    await pg.locator('#btnHandOpen').tap(); await pg.waitForTimeout(100);
    const pad = await pg.locator('#handPad').boundingBox();
    const bar = await pg.locator('#handFull .padbar').boundingBox();
    if (pad.y + pad.height > h + 1 || pad.x + pad.width > w + 1) issues.push(`[${name}] hand pad overflows ${JSON.stringify(pad)}`);
    if (pad.y < bar.y + bar.height - 1) issues.push(`[${name}] hand pad overlaps bar`);
    await pg.mouse.move(pad.x + pad.width * .3, pad.y + pad.height * .3); await pg.mouse.down(); await pg.mouse.move(pad.x + pad.width * .6, pad.y + pad.height * .6, { steps: 5 }); await pg.mouse.up();
    await pg.locator('#btnHandNext').tap();
    await pg.screenshot({ path: path.join(OUT, `E_${name}_pad.png`) });
    await pg.locator('#btnHandClose').tap();
    if (await pg.evaluate(() => Object.keys(handChars()).length) < 1) issues.push(`[${name}] hand stroke not saved`);
    // 保存・送信（PDF）
    await pg.locator('#btnSaveWork').tap();
    await pg.locator('#btnImage').tap(); await pg.waitForTimeout(300);
    await ovf('send-modal');
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.locator('.modal button', { hasText: 'PDF を ダウンロード' }).tap()]);
    await dl.saveAs(path.join(OUT, `E_${name}.pdf`));
    await pg.locator('.modal button', { hasText: 'とじる' }).tap();
    await pg.screenshot({ path: path.join(OUT, `E_${name}_finish.png`), fullPage: true });
    // もじとうろく
    await pg.locator('#steps button[data-v=glyph]').tap(); await ovf('glyph');
    await pg.locator('.gcell[aria-label="あ を かく"]').tap(); await pg.waitForTimeout(100);
    const g = await pg.locator('.box > .bigcv').boundingBox();
    if (g.y + g.height > h + 1 || g.x + g.width > w + 1) issues.push(`[${name}] glyph pad overflows`);
    await ovf('glyph-modal');
    await pg.mouse.move(g.x + 50, g.y + 50); await pg.mouse.down(); await pg.mouse.move(g.x + 200, g.y + 150, { steps: 4 }); await pg.mouse.up();
    await pg.locator('.box button', { hasText: 'つぎへ' }).tap();
    await pg.locator('.box button', { hasText: 'おわる' }).tap();
    if (!(await pg.evaluate(() => !!P().glyphs['あ']))) issues.push(`[${name}] glyph not saved`);
    // せってい：ひと ついか・きりかえ・バックアップ
    await pg.locator('#steps button[data-v=setting]').tap(); await ovf('setting');
    await pg.fill('#profName', 'たろう'); await pg.locator('#btnProfAdd').tap();
    await pg.locator('#btnExport').tap();
    const code = await pg.inputValue('#exportBox');
    const first = await pg.evaluate(() => DB.profiles[0].id);
    await pg.selectOption('#whoSel', first);
    if ((await pg.evaluate(() => P().name)) !== 'ためしのひと') issues.push(`[${name}] switch failed`);
    await pg.fill('#exportBox', code); await pg.locator('#btnImport').tap();
    await pg.locator('.modal button', { hasText: 'べつの ひととして ついか' }).tap();
    if ((await pg.evaluate(() => DB.profiles.length)) !== 3) issues.push(`[${name}] import add failed`);
    await ovf('after-import');
    // じどうせいと モード（ながおし）
    await pg.evaluate(() => window.scrollTo(0, 0)); const rb = await pg.locator('#roleBtn').boundingBox();
    await pg.mouse.move(rb.x + 10, rb.y + 10); await pg.mouse.down(); await pg.waitForTimeout(1350); await pg.mouse.up();
    if (!(await pg.evaluate(() => document.body.classList.contains('student')))) issues.push(`[${name}] role toggle failed`);
    for (const v of ['make', 'type', 'finish', 'glyph']) { await pg.locator(`#steps button[data-v=${v}]`).tap(); await ovf('student-' + v); }
    const vis = await pg.evaluate(() => [...document.querySelectorAll('.tonly')].filter(e => e.offsetParent).map(e => e.id || e.className));
    if (vis.length) issues.push(`[${name}] teacher-only visible in student: ${vis.join(',')}`);
    await pg.screenshot({ path: path.join(OUT, `E_${name}_student.png`), fullPage: true });
    errs.forEach(e => issues.push(`[${name}] ${e}`));
    await ctx.close();
  }
  if (issues.length) throw new Error(issues.join('\n'));
});
