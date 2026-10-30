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
  $('#btnDownload').hidden = IN_FRAME;
  $('#btnUndoReplace').hidden = !DB.replacedBackup;
  $('#brokenBox').hidden = !BROKEN;
}
$('#optRomaji').addEventListener('change', e => { S().romaji = e.target.value; saveDB(); });
$('#optCase').addEventListener('change', e => { S().keyCase = e.target.value; saveDB(); });
$('#optSpeakPick').addEventListener('change', e => { S().speakPick = e.target.checked; saveDB(); });
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
// id, name, glyphs, words, wordVerb, doc, docSrc, conn, cuts, cutsText, works, photos, hand, settings(+show), fin(+snap), mk, draft
const SCHEMA_V = 2;
const IMPORT_MAX = 8 * 1024 * 1024; // よみこむ コードの おおきさの うえかぎり（もじすう）
const LIM = { strokes: 80, pts: 3000, glyphs: 200, hand: 5000, doc: 300, line: 1000, works: 300, text: 20000, words: 200 };
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const arr = v => Array.isArray(v) ? v : [];
const str = (v, max, d = '') => typeof v === 'string' ? v.slice(0, max) : d;
const num = (v, lo, hi, d) => typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
const int = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
const pick = (v, list, d) => list.includes(v) ? v : d;
const bool = (v, d) => typeof v === 'boolean' ? v : d;
const clone = v => JSON.parse(JSON.stringify(v));
// せん：[[x,y],…] の あつまり（ざひょうは 0〜1 ふきん）。へんな ものは のぞく
function cleanStrokes(v) {
  return arr(v).slice(0, LIM.strokes).map(st => arr(st).slice(0, LIM.pts)
    .filter(p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && isFinite(n))).map(p => p.map(n => Math.min(2, Math.max(-1, n)))))
    .filter(st => st.length);
}
function cleanGlyphs(v) {
  const g = {};
  Object.entries(obj(v)).slice(0, LIM.glyphs).forEach(([c, st]) => { if ([...c].length === 1) { const s = cleanStrokes(st); if (s.length) g[c] = s; } });
  return g;
}
function cleanHand(v) {
  const h = {};
  Object.entries(obj(v)).slice(0, LIM.hand).forEach(([k, x]) => {
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
    title: str(o.title, 60), breaks: intList(o.breaks, LIM.text),
  };
  if (o.snap) f.snap = cleanSnap(o.snap);
  if (!f.snap) delete f.snap;
  return f;
}
// ひらいた さくひんの「その ときの もじ・なまえ」
function cleanSnap(v) {
  const o = obj(v); if (typeof o.text !== 'string') return null;
  return { id: str(o.id, 40), text: str(o.text, LIM.text), nameText: str(o.nameText, 30), glyphs: o.glyphs ? cleanGlyphs(o.glyphs) : null };
}
function cleanWork(v) {
  const o = obj(v); if (typeof o.text !== 'string' || !o.text) return null;
  const w = Object.assign(cleanFin(o), { id: str(o.id, 40) || 'w' + Date.now() + Math.random().toString(36).slice(2, 5), date: str(o.date, 40), text: o.text.slice(0, LIM.text), nameText: str(o.nameText, 30), conn: bool(o.conn, false) });
  delete w.snap;
  if (o.glyphs) w.glyphs = cleanGlyphs(o.glyphs);
  if (o.hand) w.hand = cleanHand(o.hand);
  return w;
}
const tplIds = () => TPLS.map(t => t.id);
function cleanVals(v) { const r = {}; Object.entries(obj(v)).forEach(([k, x]) => { if (/^\d+$/.test(k) && typeof x === 'string') r[k] = x.slice(0, 60); }); return r; }
function cleanDocSrc(v) {
  const r = {};
  Object.entries(obj(v)).slice(0, LIM.doc * 3).forEach(([k, x]) => { if (x && tplIds().includes(x.tpl)) r[k.slice(0, LIM.line)] = { tpl: x.tpl, vals: cleanVals(x.vals) }; });
  return r;
}
const cleanDoc = v => arr(v).filter(s => typeof s === 'string').slice(0, LIM.doc).map(s => s.slice(0, LIM.line));
function cleanShow(v) {
  const o = obj(v), sh = showDef();
  const ids = (l, all) => l === null || l === undefined ? null : [...new Set(arr(l).filter(x => all.includes(x)))];
  sh.tpls = ids(o.tpls, tplIds()); sh.modes = ids(o.modes, MODE_IDS);
  sh.glyph = bool(o.glyph, true); sh.max = pick(o.max, [0, 2, 3, 4, 6], 0);
  const wl = l => [...new Set(arr(l).filter(x => typeof x === 'string').map(x => x.slice(0, 60)))].slice(0, LIM.words);
  Object.keys(SLOTS).forEach(k => { if (obj(o.hide)[k]) sh.hide[k] = wl(o.hide[k]); if (obj(o.pin)[k]) sh.pin[k] = wl(o.pin[k]); });
  return sh;
}
function cleanSettings(v) {
  const o = obj(v), d = DEF_SET;
  return {
    romaji: pick(o.romaji, ['kunrei', 'hepburn'], d.romaji), guide: pick(o.guide, [0, 1, 2], d.guide), finger: bool(o.finger, d.finger), sound: bool(o.sound, d.sound),
    keyCase: pick(o.keyCase, ['lower', 'upper'], d.keyCase), glyphModel: bool(o.glyphModel, d.glyphModel), input: pick(o.input, ['kana', 'roma'], d.input),
    showBig: bool(o.showBig, d.showBig), chunk: pick(o.chunk, ['auto', 'ten', 'sent', 'all'], d.chunk), speakPick: bool(o.speakPick, d.speakPick),
    advance: pick(o.advance, ['auto09', 'auto2', 'manual'], d.advance), show: cleanShow(o.show),
  };
}
function cleanMk(v) {
  const o = obj(v), m = { tpl: pick(o.tpl, tplIds(), 'gamba'), vals: cleanVals(o.vals), active: null, free: str(o.free, LIM.line) };
  return m;
}
// ぶんしょうの さぎょう じょうたい（したがき にも つかう）
function cleanWorkState(o) {
  return { doc: cleanDoc(o.doc), hand: cleanHand(o.hand), fin: cleanFin(o.fin), docSrc: cleanDocSrc(o.docSrc), conn: bool(o.conn, false), cuts: intList(o.cuts, LIM.text), cutsText: str(o.cutsText, LIM.text) };
}
// よみこむ データを しらべて、へんな ところを とりのぞく（ほぞん して ある データにも つかう）
function cleanProfile(src) {
  if (!src || typeof src !== 'object' || Array.isArray(src)) return null;
  const words = {};
  Object.entries(obj(src.words)).forEach(([k, l]) => { if (SLOTS[k]) words[k] = [...new Set(arr(l).filter(w => typeof w === 'string').map(w => normText(w).slice(0, 30)).filter(Boolean))].slice(0, LIM.words); });
  const wordVerb = {};
  Object.entries(obj(src.wordVerb)).forEach(([w, v]) => { if (VERBS[v]) wordVerb[w.slice(0, 30)] = v; });
  const p = newProfile(typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, 30) : 'よみこんだひと');
  if (typeof src.id === 'string' && /^[\w-]{1,40}$/.test(src.id)) p.id = src.id;
  const ws = cleanWorkState(src);
  Object.assign(p, ws, {
    glyphs: cleanGlyphs(src.glyphs), words, wordVerb,
    works: arr(src.works).slice(0, LIM.works).map(cleanWork).filter(Boolean),
    photos: arr(src.photos).filter(x => x && typeof x.d === 'string' && x.d.startsWith('data:image/jpeg;base64,') && x.d.length < 400000).slice(0, PHOTO_MAX).map(x => ({ d: x.d, date: str(x.date, 40) })),
    settings: cleanSettings(src.settings), mk: cleanMk(src.mk),
  });
  // ふるい かたち：てがきが はいれつ だった ころ
  if (src.fin && src.fin.grid === false && !src.fin.gstyle) p.fin.gstyle = 'none';
  if (src.draft && typeof src.draft === 'object') p.draft = Object.assign({ date: str(src.draft.date, 40) }, cleanWorkState(src.draft));
  return p;
}
// コードを しらべる：{ app, v, profile } か { app, v, profiles:[…] }（ぜんいんぶん）
function parseCode(txt) {
  if (txt.length > IMPORT_MAX) return { err: 'コードが おおきすぎます' };
  let o; try { o = JSON.parse(txt); } catch (e) { return { err: 'コードが よみこめません' }; }
  if (!o || o.app !== 'bunsho-maker') return { err: '文章メーカーの コードでは ありません' };
  if (typeof o.v === 'number' && o.v > SCHEMA_V) return { err: 'あたらしい 文章メーカーで つくった コードです。アプリを さいしんに してください' };
  const list = o.profiles ? arr(o.profiles) : o.profile ? [o.profile] : [];
  const ps = list.map(cleanProfile).filter(Boolean);
  if (!ps.length) return { err: 'コードの なかみが こわれています' };
  return { ps };
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
// こわれた データの とりだし・けす
$('#btnBrokenSave').addEventListener('click', () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([BROKEN || ''], { type: 'application/json' })), download: 'bunsho-broken-' + new Date().toISOString().slice(0, 10) + '.json' });
  document.body.append(a); a.click(); a.remove();
});
$('#btnBrokenDrop').addEventListener('click', function () {
  if (this.dataset.c !== '1') { this.dataset.c = '1'; this.textContent = 'ほんとうに けす？（とりだした ファイルは のこります）'; setTimeout(() => { this.dataset.c = ''; this.textContent = 'とりだしたので けす'; }, 3000); return; }
  try { localStorage.removeItem(BROKEN_KEY); } catch (e) {}
  BROKEN = null; saveBlocked = false;
  if (saveDB()) toast('けしました'); renderSetting();
});
$('#btnImport').addEventListener('click', () => importText($('#exportBox').value.trim()));
$('#fileImport').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; f.text().then(importText); e.target.value = ''; });

