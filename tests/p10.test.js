// 第12回再評価への対応：とりけしで ふるい もじが もどる・2つで 1もじの かんじの さかいめ・くとうてんの かわり
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const openEdit = async (pg, doc) => {
  await pg.evaluate(d => { S().script = 'hira'; P().doc = [d]; saveDB(); show('make'); $('#docEdit').closest('details').open = true; }, doc);
  await pg.locator('#docEdit').focus();
};
const val = pg => pg.evaluate(() => $('#docEdit').value);

test('10-1 P1 ふるい かんじを けして とりけす（Undo）と もどる。やりなおし（Redo）も できる。あたらしく うった かんじは とりけし・やりなおしでも はいらない', async b => {
  const pg = await openPage(b);
  await openEdit(pg, '学校へ。');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 1));
  await pg.keyboard.press('Backspace');
  eq(await val(pg), '校へ。');
  await pg.keyboard.press('ControlOrMeta+z');
  eq(await val(pg), '学校へ。');
  await pg.keyboard.press('ControlOrMeta+Shift+z');
  eq(await val(pg), '校へ。');
  // えらんで おきかえ → とりけし
  await pg.keyboard.press('ControlOrMeta+z');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 2));
  await pg.keyboard.insertText('が');
  eq(await val(pg), 'がへ。');
  await pg.keyboard.press('ControlOrMeta+z');
  eq(await val(pg), '学校へ。');
  // あたらしい かんじ：とりのぞかれ、とりけし・やりなおしでも もどって こない
  await pg.evaluate(() => { const t = $('#docEdit'); t.setSelectionRange(t.value.length, t.value.length); });
  await pg.keyboard.insertText('本');
  eq(await val(pg), '学校へ。');
  await pg.keyboard.press('ControlOrMeta+z');
  await pg.keyboard.press('ControlOrMeta+Shift+z');
  ok(!/本/.test(await val(pg)), await val(pg));
  // ちょくせつ「とりけし」の できごとが きても、うけいれて いない なかみなら あたらしい かんじは とる
  const r = await pg.evaluate(() => { const t = $('#docEdit'); t.value = '学校へ。本'; t.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'historyUndo' })); return t.value; });
  eq(r, '学校へ。');
  noErr(pg);
});

test('10-2 P1 2つで 1もじの かんじ（𠮷 など）を おきかえ・はさむ・けしても、こわれた もじに ならない', async b => {
  const pg = await openPage(b);
  const broken = s => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);
  await openEdit(pg, '𠮷あ');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 2));
  await pg.keyboard.insertText('𠮯');
  let v = await val(pg); eq(v, 'あ'); ok(!broken(v), escape(v));
  // おわりがわ：おなじ したの かたわれを もつ もじ
  await openEdit(pg, 'あ𠮷');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(1, 3));
  await pg.keyboard.insertText('𠞷');
  v = await val(pg); eq(v, 'あ'); ok(!broken(v), escape(v));
  // はさむ・けす
  await openEdit(pg, '𠮷𠮷');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(2, 2));
  await pg.keyboard.insertText('𠮯い');
  v = await val(pg); eq(v, '𠮷い𠮷'); ok(!broken(v), escape(v));
  await pg.keyboard.press('Backspace');
  await pg.keyboard.press('Backspace');
  v = await val(pg); ok(!broken(v), escape(v)); eq(v, '𠮷');
  noErr(pg);
});

test('10-3 P2 くとうてんの かわり（, . ! ? ， ．）は、なまえ・だいでも もじとうろく できる かたち（、。！？）に そろう', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().script = 'hira'; show('setting'); });
  await pg.locator('#profName').fill('たロう２０２６,.!?，．');
  eq(await pg.evaluate(() => $('#profName').value), 'たろう2026、。！？、。');
  await pg.evaluate(() => show('finish'));
  await pg.locator('#optTitle').fill('えんそく!');
  eq(await pg.evaluate(() => [$('#optTitle').value, fin.title]), ['えんそく！', 'えんそく！']);
  noErr(pg);
});
