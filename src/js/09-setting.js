// ===== せってい =====
function renderShowBox() {
  const sh = SH(), box = $('#showBox'); box.innerHTML = '';
  const grp = (label, ...kids) => el('div', { class: 'showgrp' }, el('b', {}, label), ...kids);
  const cb = (on, text, fn) => { const i = el('input', { type: 'checkbox' }); i.checked = on; i.addEventListener('change', () => { fn(i.checked); saveDB(); }); return el('label', {}, i, ' ' + text); };
  const listToggle = (key, all, id, on) => { let l = sh[key] && sh[key].length ? sh[key].slice() : all.slice(); if (on) l.push(id); else l = l.filter(x => x !== id); sh[key] = l.length === all.length ? null : l; };
  const tIds = TPLS.map(t => t.id);
  box.append(grp('ぶんの かた', ...TPLS.map(t => cb(!sh.tpls || sh.tpls.includes(t.id), t.em + t.name, on => listToggle('tpls', tIds, t.id, on)))));
  const mIds = ['glyph', 'font', 'hand'], mName = { glyph: 'じぶんの もじ', font: 'iPadの もじ', hand: 'てがき' };
  box.append(grp('しあげかた', ...mIds.map(m => cb(!sh.modes || sh.modes.includes(m), mName[m], on => listToggle('modes', mIds, m, on))), cb(sh.glyph, 'もじとうろくの ボタン', on => { sh.glyph = on; })));
  const maxSel = el('select', { 'aria-label': 'ことばの かず' });
  [[0, 'ぜんぶ'], [2, '2こ'], [3, '3こ'], [4, '4こ'], [6, '6こ']].forEach(([v, t]) => maxSel.append(el('option', { value: v }, t)));
  maxSel.value = String(sh.max); maxSel.addEventListener('change', () => { sh.max = +maxSel.value; saveDB(); });
  box.append(grp('ことばの かず', maxSel, el('span', { class: 'hint' }, '（1かいに だす ことばの かず。うえから じゅんに でます）')));
  const det = el('details', {}, el('summary', { class: 'hint' }, 'だす ことばを えらぶ（タップで だす／かくす）'));
  Object.entries(SLOTS).forEach(([k, s]) => {
    const all = s.w.map(x => x[0]).concat(P().words[k] || []);
    if (!all.length) return;
    det.append(grp(s.q, ...all.map(w => {
      const hide = () => sh.hide[k] || [];
      const b = el('button', { class: 'wtog' + (hide().includes(w) ? ' off' : '') }, w);
      b.addEventListener('click', () => { const h = hide(); sh.hide[k] = h.includes(w) ? h.filter(x => x !== w) : h.concat(w); b.classList.toggle('off'); saveDB(); });
      return b;
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
const exportCode = () => JSON.stringify({ app: 'bunsho-maker', v: 1, profile: P() });
$('#btnExport').addEventListener('click', () => { $('#exportBox').value = exportCode(); toast('コードを つくりました'); });
$('#btnCopyExport').addEventListener('click', () => {
  const box = $('#exportBox'); if (!box.value) box.value = exportCode();
  const fallback = () => { box.focus(); box.select(); toast('えらんだ じょうたいです。コピーしてください'); };
  try { navigator.clipboard.writeText(box.value).then(() => toast('コピーしました'), fallback); } catch (e) { fallback(); }
});
$('#btnDownload').addEventListener('click', () => {
  const a = el('a', { href: URL.createObjectURL(new Blob([exportCode()], { type: 'application/json' })), download: `bunsho-${P().name}.json` });
  document.body.append(a); a.click(); a.remove();
});
// よみこむ データを しらべて、へんな ところを とりのぞく
function cleanProfile(src) {
  if (!src || typeof src !== 'object') return null;
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const arr = v => Array.isArray(v) ? v : [];
  const isStroke = s => Array.isArray(s) && s.every(p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && isFinite(n)));
  const glyphs = {};
  Object.entries(obj(src.glyphs)).forEach(([c, st]) => { if (typeof c === 'string' && c.length === 1 && Array.isArray(st) && st.every(isStroke)) glyphs[c] = st; });
  const words = {};
  Object.entries(obj(src.words)).forEach(([k, l]) => { if (SLOTS[k]) words[k] = arr(l).filter(w => typeof w === 'string').map(w => normText(w).slice(0, 30)); });
  const p = newProfile(typeof src.name === 'string' && src.name.trim() ? src.name.trim().slice(0, 30) : 'よみこんだひと');
  if (typeof src.id === 'string') p.id = src.id;
  Object.assign(p, {
    glyphs, words, wordVerb: obj(src.wordVerb),
    doc: arr(src.doc).filter(s => typeof s === 'string'),
    works: arr(src.works).filter(w => w && typeof w.text === 'string' && typeof w.mode === 'string'),
    photos: arr(src.photos).filter(x => x && typeof x.d === 'string' && x.d.startsWith('data:image/jpeg;base64,')).slice(0, PHOTO_MAX).map(x => ({ d: x.d, date: typeof x.date === 'string' ? x.date : '' })),
    hand: obj(src.hand), settings: Object.assign({}, DEF_SET, obj(src.settings)), fin: obj(src.fin), mk: obj(src.mk),
  });
  return p;
}
function importText(txt) {
  let o; try { o = JSON.parse(txt); } catch (e) { return toast('コードが よみこめません'); }
  if (!o || o.app !== 'bunsho-maker' || !o.profile) return toast('文章メーカーの コードでは ありません');
  const p = cleanProfile(o.profile);
  if (!p) return toast('コードの なかみが こわれています');
  const finish = msg => { DB.current = p.id; bindProfile(); if (saveDB()) toast(msg); renderWho(); renderSetting(); };
  const i = DB.profiles.findIndex(x => x.id === p.id);
  if (i < 0) { DB.profiles.push(p); return finish(p.name + ' を よみこみました'); }
  // おなじ ひとの データが ある ときは、えらんでもらう
  const old = DB.profiles[i];
  const m = openModal(el('div', { class: 'regtitle' }, '「' + old.name + '」の データが もう あります'),
    el('p', { class: 'hint' }, `いま：もじ ${Object.keys(old.glyphs || {}).length}こ・さくひん ${(old.works || []).length}こ　／　よみこむ：もじ ${Object.keys(p.glyphs).length}こ・さくひん ${p.works.length}こ`),
    el('div', { class: 'row' },
      el('button', { class: 'btn main', onclick: () => { m.remove(); p.id = newProfile('').id; p.name += '（よみこみ）'; DB.profiles.push(p); finish(p.name + ' として ついか しました'); } }, 'べつの ひととして ついか'),
      el('button', { class: 'btn warn', onclick: () => { m.remove(); DB.replacedBackup = { date: new Date().toISOString(), profile: old }; DB.profiles[i] = p; finish('おきかえました（まえの データは「もとに もどす」で もどせます）'); } }, 'いまの データを おきかえる'),
      el('button', { class: 'btn', onclick: () => m.remove() }, 'やめる')));
}
// おきかえる まえの データに もどす
$('#btnUndoReplace').addEventListener('click', () => {
  const bk = DB.replacedBackup; if (!bk) return toast('もどせる データは ありません');
  const i = DB.profiles.findIndex(x => x.id === bk.profile.id);
  if (i >= 0) DB.profiles[i] = bk.profile; else DB.profiles.push(bk.profile);
  delete DB.replacedBackup; DB.current = bk.profile.id; bindProfile();
  if (saveDB()) toast('まえの データに もどしました'); renderWho(); renderSetting();
});
$('#btnImport').addEventListener('click', () => importText($('#exportBox').value.trim()));
$('#fileImport').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; f.text().then(importText); e.target.value = ''; });

