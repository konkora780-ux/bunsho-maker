// だい2かい さいひょうか P0：じぶんで かいた「はじめに、」を けさない／ほぞんした ものを だまって へらさない
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';

test('2P0-1 じぶんで かいた「はじめに、」は 1ぶんに なっても、チェックの つけはずしでも きえない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(), box = $('#optConn'), tog = on => { box.checked = on; box.dispatchEvent(new Event('change')); };
    const out = {};
    // さいひょうかの てじゅん：2ぶん → ON → 1つ けす（がめんの ✕）→ OFF
    p.conn = false; p.doc = ['はじめに、いぬ。', 'あめ。']; delete p.docIds; saveDB(); show('make'); renderDoc();
    tog(true); out.on = p.doc.slice();
    $$('#docList .docline')[1].querySelector('button.warn').click(); out.del = p.doc.slice();
    tog(false); out.off = p.doc.slice();
    // 1ぶんで ON → OFF
    tog(true); out.one = p.doc.slice(); tog(false); out.oneOff = p.doc.slice();
    // 0 → 1 → 2 → 1（ON の まま）
    tog(true); setDoc([], 'keep');
    setDoc([{ i: -1, body: 'はじめに、そら。' }], 'conn'); out.s1 = p.doc.slice();
    setDoc(keepAll().concat([{ i: -1, body: 'うみ。' }]), 'conn'); out.s2 = p.doc.slice();
    setDoc(keepAll().slice(0, 1), 'conn'); out.s1b = p.doc.slice();
    tog(false); out.s1off = p.doc.slice();
    // ON の まま「ぶんしょうを なおす」で、ばしょと ちがう「はじめに、」を まんなかに かく
    p.doc = ['あ。', 'い。', 'う。']; delete p.docIds; tog(true);
    $('#docEdit').value = 'はじめに、あ。\nはじめに、か。\nさいごに、う。'; $('#btnApplyEdit').click(); out.edit = p.doc.slice();
    tog(false); out.editOff = p.doc.slice();
    return out;
  });
  eq(r, {
    on: ['はじめに、はじめに、いぬ。', 'さいごに、あめ。'], del: ['はじめに、いぬ。'], off: ['はじめに、いぬ。'],
    one: ['はじめに、いぬ。'], oneOff: ['はじめに、いぬ。'],
    s1: ['はじめに、そら。'], s2: ['はじめに、はじめに、そら。', 'さいごに、うみ。'], s1b: ['はじめに、そら。'], s1off: ['はじめに、そら。'],
    edit: ['はじめに、あ。', 'つぎに、はじめに、か。', 'さいごに、う。'], editOff: ['あ。', 'はじめに、か。', 'う。'],
  });
  noErr(pg);
});

test('2P0-2 ほぞんした せん・だいを よみこみで だまって へらさない（しらせて、もとの データを のこす）', async b => {
  const pg = await openPage(b);
  // 201ぽんの せん・61もじの だいを ほぞんして よみこみなおす
  await pg.evaluate(() => {
    P().glyphs = { 'あ': Array.from({ length: 201 }, () => [[0.1, 0.1], [0.9, 0.9]]) };
    fin.title = 'あ'.repeat(61); saveDB();
  });
  const raw = await pg.evaluate(k => localStorage.getItem(k), KEY);
  await pg.reload();
  const r = await pg.evaluate(k => {
    const ks = []; for (let i = 0; i < localStorage.length; i++) { const x = localStorage.key(i); if (x.startsWith(k + '.broken')) ks.push(localStorage.getItem(x)); }
    return { fixes: LOAD_FIXES.join('／'), kept: ks, n: P().glyphs['あ'].length, title: fin.title.length };
  }, KEY);
  ok(/せん/.test(r.fixes) && /だい/.test(r.fixes), 'へらした ことを しらせる：' + r.fixes);
  eq([r.kept, r.n, r.title], [[raw], 200, 60]);
  // バックアップの コードでも しらせる
  const r2 = await pg.evaluate(() => {
    const big = { name: 'x', glyphs: { 'あ': Array.from({ length: 201 }, () => [[0, 0], [1, 1]]) }, fin: { title: 'い'.repeat(61) } };
    return parseCode(JSON.stringify({ app: 'bunsho-maker', v: 2, profile: big })).fixes.join('／');
  });
  ok(/せん/.test(r2) && /だい/.test(r2), 'コードでも しらせる：' + r2);
  noErr(pg);
});

test('2P0-2 うえかぎりは いれる ときに とめる（せん・だい・なまえ・ことば）。ふつうの データでは なにも しらせない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const out = {};
    // てがきの わく：200ぽん かいたら 201ぽんめは かけない
    show('finish'); fin.mode = 'hand'; P().doc = ['あい']; renderFinish();
    padStrokes = Array.from({ length: 199 }, () => [[0.1, 0.1], [0.9, 0.9]]);
    const cv = $('#handPad'), rc = cv.getBoundingClientRect(), ev = (t, x) => new PointerEvent(t, { pointerId: 9, pointerType: 'pen', clientX: rc.left + x, clientY: rc.top + 5, bubbles: true });
    const line = () => { cv.dispatchEvent(ev('pointerdown', 5)); cv.dispatchEvent(ev('pointermove', 20)); cv.dispatchEvent(ev('pointerup', 20)); return padStrokes.length; };
    out.strokes = [line(), line()];
    out.max = [$('#optTitle').maxLength, $('#profName').maxLength];
    // ふつうの データ（せん 200ぽん・だい 60もじ）は いったり きたりしても なにも しらせない
    const p = { name: 'a', glyphs: { 'あ': Array.from({ length: 200 }, () => [[0, 0], [1, 1]]) }, fin: { title: 'い'.repeat(60) }, words: { nani: ['あ'.repeat(30)] } };
    out.fixes = parseCode(JSON.stringify({ app: 'bunsho-maker', v: 2, profile: p })).fixes;
    // おおきすぎる コードの まんもじ
    out.err = parseCode('x'.repeat(IMPORT_MAX + 1)).err;
    return out;
  });
  eq([r.strokes, r.max, r.fixes], [[200, 200], [60, 30], []]);
  ok(/3355まんもじ。うえかぎりは 3355まんもじ/.test(r.err), r.err);
  noErr(pg);
});
