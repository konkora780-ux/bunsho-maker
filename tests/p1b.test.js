// だい2かい さいひょうか P1・P2：ふるい つくりかた・つくりかけの したがき・PDF・とりだし・ダウンロード名
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';

test('2P1-3 ふるい つくりかた（docSrc）は id へ うつして けす。けした つくりかたは もどって こない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(), G = { tpl: 'gamba', vals: { 0: 'きょう' } }, T = { tpl: 'tano', vals: { 0: 'きのう' } };
    // さいひょうかの てじゅん：docSrc と lineSrc の りょうほう → かえる → もとの もじに もどす
    p.doc = ['あ。']; p.docIds = ['a1']; p.lineSrc = { a1: T }; p.docSrc = { 'あ。': G };
    const first = srcOf(0).tpl, gone = p.docSrc === undefined;
    setDoc([{ i: 0, body: 'い。' }], 'keep'); setDoc([{ i: 0, body: 'あ。' }], 'keep');
    const back = srcOf(0);
    // ふるい データだけ → うつる
    p.doc = ['う。', 'え。']; delete p.docIds; p.lineSrc = {}; p.docSrc = { 'う。': G };
    const moved = [srcOf(0) && srcOf(0).tpl, srcOf(1)];
    // けして おなじ ぶんを もういちど いれる → つくりかたは ない（あたらしい ぶん）
    setDoc([{ i: 1, body: 'え。' }], 'keep'); setDoc(keepAll().concat([{ i: -1, body: 'う。' }]), 'keep');
    const readd = srcOf(1);
    // id が かさなった → つくりなおしても つくりかたは のこる
    p.doc = ['か。', 'き。']; p.docIds = ['x', 'x']; p.lineSrc = { x: G };
    const ids = docIds(), dup = [new Set(ids).size, srcOf(0) && srcOf(0).tpl, srcOf(1) && srcOf(1).tpl];
    return { first, gone, back, moved, readd, dup };
  });
  eq(r, { first: 'tano', gone: true, back: null, moved: ['gamba', null], readd: null, dup: [2, 'gamba', 'gamba'] });
  noErr(pg);
});

test('2P1-4 つくりかけの ぶんだけでも、さくひんを ひらく まえに したがきに のこす（よみこみなおしても）', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => {
    const p = P(); p.doc = []; p.hand = {};
    mk = p.mk = { tpl: 'tano', vals: { 0: 'きょう' }, active: null, free: 'まだ かいている' }; saveDB();
    p.works.push({ id: 'wz', date: '2026-10-31', text: 'べつ', mode: 'font', dir: 'yoko', cols: 10, paper: 'free' });
    openWork(p.works[0]);
  });
  const r1 = await pg.evaluate(() => [!!P().draft, mk.free, JSON.stringify(mk.vals)]);
  await pg.reload();
  const r2 = await pg.evaluate(() => { const d = P().draft; restoreDraft(); return [d && d.mk && d.mk.free, mk.free, mk.vals[0], mk.tpl, P().doc]; });
  eq(r1, [true, '', '{}']); eq(r2, ['まだ かいている', 'まだ かいている', 'きょう', 'tano', []]);
  noErr(pg);
});

test('2P1-5 1ページの PDF：JPEG・PDF・PNG に できなくても キャンバスを てばなし、できた ことに しない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    P().doc = ['あいう']; fin.mode = 'font';
    const made = [], orig = document.createElement.bind(document);
    document.createElement = t => { const e = orig(t); if (t === 'canvas') made.push(e); return e; };
    const ctp = cvToPage; cvToPage = () => { throw new Error('encode'); };
    let err = '';
    try { await finishPDF(Object.assign({}, fin), 'あいう', {}, 't'); } catch (e) { err = e.message; }
    cvToPage = ctp;
    const freed1 = made.length > 0 && made.every(c => c.width === 0);
    // renderSheet が しっぱい
    made.length = 0; const rs = renderSheet; renderSheet = () => { throw new Error('draw'); };
    try { await renderPages(Object.assign({}, fin), 'あいう', {}); } catch (e) { err += '/' + e.message; }
    renderSheet = rs; document.createElement = orig;
    const freed2 = made.length > 0 && made.every(c => c.width === 0);
    // PNG に できない（toBlob が null）
    const tb = HTMLCanvasElement.prototype.toBlob; HTMLCanvasElement.prototype.toBlob = function (cb) { cb(null); };
    const out = await finishPDF(Object.assign({}, fin), 'あいう', {}, 't');
    openSendModal(out, 't'); HTMLCanvasElement.prototype.toBlob = tb;
    const m = $('.modal'), txt = m.textContent, png = [...m.querySelectorAll('button')].some(x => /PNG|がぞうを ダウンロード/.test(x.textContent));
    m.remove();
    return { err, freed1, freed2, nopng: /つくれませんでした/.test(txt) && !png, freed3: out.one.width === 0 };
  });
  eq(r, { err: 'encode/draw', freed1: true, freed2: true, nopng: true, freed3: true });
  noErr(pg);
});

test('2P1-5 まとめPDF：おした ときの ないようで つくり、ページの なかみ・じゅんばん・おおきさが ただしく、さくひんは かわらない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const p = P(), A = [[[0.1, 0.1], [0.9, 0.9]]];
    p.glyphs = { 'あ': A, 'い': A };
    p.works = [
      { id: 'w1', date: '2026-10-31', text: 'あい', mode: 'glyph', dir: 'yoko', cols: 10, rows: 0, paper: 'a4y', font: 0, weight: 0.08, size: 0.8, gstyle: 'none' },
      { id: 'w2', date: '2026-10-31', text: 'いあ', mode: 'font', dir: 'tate', cols: 10, rows: 0, paper: 'b5t', font: 0, weight: 0.08, size: 0.8, gstyle: 'masu' },
    ].map(w => cleanWork(w));
    const before = JSON.stringify(p.works);
    // くらべる もの：さきに 1ページずつ つくった JPEG
    const ref = [];
    for (const w of p.works) await renderPages(Object.assign({}, w, { nameText: p.name }), w.text, w.hand, undefined, cv => { ref.push(cvToPage(cv)); });
    selWorks.clear(); p.works.forEach(w => selWorks.add(w.id)); updWorksBtn();
    let got = null; const osm = openSendModal; openSendModal = o => { got = o; };
    $('#btnWorksPDF').click();
    // おした あとで もじを かえても まざらない
    p.glyphs['あ'] = [[[0.9, 0.1], [0.1, 0.9]]];
    for (let i = 0; i < 100 && !got; i++) await new Promise(r => setTimeout(r, 50));
    openSendModal = osm;
    const bytes = new Uint8Array(await got.files[0].arrayBuffer()), txt = new TextDecoder('latin1').decode(bytes);
    const boxes = [...txt.matchAll(/\/MediaBox \[0 0 (\d+) (\d+)\]/g)].map(m => [+m[1], +m[2]]);
    const jpgs = [...txt.matchAll(/\/Width (\d+) \/Height (\d+) .*?\/DCTDecode \/Length (\d+) >>\nstream\n/g)].map(m => {
      const at = m.index + m[0].length; return { w: +m[1], h: +m[2], b: bytes.slice(at, at + +m[3]) };
    });
    const same = (a, z) => a.length === z.length && a.every((x, i) => x === z[i]);
    return {
      count: +txt.match(/\/Count (\d+)/)[1], boxes,
      same: jpgs.length === ref.length && jpgs.every((j, i) => j.w === ref[i].w && j.h === ref[i].h && same(j.b, ref[i].jpg)),
      unchanged: JSON.stringify(p.works) === before, eof: txt.trimEnd().endsWith('%%EOF'),
    };
  });
  eq(r, { count: 2, boxes: [[842, 595], [516, 729]], same: true, unchanged: true, eof: true });
  noErr(pg);
});

test('2P1-6 もとの データを のこせなかった・よみだせなかった ときも、がめんで どう するか わかる', async b => {
  const pg = await openPage(b);
  // のこす ばしょが ない（.broken に かけない）→ メモリから とりだせる
  await pg.addInitScript(() => { const s = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).includes('.broken')) throw new Error('quota'); return s.call(this, k, v); }; });
  await pg.evaluate(k => localStorage.setItem(k, JSON.stringify({ profiles: [{ id: 'p1', name: 'a', glyphs: { 'あ': Array.from({ length: 201 }, () => [[0, 0], [1, 1]]) } }], current: 'p1' })), KEY);
  const raw = await pg.evaluate(k => localStorage.getItem(k), KEY);
  await pg.reload();
  eq(await pg.evaluate(() => [HELD_RAW != null, saveBlocked]), [true, true]);
  await pg.click('#steps button[data-v=setting]');
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#brokenBox >> text=ファイルに とりだす')]);
  eq(require('fs').readFileSync(await dl.path(), 'utf8'), raw);
  await pg.click('#brokenBox >> text=とりだしたので ほぞんを はじめる'); await pg.click('#brokenBox >> text=ほんとう');
  eq(await pg.evaluate(k => [saveBlocked, HELD_RAW, JSON.parse(localStorage.getItem(k)).profiles[0].glyphs['あ'].length], KEY), [false, null, 200]);
  // よみだせない → とりだせるとは いわない
  const r = await pg.evaluate(() => { READ_FAIL = saveBlocked = true; renderBroken(); const t = $('#brokenBox').textContent; return [/よみだせませんでした/.test(t), /とりだす/.test(t)]; });
  eq(r, [true, false]);
  noErr(pg);
});

test('2P2-7 わけた PDF の ばんごうを ダウンロードの なまえにも のこす', async b => {
  const pg = await openPage(b);
  const names = [];
  for (const part of [1, 2, 0]) {
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.evaluate(n => saveFile(new File(['%PDF'], 'x.pdf', { type: 'application/pdf' }), n), part)]);
    names.push(dl.suggestedFilename());
  }
  ok(/^bunsho_\d{8}_\d{6}_1\.pdf$/.test(names[0]) && /_2\.pdf$/.test(names[1]) && /^bunsho_\d{8}_\d{6}\.pdf$/.test(names[2]), names.join(' '));
  noErr(pg);
});
