// 2026-11-05 こんちゃん：もじとうろくの とき、かく せんの ふとさを 3だんかいから えらぶ
const { test, eq, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('14-1 もじとうろくで せんの ふとさを えらぶと ③の ふとさも おなじに なり、ほぞん・よみこみで のこる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    show('glyph'); openReg('あ');
    const bs = $$('.modal .gw'), lab = bs.map(x => x.textContent);
    const first = bs.filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.textContent);
    bs[2].click();
    const after = $$('.modal .gw').filter(x => x.classList.contains('on')).map(x => x.textContent);
    return [lab, first, after, fin.weight];
  });
  eq(r, [['ほそい', 'ふつう', 'ふとい'], ['ふつう'], ['ふとい'], 0.1]);
  await pg.reload(); await pg.waitForTimeout(300);
  eq(await pg.evaluate(() => { show('finish'); return [fin.weight, $('#optWeight').value]; }), [0.1, '0.1'], 'よみこみ ご');
  noErr(pg);
});

test('14-2 ふとさで かく せんが かわる（ほそい < ふとい）。③で とちゅうの ねだんでも いちばん ちかい ボタンが えらばれる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const ink = w => {
      fin.weight = w; P().glyphs['あ'] = [[[0.2, 0.5], [0.8, 0.5]]];
      const cv = document.createElement('canvas'); drawGlyphThumb(cv, 'あ');
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) n++;
      return n;
    };
    const a = ink(0.05), c = ink(0.1);
    fin.weight = 0.08; show('glyph'); openReg('あ');
    const on = $$('.modal .gw.on').map(x => x.textContent);
    return [a < c, on];
  });
  eq(r, [true, ['ふつう']]);
  noErr(pg);
});
