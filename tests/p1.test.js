// さいひょうか P1：ひらいた さくひんの もじ・ぶんの id・したがき・まとめPDF
const { test, eq, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('P1 ほぞんした ときに なかった もじは、あとで とうろくしても ひらいた さくひんに まぜない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const A = [[[0.1, 0.1], [0.9, 0.9]]];
    P().glyphs = { 'あ': A }; P().name = 'あ'; P().doc = ['あい'];
    Object.assign(fin, { mode: 'glyph', name: true }); saveDB();
    show('finish'); $('#btnSaveWork').click();
    const w = P().works[0];
    const pic = async (o, t, h) => (await renderPages(o, t, h))[0].toDataURL();
    const ref = await pic(w, w.text, w.hand);
    P().glyphs['い'] = A; saveDB();
    openWork(w);
    const noI = !finO().glyphs['い'];
    const openSame = (await pic(finO(), finText(), handChars())) === ref;
    $('#btnSaveWork').click();
    return { saved: Object.keys(w.glyphs), noI, openSame, resaved: Object.keys(P().works[0].glyphs) };
  });
  eq(r, { saved: ['あ'], noI: true, openSame: true, resaved: ['あ'] });
  noErr(pg);
});

test('P1 ぶんの つくりかたは ぶんの id で おぼえる（おなじ もじの ぶんでも べつべつ）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(); p.doc = ['あ。', 'あ。']; const ids = docIds();
    p.lineSrc = { [ids[0]]: { tpl: 'gamba', vals: { 0: 'きょう' } }, [ids[1]]: { tpl: 'tano', vals: { 0: 'きのう' } } };
    const two = [srcOf(0).tpl, srcOf(1).tpl];
    moveLine(0, 1);
    const moved = [srcOf(0).tpl, srcOf(1).tpl];
    // なかみを かえた ぶんの つくりかたは わすれる
    setDoc([{ i: 0, body: 'い。' }, { i: 1, body: 'あ。' }], 'keep');
    const edited = [srcOf(0), srcOf(1) && srcOf(1).tpl];
    // id が かさなって いたら つくりなおす
    p.docIds = ['x', 'x']; const fixed = new Set(docIds()).size;
    return { two, moved, edited, fixed };
  });
  eq(r, { two: ['gamba', 'tano'], moved: ['tano', 'gamba'], edited: [null, 'gamba'], fixed: 2 });
  noErr(pg);
});

test('P1 おなじ ぶんの さくひんを ひらいても、いまの くぎり・つくりかたを もちこまない。したがきで つくりかけの ぶんも もどる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(); p.doc = ['あいう']; p.cuts = [1]; p.cutsText = 'あいう'; p.lineSrc = { [docIds()[0]]: { tpl: 'gamba', vals: {} } };
    mk = p.mk = { tpl: 'tano', vals: { 0: 'きょう' }, active: null, free: '', editIdx: 0 }; saveDB();
    p.works.push({ id: 'wy', date: '2026-10-30', text: 'あいう', mode: 'font', dir: 'yoko', cols: 10, paper: 'free' });
    openWork(p.works[0]);
    const opened = [p.cuts, p.cutsText, p.lineSrc, srcOf(0), JSON.stringify(mk.vals), mk.editIdx];
    // したがきの つくりかけは よみこみなおしても のこる
    const dm = cleanProfile(JSON.parse(JSON.stringify(p))).draft.mk, again = [dm.vals[0], dm.editIdx];
    restoreDraft();
    const back = [p.cuts, p.cutsText, !!srcOf(0), mk.tpl, mk.vals[0], mk.editIdx];
    return { opened, back, again };
  });
  eq(r, { opened: [null, null, null, null, '{}', null], back: [[1], 'あいう', true, 'tano', 'きょう', 0], again: ['きょう', 0] });
  noErr(pg);
});

test('P1 まとめPDF：29・30・31・60・61ページで わけかたが ただしい', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const out = [];
    for (const n of [29, 30, 31, 60, 61]) {
      const pb = pdfBuilder('t');
      for (let i = 0; i < n; i++) { const cv = document.createElement('canvas'); cv.width = 20; cv.height = 28; pb.add(cv); }
      const res = pb.done(), counts = [];
      for (const f of res.files) counts.push(+(await f.text()).match(/\/Count (\d+)/)[1]);
      out.push([n, res.count, counts, res.files.map(f => f.name)]);
    }
    return out;
  });
  eq(r, [[29, 29, [29], ['t.pdf']], [30, 30, [30], ['t.pdf']], [31, 31, [30, 1], ['t_1.pdf', 't_2.pdf']],
    [60, 60, [30, 30], ['t_1.pdf', 't_2.pdf']], [61, 61, [30, 30, 1], ['t_1.pdf', 't_2.pdf', 't_3.pdf']]]);
  noErr(pg);
});

test('P1 PDF：とちゅうで しっぱいしても キャンバスを てばなす', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const made = [], orig = document.createElement.bind(document);
    document.createElement = t => { const e = orig(t); if (t === 'canvas') made.push(e); return e; };
    let err = '';
    try { await renderPages(Object.assign({}, fin, { mode: 'font' }), 'あいう', {}, undefined, () => { throw new Error('x'); }); } catch (e) { err = e.message; }
    document.createElement = orig;
    return { err, freed: made.every(c => c.width === 0) && made.length > 0 };
  });
  eq(r, { err: 'x', freed: true });
  noErr(pg);
});

test('P1 じぶんで かいた「はじめに、」は、ならべかえ・じゅんじょの ことばの つけはずしで きえない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(); p.conn = false; p.doc = ['あめ。', 'はじめに、いぬ。']; delete p.docIds; saveDB();
    moveLine(1, -1); const moved = p.doc.slice();
    const box = $('#optConn'); box.checked = true; box.dispatchEvent(new Event('change'));
    const on = p.doc.slice();
    moveLine(0, 1); const onMoved = p.doc.slice();
    box.checked = false; box.dispatchEvent(new Event('change'));
    return { moved, on, onMoved, off: p.doc.slice() };
  });
  eq(r, { moved: ['はじめに、いぬ。', 'あめ。'], on: ['はじめに、はじめに、いぬ。', 'さいごに、あめ。'],
    onMoved: ['はじめに、あめ。', 'さいごに、はじめに、いぬ。'], off: ['あめ。', 'はじめに、いぬ。'] });
  noErr(pg);
});
