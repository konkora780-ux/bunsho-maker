// きのうごとの テスト（node tests/run.js で うごく）
const path = require('path');
const { test, eq, ok, openPage, OUT } = require('./helpers');
const chip = (pg, t) => pg.locator('#chooser .chip', { hasText: t }).first().click();
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('① ぶんまつが「なにを」に あわせて かわる', async b => {
  const pg = await openPage(b);
  await chip(pg, 'きょう'); await chip(pg, 'うた'); await chip(pg, 'おおきなこえで');
  eq(await pg.$$eval('#chooser .chip', es => es.map(e => e.textContent)), ['✅うたいました。', '💪がんばってうたいました。', '💪がんばりました。']);
  await chip(pg, 'うたいました。');
  eq(await pg.evaluate(() => sentenceText()), 'きょう、うたをおおきなこえでうたいました。');
  noErr(pg);
});

test('D2 ならびかえで くぎり・てがき・かいぎょうが ずれない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    P().doc = ['あいう。', 'かきく。', 'さしす。'];
    P().cuts = [1, 6]; P().cutsText = P().doc.join('\n');
    P().hand = { 0: { ch: 'あ', s: [[1]] }, 4: { ch: 'か', s: [[1]] } }; fin.breaks = [4];
    renderDoc();
    const out = { up0: $$('#docList .mv button')[0].disabled };
    $$('#docList .mv button')[1].click();
    out.doc = P().doc.slice(); out.cuts = P().cuts.slice(); out.hand = Object.keys(P().hand).map(k => k + P().hand[k].ch);
    out.breaks = fin.breaks.slice();
    $('#optConn').click();
    out.doc2 = P().doc.slice(); out.cuts2 = P().cuts.slice(); out.hand2 = Object.keys(P().hand).map(k => k + P().hand[k].ch);
    $('#optConn').click(); out.doc3 = P().doc.slice();
    return out;
  });
  eq(r.up0, true, '1ぎょうめの ▲ は おせない');
  eq(r.doc, ['かきく。', 'あいう。', 'さしす。']);
  eq(r.cuts, [1, 6]); eq(r.hand, ['0か', '4あ']); eq(r.breaks, [0]);
  eq(r.doc2, ['はじめに、かきく。', 'つぎに、あいう。', 'さいごに、さしす。']);
  eq(r.cuts2, [6, 15]); eq(r.hand2, ['5か', '13あ']);
  eq(r.doc3, ['かきく。', 'あいう。', 'さしす。'], 'チェックを はずすと もどる');
  noErr(pg);
});

test('D3 できた ぶんを えらびなおす', async b => {
  const pg = await openPage(b);
  await pg.click('.tpl >> text=たのしかったこと');
  for (const w of ['きょう', 'ともだち', 'うた', 'うれしかったです。']) await pg.click(`.chip >> text="${w}"`);
  ok(await pg.isVisible('#rereadHint'), 'よみかえしの ヒント');
  await pg.click('#btnAddSent');
  await pg.click('.docline >> text=✏️ なおす');
  eq(await pg.textContent('#btnAddSent'), '✓ なおした ぶんに する');
  await pg.click('.slot >> nth=1'); await pg.click('.chip >> text="かぞく"'); await pg.click('#btnAddSent');
  eq(await pg.evaluate(() => P().doc), ['きょう、かぞくとうたをうたいました。うれしかったです。']);
  noErr(pg);
});

test('D4 ほうこくする・おねがい', async b => {
  const pg = await openPage(b);
  await pg.locator('#tplList button', { hasText: 'ほうこくする' }).click();
  for (const w of ['せんせい', 'きょう', 'うた', 'えがおで', 'うたいました。']) await chip(pg, w);
  await pg.click('#btnAddSent');
  await pg.locator('#tplList button', { hasText: 'おねがい' }).click();
  await chip(pg, 'ともだち'); await chip(pg, 'がっき');
  eq(await pg.$$eval('#chooser .chip', a => a.map(x => x.textContent)), ['🙋がっきをえんそうするのをてつだってください。', '💡がっきのえんそうのしかたをおしえてください。', '👀がっきをえんそうしているところをみてください。', '🤝がっきをいっしょにえんそうしてください。']);
  await chip(pg, 'いっしょに'); await pg.click('#btnAddSent');
  eq(await pg.evaluate(() => P().doc), ['せんせい、きょう、うたをえがおでうたいました。', 'ともだち、がっきをいっしょにえんそうしてください。']);
  // する の ことば・かく の ことば
  await pg.locator('#tplList button', { hasText: 'おねがい' }).click();
  await chip(pg, 'せんせい'); await chip(pg, 'そうじ');
  eq(await pg.$$eval('#chooser .chip', a => a.map(x => x.textContent.slice(2))), ['そうじをてつだってください。', 'そうじのしかたをおしえてください。', 'そうじをしているところをみてください。', 'そうじをいっしょにしてください。']);
  await pg.click('.slot >> nth=1'); await chip(pg, 'ひらがな'); await chip(pg, 'おしえて');
  eq(await pg.evaluate(() => sentenceText()), 'せんせい、ひらがなのかきかたをおしえてください。');
  noErr(pg);
});

test('D5 しゃしん（6まいまで・じどうせいとは みるだけ）', async b => {
  const pg = await openPage(b);
  const f = path.join(__dirname, 'fixtures', 'photo.jpg');
  await pg.setInputFiles('#photoFile', [f, f, f, f, f, f, f]);
  await pg.waitForFunction(() => $('#btnPhotoAdd').hidden);
  eq(await pg.evaluate(() => P().photos.length), 6);
  ok(await pg.evaluate(() => P().photos.every(x => x.d.startsWith('data:image/jpeg'))));
  const dim = await pg.evaluate(() => new Promise(r => { const i = new Image(); i.onload = () => r(Math.max(i.width, i.height)); i.src = P().photos[0].d; }));
  ok(dim <= 480, 'ちいさく なっている ' + dim);
  await pg.evaluate(() => { DB.role = 'student'; applyRole(); });
  ok(!(await pg.locator('.photo .x').first().isVisible()), 'じどうせいとには ✕ が でない');
  await pg.evaluate(() => { P().photos = []; renderPhotos(); });
  ok(await pg.evaluate(() => $('#photoCard').hidden), '0まいの ときは かくす');
  eq(await pg.evaluate(() => cleanProfile({ name: 'x', photos: [{ d: 'data:image/jpeg;base64,AAA' }, { d: 'javascript:1' }] }).photos.length), 1, 'よみこみで へんな データを はじく');
  noErr(pg);
});

test('② くぎり・ボタンなしの クリック・てうごかし すすむ', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { P().doc = ['きょうはがっこうでたのしくあそびました。']; S().advance = 'manual'; saveDB(); });
  await pg.click('#steps button[data-v=type]');
  eq(await pg.evaluate(() => ty.sents), ['きょうはがっこうでたのしくあそびました。']);
  await pg.click('#btnCuts'); await pg.click('.cutch >> nth=3'); await pg.click('.cutch >> nth=9'); await pg.click('.modal >> text=✓ おわる');
  eq(await pg.evaluate(() => ty.sents), ['きょうは', 'がっこうでた', 'のしくあそびました。']);
  let g = 0;
  while (g++ < 30) { const k = await pg.evaluate(() => ty.si > 0 || ty.done ? null : nextKeyKana()); if (!k) break; await pg.locator(`#kb .key[data-k="${k}"]`).tap({ force: true }); }
  await pg.waitForTimeout(1200);
  eq(await pg.evaluate(() => ty.si), 0, 'てうごかしでは かってに すすまない');
  noErr(pg);
});

test('A じどうせいとに みせるもの', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=setting]');
  await pg.click('#showBox label:has-text("がんばったこと") input');
  await pg.click('#showBox label:has-text("てがき") input');
  await pg.click('#showBox label:has-text("もじとうろくの ボタン") input');
  await pg.evaluate(() => { DB.role = 'student'; applyRole(); show('make'); });
  ok(!(await pg.$$eval('.tpl', es => es.map(e => e.textContent).join())).includes('がんばったこと'));
  await pg.click('#steps button[data-v=finish]');
  eq(await pg.$$eval('.mode', es => es.filter(e => !e.hidden).map(e => e.dataset.m)), ['glyph', 'font']);
  ok(!(await pg.isVisible('#steps button[data-v=glyph]')));
  noErr(pg);
});

test('③ よみこみの えらびかた と もとに もどす', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=setting]'); await pg.click('#btnExport');
  await pg.click('#btnImport'); await pg.click('text=いまの データを おきかえる');
  ok(await pg.isVisible('#btnUndoReplace'));
  await pg.click('#btnUndoReplace');
  await pg.click('#btnImport'); await pg.click('text=べつの ひととして ついか');
  eq(await pg.evaluate(() => DB.profiles.length), 2);
  noErr(pg);
});

test('④ ほぞん できない ときは あかい おしらせ', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { window._o = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await pg.click('.tpl >> text=じゆうに'); await pg.fill('#freeText', 'あい'); await pg.click('#btnAddSent');
  ok(await pg.isVisible('#saveErr'));
  await pg.evaluate(() => { Storage.prototype.setItem = window._o; saveDB(); });
  ok(!(await pg.isVisible('#saveErr')));
  noErr(pg);
});
