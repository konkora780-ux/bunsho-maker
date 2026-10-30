// だい1だんかい：ほぞんと ふくげん・さくひんの みため こてい・ひとごとの ひょうじ せってい
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
const KEY = 'bunshoMaker.v1';

// ぜんぶの ほぞん こうもくに あたいを いれる
const fillAll = () => {
  const p = P();
  p.glyphs = { 'あ': [[[0.1, 0.1], [0.9, 0.9]]] }; p.words = { nani: ['なわとび'] }; p.wordVerb = { 'なわとび': 'suru' };
  p.doc = ['はじめに、あいう。', 'さいごに、かきく。']; p.docSrc = { 'あいう。': { tpl: 'gamba', vals: { 0: 'きょう' } } }; p.conn = true;
  p.cuts = [2, 5]; p.cutsText = p.doc.join('\n'); p.hand = { 0: { ch: 'は', s: [[[0.2, 0.2], [0.5, 0.5]]] } };
  p.photos = [{ d: 'data:image/jpeg;base64,AAAA', date: '2026-10-30' }];
  p.works = [{ id: 'w1', date: '2026-10-30', text: 'あいう', mode: 'glyph', dir: 'tate', cols: 12, rows: 3, font: 2, glyphs: { 'あ': [[[0, 0], [1, 1]]] }, nameText: 'たろう', hand: {}, conn: false }];
  Object.assign(S(), { input: 'roma', guide: 1, advance: 'manual', chunk: 'ten' });
  SH().tpls = ['gamba', 'tano']; SH().modes = ['font']; SH().hide = { itsu: ['きのう'] }; SH().pin = { nani: ['なわとび'] }; SH().max = 3;
  Object.assign(fin, { mode: 'hand', dir: 'tate', cols: 14, title: 'だい', breaks: [3] });
  mk = p.mk = { tpl: 'tano', vals: { 0: 'きょう' }, active: null, free: '' };
  p.draft = { date: '2026-10-30', doc: ['した'], hand: {}, fin: Object.assign({}, FIN_DEF), docSrc: {}, conn: false, cuts: [1], cutsText: 'した' };
  saveDB();
};

test('P0-1 ぜんぶの こうもくが バックアップで いったり きたり できる', async b => {
  const pg = await openPage(b);
  await pg.evaluate(fillAll);
  const r = await pg.evaluate(() => {
    const before = JSON.parse(JSON.stringify(P()));
    const code = exportCode(), back = parseCode(code).ps[0];
    // もとの あたいが ひとつのこらず のこっているか（よみこみで ふえる はじめの あたいは かまわない）
    const sub = (x, y, path) => x && typeof x === 'object' ? Object.keys(x).flatMap(k => sub(x[k], y && y[k], path + '.' + k)) : JSON.stringify(x) === JSON.stringify(y) ? [] : [path];
    const diff = sub(before, back, '');
    return { diff, lost: Object.keys(before).filter(k => !(k in back)), keys: Object.keys(back), v: JSON.parse(code).v };
  });
  eq(r.diff, [], 'ちがう こうもく'); eq(r.lost, [], 'なくなった こうもく');
  for (const k of ['docSrc', 'conn', 'cuts', 'cutsText', 'draft', 'photos', 'settings', 'fin', 'mk', 'works', 'hand']) ok(r.keys.includes(k), k + ' が ある');
  eq(r.v, 2);
  // べつの ひととして よみこんでも なかみは おなじ
  const r2 = await pg.evaluate(() => {
    const code = exportCode(), me = P().id; $('#exportBox').value = code; importText(code);
    document.querySelector('.modal .btn.main').click();
    const a = cleanProfile(DB.profiles.find(p => p.id === me)), c = P();
    return { n: DB.profiles.length, same: ['docSrc', 'conn', 'cuts', 'cutsText', 'draft', 'works', 'settings', 'photos'].filter(k => JSON.stringify(a[k]) !== JSON.stringify(c[k])) };
  });
  eq(r2.n, 2); eq(r2.same, [], 'べつの ひとに した ときの なかみ');
  noErr(pg);
});

test('P0-1 おきかえ・もどす・ほぞん しっぱいでも もとの データが まもられる', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { P().doc = ['もとの ぶん']; saveDB(); window._code = exportCode(); P().doc = ['いまの ぶん']; saveDB(); });
  // ほぞん できない ときに おきかえ → そのまま
  await pg.evaluate(() => { window._o = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('quota'); }; importText(_code); });
  await pg.click('text=いまの データを おきかえる');
  eq(await pg.evaluate(() => [P().doc, !!DB.replacedBackup]), [['いまの ぶん'], false], 'しっぱい したら おきかえない');
  await pg.evaluate(() => { Storage.prototype.setItem = _o; });
  await pg.reload();
  eq(await pg.evaluate(() => P().doc), ['いまの ぶん'], 'よみなおしても もとの まま');
  // ふつうに おきかえ → もどす
  await pg.evaluate(() => importText(window._code || ''));
  await pg.evaluate(() => { P().doc = ['いまの ぶん']; saveDB(); });
  const code = await pg.evaluate(() => { const p = JSON.parse(JSON.stringify(P())); p.doc = ['もとの ぶん']; return JSON.stringify({ app: 'bunsho-maker', v: 2, profile: p }); });
  await pg.evaluate(c => importText(c), code); await pg.click('text=いまの データを おきかえる');
  eq(await pg.evaluate(() => P().doc), ['もとの ぶん']);
  await pg.reload(); await pg.click('#steps button[data-v=setting]');
  await pg.click('#btnUndoReplace');
  eq(await pg.evaluate(() => [P().doc, DB.profiles.length]), [['いまの ぶん'], 1]);
  noErr(pg);
});

test('P0-1 ぜんいんぶんの コード', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p2 = newProfile('はなこ'); DB.profiles.push(p2); saveDB();
    $('#optExportAll').checked = true; $('#optExportAll').dispatchEvent(new Event('change'));
    const code = exportCode(); DB.profiles = [newProfile('べつ')]; DB.current = DB.profiles[0].id; saveDB();
    importText(code); return DB.profiles.map(p => p.name);
  });
  eq(r, ['べつ', 'ためしのひと', 'はなこ']);
  noErr(pg);
});

test('P1-2 へんな データ・おおきすぎる データを よみこんでも こわれない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const bad = { app: 'bunsho-maker', v: 1, profile: { name: 'へん', fin: { mode: 'xxx', font: 999, cols: 0, rows: -5, paper: 'a0', breaks: ['a', -1, 3] },
      glyphs: { 'あ': [[[0, 'x'], [NaN, 1]], 'bad'], 'いう': [[[0, 0]]] }, hand: { 0: { ch: 'あ', s: 'x' }, a: 1 },
      works: [{ text: 'あ', mode: 'zzz', font: 999, cols: 0 }, { text: 1 }], settings: { guide: 9, input: 'x', show: { tpls: ['nai'], hide: 'x' } }, mk: { tpl: 'nai' }, docSrc: { 'あ': { tpl: 'nai' } } } };
    importText(JSON.stringify(bad));
    const p = P();
    return { name: p.name, fin: [p.fin.mode, p.fin.font, p.fin.cols, p.fin.rows, p.fin.paper, p.fin.breaks], glyphs: Object.keys(p.glyphs), work: [p.works.length, p.works[0].mode, p.works[0].font, p.works[0].cols],
      set: [S().guide, S().input, SH().tpls], mk: mk.tpl, docSrc: Object.keys(p.docSrc).length };
  });
  eq(r.name, 'へん'); eq(r.fin, ['font', 0, 10, 0, 'free', [3]]); eq(r.glyphs, []); eq(r.work, [1, 'font', 0, 10]);
  eq(r.set, [2, 'kana', ['gamba']]); eq(r.mk, 'gamba'); eq(r.docSrc, 0);
  ok((await pg.textContent('.modal')).includes('なおした こと'), 'なおした ことを しらせる');
  await pg.click('.modal >> text=わかった');
  await pg.click('#steps button[data-v=finish]'); await pg.click('#steps button[data-v=make]');
  eq(await pg.evaluate(() => DB.profiles.length), 2);
  const big = await pg.evaluate(() => { const n = DB.profiles.length; importText(JSON.stringify({ app: 'bunsho-maker', profile: { name: 'x', doc: ['あ'.repeat(IMPORT_MAX)] } })); return DB.profiles.length === n; });
  ok(big, 'おおきすぎる コードは よみこまない');
  eq(await pg.evaluate(() => { const n = DB.profiles.length; importText('{"app":"bunsho-maker","v":99,"profile":{}}'); return DB.profiles.length === n; }), true, 'あたらしすぎる コード');
  noErr(pg);
});

// こわれた データの のこりかた（.broken. で はじまる キーの なかみ）
const brokenOf = k => { const r = []; for (let i = 0; i < localStorage.length; i++) { const x = localStorage.key(i); if (x.startsWith(k + '.broken')) r.push(localStorage.getItem(x)); } return r.sort(); };
test('再P0-2 こわれた データ（よめない・なかみが へん）は けさずに なんかいぶんでも のこす', async b => {
  const pg = await openPage(b);
  // 1) JSON として よめない
  await pg.evaluate(k => localStorage.setItem(k, '{こわれた'), KEY);
  await pg.reload();
  eq(await pg.evaluate(brokenOf, KEY), ['{こわれた']);
  await pg.click('#steps button[data-v=setting]'); ok(await pg.isVisible('#brokenBox'));
  // 2) JSON は よめるが なかみが へん（profiles:[null,3]）→ もとの まま のこし、まえの ものも けさない
  const raw2 = '{"profiles":[null,3],"current":"x"}';
  await pg.evaluate(([k, r]) => localStorage.setItem(k, r), [KEY, raw2]);
  await pg.reload();
  const r2 = { list: await pg.evaluate(brokenOf, KEY), fixes: await pg.evaluate(() => LOAD_FIXES.length), blocked: await pg.evaluate(() => saveBlocked) };
  eq(r2.list, [raw2, '{こわれた'].sort()); ok(r2.fixes > 0, 'なおした ことを しらせる'); eq(r2.blocked, false);
  // 3) いちぶの ひとだけ へん → よい ひとは つかえる、もとの データは のこる
  const good = await pg.evaluate(() => JSON.stringify(P()));
  const raw3 = JSON.stringify({ profiles: [JSON.parse(good), 'x'], current: JSON.parse(good).id });
  await pg.evaluate(([k, r]) => localStorage.setItem(k, r), [KEY, raw3]);
  await pg.reload();
  eq([await pg.evaluate(() => DB.profiles.length), (await pg.evaluate(brokenOf, KEY)).length], [1, 3]);
  // 4) ふつうの データでは なにも のこさない・しらせない
  await pg.evaluate(() => saveDB()); await pg.reload();
  eq(await pg.evaluate(() => [LOAD_FIXES.length, saveBlocked]), [0, false]);
  // 5) ひとつずつ とりだして けす。ぜんぶ けすと おしらせが きえる
  await pg.click('#steps button[data-v=setting]');
  eq(await pg.$$eval('#brokenBox .row', es => es.length), 3);
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.locator('#brokenBox button', { hasText: 'とりだす' }).first().click()]);
  ok(dl.suggestedFilename().startsWith('bunsho-broken-'));
  for (let i = 0; i < 3; i++) { const d = pg.locator('#brokenBox button.warn').first(); await d.click(); await d.click(); }
  ok(!(await pg.isVisible('#brokenBox')), 'ぜんぶ けしたら かくれる');
  noErr(pg);
});

test('再P0-2 のこせない・よみだせない ときは ほぞんを とめて もとの データを まもる', async b => {
  const pg = await openPage(b);
  const ctx = pg.context();
  const pg2 = await ctx.newPage(); pg2.errs = []; pg2.on('pageerror', e => pg2.errs.push(e.message));
  await pg2.addInitScript(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k.includes('.broken')) throw new Error('quota'); return o.call(this, k, v); }; });
  await pg2.goto(pg.url());
  for (const raw of ['{こわれた2', '{"profiles":[null]}']) {
    await pg2.evaluate(([k, r]) => { localStorage.setItem(k, r); }, [KEY, raw]);
    await pg2.reload();
    await pg2.click('.tpl >> text=じゆうに'); await pg2.fill('#freeText', 'あい'); await pg2.click('#btnAddSent');
    eq(await pg2.evaluate(k => [localStorage.getItem(k), saveBlocked], KEY), [raw, true], raw);
    ok(await pg2.isVisible('#saveErr'));
    // さいきどう しても まもる
    await pg2.reload();
    eq(await pg2.evaluate(k => [localStorage.getItem(k), saveBlocked], KEY), [raw, true], 'さいきどう ' + raw);
  }
  // よみだし そのものが できない
  const pg3 = await ctx.newPage(); pg3.errs = []; pg3.on('pageerror', e => pg3.errs.push(e.message));
  await pg3.addInitScript(() => { Storage.prototype.getItem = function () { throw new Error('read'); }; });
  await pg3.goto(pg.url());
  eq(await pg3.evaluate(() => [saveBlocked, saveDB()]), [true, false]);
  noErr(pg); eq(pg2.errs, []); eq(pg3.errs, []);
});

test('再P0-2 よみこみの うえかぎり：かきだした コードは よみこめ、けずった ものは しらせる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    // おおきめの ぶんしょう（1000ぎょう×2000もじ ちかく）でも おなじ ものが もどる
    const p = P(); p.doc = Array.from({ length: 300 }, (_, i) => 'あ'.repeat(1000) + i);
    p.works = Array.from({ length: 400 }, (_, i) => ({ id: 'w' + i, date: '', text: 'あいう', mode: 'font' }));
    const code = exportCode(), back = parseCode(code);
    const same = JSON.stringify(back.ps[0].doc) === JSON.stringify(p.doc) && back.ps[0].works.length === 400 && back.fixes.length === 0;
    // うえかぎりを こえた ものは けずって しらせる
    const over = parseCode(JSON.stringify({ app: 'bunsho-maker', v: 2, profile: { name: 'x', doc: Array.from({ length: 1200 }, () => 'あ'), works: [{ text: '' }, 3] } }));
    return { same, fixes: over.fixes };
  });
  eq(r.same, true, 'かきだした ものが そのまま もどる');
  ok(r.fixes.some(x => x.includes('ぶん 200こ')), r.fixes.join('/'));
  ok(r.fixes.some(x => x.includes('さくひん 2こ')), r.fixes.join('/'));
  // よみこみで なおした ときは ダイアログで しらせる
  await pg.evaluate(() => importText(JSON.stringify({ app: 'bunsho-maker', v: 2, profiles: [{ name: 'a', id: 'pa' }, null] })));
  ok((await pg.textContent('.modal')).includes('こわれていて よみこめませんでした'));
  noErr(pg);
});

test('再P0-1 ぶんの かた・しあげかたが 0こ でも こわれない（よみこみ・きどう・じどうせいと モード）', async b => {
  const pg = await openPage(b);
  // よみこみ：tpls:[]・ぜんぶ ふせいな id・modes:[]
  const r = await pg.evaluate(() => {
    const out = [];
    for (const show of [{ tpls: [], modes: [] }, { tpls: ['nai', 'x'], modes: ['zzz'] }]) {
      const res = parseCode(JSON.stringify({ app: 'bunsho-maker', v: 2, profile: { name: 'a', settings: { show } } }));
      out.push([res.ps[0].settings.show.tpls, res.ps[0].settings.show.modes, res.fixes.length]);
    }
    return out;
  });
  eq(r, [[['gamba'], ['font'], 2], [['gamba'], ['font'], 2]]);
  // きどう：ほぞん データに tpls:[] が はいっていても、じどうせいと モードで ひらける
  await pg.evaluate(k => { saveDB(); const d = JSON.parse(localStorage.getItem(k)); d.profiles[0].settings = { show: { tpls: [], modes: [] } }; d.role = 'student'; localStorage.setItem(k, JSON.stringify(d)); }, KEY);
  await pg.reload();
  eq(await pg.$$eval('.tpl', es => es.map(e => e.textContent)), ['💪がんばったこと']);
  await pg.click('#steps button[data-v=finish]');
  eq(await pg.$$eval('.mode', es => es.filter(e => !e.hidden).map(e => e.dataset.m)), ['font']);
  // がめんの とちゅうで 0こ に なっても（ないぶの じょうたい）こわれない
  await pg.evaluate(() => { SH().tpls = []; SH().modes = []; show('make'); show('finish'); });
  eq(await pg.$$eval('.mode', es => es.filter(e => !e.hidden).map(e => e.dataset.m)), ['font']);
  noErr(pg);
});

test('P0-2 さくひんは ほぞんした ときの もじ・なまえの まま（いちらん・ひらく・PDF・まとめPDF）', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    const A = [[[0.1, 0.1], [0.9, 0.9]]], B = [[[0.9, 0.1], [0.1, 0.9]]];
    P().glyphs = { 'あ': A, 'い': A, 'た': A }; P().name = 'たあ'; P().doc = ['あい'];
    Object.assign(fin, { mode: 'glyph', name: true }); saveDB();
    show('finish'); $('#btnSaveWork').click();
    const w = P().works[0];
    const pic = async (o, t, h) => (await renderPages(o, t, h))[0].toDataURL();
    const ref = await pic(w, w.text, w.hand);
    P().glyphs = { 'あ': B, 'い': B, 'た': B }; P().name = 'いい'; saveDB();
    const listSame = (await pic(w, w.text, w.hand)) === ref;
    P().doc = ['ちがう']; openWork(w);
    const openSame = (await pic(finO(), finText(), handChars())) === ref;
    const snapName = finO().nameText;
    // ひらいて ほぞんしなおしても A の まま
    $('#btnSaveWork').click(); const w2 = P().works[0];
    const resave = JSON.stringify(w2.glyphs['あ']) === JSON.stringify(A) && w2.nameText === 'たあ';
    // ぶんしょうを かえたら いまの もじ（あたらしい さくひん）
    P().doc = ['あいあ']; const fresh = !finSnap() && finO().glyphs === undefined;
    return { listSame, openSame, snapName, resave, fresh };
  });
  eq(r, { listSame: true, openSame: true, snapName: 'たあ', resave: true, fresh: true });
  noErr(pg);
});

test('P1-3 さくひんを ひらく → したがきに もどすで さぎょうが ぜんぶ もどる', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P();
    p.doc = ['はじめに、あいう。', 'さいごに、かきく。']; p.conn = true; p.docSrc = { 'あいう。': { tpl: 'gamba', vals: { 0: 'きょう' } } };
    p.cuts = [3]; p.cutsText = p.doc.join('\n'); p.hand = { 2: { ch: 'め', s: [[[0, 0], [1, 1]]] } }; fin.breaks = [4]; saveDB();
    const before = JSON.stringify([p.doc, p.conn, p.docSrc, p.cuts, p.cutsText, p.hand, fin.breaks]);
    p.works.push({ id: 'wx', date: '2026-10-30', text: 'べつ', mode: 'font', dir: 'yoko', cols: 10, paper: 'free' });
    openWork(p.works[0]);
    const opened = [p.doc, p.conn, p.cuts === undefined && p.cutsText === undefined && p.docSrc === undefined];
    restoreDraft();
    return { same: JSON.stringify([p.doc, p.conn, p.docSrc, p.cuts, p.cutsText, p.hand, fin.breaks]) === before, opened, again: (restoreDraft(), p.doc) };
  });
  eq(r.same, true); eq(r.opened, [['べつ'], false, true]); eq(r.again, ['べつ']);
  noErr(pg);
});

test('P1-1 ひょうじ せっていが ひとの あいだで まざらない', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const a = P(); const p2 = newProfile('はなこ'), p3 = newProfile('じろう'); DB.profiles.push(p2, p3);
    DB.current = p2.id; SH().hide.itsu = ['きょう'];
    DB.current = p3.id; const h3 = SH().hide.itsu;
    DB.current = a.id; const h1 = SH().hide.itsu;
    return [h3 || null, h1 || null, showDef().hide];
  });
  eq(r, [null, null, {}]);
  noErr(pg);
});

test('P1-1 さいごの 1つは はずせない（ぜんぶ でる ことに ならない）', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=setting]');
  const labels = await pg.$$eval('#showBox .showgrp:first-child label', es => es.map(e => e.textContent.trim()));
  for (const l of labels) await pg.click(`#showBox .showgrp:first-child label:has-text("${l}") input`);
  eq(await pg.evaluate(() => SH().tpls.length), 1, 'かたは 1つ のこる');
  ok(await pg.isChecked(`#showBox .showgrp:first-child label:has-text("${labels[labels.length - 1]}") input`));
  for (const m of ['じぶんの もじ', 'iPadの もじ', 'てがき']) await pg.click(`#showBox label:has-text("${m}") input`);
  eq(await pg.evaluate(() => SH().modes), ['hand']);
  await pg.evaluate(() => { DB.role = 'student'; applyRole(); show('make'); });
  eq(await pg.$$eval('.tpl', es => es.length), 1);
  await pg.click('#steps button[data-v=finish]');
  eq(await pg.$$eval('.mode', es => es.filter(e => !e.hidden).map(e => e.dataset.m)), ['hand']);
  noErr(pg);
});

test('P1-1 ぶんまつ・おねがいも かくせる／⭐で さきに だす', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { P().words.itsu = ['あさのかいで']; SH().hide = { gend: ['#past'], help: ['#issho'] }; SH().pin = { itsu: ['えんそくで'] }; SH().max = 2; DB.role = 'student'; applyRole(); show('make'); });
  eq(await pg.$$eval('#chooser .chip', es => es.map(e => e.textContent)), ['🍙えんそくで', 'あさのかいで'], '⭐ → ふやした ことば の じゅん');
  await pg.evaluate(() => { SH().max = 0; renderMake(); });
  for (const w of ['きょう', 'うた', 'えがおで']) await pg.locator('#chooser .chip', { hasText: w }).first().click();
  eq(await pg.$$eval('#chooser .chip', es => es.map(e => e.textContent)), ['💪がんばってうたいました。', '💪がんばりました。']);
  // せっていの ボタンは タップで だす → ⭐ → かくす
  await pg.evaluate(() => { DB.role = 'teacher'; applyRole(); show('setting'); });
  await pg.click('#showBox summary');
  const btn = pg.locator('#showBox .wtog', { hasText: 'きのう' }).first();
  await btn.click(); eq(await pg.evaluate(() => SH().pin.itsu), ['えんそくで', 'きのう']);
  await btn.click(); eq(await pg.evaluate(() => [SH().pin.itsu, SH().hide.itsu]), [['えんそくで'], ['きのう']]);
  await btn.click(); eq(await pg.evaluate(() => SH().hide.itsu), []);
  noErr(pg);
});

// ===== だい2だんかい =====
test('2-A ぶんを なおす・ふやす・けす ときの てがき／くぎりの きまり', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(() => {
    const p = P();
    p.doc = ['あいう。', 'かきく。', 'さしす。']; p.cuts = [1, 6, 11]; p.cutsText = p.doc.join('\n');
    p.hand = { 0: { ch: 'あ', s: [[[0, 0], [1, 1]]] }, 4: { ch: 'か', s: [[[0, 0], [1, 1]]] }, 8: { ch: 'さ', s: [[[0, 0], [1, 1]]] } };
    const ids = docIds().slice();
    // 2ぎょうめを なおす → その ぶんの てがき・くぎりだけ きえる
    const ents = keepAll(); ents[1].body = 'たちつてと。';
    const lost = setDoc(ents, 'keep', true);
    setDoc(ents, 'keep');
    const out = { lost, doc: p.doc.slice(), hand: Object.keys(p.hand).map(k => k + p.hand[k].ch), cuts: p.cuts.slice(), sameIds: JSON.stringify(docIds()) === JSON.stringify(ids) };
    // ふやす → まえの ものは そのまま
    const e2 = keepAll(); e2.push({ i: -1, body: 'なに。' }); setDoc(e2, 'keep');
    out.add = [Object.keys(p.hand).length, docIds().length, new Set(docIds()).size];
    return out;
  });
  eq(r.lost, 1); eq(r.doc, ['あいう。', 'たちつてと。', 'さしす。']);
  eq(r.hand, ['0あ', '10さ']); eq(r.cuts, [1, 13]); eq(r.sameIds, true, 'id は かわらない'); eq(r.add, [2, 4, 4]);
  // ✏️ なおすで てがきが きえる ときは きいてくる
  await pg.evaluate(() => { P().doc = []; P().hand = {}; saveDB(); renderMake(); });
  await pg.click('.tpl >> text=たのしかったこと');
  for (const w of ['きょう', 'ともだち', 'うた', 'うれしかったです。']) await pg.click(`.chip >> text="${w}"`);
  await pg.click('#btnAddSent');
  await pg.evaluate(() => { P().hand = { 0: { ch: 'き', s: [[[0, 0], [1, 1]]] } }; saveDB(); });
  await pg.click('.docline >> text=✏️ なおす');
  await pg.click('.slot >> nth=1'); await pg.click('.chip >> text="かぞく"'); await pg.click('#btnAddSent');
  eq(await pg.textContent('.modal .regtitle'), '✋ てがきが きえます');
  await pg.click('.modal >> text=やめる');
  eq(await pg.evaluate(() => [P().doc, Object.keys(P().hand).length]), [['きょう、ともだちとうたをうたいました。うれしかったです。'], 1]);
  await pg.click('#btnAddSent'); await pg.click('.modal button.warn');
  eq(await pg.evaluate(() => [P().doc, Object.keys(P().hand).length]), [['きょう、かぞくとうたをうたいました。うれしかったです。'], 0]);
  // せんせいの ちょくせつ なおし：おなじ ぶんは ひきつぐ
  const r3 = await pg.evaluate(() => { P().doc = ['あいう。', 'かきく。']; delete P().docIds; P().hand = { 4: { ch: 'か', s: [[[0, 0], [1, 1]]] } }; renderDoc(); $('#docEdit').value = 'かきく。\nあたらしい。'; $('#btnApplyEdit').click(); return [P().doc, Object.keys(P().hand)]; });
  eq(r3, [['かきく。', 'あたらしい。'], ['0']]);
  noErr(pg);
});

test('2-B うてない もじ・れんしゅうを はぶく・ミスを みせない・ひつような もじ', async b => {
  const pg = await openPage(b);
  // ぜんぶ うてない ぶん → 「できた」に しない
  await pg.evaluate(() => { P().doc = ['漢字。']; saveDB(); show('type'); });
  const t = await pg.textContent('#bigNow');
  ok(!t.includes('できた'), 'ぜんぶ とばしたら できた に しない：' + t);
  ok((await pg.textContent('#typeStat')).includes('漢'), 'とばす もじを みせる');
  // れんしゅうを はぶく・ミスを みせない（じどうせいと モード）
  await pg.evaluate(() => { P().doc = ['あい。']; SH().practice = false; SH().stat = false; DB.role = 'student'; applyRole(); show('make'); });
  ok(!(await pg.isVisible('#steps button[data-v=type]')), '② の ボタンを かくす');
  eq(await pg.textContent('#goType'), 'つぎへ：しあげる ▶');
  await pg.click('#goType'); eq(await pg.evaluate(() => currentView), 'finish');
  await pg.evaluate(() => { SH().practice = true; applyRole(); show('type'); });
  ok(!(await pg.textContent('#typeStat')).includes('ミス'), 'ミスを みせない');
  // ひつような もじに だい・なまえ・ゔ・ゎ
  const need = await pg.evaluate(() => { P().doc = ['ゔぁ']; P().glyphs = {}; P().name = 'たろう'; fin.title = 'えんそく'; fin.name = true; return neededGlyphs().join(''); });
  eq(need, 'ゔぁえんそくたろう');
  noErr(pg);
});

test('2-C べつの ゆび・とめられた せん・ダイアログの フォーカス・キーの フォーカス・きょうゆう しっぱい', async b => {
  const pg = await openPage(b);
  // てがきの わく：ゆび2ほん・pointercancel
  await pg.evaluate(() => { P().doc = ['あい']; fin.mode = 'hand'; saveDB(); show('finish'); });
  await pg.click('#btnHandOpen');
  const r = await pg.evaluate(() => {
    const cv = $('#handPad'), R = cv.getBoundingClientRect();
    const ev = (t, id, type, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: type, clientX: R.left + R.width * x, clientY: R.top + R.height * y, bubbles: true, isPrimary: id === 1 }));
    const n0 = padStrokes.length;
    ev('pointerdown', 1, 'touch', .2, .2); ev('pointerdown', 2, 'touch', .8, .8); ev('pointermove', 1, 'touch', .3, .3); ev('pointerup', 2, 'touch', .8, .8); ev('pointerup', 1, 'touch', .3, .3);
    const a = padStrokes.length - n0;
    ev('pointerdown', 3, 'touch', .2, .2); ev('pointermove', 3, 'touch', .4, .4); ev('pointercancel', 3, 'touch', .4, .4);
    const c = padStrokes.length - n0;
    ev('pointerdown', 4, 'touch', .1, .9); ev('pointerdown', 5, 'pen', .5, .5); ev('pointermove', 5, 'pen', .6, .6); ev('pointerup', 4, 'touch', .1, .9); ev('pointerup', 5, 'pen', .6, .6);
    return [a, c, padStrokes.length - n0, padStrokes[padStrokes.length - 1][0][0]];
  });
  eq(r, [1, 1, 2, 0.5], 'ゆび2ほんでも 1ぽん／とめられた せんは のこさない／ペンが ゆうせん');
  await pg.click('#btnHandClose');
  // ダイアログ：ひらくと なかへ、Esc で とじて もとへ
  await pg.evaluate(() => show('setting'));
  await pg.focus('#btnImport'); await pg.evaluate(() => { $('#exportBox').value = exportCode(); });
  await pg.keyboard.press('Enter');
  eq(await pg.evaluate(() => [document.querySelector('.modal').getAttribute('role'), !!document.activeElement.closest('.modal')]), ['dialog', true]);
  await pg.keyboard.press('Escape');
  eq(await pg.evaluate(() => [document.querySelectorAll('.modal').length, document.activeElement.id]), [0, 'btnImport']);
  // キーを おしても フォーカスが のこる
  await pg.evaluate(() => { P().doc = ['あい']; show('type'); });
  const k = await pg.evaluate(() => nextKeyKana());
  await pg.focus(`#kb .key[data-k="${k}"]`); await pg.keyboard.press('Enter');
  ok(await pg.evaluate(() => !!document.activeElement.closest('#kb')), 'フォーカスが キーボードに のこる');
  // きょうゆうの しっぱい（やめた とき いがい）は しらせる
  await pg.evaluate(() => { navigator.canShare = () => true; navigator.share = () => Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })); sendFile(new File(['a'], 'a.pdf')); });
  await pg.waitForSelector('.modal .regtitle');
  eq(await pg.textContent('.modal .regtitle'), '⚠ おくれませんでした');
  await pg.click('.modal >> text=とじる');
  await pg.evaluate(() => { navigator.share = () => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })); sendFile(new File(['a'], 'a.pdf')); });
  await pg.waitForTimeout(200);
  eq(await pg.evaluate(() => document.querySelectorAll('.modal').length), 0, 'やめた ときは なにも ださない');
  noErr(pg);
});

test('2-D まとめPDF：1ページずつ つくり、おおい ときは わける', async b => {
  const pg = await openPage(b);
  const r = await pg.evaluate(async () => {
    P().works = Array.from({ length: 35 }, (_, i) => ({ id: 'w' + i, date: '2026-10-30', text: 'あいう' + i, mode: 'font', dir: 'yoko', cols: 10, rows: 0, font: 0, paper: 'a4t', gstyle: 'masu', size: 0.72 }));
    saveDB(); show('finish'); P().works.forEach(w => selWorks.add(w.id)); updWorksBtn();
    $('#btnWorksPDF').click();
    for (let i = 0; i < 200 && !document.querySelector('.modal'); i++) await new Promise(r => setTimeout(r, 100));
    const btns = [...document.querySelectorAll('.modal button')].map(b => b.textContent);
    return { pdfBtns: btns.filter(t => t.startsWith('📤 PDF')), text: document.querySelector('.modal .hint').textContent };
  });
  eq(r.pdfBtns, ['📤 PDF 1/2 を おくる', '📤 PDF 2/2 を おくる']);
  ok(r.text.includes('35ページ'), r.text);
  noErr(pg);
});
