// かんじは うてない（ひらがなで うつ）：ぶん・ことば・だい・なまえの らんで、かんじを とりのぞいて しらせる
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('7-1 じゆうに かく・ぶんしょうを なおす・だい・なまえ・せんせいが たす ことば で、かんじを うつと とりのぞかれ、しらせが でる', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { mk = P().mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; show('make'); });
  await pg.locator('#freeText').fill('きょう学校で𠮷あそんだ。');
  const r1 = await pg.evaluate(() => [$('#freeText').value, P().mk.free, $$('.toast').map(x => x.textContent).join('|')]);
  eq(r1.slice(0, 2), ['きょうであそんだ。', 'きょうであそんだ。']);
  ok(/かんじや ABC は つかえません/.test(r1[2]), r1[2]);
  // ぶんしょうを なおす
  await pg.evaluate(() => { P().doc = ['あいう。']; saveDB(); show('make'); $('#docEdit').closest('details').open = true; });
  await pg.locator('#docEdit').fill('あい漢字う。');
  eq(await pg.evaluate(() => $('#docEdit').value), 'あいう。');
  // だい（しあげる）
  await pg.evaluate(() => show('finish'));
  await pg.locator('#optTitle').fill('えんそく遠足');
  eq(await pg.evaluate(() => [$('#optTitle').value, fin.title]), ['えんそく', 'えんそく']);
  // なまえ（せってい）
  await pg.evaluate(() => show('setting'));
  await pg.locator('#profName').fill('こん今ちゃん');
  eq(await pg.evaluate(() => $('#profName').value), 'こんちゃん');
  // せんせいが たす ことば
  await pg.evaluate(() => { mk = P().mk = { tpl: TPLS[0].id, vals: {}, active: null, free: '' }; show('make'); });
  const w = pg.locator('#chooser input[data-kana]').first();
  await w.fill('音楽おんがく');
  eq(await w.inputValue(), 'おんがく');
  // ひらがなの ひとは カタカナも ひらがなに そろう。すうじ・きごうは そのまま
  await pg.evaluate(() => { mk = P().mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; show('make'); });
  await pg.locator('#freeText').fill('ボール 3こ！');
  eq(await pg.evaluate(() => P().mk.free), 'ぼーる 3こ！');
  noErr(pg);
});

test('7-2 にほんごの へんかんの とちゅうは さわらず、きまったら とりのぞく（カーソルも ずれない）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    mk = P().mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; show('make');
    const ta = $('#freeText'); ta.focus();
    ta.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    ta.value = 'あ学校い'; ta.setSelectionRange(3, 3);
    ta.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: '学校' }));
    const mid = [ta.value, P().mk.free];
    ta.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '学校' }));
    return { mid, end: [ta.value, P().mk.free, ta.selectionStart] };
  });
  eq(r.mid, ['あ学校い', 'あ学校い'], 'とちゅうは そのまま');
  eq(r.end, ['あい', 'あい', 1], 'きまったら とりのぞく');
  noErr(pg);
});

test('7-3 まえから ある データの かんじは けさない・バックアップの らんは かんじも そのまま', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    P().doc = ['学校に いきました。']; P().name = '山田'; saveDB(); show('make'); show('setting');
    const box = $('#exportBox'); box.value = '{"漢字":1}'; box.dispatchEvent(new Event('input', { bubbles: true }));
    return [P().doc[0], P().name, box.value];
  });
  eq(r, ['学校に いきました。', '山田', '{"漢字":1}']);
  noErr(pg);
});
