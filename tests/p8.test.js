// カタカナ（ひとごと）・iPad と おなじ かなキーボード・すうじ
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('8-1 せんせいが カタカナに すると、ことば・ぶん・しあげ・さくひんが カタカナ。なかは ひらがなの まま', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { show('setting'); });
  await pg.selectOption('#optScript', 'kata');
  const r = await pg.evaluate(() => {
    P().doc = ['きょう、がっきを えんそうしました。']; fin.title = 'えんそく'; fin.name = true; P().name = 'たろう'; saveDB();
    mk = P().mk = { tpl: 'gamba', vals: {}, active: null, free: '' }; show('make');
    const chips = $$('#chooser .chip').map(x => x.textContent).join('|');
    const line = $('#docList .docline span').textContent;
    const o = finO();
    return { set: S().script, chips, line, doc: P().doc[0], fin: finText(), title: o.title, name: o.nameText, edit: $('#docEdit').value };
  });
  eq(r.set, 'kata');
  ok(/キョウ/.test(r.chips) && !/きょう/.test(r.chips), r.chips);
  eq([r.line, r.doc, r.fin, r.title, r.name, r.edit], ['キョウ、ガッキヲ エンソウシマシタ。', 'きょう、がっきを えんそうしました。', 'キョウ、ガッキヲ エンソウシマシタ。', 'エンソク', 'タロウ', 'キョウ、ガッキヲ エンソウシマシタ。']);
  // さくひんは カタカナで のこる。ひらく と なかは ひらがな
  const w = await pg.evaluate(() => { show('finish'); $('#btnSaveWork').click(); const w = P().works[0]; return [w.text, w.title, w.nameText]; });
  eq(w, ['キョウ、ガッキヲ エンソウシマシタ。', 'エンソク', 'タロウ']);
  const o2 = await pg.evaluate(() => { openWork(P().works[0]); return [P().doc[0], fin.title, finText(), !!finSnap()]; });
  eq(o2, ['きょう、がっきを えんそうしました。', 'えんそく', 'キョウ、ガッキヲ エンソウシマシタ。', true]);
  noErr(pg);
});

test('8-2 らんの もじが その ひとの もじに そろう（ひらがな⇔カタカナ）。なまえも そろえる', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().script = 'kata'; mk = P().mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; show('make'); });
  await pg.locator('#freeText').fill('ぼーる 3こ！');
  eq(await pg.evaluate(() => [$('#freeText').value, sentenceText()]), ['ボール 3コ！', 'ぼーる 3こ！']);
  await pg.evaluate(() => { S().script = 'hira'; show('make'); });
  await pg.locator('#freeText').fill('ボールABC@#');
  eq(await pg.evaluate(() => $('#freeText').value), 'ぼーる');
  await pg.evaluate(() => { S().script = 'kata'; show('setting'); });
  await pg.locator('#profName').fill('こんちゃん２０');
  eq(await pg.evaluate(() => $('#profName').value), 'コンチャン20');
  // ぜんかくの すうじは はんかくに
  eq(await pg.evaluate(() => normText('２０２６ねん')), '2026ねん');
  // バックアップで のこる・へんな あたいは もどる
  eq(await pg.evaluate(() => [cleanSettings({ script: 'kata', scriptKey: false }).script, cleanSettings({ script: 'x' }).script, cleanSettings({}).scriptKey]), ['kata', 'hira', true]);
  noErr(pg);
});

test('8-3 かなキーボード：iPad と おなじ ならび、ひだりに 123・カタカナ・ひらがな、123 で 1〜0 の よこ 1れつ', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().input = 'kana'; S().script = 'hira'; P().doc = ['か3。']; saveDB(); show('type'); });
  const r = await pg.evaluate(() => {
    const cols = $$('#kb .kcol').map(c => [...c.children].map(k => k.dataset.k || ''));
    return { side: cols[0], punct: cols[1], wa: cols[2], a: cols[cols.length - 2], right: cols[cols.length - 1] };
  });
  eq(r.side.slice(0, 3), ['NUM', 'KATA', 'HIRA']);
  eq(r.punct, ['', '？', '！', '、', '。']);
  eq(r.wa, ['わ', 'を', 'ん', 'ー', 'MOD']);
  eq(r.a, ['あ', 'い', 'う', 'え', 'お']);
  eq(r.right[1], ' ');
  // か を うつ → つぎは 3：123 キーが ひかる
  await pg.locator('#kb .key[data-k="か"]').dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => $('#kb .key[data-k="NUM"]').classList.contains('next')), true);
  await pg.locator('#kb .key[data-k="NUM"]').dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => $$('#kb .knumrow .key').map(k => k.dataset.k).join('')), '1234567890');
  await pg.locator('#kb .key[data-k="3"]').dispatchEvent('pointerdown');
  // つぎは「。」：ひらがなの キーが ひかる → もどる
  eq(await pg.evaluate(() => $('#kb .key[data-k="HIRA"]').classList.contains('next')), true);
  await pg.locator('#kb .key[data-k="HIRA"]').dispatchEvent('pointerdown');
  await pg.locator('#kb .key[data-k="。"]').dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => [ty.done, ty.miss]), [true, 0]);
  // カタカナ キー：キーと もじが カタカナに なる（ぶんしょうは かわらない）
  await pg.evaluate(() => startTyping());
  await pg.locator('#kb .key[data-k="KATA"]').dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => [S().script, $('#kb .key[data-k="か"]').textContent, $('#target .unit .k').textContent, P().doc[0]]), ['kata', 'カ', 'カ', 'か3。']);
  // せんせいが きりかえを けすと、いまの もじの キーだけ
  await pg.evaluate(() => { S().scriptKey = false; renderKB(); });
  eq(await pg.evaluate(() => [!!$('#kb .key[data-k="KATA"]'), !!$('#kb .key[data-k="HIRA"]')]), [true, false]);
  noErr(pg);
});

test('8-4 もじとうろく：ひらがな・カタカナ・すうじ ぜんぶ（その ひとの もじが さき）。すうじ 0〜9 も とうろく でき、なんけたでも ならぶ', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    S().script = 'kata'; P().doc = ['2026ねん']; fin.mode = 'glyph'; saveDB(); show('glyph');
    const rows = $$('#glyphGrid .grow').map(r => [...r.querySelectorAll('.lb')].map(x => x.textContent).join(''));
    return { first: rows[0], hira: rows.includes('あいうえお'), num: rows.find(r => /^0/.test(r)), need: neededGlyphs().join(''), prog: $('#glyphProg').textContent };
  });
  eq([r.first, r.num, r.need, r.hira], ['アイウエオ', '0123456789', '206ネン', true]);
  ok(/\/ 181/.test(r.prog), r.prog);
  // すうじを とうろく → しあげで その もじが つかわれる（たりない もじに でない）
  const miss = await pg.evaluate(async () => {
    const st = [[[0.2, 0.2], [0.8, 0.8]]];
    '0123456789ネン'.split('').forEach(c => { P().glyphs[c] = st; });
    show('finish'); await drawFinish(); return $('#missingInfo').textContent;
  });
  ok(!/とうろくしていない/.test(miss), miss);
  noErr(pg);
});
