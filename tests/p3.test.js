// だい3かい さいひょうか：ながい ぶんと じゅんじょの ことば・まえの かたちの てがき・よみだせない とき・ながい せん・PDF
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';

test('3P1-1 じゅんじょの ことばを つけても 1ぶんは ほぞんの うえかぎりを こえない（けずられない）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(), box = $('#optConn'), tog = on => { box.checked = on; box.dispatchEvent(new Event('change')); };
    const M = bodyMax(), out = { M };
    p.conn = false; p.doc = []; delete p.docIds; show('make'); renderDoc();
    // ながすぎる ぎょうは なおす らんで うけつけない（らんは のこる）
    $('#docEdit').value = 'あ'.repeat(M + 1) + '\nい。'; $('#btnApplyEdit').click();
    out.refused = [p.doc.length, $('#docEdit').value.length];
    // ちょうど うえかぎり → つけても 2000もじ。よみこんでも へらない
    $('#docEdit').value = 'あ'.repeat(M) + '\nい。'; $('#btnApplyEdit').click(); tog(true);
    const back = parseCode(exportCode());
    out.fit = [p.doc[0].length, back.ps[0].doc[0].length, back.fixes.length];
    // つけて いない ながい ぶん（うえかぎり＋1）が ある とき は チェックを つけない
    tog(false); p.doc = ['あ'.repeat(M + 1), 'い。']; delete p.docIds; renderDoc();
    tog(true); out.connRefused = [p.conn, box.checked, p.doc[0].length];
    // じゆうに かく：ながすぎると いれられないが、けさずに のこす
    mk = p.mk = { tpl: 'jiyu', vals: {}, active: null, free: '' }; renderMake();
    const ta = $('#freeText'); ta.value = 'う'.repeat(M + 3); ta.dispatchEvent(new Event('input'));
    out.free = [$('#btnAddSent').disabled, /あと 3もじ/.test($('#sentPreview').textContent), mk.free.length];
    saveDB();
    return out;
  });
  eq(r.refused, [0, r.M + 4]); eq(r.fit, [2000, 2000, 0]); eq(r.connRefused, [false, false, r.M + 1]); eq(r.free, [true, true, r.M + 3]);
  await pg.reload();
  eq(await pg.evaluate(() => [P().mk.free.length, LOAD_FIXES.length]), [r.M + 3, 0]);
  noErr(pg);
});

test('3P1-2 まえの かたちの てがき（シートの ざひょう）は ざひょうを かえず、ひらかずに まもる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const old = { id: 'wold', date: '2026-10-01', text: 'あい', mode: 'hand', dir: 'yoko', cols: 10, paper: 'free', hand: [[[100, 100], [200, 200]], [[350.5, 20], [360, 40]]] };
    const w = cleanWork(old), p = P();
    p.works = [w]; p.doc = ['いまの ぶん']; saveDB();
    const back = parseCode(exportCode());
    openWork(p.works[0]);
    renderWorks();
    return { hand: w.hand, back: back.ps[0].works[0].hand, fixes: back.fixes, doc: p.doc, kept: JSON.stringify(p.works[0].hand) === JSON.stringify(old.hand), toast: $$('.toast').map(t => t.textContent).join('') };
  });
  eq([r.hand, r.back, r.fixes, r.doc, r.kept], [[[[100, 100], [200, 200]], [[350.5, 20], [360, 40]]], [[[100, 100], [200, 200]], [[350.5, 20], [360, 40]]], [], ['いまの ぶん'], true]);
  ok(/ひらけません/.test(r.toast), r.toast);
  noErr(pg);
});

test('3P2-3 よみだせない ときは せんようの あんないだけ。のこせなかった ときの ほぞん さいかいの しっぱい', async b => {
  const pg = await openPage(b);
  await pg.addInitScript(() => {
    const g = Storage.prototype.getItem, s = Storage.prototype.setItem;
    Storage.prototype.getItem = function (k) { if (k === 'bunshoMaker.v1' && sessionStorage.getItem('failRead')) throw new Error('read'); return g.call(this, k); };
    Storage.prototype.setItem = function (k, v) {
      if (String(k).includes('.broken') && sessionStorage.getItem('failBroken')) throw new Error('quota');
      if (k === 'bunshoMaker.v1' && sessionStorage.getItem('failMain')) throw new Error('quota');
      return s.call(this, k, v);
    };
  });
  // 1) よみだせない
  await pg.evaluate(() => sessionStorage.setItem('failRead', '1'));
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  const r1 = await pg.evaluate(() => ({ t: $('#brokenBox').textContent, btn: $$('#brokenBox button').length, ban: ($('#saveErr') || {}).textContent || '' }));
  ok(/よみだせませんでした/.test(r1.t) && !/とりだ|けすと|ほぞん できるように/.test(r1.t), r1.t); eq(r1.btn, 0);
  ok(!/とりだす/.test(r1.ban), r1.ban);
  // 2) まえに のこした ものが ある うえで、こんどは のこせない → メモリから とりだす → ほぞん さいかいが しっぱい → もういちど
  await pg.evaluate(k => { sessionStorage.clear(); localStorage.setItem(k + '.broken.1', '{"まえ":1}'); localStorage.setItem(k, JSON.stringify({ profiles: [{ id: 'p1', name: 'a', fin: { title: 'あ'.repeat(61) } }], current: 'p1' })); sessionStorage.setItem('failBroken', '1'); }, KEY);
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  const t2 = await pg.evaluate(() => $('#brokenBox').textContent);
  ok(!/「けす」を おすと/.test(t2), t2);
  await pg.evaluate(() => sessionStorage.setItem('failMain', '1'));
  await pg.click('#brokenBox >> text=とりだしたので ほぞんを はじめる'); await pg.click('#brokenBox >> text=ほんとう');
  eq(await pg.evaluate(() => [saveBlocked, HELD_RAW != null]), [true, true]);
  await pg.evaluate(() => sessionStorage.removeItem('failMain'));
  await pg.click('#brokenBox >> text=とりだしたので ほぞんを はじめる'); await pg.click('#brokenBox >> text=ほんとう');
  eq(await pg.evaluate(k => [saveBlocked, HELD_RAW, !!localStorage.getItem(k + '.broken.1')], KEY), [false, null, true]);
  noErr(pg);
});

test('3P2-5 とても ながい 1ぽんの せんも、さいごまで のこる（てんの うえかぎり いない）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    // かく わくと おなじ しくみ（attachDraw）を みえる キャンバスで ためす
    const cv = document.createElement('canvas'); cv.width = cv.height = 400;
    cv.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:400px;z-index:9999'; document.body.append(cv);
    const got = [];
    attachDraw(cv, { toLogical: (fx, fy) => [fx, fy], onDraw: () => {}, onEnd: pts => got.push(simplify(pts, 0.0001)) });
    const P_ = i => [5 + (i % 200) * 1.9, 5 + Math.floor(i / 200) * 9.5];
    const ev = (t, i) => new PointerEvent(t, { pointerId: 7, pointerType: 'pen', clientX: P_(i)[0], clientY: P_(i)[1], bubbles: true });
    cv.dispatchEvent(ev('pointerdown', 0));
    for (let i = 1; i <= 7999; i++) cv.dispatchEvent(ev('pointermove', i));
    cv.dispatchEvent(ev('pointerup', 7999));
    cv.remove();
    const s = got[0], last = s[s.length - 1], ex = P_(7999).map(v => v / 400);
    return { dbg: [last, ex], n: got.length, len: s.length, near: Math.abs(last[0] - ex[0]) < 0.01 && Math.abs(last[1] - ex[1]) < 0.01 };
  });
  eq([r.n, r.len <= 5000, r.near], [1, true, true], JSON.stringify(r.dbg));
  noErr(pg);
});

test('3P2-6 たんどくの PDF：つくって いる あいだに ひとを かえても まざらない／きょうゆう しっぱい からの ほぞんでも ばんごうが のこる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const p = P(), A = [[[0.1, 0.1], [0.9, 0.9]]];
    p.glyphs = { 'あ': A }; p.doc = ['あいあ']; Object.assign(fin, { mode: 'glyph', name: true }); saveDB(); show('finish');
    const f = fixedFin(), ref = new Uint8Array(await (await finishPDF(f.o, f.text, f.hand, 't')).files[0].arrayBuffer());
    let got = null; const osm = openSendModal; openSendModal = o => { got = o; };
    $('#btnImage').click();
    // おした すぐ あとに、もじ・なまえ・しあげ・ひとを かえる
    p.glyphs['あ'] = [[[0.9, 0.1], [0.1, 0.9]]]; p.name = 'べつ'; fin.mode = 'font';
    const q = newProfile('ほか'); DB.profiles.push(q); DB.current = q.id;
    for (let i = 0; i < 100 && !got; i++) await new Promise(r => setTimeout(r, 50));
    openSendModal = osm; DB.current = p.id;
    const out = new Uint8Array(await got.files[0].arrayBuffer());
    return { same: out.length === ref.length && out.every((x, i) => x === ref[i]) };
  });
  eq(r, { same: true });
  // きょうゆうが しっぱい → ファイルとして ほぞん → ばんごう つき
  await pg.evaluate(() => { navigator.canShare = () => true; navigator.share = () => Promise.reject(new Error('x')); sendFile(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }), 2); });
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('.modal button:has-text("ファイルとして ほぞん")')]);
  ok(/^bunsho_\d{8}_\d{6}_2\.pdf$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  noErr(pg);
});
