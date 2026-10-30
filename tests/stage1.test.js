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
  eq(r.set, [2, 'kana', []]); eq(r.mk, 'gamba'); eq(r.docSrc, 0);
  await pg.click('#steps button[data-v=finish]'); await pg.click('#steps button[data-v=make]');
  eq(await pg.evaluate(() => DB.profiles.length), 2);
  const big = await pg.evaluate(() => { const n = DB.profiles.length; importText(JSON.stringify({ app: 'bunsho-maker', profile: { name: 'x', doc: ['あ'.repeat(9e6)] } })); return DB.profiles.length === n; });
  ok(big, 'おおきすぎる コードは よみこまない');
  eq(await pg.evaluate(() => { const n = DB.profiles.length; importText('{"app":"bunsho-maker","v":99,"profile":{}}'); return DB.profiles.length === n; }), true, 'あたらしすぎる コード');
  noErr(pg);
});

test('P1-2 こわれた ほぞん データは けさずに とっておく', async b => {
  const pg = await openPage(b);
  await pg.evaluate(k => localStorage.setItem(k, '{こわれた'), KEY);
  await pg.reload();
  eq(await pg.evaluate(k => [localStorage.getItem(k + '.broken'), BROKEN], KEY), ['{こわれた', '{こわれた']);
  await pg.click('#steps button[data-v=setting]'); ok(await pg.isVisible('#brokenBox'));
  // とっておく ばしょが ない ときは、うわがき しない
  const ctx = pg.context();
  const pg2 = await ctx.newPage(); pg2.errs = []; pg2.on('pageerror', e => pg2.errs.push(e.message));
  await pg2.addInitScript(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k.endsWith('.broken')) throw new Error('quota'); return o.call(this, k, v); }; });
  await pg2.evaluate(k => { localStorage.removeItem(k + '.broken'); localStorage.setItem(k, '{こわれた2'); }, KEY).catch(() => {});
  await pg2.goto(pg.url());
  await pg2.evaluate(k => { localStorage.removeItem(k + '.broken'); localStorage.setItem(k, '{こわれた2'); }, KEY);
  await pg2.reload();
  await pg2.click('.tpl >> text=じゆうに'); await pg2.fill('#freeText', 'あい'); await pg2.click('#btnAddSent');
  eq(await pg2.evaluate(k => [localStorage.getItem(k), saveBlocked], KEY), ['{こわれた2', true]);
  ok(await pg2.isVisible('#saveErr'));
  noErr(pg); eq(pg2.errs, []);
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
    const opened = [p.doc, p.conn, p.cuts.length ? p.cutsText === p.doc.join('\n') : false];
    restoreDraft();
    return { same: JSON.stringify([p.doc, p.conn, p.docSrc, p.cuts, p.cutsText, p.hand, fin.breaks]) === before, opened, again: (restoreDraft(), p.doc) };
  });
  eq(r.same, true); eq(r.opened, [['べつ'], false, false]); eq(r.again, ['べつ']);
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
