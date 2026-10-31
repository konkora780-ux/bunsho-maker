// だい4かい さいひょうか：かえた あとの ぜんぶの ぶんで ながさを しらべる・よみだせない ときの まえの コピー・ペンを はなした ところ・ながい つくりかけ・まえの かたちの てがき
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';

test('4P1-1 ふるい ながい ぶん（じゅんじょの ことば つき）に ぶんを たす・ならべかえる・けすと きは、こえるなら なにも かえない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(), A = n => 'あ'.repeat(n), snap = () => JSON.stringify([p.doc, p.hand, p.cuts, p.cutsText, mk.free, p.conn]);
    const setFree = t => { mk = p.mk = { tpl: 'jiyu', vals: {}, active: null, free: t }; renderMake(); };
    const add = () => $('#btnAddSent').click();
    const out = {};
    show('make');
    // 1) ふるい データ：2000もじの 1ぶん ＋ チェック ON（1ぶんなので じどうの ことばは まだ ない）→「い。」を たす
    p.doc = [A(2000)]; p.conn = true; delete p.docIds; p.hand = { 3: { ch: 'あ', s: [[[0, 0], [1, 1]]] } }; p.cuts = [5]; p.cutsText = p.doc.join('\n'); saveDB();
    setFree('い。'); let before = snap(); add(); out.add2000 = snap() === before;
    // 2) 1996もじ（はじめに、で 2001）→ ことわる。1995もじ → はいる・よみこんでも おなじ
    p.doc = [A(1996)]; delete p.docIds; before = snap(); add(); out.add1996 = snap() === before;
    p.doc = [A(1995)]; delete p.docIds; add();
    const back = parseCode(exportCode());
    out.add1995 = [p.doc.map(s => s.length), back.ps[0].doc.map(s => s.length), back.fixes.length];
    // 3) ならべかえ：つぎに、＋1996（2000）を さいごへ → さいごに、で 2001 → ことわる
    p.doc = ['はじめに、い。', 'つぎに、' + A(1996), 'さいごに、う。']; delete p.docIds; p.cuts = []; p.cutsText = ''; saveDB();
    before = snap(); moveLine(1, 1); out.move = snap() === before;
    // 4) けす：1つめを けすと ながい ぶんが さいしょ（はじめに、で 2001）→ ことわる
    before = snap(); $$('#docList .docline')[0].querySelector('button.warn').click(); out.del = snap() === before;
    // 5) チェックを はずす のは できる（ことばを とる だけ）
    const box = $('#optConn'); box.checked = false; box.dispatchEvent(new Event('change'));
    out.off = [p.conn, p.doc.map(s => s.length)];
    return out;
  });
  eq(r, { add2000: true, add1996: true, add1995: [[2000, 7], [2000, 7], 0], move: true, del: true, off: [false, [2, 1996, 2]] });
  noErr(pg);
});

test('4P2-2 よみだせない とき、まえに のこした コピーは「べつの コピー」として とりだせる（けす ボタンは ださない）', async b => {
  const pg = await openPage(b);
  await pg.addInitScript(() => { const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (k === 'bunshoMaker.v1' && sessionStorage.getItem('failRead')) throw new Error('read'); return g.call(this, k); }; });
  await pg.evaluate(k => { localStorage.setItem(k + '.broken.1700000000000', '{"まえの":"コピー"}'); sessionStorage.setItem('failRead', '1'); }, KEY);
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  const r = await pg.evaluate(() => ({ t: $('#brokenBox').textContent, btns: $$('#brokenBox button').map(x => x.textContent) }));
  ok(/よみだせませんでした/.test(r.t) && /いまの データでは ありません/.test(r.t) && !/「けす」を おすと/.test(r.t), r.t);
  eq(r.btns, ['📥 この コピーを ファイルに する']);
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#brokenBox button')]);
  eq(require('fs').readFileSync(await dl.path(), 'utf8'), '{"まえの":"コピー"}');
  eq(await pg.evaluate(() => saveBlocked), true);
  noErr(pg);
});

test('4P2-3 ペンを はなした ところも のこす／とめられた せんは のこさない／まとめた うごきが ない・から の とき', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 400;
    cv.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:400px;z-index:9999'; document.body.append(cv);
    const got = [];
    attachDraw(cv, { toLogical: (fx, fy) => [fx, fy], onDraw: () => {}, onEnd: pts => got.push(pts.map(p => p.map(v => Math.round(v * 1000) / 1000))) });
    const ev = (t, x, y, id, noCo) => { const e = new PointerEvent(t, { pointerId: id, pointerType: 'pen', clientX: x, clientY: y, bubbles: true }); if (noCo) Object.defineProperty(e, 'getCoalescedEvents', { value: undefined }); return e; };
    // up だけ すすんだ
    cv.dispatchEvent(ev('pointerdown', 40, 40, 1)); cv.dispatchEvent(ev('pointermove', 80, 80, 1)); cv.dispatchEvent(ev('pointerup', 120, 120, 1));
    // up が さいごの move と おなじ（かさねない）・まとめた うごきの しくみが ない
    cv.dispatchEvent(ev('pointerdown', 40, 40, 2, true)); cv.dispatchEvent(ev('pointermove', 80, 80, 2, true)); cv.dispatchEvent(ev('pointerup', 80, 80, 2, true));
    // とめられた
    cv.dispatchEvent(ev('pointerdown', 40, 40, 3)); cv.dispatchEvent(ev('pointermove', 80, 80, 3)); cv.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 3, bubbles: true }));
    // とめられた あとも つぎの せんが かける
    cv.dispatchEvent(ev('pointerdown', 10, 10, 4)); cv.dispatchEvent(ev('pointerup', 20, 20, 4));
    cv.remove();
    return got;
  });
  eq(r, [[[0.1, 0.1], [0.2, 0.2], [0.3, 0.3]], [[0.1, 0.1], [0.2, 0.2]], [[0.025, 0.025], [0.05, 0.05]]]);
  noErr(pg);
});

test('4P2-4 ながい つくりかけ（2001・3000もじ）は ほぞん・よみこみ・したがき・コードで そのまま', async b => {
  const pg = await openPage(b);
  for (const n of [2001, 3000]) {
    await pg.evaluate(n => { const p = P(); p.doc = []; p.hand = {}; delete p.draft; mk = p.mk = { tpl: 'jiyu', vals: {}, active: null, free: 'う'.repeat(n) }; saveDB(); }, n);
    await pg.reload();
    const a = await pg.evaluate(() => { const back = parseCode(exportCode()); return [P().mk.free.length, LOAD_FIXES.length, back.ps[0].mk.free.length, back.fixes.length]; });
    eq(a, [n, 0, n, 0], n + 'もじ');
    await pg.evaluate(() => { const p = P(); p.works = [{ id: 'wq', date: '2026-11-01', text: 'べつ', mode: 'font', dir: 'yoko', cols: 10, paper: 'free' }]; openWork(p.works[0]); });
    await pg.reload();
    eq(await pg.evaluate(() => { const d = P().draft.mk.free.length; restoreDraft(); return [d, mk.free.length, LOAD_FIXES.length]; }), [n, n, 0]);
  }
  noErr(pg);
});

test('4P2-5 まえの かたちの てがき：ひらかない ときは なにも かわらない。いまの さくひんと まぜて まとめPDF に できる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const p = P();
    p.works = [
      cleanWork({ id: 'wold', date: '2026-10-01', text: 'あい', mode: 'hand', dir: 'yoko', cols: 10, paper: 'a4t', hand: [[[100, 100], [300, 260]]] }),
      cleanWork({ id: 'wnew', date: '2026-10-31', text: 'うえ', mode: 'hand', dir: 'yoko', cols: 10, paper: 'a4t', hand: { 0: { ch: 'う', s: [[[0.2, 0.2], [0.8, 0.8]]] } } }),
    ];
    p.doc = ['いまの ぶん']; mk = p.mk = { tpl: 'tano', vals: { 0: 'きょう' }, active: null, free: '' }; p.draft = { date: 'x', doc: ['まえ'], hand: {}, fin: clone(fin) }; saveDB();
    const before = JSON.stringify([p, fin]);
    openWork(p.works[0]);
    const same = JSON.stringify([p, fin]) === before;
    // まとめPDF：まえの かたち＋いまの かたち
    const ref = [];
    for (const w of p.works) await renderPages(Object.assign(clone(w), { nameText: p.name }), w.text, w.hand, undefined, cv => { ref.push(cvToPage(cv)); });
    selWorks.clear(); p.works.forEach(w => selWorks.add(w.id)); updWorksBtn();
    let got = null; const osm = openSendModal; openSendModal = o => { got = o; };
    $('#btnWorksPDF').click();
    for (let i = 0; i < 100 && !got; i++) await new Promise(r => setTimeout(r, 50));
    openSendModal = osm;
    const bytes = new Uint8Array(await got.files[0].arrayBuffer()), txt = new TextDecoder('latin1').decode(bytes);
    const jpgs = [...txt.matchAll(/\/DCTDecode \/Length (\d+) >>\nstream\n/g)].map(m => { const at = m.index + m[0].length; return bytes.slice(at, at + +m[1]); });
    const eqb = (a, z) => a.length === z.length && a.every((x, i) => x === z[i]);
    // まえの かたちの ページには せんが ある（てがきの ない おなじ さくひんと ちがう）
    const blank = []; await renderPages(Object.assign(clone(p.works[0]), { nameText: p.name, hand: [] }), 'あい', [], undefined, cv => { blank.push(cvToPage(cv)); });
    return { same, count: got.count, match: jpgs.length === 2 && jpgs.every((j, i) => eqb(j, ref[i].jpg)), drawn: !eqb(ref[0].jpg, blank[0].jpg), unchanged: JSON.stringify(p.works[0].hand) === '[[[100,100],[300,260]]]' };
  });
  eq(r, { same: true, count: 2, match: true, drawn: true, unchanged: true });
  noErr(pg);
});
