// だい5かい さいひょうか：うごきを へらす せってい・えらんでいる しるし・もじの いろ・いんさつ・ことわった ときは なにも かえない・よみだせない コピー・ペンの てん
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';
// sRGB の あかるさの ひ（WCAG と おなじ けいさん）
const ratio = (a, b) => {
  const L = s => { const c = s.match(/\d+(\.\d+)?/g).slice(0, 3).map(v => +v / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};

test('5P1-1 うごきを へらす せってい：おしても しずまない・ゆれない・ひかり つづけない（ふつうの ときは しずむ）', async b => {
  const out = {};
  for (const rm of ['no-preference', 'reduce']) {
    const pg = await openPage(b, { reducedMotion: rm });
    await pg.click('#steps button[data-v=make]');
    const bx = await pg.locator('#btnClearSlots').boundingBox();
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down();
    const btn = await pg.evaluate(() => getComputedStyle($('#btnClearSlots')).transform);
    await pg.mouse.up();
    out[rm] = [btn, await pg.evaluate(() => {
      const k = el('button', { class: 'key next hit' }), s = el('div', { class: 'shake' }), r = el('button', { class: 'rolebtn press' }, el('span', { class: 'fill' }));
      document.body.append(k, s, r);
      const v = [getComputedStyle(k).transform, getComputedStyle(k).animationName, getComputedStyle(s).animationName, getComputedStyle(r.firstChild).transitionProperty];
      k.remove(); s.remove(); r.remove(); return v;
    })];
    noErr(pg);
  }
  ok(out['no-preference'][0] !== 'none', 'ふつうの ときは しずむ ' + out['no-preference'][0]);
  eq(out.reduce, ['none', ['none', 'none', 'ngflash', 'opacity']]);
});

test('5P1-2 えらんでいる ところは ✓ と aria でも わかる・おおきさは かわらない・フォーカスの わくは こい', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=make]');
  const r = await pg.evaluate(() => {
    const tabs = $$('#steps button').map(x => x.getAttribute('aria-current'));
    const tp = $$('.tpl'), on = tp.find(x => x.classList.contains('on')), off = tp.find(x => !x.classList.contains('on'));
    const mark = x => getComputedStyle(x, '::after').content;
    const w = [on.getBoundingClientRect().height, off.getBoundingClientRect().height];
    show('finish');
    const md = $$('.mode').filter(x => !x.hidden).map(x => [x.classList.contains('on'), x.getAttribute('aria-pressed')]);
    return { tabs, tpl: [on.getAttribute('aria-pressed'), off.getAttribute('aria-pressed')], mark: [/✓/.test(mark(on)), mark(off)], tabMark: /✓/.test(mark($('#steps button.on'))), w, md };
  });
  eq(r.tabs.slice(0, 3), ['page', null, null]);
  eq(r.tpl, ['true', 'false']); eq(r.mark, [true, 'none']); eq(r.tabMark, true);
  eq(r.w[0], r.w[1], 'えらんでも たかさは おなじ');
  ok(r.md.length >= 2 && r.md.every(([on, a]) => a === String(on)) && r.md.some(([on]) => on), JSON.stringify(r.md));
  await pg.keyboard.press('Tab');
  const f = await pg.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth, s.outlineColor]; });
  eq(f[0], 'solid'); eq(f[1], '4px');
  ok(ratio(f[2], 'rgb(255,255,255)') >= 3, 'しろに たいする わくの ひ ' + f[2]);
  noErr(pg);
});

test('5P1-3 あかい おびの しろ もじ・うちおわった みどりの もじは 4.5:1 いじょう', async b => {
  const pg = await openPage(b);
  const c = await pg.evaluate(() => {
    const e = el('div', { class: 'saveerr' }, 'x'), u = el('span', { class: 'unit done' }, el('span', { class: 'k' }, 'あ'), el('span', { class: 'r' }, 'a'));
    document.body.append(e, u);
    const v = [getComputedStyle(e).color, getComputedStyle(e).backgroundColor, getComputedStyle(u.lastChild).color];
    e.remove(); u.remove(); return v;
  });
  ok(ratio(c[0], c[1]) >= 4.5, 'あかい おび ' + ratio(c[0], c[1]).toFixed(2));
  ok(ratio(c[2], 'rgb(255,255,255)') >= 4.5, 'みどりの もじ ' + ratio(c[2], 'rgb(255,255,255)').toFixed(2));
  noErr(pg);
});

test('5P2-4 ブラウザで いんさつ する ときは ほうがんの もようを けして しろい かみに する', async b => {
  const pg = await openPage(b);
  const scr = await pg.evaluate(() => getComputedStyle(document.body).backgroundImage);
  await pg.emulateMedia({ media: 'print' });
  const pr = await pg.evaluate(() => [getComputedStyle(document.body).backgroundImage, getComputedStyle(document.body).backgroundColor]);
  ok(scr !== 'none', 'がめんでは もようが ある');
  eq(pr, ['none', 'rgb(255, 255, 255)']);
  noErr(pg);
});

test('5P2-5 ながすぎて ことわった ときは id・つくりかた・ふるい docSrc も ふくめて なにも かえない（できる ときだけ うつす）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P(), A = n => 'あ'.repeat(n), src = { tpl: 'jiyu', vals: {}, free: 'x' };
    const snap = () => JSON.stringify([P(), fin, mk]);
    const out = {};
    // 1) ふるい docSrc・id なし・2000もじ ＋ チェック ON → 2ぶんめを たすと「はじめに、」で こえる
    p.doc = [A(2000)]; p.conn = true; delete p.docIds; delete p.lineSrc; p.docSrc = { [A(2000)]: src };
    p.hand = { 3: { ch: 'あ', s: [[[0, 0], [1, 1]]] } }; p.cuts = [5]; p.cutsText = p.doc.join('\n');
    let before = snap();
    out.dry = setDoc([{ i: 0, body: p.doc[0] }, { i: -1, body: 'い。' }], 'conn', true);
    out.real = setDoc([{ i: 0, body: p.doc[0] }, { i: -1, body: 'い。' }], 'conn');
    out.same1 = snap() === before;
    // 2) id が かさなっている ＋ つくりかた あり
    p.doc = ['つぎに、' + A(1996), 'い。']; delete p.docSrc; p.docIds = ['x', 'x']; p.lineSrc = { x: src };
    before = snap();
    out.move = setDoc([{ i: 1, body: 'い。' }, { i: 0, body: A(1996) }], 'conn');
    out.same2 = snap() === before;
    // 3) こえない ときは うつして、ふるい docSrc は けす
    p.doc = ['い。']; delete p.docIds; delete p.lineSrc; p.docSrc = { 'い。': src };
    const ok3 = setDoc([{ i: 0, body: 'い。' }, { i: -1, body: 'う。' }], 'conn');
    out.ok = [ok3 != null, p.doc, 'docSrc' in p, Object.keys(p.lineSrc).length, JSON.stringify(p.lineSrc[p.docIds[0]]) === JSON.stringify(src), new Set(p.docIds).size];
    return out;
  });
  eq(r, { dry: null, real: null, same1: true, move: null, same2: true, ok: [true, ['はじめに、い。', 'さいごに、う。'], false, 1, true, 2] });
  noErr(pg);
});

test('5P2-6 よみだせない とき：まえの コピーが 2こで、そのうち 1こが よみだせない → よめない ほうは しらせ、よめる ほうは とりだせる。ほぞんは とまった まま、もとの ばしょも のこる', async b => {
  const pg = await openPage(b);
  await pg.addInitScript(() => { const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if ((k === 'bunshoMaker.v1' || k === 'bunshoMaker.v1.broken.1700000000000') && sessionStorage.getItem('failRead')) throw new Error('read'); return g.call(this, k); }; });
  await pg.evaluate(k => { localStorage.setItem(k, '{"いまの":"データ"}'); localStorage.setItem(k + '.broken.1700000000000', '{"a":1}'); localStorage.setItem(k + '.broken.1700000100000', '{"b":2}'); sessionStorage.setItem('failRead', '1'); }, KEY);
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  eq(await pg.locator('#brokenBox button').count(), 2);
  // よみだせない ほう（1700000000000）を おす → ダウンロード しないで しらせる
  let dl = false; pg.on('download', () => { dl = true; });
  // brokenKeys は なまえの じゅん：0ばんめが よみだせない ほう
  await pg.locator('#brokenBox .row button').nth(0).click();
  await pg.waitForTimeout(300);
  const t = await pg.evaluate(() => $$('.toast').map(x => x.textContent).join('|'));
  ok(/この コピーも よみだせませんでした/.test(t), t); eq(dl, false);
  const [d2] = await Promise.all([pg.waitForEvent('download'), pg.locator('#brokenBox .row button').nth(1).click()]);
  eq(require('fs').readFileSync(await d2.path(), 'utf8'), '{"b":2}');
  eq(await pg.evaluate(k => [saveBlocked, Object.keys(localStorage).filter(x => x.startsWith(k)).sort()], KEY), [true, [KEY, KEY + '.broken.1700000000000', KEY + '.broken.1700000100000']]);
  noErr(pg);
});

test('5P2-7 ペン：てんが うえかぎりの すぐ てまえで はなした ところだけ すすむ／まとめた うごきが いくつも ある', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 400;
    cv.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:400px;z-index:9999'; document.body.append(cv);
    const got = [];
    attachDraw(cv, { toLogical: (fx, fy) => [fx, fy], onDraw: () => {}, onEnd: pts => got.push(pts) });
    const ev = (t, x, y, id, co) => { const e = new PointerEvent(t, { pointerId: id, pointerType: 'pen', clientX: x, clientY: y, bubbles: true }); if (co) Object.defineProperty(e, 'getCoalescedEvents', { value: () => co }); return e; };
    // うえかぎりの すぐ てまえ（LIM.pts - 3 てん）まで うごかして、べつの ところで はなす
    cv.dispatchEvent(ev('pointerdown', 0, 0, 1));
    for (let i = 1; i < LIM.pts - 3; i++) cv.dispatchEvent(ev('pointermove', (i % 400), Math.floor(i / 400), 1));
    cv.dispatchEvent(ev('pointerup', 399, 399, 1));
    const a = got[0], last = a[a.length - 1];
    // まとめた うごきが 3つ
    const co = [[50, 50], [60, 60], [70, 70]].map(([x, y]) => new PointerEvent('pointermove', { clientX: x, clientY: y }));
    cv.dispatchEvent(ev('pointerdown', 40, 40, 2)); cv.dispatchEvent(ev('pointermove', 70, 70, 2, co)); cv.dispatchEvent(ev('pointerup', 70, 70, 2));
    cv.remove();
    return [a.length <= LIM.pts, a.length >= LIM.pts - 3, Math.round(last[0] * 1000), Math.round(last[1] * 1000), got[1].map(p => p.map(v => Math.round(v * 1000) / 1000))];
  });
  eq(r, [true, true, 998, 998, [[0.1, 0.1], [0.125, 0.125], [0.15, 0.15], [0.175, 0.175]]]);
  noErr(pg);
});
