// 第11回 動作チェックへの対応：てがきを まもる・さくひんの もじ・ばらばらの だくてん・ふるい もじを まもる
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const ST = [[[0.2, 0.2], [0.8, 0.8]]];

test('9-1 P0 てがきが ある あいだは ひらがな⇔カタカナを かえない（せってい・②の キー）。ちがう もじの わくを ひらいて とじても せんは きえない', async b => {
  const pg = await openPage(b);
  await pg.evaluate(st => { S().script = 'hira'; S().input = 'kana'; P().doc = ['あ。']; P().hand = { 0: { ch: 'あ', s: st } }; fin.mode = 'hand'; saveDB(); show('setting'); }, ST);
  await pg.selectOption('#optScript', 'kata');
  const r1 = await pg.evaluate(() => [S().script, $('#optScript').value, $$('.toast').map(x => x.textContent).join('|')]);
  eq(r1.slice(0, 2), ['hira', 'hira']);
  ok(/てがきを まもる/.test(r1[2]), r1[2]);
  await pg.evaluate(() => show('type'));
  await pg.locator('#kb .key[data-k="KATA"]').dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => S().script), 'hira');
  // むかしの データなどで もじが ちがう ばあい：わくを ひらいて なにも かかずに とじても けさない
  const r2 = await pg.evaluate(() => {
    S().script = 'kata'; saveDB(); show('finish'); fin.hi = 0; openHandFull(true); const n = padStrokes.length; $('#btnHandClose').click();
    return [n, P().hand[0] && P().hand[0].ch, JSON.parse(localStorage.getItem(STORE_KEY)).profiles.find(p => p.id === DB.current).hand[0].ch];
  });
  eq(r2, [0, 'あ', 'あ']);
  // てがきを けせば かえられる
  await pg.evaluate(() => { P().hand = {}; S().script = 'hira'; saveDB(); show('setting'); });
  await pg.selectOption('#optScript', 'kata');
  eq(await pg.evaluate(() => S().script), 'kata');
  noErr(pg);
});

test('9-2 P1 ほぞんした ときと ちがう もじで さくひんを ひらいても、ほぞんした ときの もじ・だい・なまえ・とうろく もじの まま', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(st => {
    S().script = 'kata'; P().name = 'まえ'; P().doc = ['あ']; P().hand = {}; P().glyphs = { 'ア': st }; fin.mode = 'glyph'; fin.title = 'だい'; fin.name = true; delete fin.snap; saveDB();
    show('finish'); $('#btnSaveWork').click();
    S().script = 'hira'; P().name = 'いま'; P().glyphs = {}; P().doc = ['べつ']; saveDB();
    openWork(P().works[0]);
    const o = finO();
    const out = { text: finText(), snap: !!finSnap(), name: o.nameText, title: o.title, gl: Object.keys(o.glyphs || {}).join(''), titleBox: $('#optTitle').value, doc: P().doc[0] };
    // そのまま ほぞんしなおしても おなじ もじ
    $('#btnSaveWork').click(); const w = P().works[0]; out.re = [w.text, w.title, w.nameText];
    // ぶんを かえたら いまの せっていに なる
    P().doc = ['あい']; out.after = [finText(), !!finSnap()];
    return out;
  }, ST);
  eq([r.text, r.snap, r.name, r.title, r.gl, r.titleBox, r.doc], ['ア', true, 'マエ', 'ダイ', 'ア', 'ダイ', 'あ']);
  eq(r.re, ['ア', 'ダイ', 'マエ']);
  eq(r.after, ['あい', false]);
  noErr(pg);
});

test('9-3 P1 はりつけた ばらばらの だくてん・はんだくてん（カ＋゛ など）は 1もじに まとめて のこす', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().script = 'kata'; mk = P().mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; show('make'); });
  await pg.locator('#freeText').fill('ガ パ が');
  eq(await pg.evaluate(() => [$('#freeText').value, sentenceText()]), ['ガ パ ガ', 'が ぱ が']);
  eq(await pg.evaluate(() => normText('ぱ')), 'ぱ');
  noErr(pg);
});

test('9-4 P1 まえから ある かんじは、ほかの ところを なおしても けさない（あたらしく いれた かんじだけ とる）', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().script = 'hira'; P().doc = ['学校へ。']; saveDB(); show('make'); $('#docEdit').closest('details').open = true; });
  await pg.locator('#docEdit').focus();
  await pg.locator('#docEdit').press('End');
  await pg.keyboard.insertText('あ');
  eq(await pg.evaluate(() => $('#docEdit').value), '学校へ。あ');
  await pg.keyboard.insertText('本');
  eq(await pg.evaluate(() => $('#docEdit').value), '学校へ。あ');
  await pg.evaluate(() => $('#btnApplyEdit').click());
  eq(await pg.evaluate(() => P().doc), ['学校へ。あ']);
  // なまえ・だい も おなじ
  await pg.evaluate(() => { P().name = '今野'; show('setting'); });
  await pg.locator('#profName').focus(); await pg.locator('#profName').press('End'); await pg.keyboard.insertText('た');
  eq(await pg.evaluate(() => $('#profName').value), '今野た');
  noErr(pg);
});
