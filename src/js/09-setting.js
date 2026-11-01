// ===== せってい =====
function renderShowBox() {
  const sh = SH(), box = $('#showBox'); box.innerHTML = '';
  const grp = (label, ...kids) => el('div', { class: 'showgrp' }, el('b', {}, label), ...kids);
  const cb = (on, text, fn) => { const i = el('input', { type: 'checkbox' }); i.checked = on; i.addEventListener('change', () => { if (fn(i.checked, i) !== false) saveDB(); }); return el('label', {}, i, ' ' + text); };
  // null＝ぜんぶ。さいごの 1つは はずせない（なにも でない がめんに ならないように）
  const listToggle = (key, all, id, on, i) => {
    let l = Array.isArray(sh[key]) ? sh[key].slice() : all.slice();
    if (on) l.push(id); else l = l.filter(x => x !== id);
    if (!l.length) { i.checked = true; toast('1つは のこしてください（ぜんぶ はずすと えらべなく なります）'); return false; }
    sh[key] = l.length === all.length ? null : all.filter(x => l.includes(x));
  };
  const tIds = TPLS.map(t => t.id);
  box.append(grp('ぶんの かた', ...TPLS.map(t => cb(!sh.tpls || sh.tpls.includes(t.id), t.em + t.name, (on, i) => listToggle('tpls', tIds, t.id, on, i)))));
  const mName = { glyph: 'じぶんの もじ', font: 'iPadの もじ', hand: 'てがき' };
  box.append(grp('しあげかた', ...MODE_IDS.map(m => cb(!sh.modes || sh.modes.includes(m), mName[m], (on, i) => listToggle('modes', MODE_IDS, m, on, i))), cb(sh.glyph, 'もじとうろくの ボタン', on => { sh.glyph = on; })));
  box.append(grp('② うってみる', cb(sh.practice, 'にゅうりょくの れんしゅうを する（はずすと ①→③ に すすみます）', on => { sh.practice = on; }),
    cb(sh.stat, 'じかん・ミスの かずを みせる', on => { sh.stat = on; })));
  const maxSel = el('select', { 'aria-label': 'ことばの かず' });
  [[0, 'ぜんぶ'], [2, '2こ'], [3, '3こ'], [4, '4こ'], [6, '6こ']].forEach(([v, t]) => maxSel.append(el('option', { value: v }, t)));
  maxSel.value = String(sh.max); maxSel.addEventListener('change', () => { sh.max = +maxSel.value; saveDB(); });
  box.append(grp('ことばの かず', maxSel, el('span', { class: 'hint' }, '（1かいに だす ことばの かず。⭐ → せんせいが ふやした ことば → もとの ことば の じゅんに でます）')));
  const det = el('details', {}, el('summary', { class: 'hint' }, 'だす ことばを えらぶ（タップする たびに　だす → ⭐さきに だす → かくす）'));
  Object.entries(SLOTS).forEach(([k, s]) => {
    // ぶんまつは うごきで かわるので、きまった なまえで えらぶ
    const all = (DYN[k] || []).concat(s.w.map(x => [x[0], x[0]])).concat((P().words[k] || []).map(w => [w, w]));
    if (!all.length) return;
    det.append(grp(s.q, ...all.map(([id, label]) => {
      const st = () => (sh.hide[k] || []).includes(id) ? 'off' : (sh.pin[k] || []).includes(id) ? 'pin' : '';
      const b = el('button', { class: 'wtog' });
      const paint = () => { const v = st(); b.className = 'wtog' + (v ? ' ' + v : ''); b.textContent = (v === 'pin' ? '⭐' : '') + label; };
      b.addEventListener('click', () => {
        const v = st(), hide = (sh.hide[k] || []).filter(x => x !== id), pin = (sh.pin[k] || []).filter(x => x !== id);
        if (v === '') pin.push(id); else if (v === 'pin') hide.push(id);
        sh.hide[k] = hide; sh.pin[k] = pin; paint(); saveDB();
      });
      paint(); return b;
    })));
  });
  box.append(det);
}
function renderSetting() {
  renderShowBox();
  $('#profName').value = P().name;
  $('#optRomaji').value = S().romaji;
  $('#optCase').value = S().keyCase;
  $('#optSpeakPick').checked = S().speakPick;
  $('#optScript').value = KATA() ? 'kata' : 'hira';
  $('#optScriptKey').checked = scriptKeyOn();
  $('#btnDownload').hidden = IN_FRAME;
  $('#btnUndoReplace').hidden = !DB.replacedBackup;
  renderBroken();
}
$('#optRomaji').addEventListener('change', e => { S().romaji = e.target.value; saveDB(); });
$('#optCase').addEventListener('change', e => { S().keyCase = e.target.value; saveDB(); });
$('#optSpeakPick').addEventListener('change', e => { S().speakPick = e.target.checked; saveDB(); });
// もじ（ひらがな／カタカナ）：なかみは ひらがなの まま なので、きりかえても ぶん・ことば・てがきは きえない
$('#optScript').addEventListener('change', e => { S().script = e.target.value === 'kata' ? 'kata' : 'hira'; if (saveDB()) toast(KATA() ? 'カタカナに しました' : 'ひらがなに しました'); });
$('#optScriptKey').addEventListener('change', e => { S().scriptKey = e.target.checked; saveDB(); });
$('#btnProfRename').addEventListener('click', () => { const n = $('#profName').value.trim(); if (!n) return; P().name = n; renderWho(); if (saveDB()) toast('かえました'); });
$('#btnProfAdd').addEventListener('click', () => {
  const n = $('#profName').value.trim();
  const p = newProfile(n && n !== P().name ? n : 'あたらしいひと' + (DB.profiles.length + 1));
  DB.profiles.push(p); DB.current = p.id; bindProfile(); renderWho(); renderSetting(); if (saveDB()) toast(p.name + ' を ついか しました');
});
$('#btnProfDel').addEventListener('click', function () {
  if (DB.profiles.length <= 1) return toast('さいごの ひとりは けせません');
  if (this.dataset.c !== '1') { this.dataset.c = '1'; this.textContent = 'ほんとうに けす？（もじも きえます）'; setTimeout(() => { this.dataset.c = ''; this.textContent = 'このひとを けす'; }, 3000); return; }
  DB.profiles = DB.profiles.filter(p => p.id !== DB.current); DB.current = DB.profiles[0].id;
  this.dataset.c = ''; this.textContent = 'このひとを けす';
  bindProfile(); saveDB(); renderWho(); renderSetting();
});
let exportAll = false;
const exportCode = () => JSON.stringify(exportAll ? { app: 'bunsho-maker', v: SCHEMA_V, profiles: DB.profiles } : { app: 'bunsho-maker', v: SCHEMA_V, profile: P() });
$('#optExportAll').addEventListener('change', e => { exportAll = e.target.checked; $('#exportBox').value = ''; });
$('#btnExport').addEventListener('click', () => { $('#exportBox').value = exportCode(); toast('コードを つくりました'); });
$('#btnCopyExport').addEventListener('click', () => {
  const box = $('#exportBox'); if (!box.value) box.value = exportCode();
  const fallback = () => { box.focus(); box.select(); toast('えらんだ じょうたいです。コピーしてください'); };
  try { navigator.clipboard.writeText(box.value).then(() => toast('コピーしました'), fallback); } catch (e) { fallback(); }
});
$('#btnDownload').addEventListener('click', () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([exportCode()], { type: 'application/json' })), download: exportAll ? 'bunsho-all.json' : `bunsho-${P().name}.json` });
  document.body.append(a); a.click(); a.remove();
});
// ===== データの かたち（スキーマ）と しらべかた =====
// ひと（プロフィール）の ほぞん こうもく。ふやしたら ここと cleanProfile に たす
// id, name, glyphs, words, wordVerb, doc, docIds, docSrc（ふるい）, lineSrc, conn, cuts, cutsText, works, photos, hand, settings(+show), fin(+snap), mk, draft
const SCHEMA_V = 2;
// うえかぎりの きまり：アプリで つくれる りょう（ほぞん ばしょ いっぱいまで）より おおきく する。
// いれる ときにも おなじ うえかぎりで とめる。よみこみで けずった・すてた ものが あれば かならず FIXES に かいて しらせる（だまって へらさない）
const IMPORT_MAX = 32 * 1024 * 1024; // よみこむ コードの うえかぎり（もじすう）。iPad の ほぞん ばしょ（やく 500まんもじ）より ずっと おおきい
const FILE_MAX = 96 * 1024 * 1024;   // よみこむ ファイルの うえかぎり（バイト）
const LIM = { strokes: 200, pts: 5000, glyphs: 300, hand: 2001000, doc: 1000, line: 2000, works: 5000, text: 2001000, words: 500 };
let FIXES = null; // cleanProfile で なおした ことの メモ（null の ときは メモ しない）
const note = m => { if (FIXES && !FIXES.includes(m)) FIXES.push(m); };
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const arr = v => Array.isArray(v) ? v : [];
// うえかぎりで けずる ときは、かならず しらせる（だまって へらさない）
const cut = (v, max, what) => { if (v.length > max) note(`${what}が おおすぎた・ながすぎたので ${max}${typeof v === 'string' ? 'もじ' : 'こ'}までに しました`); return v.slice(0, max); };
const str = (v, max, d = '', what = 'もじ') => typeof v === 'string' ? cut(v, max, what) : d;
const num = (v, lo, hi, d) => typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
const int = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const bool = (v, d) => typeof v === 'boolean' ? v : d;
const clone = v => JSON.parse(JSON.stringify(v));
// せん：[[x,y],…] の あつまり（ざひょうは 0〜1 ふきん）。へんな ものは のぞく
function cleanStrokes(v) {
  const ok = p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && isFinite(n));
  return cut(arr(v), LIM.strokes, '1もじの せん').map(st => {
    const a = cut(arr(st), LIM.pts, '1ぽんの せんの てん'), b = a.filter(ok);
    if (b.length < a.length) note('せんの なかの おかしな てんを のぞきました');
    if (b.some(p => p.some(n => n < -1 || n > 2))) note('わくから おおきく はみでた せんを わくの ちかくに よせました');
    return b.map(p => p.map(n => Math.min(2, Math.max(-1, n))));
  }).filter(st => st.length);
}
// ふるい かたちの てがき：シートに じかに かいた せん（シートの ざひょう。1もじの わくの 0〜1 では ない）
// ざひょうは かえずに、かずと へんな てんだけ しらべる
function cleanSheetStrokes(v) {
  const ok = p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && isFinite(n) && Math.abs(n) < 1e6);
  return cut(arr(v), LIM.hand, 'まえの かたちの てがきの せん').map(st => {
    const a = cut(arr(st), LIM.pts, '1ぽんの せんの てん'), b = a.filter(ok);
    if (b.length < a.length) note('せんの なかの おかしな てんを のぞきました');
    return b;
  }).filter(st => st.length);
}
function cleanGlyphs(v) {
  const g = {};
  cut(Object.entries(obj(v)), LIM.glyphs, 'とうろくした もじ').forEach(([c, st]) => { if ([...c].length === 1) { const s = cleanStrokes(st); if (s.length) g[c] = s; } });
  return g;
}
function cleanHand(v) {
  const h = {};
  if (Array.isArray(v) && v.length) note('まえの かたちの てがき（シートに じかに かいた せん）は いまの ぶんしょうでは つかえないので のぞきました');
  cut(Object.entries(obj(v)), LIM.hand, 'てがきの もじ').forEach(([k, x]) => {
    if (!/^\d+$/.test(k) || !x || typeof x.ch !== 'string' || [...x.ch].length !== 1) return;
    const s = cleanStrokes(x.s); if (s.length) h[k] = { ch: x.ch, s };
  });
  return h;
}
const intList = (v, max) => [...new Set(arr(v).filter(n => Number.isInteger(n) && n >= 0 && n <= max))].sort((a, z) => a - z);
// しあげの せってい（さくひんにも つかう）。しらない あたいは はじめの あたいに もどす
function cleanFin(v) {
  const o = obj(v), d = FIN_DEF;
  const f = {
    hi: 0, page: 0,
    mode: pick(o.mode, ['glyph', 'font', 'hand'], d.mode), dir: pick(o.dir, ['yoko', 'tate'], d.dir),
    cols: int(o.cols, 1, 60, d.cols), rows: int(o.rows, 0, 60, d.rows),
    grid: bool(o.grid, d.grid), name: bool(o.name, d.name), model: bool(o.model, d.model), penOnly: bool(o.penOnly, d.penOnly), sentBreak: bool(o.sentBreak, d.sentBreak),
    font: int(o.font, 0, FONTS.length - 1, d.font), weight: num(o.weight, 0.02, 0.2, d.weight), size: num(o.size, 0.3, 1, d.size),
    use: pick(o.use, Object.keys(USES), d.use), paper: pick(o.paper, Object.keys(PAPERS), d.paper), gstyle: pick(o.gstyle, Object.keys(GSTYLES), o.grid === false ? 'none' : d.gstyle),
    title: str(o.title, 60, '', 'だい'), breaks: intList(o.breaks, LIM.text),
  };
  if (o.snap) f.snap = cleanSnap(o.snap);
  if (!f.snap) delete f.snap;
  return f;
}
// ひらいた さくひんの「その ときの もじ・なまえ」
function cleanSnap(v) {
  const o = obj(v); if (typeof o.text !== 'string') return null;
  return { id: str(o.id, 40), text: str(o.text, LIM.text, '', 'ひらいた さくひんの ぶん'), nameText: str(o.nameText, 30, '', 'なまえ'), glyphs: o.glyphs ? cleanGlyphs(o.glyphs) : null };
}
function cleanWork(v) {
  const o = obj(v); if (typeof o.text !== 'string' || !o.text) return null;
  const w = Object.assign(cleanFin(o), { id: str(o.id, 40) || 'w' + Date.now() + Math.random().toString(36).slice(2, 5), date: str(o.date, 40), text: str(o.text, LIM.text, '', 'さくひんの ぶん'), nameText: str(o.nameText, 30, '', 'なまえ'), conn: bool(o.conn, false) });
  delete w.snap;
  if (o.glyphs) w.glyphs = cleanGlyphs(o.glyphs);
  // ふるい かたち：シートに じかに かいた せん（はいれつ）も のこす
  if (o.hand) w.hand = Array.isArray(o.hand) ? cleanSheetStrokes(o.hand) : cleanHand(o.hand);
  return w;
}
const tplIds = () => TPLS.map(t => t.id);
function cleanVals(v) { const r = {}; Object.entries(obj(v)).forEach(([k, x]) => { if (/^\d+$/.test(k) && typeof x === 'string') r[k] = str(x, 60, '', 'えらんだ ことば'); }); return r; }
function cleanDocSrc(v) {
  const r = {};
  cut(Object.entries(obj(v)), LIM.doc * 3, 'ぶんの つくりかた').forEach(([k, x]) => { if (x && tplIds().includes(x.tpl)) r[str(k, LIM.line, '', 'ぶん')] = { tpl: x.tpl, vals: cleanVals(x.vals) }; });
  return r;
}
const cleanDoc = v => cut(arr(v).filter(s => typeof s === 'string'), LIM.doc, 'ぶん').map(s => str(s, LIM.line, '', '1つの ぶん'));
function cleanShow(v) {
  const o = obj(v), sh = showDef();
  const ids = (l, all) => l === null || l === undefined ? null : [...new Set(arr(l).filter(x => all.includes(x)))];
  sh.tpls = ids(o.tpls, tplIds()); sh.modes = ids(o.modes, MODE_IDS);
  // 0こ では えらべなく なるので、さいていの 1つに する（せんせいの がめんの「さいごの 1つは はずせない」と おなじ きまり）
  if (sh.tpls && !sh.tpls.length) { sh.tpls = [SHOW_MIN.tpl]; note('「みせるもの」の ぶんの かたが 0こ だったので「がんばったこと」だけに しました'); }
  if (sh.modes && !sh.modes.length) { sh.modes = [SHOW_MIN.mode]; note('「みせるもの」の しあげかたが 0こ だったので「iPadの もじ」だけに しました'); }
  sh.glyph = bool(o.glyph, true); sh.practice = bool(o.practice, true); sh.stat = bool(o.stat, true); sh.max = pick(o.max, [0, 2, 3, 4, 6], 0);
  const wl = l => cut([...new Set(arr(l).filter(x => typeof x === 'string').map(x => str(x, 60, '', 'ことば')))], LIM.words, 'かくす・さきに だす ことば');
  Object.keys(SLOTS).forEach(k => { if (obj(o.hide)[k]) sh.hide[k] = wl(o.hide[k]); if (obj(o.pin)[k]) sh.pin[k] = wl(o.pin[k]); });
  return sh;
}
function cleanSettings(v) {
  const o = obj(v), d = DEF_SET;
  return {
    romaji: pick(o.romaji, ['kunrei', 'hepburn'], d.romaji), guide: pick(o.guide, [0, 1, 2], d.guide), finger: bool(o.finger, d.finger), sound: bool(o.sound, d.sound),
    keyCase: pick(o.keyCase, ['lower', 'upper'], d.keyCase), glyphModel: bool(o.glyphModel, d.glyphModel), input: pick(o.input, ['kana', 'roma'], d.input),
    showBig: bool(o.showBig, d.showBig), chunk: pick(o.chunk, ['auto', 'ten', 'sent', 'all'], d.chunk), speakPick: bool(o.speakPick, d.speakPick),
    advance: pick(o.advance, ['auto09', 'auto2', 'manual'], d.advance), script: pick(o.script, ['hira', 'kata'], d.script), scriptKey: bool(o.scriptKey, d.scriptKey), show: cleanShow(o.show),
  };
}
function cleanMk(v) {
  const o = obj(v), m = { tpl: pick(o.tpl, tplIds(), 'gamba'), vals: cleanVals(o.vals), active: null, free: str(o.free, LIM.text, '', 'つくりかけの ぶん') };
  if (Number.isInteger(o.editIdx) && o.editIdx >= 0 && o.editIdx < LIM.doc) m.editIdx = o.editIdx;
  return m;
}
// ぶんしょうの さぎょう じょうたい（したがき にも つかう）
function cleanWorkState(o) {
  return { doc: cleanDoc(o.doc), hand: cleanHand(o.hand), fin: cleanFin(o.fin), docSrc: cleanDocSrc(o.docSrc), lineSrc: cleanDocSrc(o.lineSrc), conn: bool(o.conn, false), cuts: intList(o.cuts, LIM.text), cutsText: str(o.cutsText, LIM.text, '', 'くぎりの ぶん'), docIds: cut(arr(o.docIds).filter(x => typeof x === 'string').map(x => str(x, 40)), LIM.doc, 'ぶんの id') };
}
// よみこむ データを しらべて、へんな ところを とりのぞく（ほぞん して ある データにも つかう）
function cleanProfile(src) {
  if (!src || typeof src !== 'object' || Array.isArray(src)) return null;
  const words = {};
  Object.entries(obj(src.words)).forEach(([k, l]) => { if (SLOTS[k]) words[k] = cut([...new Set(arr(l).filter(w => typeof w === 'string').map(w => str(normText(w), 30, '', 'ことば')).filter(Boolean))], LIM.words, 'ことば'); });
  const wordVerb = {};
  Object.entries(obj(src.wordVerb)).forEach(([w, v]) => { if (VERBS[v]) wordVerb[str(w, 30, '', 'ことば')] = v; });
  const p = newProfile(typeof src.name === 'string' && src.name.trim() ? str(src.name.trim(), 30, '', 'なまえ') : 'よみこんだひと');
  if (typeof src.id === 'string' && /^[\w-]{1,40}$/.test(src.id)) p.id = src.id;
  const ws = cleanWorkState(src);
  const name = p.name;
  Object.assign(p, ws, {
    glyphs: cleanGlyphs(src.glyphs), words, wordVerb,
    works: cut(arr(src.works), LIM.works, 'さくひん').map(cleanWork).filter(Boolean),
    photos: arr(src.photos).filter(x => x && typeof x.d === 'string' && x.d.startsWith('data:image/jpeg;base64,') && x.d.length < 400000).slice(0, PHOTO_MAX).map(x => ({ d: x.d, date: str(x.date, 40) })),
    settings: cleanSettings(src.settings), mk: cleanMk(src.mk),
  });
  // ふるい かたち：てがきが はいれつ だった ころ
  if (src.fin && src.fin.grid === false && !src.fin.gstyle) p.fin.gstyle = 'none';
  if (src.draft && typeof src.draft === 'object') p.draft = Object.assign({ date: str(src.draft.date, 40) }, cleanWorkState(src.draft), src.draft.mk ? { mk: cleanMk(src.draft.mk) } : {});
  // なくなった もの・みじかく なった ものを しらせる
  const len = v => Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0;
  const chars = v => Array.isArray(v) ? v.filter(x => typeof x === 'string').join('').length : 0;
  const lost = (label, a, b) => { if (a > b) note(`${name}：${label} ${a - b}こを よみこめませんでした`); };
  lost('さくひん', len(src.works), p.works.length);
  lost('ぶん', len(src.doc), p.doc.length);
  if (chars(src.doc) > p.doc.join('').length && len(src.doc) === p.doc.length) note(`${name}：ながすぎる ぶんを みじかく しました`);
  lost('とうろくした もじ', len(src.glyphs), Object.keys(p.glyphs).length);
  lost('てがきの もじ', len(src.hand), Object.keys(p.hand).length);
  lost('しゃしん', len(src.photos), p.photos.length);
  return p;
}
// コードを しらべる：{ app, v, profile } か { app, v, profiles:[…] }（ぜんいんぶん）
function parseCode(txt) {
  if (txt.length > IMPORT_MAX) return { err: `コードが おおきすぎます（${Math.round(txt.length / 1e4)}まんもじ。うえかぎりは ${IMPORT_MAX / 1e4 | 0}まんもじ）` };
  let o; try { o = JSON.parse(txt); } catch (e) { return { err: 'コードが よみこめません' }; }
  if (!o || o.app !== 'bunsho-maker') return { err: '文章メーカーの コードでは ありません' };
  if (typeof o.v === 'number' && o.v > SCHEMA_V) return { err: 'あたらしい 文章メーカーで つくった コードです。アプリを さいしんに してください' };
  const list = o.profiles ? arr(o.profiles) : o.profile ? [o.profile] : [];
  FIXES = [];
  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  const nBad = list.filter(x => !isObj(x)).length;
  if (nBad) note(`ひとの データ ${nBad}こが こわれていて よみこめませんでした`);
  const ps = list.filter(isObj).map(cleanProfile).filter(Boolean);
  const fixes = FIXES; FIXES = null;
  if (!ps.length) return { err: 'コードの なかみが こわれています' };
  return { ps, fixes };
}
function importText(txt) {
  const r = parseCode(txt);
  if (r.err) return toast(r.err);
  const ps = r.ps, dup = ps.filter(p => DB.profiles.some(x => x.id === p.id));
  // ほぞん できた ときだけ きりかえる。できなければ まえの じょうたいに もどす
  const commit = (apply, msg) => {
    const before = { profiles: DB.profiles.slice(), current: DB.current, rb: DB.replacedBackup };
    apply();
    DB.current = ps[0].id;
    if (!saveDB()) {
      DB.profiles = before.profiles; DB.current = before.current; if (before.rb) DB.replacedBackup = before.rb; else delete DB.replacedBackup;
      saveDB(); bindProfile(); renderWho(); renderSetting();
      return toast('ほぞんする ばしょが たりず、よみこめませんでした（いまの データは そのままです）');
    }
    bindProfile(); toast(msg); renderWho(); renderSetting();
    if (r.fixes.length) showFixes('よみこむ ときに なおした こと', r.fixes);
  };
  const addAll = asNew => () => ps.forEach(p => {
    if (asNew && DB.profiles.some(x => x.id === p.id)) { p.id = newProfile('').id; p.name += '（よみこみ）'; }
    DB.profiles.push(p);
  });
  const who = ps.length > 1 ? ps.length + 'にんぶん' : ps[0].name;
  if (!dup.length) return commit(addAll(false), who + ' を よみこみました');
  // おなじ ひとの データが ある ときは、えらんでもらう
  const old = DB.profiles.find(x => x.id === dup[0].id);
  const info = ps.length > 1 ? `${ps.length}にんの うち、${dup.map(p => p.name).join('・')} の データが もう あります` :
    `いま：もじ ${Object.keys(old.glyphs || {}).length}こ・さくひん ${(old.works || []).length}こ　／　よみこむ：もじ ${Object.keys(ps[0].glyphs).length}こ・さくひん ${ps[0].works.length}こ`;
  const m = openModal(el('div', { class: 'regtitle' }, '「' + (ps.length > 1 ? dup.map(p => p.name).join('・') : old.name) + '」の データが もう あります'),
    el('p', { class: 'hint' }, info),
    el('div', { class: 'row' },
      el('button', { class: 'btn main', onclick: () => { m.remove(); commit(addAll(true), 'べつの ひととして ついか しました'); } }, 'べつの ひととして ついか'),
      el('button', { class: 'btn warn', onclick: () => {
        m.remove();
        commit(() => {
          const olds = dup.map(p => DB.profiles.find(x => x.id === p.id));
          DB.replacedBackup = { date: new Date().toISOString(), profiles: olds };
          ps.forEach(p => { const i = DB.profiles.findIndex(x => x.id === p.id); if (i >= 0) DB.profiles[i] = p; else DB.profiles.push(p); });
        }, 'おきかえました（まえの データは「もとに もどす」で もどせます）');
      } }, 'いまの データを おきかえる'),
      el('button', { class: 'btn', onclick: () => m.remove() }, 'やめる')));
}
// おきかえる まえの データに もどす
$('#btnUndoReplace').addEventListener('click', () => {
  const bk = DB.replacedBackup; if (!bk) return toast('もどせる データは ありません');
  const olds = (bk.profiles || (bk.profile ? [bk.profile] : [])).map(cleanProfile).filter(Boolean);
  const before = DB.profiles.slice(), cur = DB.current;
  olds.forEach(o => { const i = DB.profiles.findIndex(x => x.id === o.id); if (i >= 0) DB.profiles[i] = o; else DB.profiles.push(o); });
  delete DB.replacedBackup; DB.current = olds[0] ? olds[0].id : cur;
  if (!saveDB()) { DB.profiles = before; DB.current = cur; DB.replacedBackup = bk; saveDB(); return toast('ほぞん できず、もどせませんでした'); }
  bindProfile(); toast('まえの データに もどしました'); renderWho(); renderSetting();
});
// こわれた データの とりだし・けす（のこして ある ぶんを ぜんぶ ならべる）
function renderBroken() {
  const box = $('#brokenBox'), ks = brokenKeys(); box.innerHTML = '';
  box.hidden = !ks.length && !LOAD_FIXES.length && !saveBlocked;
  if (box.hidden) return;
  if (LOAD_FIXES.length) box.append(el('p', {}, '⚠ ひらいた ときに なおした こと：'), el('ul', {}, ...LOAD_FIXES.map(x => el('li', {}, x))));
  // よみだせない ときは、とりだせる・けせば ほぞん できる とは いわない（せんようの あんないだけ）
  if (saveBlocked && !READ_FAIL && HELD_RAW == null) box.append(el('p', {}, '⚠ もとの データを まもる ために、ほぞんを とめています。したの ボタンで とりだしてから「けす」を おすと、ほぞん できるように なります。'));
  // よみだせなかった：とりだせるとは いわず、もとの データを まもる てじゅんを だす
  if (READ_FAIL) box.append(el('p', {}, '⚠ この iPad では ほぞんした データを よみだせませんでした。ページを とじたり、Safari の「Webサイトデータ」を けしたり しないで、がっこうの たんとうの せんせいに そうだんしてください。（ほかの iPad の バックアップが あれば、そちらは つかえます）'));
  // のこす ばしょが なくて メモリに だけ ある もとの データ
  if (HELD_RAW != null) {
    const go = el('button', { class: 'btn small warn' }, 'とりだしたので ほぞんを はじめる');
    go.addEventListener('click', () => {
      if (go.dataset.c !== '1') { go.dataset.c = '1'; go.textContent = 'ほんとう？（もとの データに うわがき します）'; setTimeout(() => { go.dataset.c = ''; go.textContent = 'とりだしたので ほぞんを はじめる'; }, 3000); return; }
      // まえに のこした もの（.broken）は べつに ある ので、ほぞんを とめる りゆうは なくなる。ほぞん できた ときだけ メモリの もとの データを てばなす
      saveBlocked = false;
      if (saveDB()) { HELD_RAW = null; if (!brokenKeys().length) LOAD_FIXES = []; toast('ほぞんを はじめました'); }
      else { saveBlocked = true; toast('まだ ほぞん できません。iPad の ようりょうを あけてから、もういちど おしてください'); }
      renderSetting();
    });
    box.append(el('p', {}, 'もとの データを のこす ばしょが たりませんでした。いま この がめんに だけ あります。ファイルに とりだして、がっこうの ほぞん ばしょに のこしてください。'),
      el('div', { class: 'row' }, el('button', { class: 'btn small', onclick: () => { const a = el('a', { href: URL.createObjectURL(new Blob([HELD_RAW], { type: 'application/json' })), download: 'bunsho-broken-' + Date.now() + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '📥 ファイルに とりだす'), go));
  }
  if (!ks.length) return;
  // よみだせない ときに、まえに のこした コピーが ある：いまの データとは べつの もの として わけて だす。
  // そうだんの ときに やくに たつので とりだしは できるが、けす ボタンは ださない
  if (READ_FAIL) {
    box.append(el('p', {}, `いまの データとは べつに、まえに のこした コピーが ${ks.length}こ あります（いまの データでは ありません。ふるい ないようです）。そうだんの ときに いっしょに わたせるよう、ファイルに とりだせます。`));
    ks.forEach(k => {
      const t = +k.slice(BROKEN_PREFIX.length + 1).replace(/_+$/, ''), d = t ? new Date(t) : null;
      const label = d ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} に のこした コピー` : 'まえに のこした コピー';
      box.append(el('div', { class: 'row' }, el('span', {}, label),
        el('button', { class: 'btn small', onclick: () => { let raw = ''; try { raw = localStorage.getItem(k) || ''; } catch (e) {} if (!raw) return toast('この コピーも よみだせませんでした'); const a = el('a', { href: URL.createObjectURL(new Blob([raw], { type: 'application/json' })), download: 'bunsho-old-copy-' + (t || 'old') + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '📥 この コピーを ファイルに する')));
    });
    return;
  }
  box.append(el('p', {}, `もとの データを けさずに ${ks.length}こ とってあります。ファイルに とりだして、がっこうの ほぞん ばしょに のこしてください。`));
  ks.forEach(k => {
    const t = +k.slice(BROKEN_PREFIX.length + 1).replace(/_+$/, ''), d = t ? new Date(t) : null;
    const label = d ? `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : 'まえの もの';
    const drop = el('button', { class: 'btn small warn' }, 'とりだしたので けす');
    drop.addEventListener('click', () => {
      if (drop.dataset.c !== '1') { drop.dataset.c = '1'; drop.textContent = 'ほんとうに けす？'; setTimeout(() => { drop.dataset.c = ''; drop.textContent = 'とりだしたので けす'; }, 3000); return; }
      try { localStorage.removeItem(k); } catch (e) {}
      if (!brokenKeys().length && HELD_RAW == null && !READ_FAIL) { saveBlocked = false; LOAD_FIXES = []; }
      if (saveDB()) toast('けしました'); renderSetting();
    });
    box.append(el('div', { class: 'row' }, el('span', {}, label),
      el('button', { class: 'btn small', onclick: () => { let raw = ''; try { raw = localStorage.getItem(k) || ''; } catch (e) {} const a = el('a', { href: URL.createObjectURL(new Blob([raw], { type: 'application/json' })), download: 'bunsho-broken-' + (t || 'old') + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '📥 ファイルに とりだす'), drop));
  });
}
$('#btnImport').addEventListener('click', () => importText($('#exportBox').value.trim()));
$('#fileImport').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > FILE_MAX) return toast('ファイルが おおきすぎます（文章メーカーの コードでは ないかも しれません）');
  f.text().then(importText);
});
// なおした ことの おしらせ
function showFixes(title, list) {
  const m = openModal(el('div', { class: 'regtitle' }, '⚠ ' + title), el('ul', { class: 'hint', style: 'text-align:left;max-width:560px' }, ...list.map(x => el('li', {}, x))),
    el('div', { class: 'row' }, el('button', { class: 'btn main', onclick: () => m.remove() }, 'わかった')));
}

