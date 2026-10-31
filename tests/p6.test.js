// だい6かい さいひょうか：かいぎょうの ✓・せまい がめんの ながい かた・フォーカスと ✓・ほんとうの ながおしと うちまちがい（うごきを へらす）・コピーが 2つとも よめない・あかい ボタンの いろ
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';
const ratio = (a, b) => {
  const L = s => { const c = s.match(/\d+(\.\d+)?/g).slice(0, 3).map(v => +v / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};
const mark = () => { const m = x => /✓/.test(getComputedStyle(x, '::after').content); return m; };

test('6P2-4a「かいぎょうを なおす」を おす・もどすと ✓ と aria-pressed が いっしょに かわる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(mk0 => {
    const m = eval(mk0)();
    P().doc = ['あいうえお。', 'かきくけこ。']; saveDB(); show('finish');
    const btn = $('#btnBrMode'), st = () => [btn.getAttribute('aria-pressed'), m(btn)];
    const a = st(); btn.click(); const c = st(); btn.click();
    return [a, c, st()];
  }, `(${mark})`);
  eq(r, [['false', false], ['true', true], ['false', false]]);
  noErr(pg);
});

test('6P2-4b 600pxの がめん：いちばん ながい かたを えらんでも ✓ が もじに かさならず、よこに はみださない。フォーカスは べつの ところに だせる', async b => {
  const pg = await openPage(b, { viewport: { width: 600, height: 900 } });
  await pg.click('#steps button[data-v=make]');
  // いちばん ながい なまえの かたを えらぶ
  await pg.evaluate(() => { const t = $$('.tpl').sort((a, z) => z.textContent.length - a.textContent.length)[0]; t.dataset.long = '1'; t.click(); });
  const r = await pg.evaluate(mk0 => {
    const m = eval(mk0)(), t = $$('.tpl').find(x => x.classList.contains('on'));
    const br = t.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(t);
    // もじ（えもじを ふくむ）の はしと ✓ の ばしょ（みぎうえ：みぎから 20px・うえから 18px の うちがわ）
    const rects = [...rg.getClientRects()];
    const hit = rects.some(q => q.right > br.right - 20 && q.top < br.top + 18);
    return { on: m(t), lines: Math.round(br.height), hit, sw: document.documentElement.scrollWidth, iw: innerWidth, pressed: t.getAttribute('aria-pressed') };
  }, `(${mark})`);
  eq([r.on, r.hit, r.sw <= r.iw, r.pressed], [true, false, true, 'true'], JSON.stringify(r));
  // Tab で べつの かたへ フォーカスを うごかしても、えらんでいる ✓ は のこる
  let f = null;
  for (let i = 0; i < 60 && !f; i++) { await pg.keyboard.press('Tab'); f = await pg.evaluate(() => { const a = document.activeElement; return a.classList.contains('tpl') && !a.classList.contains('on') ? [getComputedStyle(a).outlineWidth, getComputedStyle(a).outlineStyle] : null; }); }
  eq(f, ['4px', 'solid'], 'えらんでいない かたに フォーカス');
  eq(await pg.evaluate(mk0 => { const m = eval(mk0)(); const t = $('.tpl.on'); return [m(t), t !== document.activeElement]; }, `(${mark})`), [true, true]);
  noErr(pg);
});

test('6P2-4c うごきを へらす：ほんとうの ながおしで バーが のびず いろが こく なり、とちゅうで はなすと もどる・きりかわらない／ほんとうの うちまちがいは ゆれずに あかい わく', async b => {
  const out = {};
  for (const rm of ['no-preference', 'reduce']) {
    const pg = await openPage(b, { reducedMotion: rm });
    const bx = await pg.locator('#roleBtn').boundingBox(), role0 = await pg.evaluate(() => DB.role);
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down();
    await pg.waitForTimeout(600);
    const mid = await pg.evaluate(() => { const f = $('#roleBtn .fill'), s = getComputedStyle(f); return [Math.round(f.getBoundingClientRect().width), $('#roleBtn').clientWidth, +s.opacity]; });
    await pg.mouse.up(); await pg.waitForTimeout(100);
    const after = await pg.evaluate(() => [$('#roleBtn').classList.contains('press'), DB.role]);
    // うちまちがい：つぎの キーでは ない かなを おす
    await pg.evaluate(() => { P().doc = ['あい']; saveDB(); show('type'); });
    const k = await pg.evaluate(() => { const nk = nextKeyKana(); return $$('#kb .key[data-k]').map(x => x.dataset.k).find(x => x !== nk && /^[ぁ-ん]$/.test(x)); });
    await pg.locator(`#kb .key[data-k="${k}"]`).dispatchEvent('pointerdown');
    const ng = await pg.evaluate(() => { const n = $('#nowCard'), s = getComputedStyle(n); return [n.classList.contains('shake'), s.animationName, ty.miss]; });
    out[rm] = { mid, after, role0, ng };
    noErr(pg);
  }
  const n = out['no-preference'], r = out.reduce;
  ok(n.mid[0] > 0 && n.mid[0] < n.mid[1], 'ふつうの ときは バーが のびて いる とちゅう ' + n.mid);
  eq(r.mid[0], r.mid[1], 'へらす ときは はばが かわらない（さいしょから いっぱい）');
  ok(r.mid[2] > 0.1 && r.mid[2] < 0.95, 'へらす ときは いろが とちゅうまで こく なる ' + r.mid[2]);
  for (const o of [n, r]) eq(o.after, [false, o.role0], 'とちゅうで はなすと もどる・きりかわらない');
  eq([n.ng[0], n.ng[1], n.ng[2] > 0], [true, 'shake', true]);
  eq([r.ng[0], r.ng[1], r.ng[2] > 0], [true, 'ngflash', true]);
});

test('6P2-5 よみだせない とき：まえの コピーが 2つとも よめない → からの ファイルを つくらず、けさず、ほぞんは とまった まま', async b => {
  const pg = await openPage(b);
  await pg.addInitScript(() => { const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (k.startsWith('bunshoMaker.v1') && sessionStorage.getItem('failRead')) throw new Error('read'); return g.call(this, k); }; });
  await pg.evaluate(k => { localStorage.setItem(k, '{"いまの":"データ"}'); localStorage.setItem(k + '.broken.1700000000000', '{"a":1}'); localStorage.setItem(k + '.broken.1700000100000', '{"b":2}'); sessionStorage.setItem('failRead', '1'); }, KEY);
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  let dl = 0; pg.on('download', () => { dl++; });
  eq(await pg.locator('#brokenBox button').count(), 2);
  for (const i of [0, 1]) {
    await pg.locator('#brokenBox .row button').nth(i).click(); await pg.waitForTimeout(300);
    ok(/この コピーも よみだせませんでした/.test(await pg.evaluate(() => $$('.toast').map(x => x.textContent).join('|'))), 'しらせる ' + i);
  }
  eq(dl, 0, 'からの ファイルを つくらない');
  eq(await pg.evaluate(k => [saveBlocked, Object.keys(localStorage).filter(x => x.startsWith(k)).sort()], KEY), [true, [KEY, KEY + '.broken.1700000000000', KEY + '.broken.1700000100000']]);
  noErr(pg);
});

test('6P2-7 いまの みため（あかい おもな ボタン）の しろ もじも 4.5:1 いじょう', async b => {
  const pg = await openPage(b);
  const c = await pg.evaluate(() => { const e = el('button', { class: 'btn main' }, 'x'); document.body.append(e); const s = getComputedStyle(e), v = [s.color, s.backgroundColor]; e.remove(); return v; });
  ok(ratio(c[0], c[1]) >= 4.5, 'あかい ボタン ' + ratio(c[0], c[1]).toFixed(2) + ' ' + c);
  noErr(pg);
});
