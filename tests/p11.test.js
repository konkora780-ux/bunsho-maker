// 第13回再評価への対応：ふるい かんじの とりけしを、フォーカスや おぼえる かずに よらず まもる
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const openEdit = async (pg, doc) => {
  await pg.evaluate(d => { S().script = 'hira'; P().doc = [d]; saveDB(); show('make'); $('#docEdit').closest('details').open = true; }, doc);
  await pg.locator('#docEdit').focus();
};
const val = pg => pg.evaluate(() => $('#docEdit').value);
const delFirst = async pg => { await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 1)); await pg.keyboard.press('Backspace'); };

test('11-1 P1 ふるい かんじを けして、ほかの ボタンへ はなれて もどってから とりけしても もどる', async b => {
  const pg = await openPage(b);
  await openEdit(pg, '学校へ。');
  await delFirst(pg);
  eq(await val(pg), '校へ。');
  await pg.locator('#btnApplyEdit').focus();
  await pg.locator('#docEdit').focus();
  await pg.keyboard.press('ControlOrMeta+z');
  eq(await val(pg), '学校へ。');
  noErr(pg);
});

test('11-2 P1 ふるい かんじを けして 35かい うった あとでも、くりかえし とりけせば もどる', async b => {
  const pg = await openPage(b);
  await openEdit(pg, '学校へ。');
  await delFirst(pg);
  await pg.evaluate(() => { const t = $('#docEdit'); t.setSelectionRange(t.value.length, t.value.length); });
  for (let i = 0; i < 35; i++) await pg.keyboard.insertText('あ');
  eq(await val(pg), '校へ。' + 'あ'.repeat(35));
  for (let i = 0; i < 40 && (await val(pg)) !== '学校へ。'; i++) await pg.keyboard.press('ControlOrMeta+z');
  eq(await val(pg), '学校へ。');
  noErr(pg);
});

test('11-3 P1 あたらしく うった かんじは、はなれて もどっても・とりけし／やりなおしでも はいらない。べつの ぶんしょうに かわったら おぼえなおす', async b => {
  const pg = await openPage(b);
  await openEdit(pg, '学校へ。');
  await pg.evaluate(() => { const t = $('#docEdit'); t.setSelectionRange(t.value.length, t.value.length); });
  await pg.keyboard.insertText('本');
  eq(await val(pg), '学校へ。');
  await pg.locator('#btnApplyEdit').focus();
  await pg.locator('#docEdit').focus();
  await pg.keyboard.press('ControlOrMeta+z');
  await pg.keyboard.press('ControlOrMeta+Shift+z');
  ok(!/本/.test(await val(pg)), await val(pg));
  // ほかの ひと・ぶんしょう（アプリが なかみを かえた）：まえの「学」は もう みとめない
  await pg.evaluate(() => { P().doc = ['あいう。']; saveDB(); renderDoc(); });
  await pg.locator('#btnApplyEdit').focus();
  await pg.locator('#docEdit').focus();
  await pg.keyboard.insertText('学');
  ok(!/学/.test(await val(pg)), await val(pg));
  // おなじ かんじが 2つ あった ときは 2つまで
  await openEdit(pg, '学学あ');
  await pg.evaluate(() => $('#docEdit').setSelectionRange(1, 1));
  await pg.keyboard.insertText('学');
  eq(await val(pg), '学学あ');
  noErr(pg);
});

test('11-4 P1 おなじ ぶんしょうの べつの ひとに「つかうひと」で かえると、まえの ひとの ふるい かんじは みとめない', async b => {
  const pg = await openPage(b);
  const bid = await pg.evaluate(() => {
    const a = P(); a.settings = Object.assign({}, DEF_SET); a.doc = ['学あ'];
    const nb = newProfile('べつ'); nb.settings = Object.assign({}, DEF_SET); nb.doc = ['あ']; DB.profiles.push(nb); saveDB(); renderWho();
    show('make'); $('#docEdit').closest('details').open = true; return nb.id;
  });
  await pg.locator('#docEdit').focus();
  await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 1));
  await pg.keyboard.press('Backspace');
  eq(await val(pg), 'あ');
  await pg.selectOption('#whoSel', bid);
  await pg.evaluate(() => { show('make'); $('#docEdit').closest('details').open = true; });
  eq(await pg.evaluate(() => [P().name, $('#docEdit').value]), ['べつ', 'あ']);
  await pg.locator('#docEdit').focus();
  await pg.evaluate(() => $('#docEdit').setSelectionRange(0, 0));
  await pg.keyboard.insertText('学');
  eq(await val(pg), 'あ');
  // おなじ ひとの なかで はなれて もどる だけなら、まえの とりけしは まだ きく（11-1 と おなじ）
  noErr(pg);
});
