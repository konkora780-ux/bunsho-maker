// 2026-11-05 こんちゃん：もじを うつ とき、つぎに うつ キーを ひからせない
const { test, eq, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('13-1 かな・ローマじ どちらでも、つぎに うつ キーは ひからない（ガイドに「ひからせる」は ない）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const out = [S().guide, [...$('#optGuide').options].map(o => o.value)];
    S().input = 'kana'; S().script = 'hira'; P().doc = ['か3。']; saveDB(); show('type');
    out.push($$('#kb .key.next').length);
    S().input = 'roma'; saveDB(); show('type');
    out.push($$('#kb .key.next').length, $$('#kb .key').length > 20);
    return out;
  });
  eq(r, [1, ['1', '0'], 0, 0, true]);
  noErr(pg);
});

test('13-2 まえに「ひからせる」(2)だった ひとは よみこむと「ヒント」(1)に なる。おしらせは でない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    importText(JSON.stringify({ app: 'bunsho-maker', v: 1, profile: { name: 'まえ', settings: { guide: 2 } } }));
    return [S().guide, !!$('.modal') && $('.modal').textContent.includes('なおした こと')];
  });
  eq(r, [1, false]);
  noErr(pg);
});
