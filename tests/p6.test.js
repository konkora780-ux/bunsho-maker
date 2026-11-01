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

// ✓（::after）の ほんとうの ばしょと おおきさ（わくこみ）と、もじ（Text ノード）の くけい との すきま。かさなると マイナス
const measure = () => {
  const badge = x => {
    const s = getComputedStyle(x, '::after'), c = getComputedStyle(x), br = x.getBoundingClientRect(), n = v => parseFloat(v) || 0;
    const extra = s.boxSizing === 'content-box' ? n(s.borderLeftWidth) + n(s.borderRightWidth) + n(s.paddingLeft) + n(s.paddingRight) : 0;
    const extraH = s.boxSizing === 'content-box' ? n(s.borderTopWidth) + n(s.borderBottomWidth) + n(s.paddingTop) + n(s.paddingBottom) : 0;
    const right = br.right - n(c.borderRightWidth) - n(s.right), top = br.top + n(c.borderTopWidth) + n(s.top);
    return { left: right - n(s.width) - extra, right, top, bottom: top + n(s.height) + extraH };
  };
  const texts = x => { const out = [], w = document.createTreeWalker(x, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { if (!t.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(t); out.push(...[...r.getClientRects()].filter(q => q.width > 0)); } return out; };
  const gap = (a, q) => Math.max(q.left - a.right, a.left - q.right, q.top - a.bottom, a.top - q.bottom);
  return x => { const a = badge(x), ts = texts(x); return { gap: Math.min(...ts.map(q => gap(a, q))), out: a.right > innerWidth || a.left < 0, lines: new Set(ts.map(q => Math.round(q.top))).size, name: x.textContent.trim().slice(0, 14) }; };
};

test('6P2-4b ✓ の ほんとうの ばしょで しらべる：375・600・768px で、えらんだ ステップ・かた（いちばん ながい）・しあげかた・かいぎょうの ✓ が もじから 4px いじょう はなれ、よこに はみださない。フォーカスは べつに だせる', async b => {
  for (const w of [375, 600, 768]) {
    const pg = await openPage(b, { viewport: { width: w, height: 1000 } });
    const r = await pg.evaluate(async src => {
      await document.fonts.ready;
      const m = eval(src)(), res = [];
      show('make');
      const t = $$('.tpl').sort((a, z) => z.textContent.length - a.textContent.length)[0]; t.click();
      const on = $('.tpl.on'), h0 = on.getBoundingClientRect().height;
      res.push(m($('#steps button.on')), Object.assign(m(on), { long: true }));
      P().doc = ['あいうえお。', 'かきくけこ。']; saveDB(); show('finish');
      $$('.mode').filter(x => !x.hidden && x.classList.contains('on')).forEach(x => res.push(m(x)));
      const brb = $('#btnBrMode'), hb = brb.getBoundingClientRect().width; brb.click(); res.push(Object.assign(m($('#btnBrMode')), { same: $('#btnBrMode').getBoundingClientRect().width === hb }));
      return { res, h0, sw: document.documentElement.scrollWidth, iw: innerWidth };
    }, `(${measure})`);
    if (process.env.SHOW) console.log(w + 'px', JSON.stringify(r.res.map(x => [x.name, Math.round(x.gap * 10) / 10, x.lines])));
    const bad = r.res.filter(x => !(x.gap >= 4) || x.out || x.same === false);
    eq(bad, [], w + 'px ' + JSON.stringify(r.res));
    ok(r.sw <= r.iw, w + 'px よこに はみだす');
    if (w === 600) ok(r.res.find(x => x.long).lines >= 2, '600px で ながい かたが 2ぎょうに なって いない（しらべたい じょうたいに なって いない）' + JSON.stringify(r.res));
    // えらぶ まえと あとで かたの たかさ・もじの ばしょが かわらない
    const same = await pg.evaluate(() => { show('make'); const ts = $$('.tpl'), on = $('.tpl.on'), other = ts.find(x => x !== on); const k = x => { const q = x.querySelector('.em') || x; const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(q.getBoundingClientRect().left - r.left)]; }; const a = k(other); other.click(); const n = $$('.tpl').find(x => x.textContent === other.textContent); return [a, k(n)]; });
    eq(same[0], same[1], w + 'px えらぶ まえと あと');
    if (w === 600) {
      // (1) キーボードで じゅんに うごかす：ふつうの Tab で、えらんでいない かたに とどくか。
      //     Mac の WebKit では、Mac の せってい（キーボード ナビゲーション）に よって Tab が ボタンを とばす ことが ある。
      //     その ときは Option+Tab（Alt+Tab）で ためし、どちらで とどいたかを きろくする（ボタンの tabindex は かえない）
      const reach = async key => { for (let i = 0; i < 60; i++) { await pg.keyboard.press(key); if (await pg.evaluate(() => { const a = document.activeElement; return a.classList.contains('tpl') && !a.classList.contains('on'); })) return true; } return false; };
      let how = 'Tab', got = await reach('Tab');
      if (!got) { how = 'Alt+Tab'; got = await reach('Alt+Tab'); }
      if (process.env.SHOW || how !== 'Tab') console.log('  （6P2-4b：えらんでいない かたへ ' + how + ' で とどいた・' + process.platform + '）');
      ok(got, 'Tab でも Option+Tab でも、えらんでいない かたに とどかない');
      // (2) フォーカスの わくの CSS：キーボードを つかった あとで、えらんでいない かたに フォーカス → こい 4px の わく。えらんでいる かたの ✓ は のこる
      const fv = await pg.evaluate(src => {
        const other = $$('.tpl').find(x => !x.classList.contains('on')); other.focus();
        const s = getComputedStyle(other), t = $('.tpl.on');
        return [other.matches(':focus-visible'), s.outlineWidth, s.outlineStyle, /✓/.test(getComputedStyle(t, '::after').content), t !== document.activeElement];
      }, `(${mark})`);
      eq(fv, [true, '4px', 'solid', true, true], 'えらんでいない かたの フォーカスの わく');
    }
    noErr(pg);
  }
});

test('6P2-4c うごきを へらす：ほんとうの ながおしで バーが おした すぐあと・とちゅう とも いっぱいの はばで いろだけ こく なり、とちゅうで はなすと いろも もどり、ながおしの じかんが すぎても きりかわらない／ほんとうの うちまちがいは ゆれずに あかい わく', async b => {
  const out = {};
  for (const rm of ['no-preference', 'reduce']) {
    const pg = await openPage(b, { reducedMotion: rm });
    const bx = await pg.locator('#roleBtn').boundingBox(), role0 = await pg.evaluate(() => DB.role);
    const look = () => pg.evaluate(() => { const f = $('#roleBtn .fill'), s = getComputedStyle(f); return [Math.round(f.getBoundingClientRect().width), $('#roleBtn').clientWidth, +s.opacity]; });
    await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
    const t0 = Date.now(); await pg.mouse.down();
    await pg.waitForTimeout(40);
    const early = await look(), tEarly = Date.now() - t0;
    await pg.waitForTimeout(560);
    const mid = await look(), tMid = Date.now() - t0;
    await pg.mouse.up(); const tUp = Date.now() - t0; await pg.waitForTimeout(100);
    const after = await pg.evaluate(() => [$('#roleBtn').classList.contains('press'), DB.role]), afterLook = await look();
    // ながおしの じかん（1.2びょう）を すぎるまで まっても、はなした あとなら きりかわらない
    await pg.waitForTimeout(Math.max(0, 1500 - (Date.now() - t0)));
    const late = await pg.evaluate(() => DB.role), tLate = Date.now() - t0;
    // うちまちがい：つぎの キーでは ない かなを おす
    await pg.evaluate(() => { P().doc = ['あい']; saveDB(); show('type'); });
    const k = await pg.evaluate(() => { const nk = nextKeyKana(); return $$('#kb .key[data-k]').map(x => x.dataset.k).find(x => x !== nk && /^[ぁ-ん]$/.test(x)); });
    await pg.locator(`#kb .key[data-k="${k}"]`).dispatchEvent('pointerdown');
    const ng = await pg.evaluate(() => { const n = $('#nowCard'), s = getComputedStyle(n); return [n.classList.contains('shake'), s.animationName, ty.miss]; });
    out[rm] = { early, mid, after, afterLook, late, role0, ng, ms: [tEarly, tMid, tUp, tLate] };
    noErr(pg);
  }
  const n = out['no-preference'], r = out.reduce;
  ok(n.mid[0] > 0 && n.mid[0] < n.mid[1], 'ふつうの ときは バーが のびて いる とちゅう ' + n.mid);
  const msg = o => ' （おして から ' + o.ms.join('・') + 'ms：すぐあと／とちゅう／はなした／さいご）' + JSON.stringify(o);
  ok(n.mid[1] - n.mid[0] > 2, 'ふつうの ときは まだ いっぱいでは ない' + msg(n));
  eq([r.early[0], r.mid[0]], [r.early[1], r.mid[1]], 'へらす ときは おした すぐあとも とちゅうも いっぱいの はば（のびない）' + msg(r));
  ok(r.mid[2] > r.early[2], 'へらす ときは いろが だんだん こく なる' + msg(r));
  eq(r.afterLook[2], 0, 'はなしたら いろも もどる' + msg(r));
  for (const o of [n, r]) eq(o.late, o.role0, 'はなした あとは ながおしの じかんが すぎても きりかわらない' + msg(o));
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
    await pg.evaluate(() => $$('.toast').forEach(x => x.remove()));  // まえの しらせが のこって いても とおらない ように けしてから
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

test('6P2-8 とおしの テストの エラーの みわけかた：そとの フォントは URL だけで しんだんへ。アプリの URL の エラーは もじに fonts.g が あっても のこす', async () => {
  const { errWatch } = require('./helpers');
  const W = errWatch(), app = 'http://127.0.0.1:1234/index.html';
  const msg = (text, url) => ({ type: () => 'error', text: () => text, location: () => ({ url }) });
  const req = (url, why) => ({ url: () => url, failure: () => ({ errorText: why }) });
  W.console(msg('ほぞんに しっぱい', app));
  W.console(msg('fonts.googleapis.com の かわりの しょりで ほぞんに しっぱい', app));
  W.console(msg('fonts.gstatic.com が よめない', ''));
  W.console(msg('Failed to load resource: net::ERR_ADDRESS_UNREACHABLE', 'https://fonts.gstatic.com/s/zen.woff2'));
  W.console({ type: () => 'warning', text: () => 'x', location: () => ({ url: app }) });
  W.requestfailed(req('http://127.0.0.1:1234/missing.js', 'net::ERR_FAILED'));
  W.requestfailed(req('https://fonts.googleapis.com/css2?family=Zen', 'net::ERR_ADDRESS_UNREACHABLE'));
  W.requestfailed(req('https://fonts.googleapis.com.example.org/x.css', 'net::ERR_FAILED'));
  eq(W.errs, [
    'CONSOLE ほぞんに しっぱい @ ' + app,
    'CONSOLE fonts.googleapis.com の かわりの しょりで ほぞんに しっぱい @ ' + app,
    'CONSOLE fonts.gstatic.com が よめない',
    'REQFAIL http://127.0.0.1:1234/missing.js net::ERR_FAILED',
    'REQFAIL https://fonts.googleapis.com.example.org/x.css net::ERR_FAILED',
  ]);
  eq(W.diag, [
    'CONSOLE Failed to load resource: net::ERR_ADDRESS_UNREACHABLE @ https://fonts.gstatic.com/s/zen.woff2',
    'REQFAIL https://fonts.googleapis.com/css2?family=Zen net::ERR_ADDRESS_UNREACHABLE',
  ]);
});
