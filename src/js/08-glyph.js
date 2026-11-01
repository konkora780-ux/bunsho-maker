// ===== もじとうろく =====
const GLYPH_HIRA = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'やゆよ', 'らりるれろ', 'わをん',
  'がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ', 'ゔ', 'ぁぃぅぇぉ', 'ゃゅょっゎ'];
const GLYPH_MARKS = '、。ー！？「」';
// すうじ（ひらがな・カタカナ どちらでも おなじ）。ならべれば なんけたでも かける
const GLYPH_NUM = '0123456789';
// ひらがな・カタカナ・すうじ ぜんぶ とうろく できる。その ひとの もじの ならびを さきに だす
const glyphRows = () => { const h = GLYPH_HIRA, k = GLYPH_HIRA.map(hira2kata); return (KATA() ? k.concat(h) : h.concat(k)).concat([GLYPH_NUM, GLYPH_MARKS]); };
const glyphAll = () => glyphRows().join('').split('');
function drawGlyphThumb(cv, ch) {
  const s = 2, n = 44; cv.width = n * s; cv.height = n * s;
  const c = cv.getContext('2d'); c.setTransform(s, 0, 0, s, 0, 0);
  const gl = P().glyphs[ch];
  if (gl) drawStrokes(c, gl, 2, 2, n - 4, (n - 4) * 0.075, '#1b1b1b');
}
// いまの ぶんしょうで つかう のに、まだ とうろく していない もじ（でてくる じゅん）
function neededGlyphs() {
  // しあげに でる もじ（その ひとの もじ）で しらべる
  const o = finO(), nm = fin.name ? o.nameText : '', all = glyphAll();
  return [...new Set([...finText() + o.title + nm].filter(c => all.includes(c) && !P().glyphs[c]))];
}
function renderGlyphGrid() {
  const g = $('#glyphGrid'); g.innerHTML = '';
  const need = neededGlyphs();
  $('#btnGlyphNeed').hidden = !need.length;
  $('#btnGlyphNeed').textContent = `📝 いまの ぶんしょうの もじから かく（あと ${need.length}もじ）`;
  glyphRows().forEach(row => {
    const r = el('div', { class: 'grow' });
    row.split('').forEach(ch => {
      const cv = document.createElement('canvas');
      drawGlyphThumb(cv, ch);
      r.append(el('button', { class: 'gcell' + (P().glyphs[ch] ? ' has' : '') + (need.includes(ch) ? ' need' : ''), 'aria-label': ch + ' を かく', onclick: () => openReg(ch) }, el('span', { class: 'lb' }, ch), cv));
    });
    g.append(r);
  });
  const all = glyphAll(), n = all.filter(c => P().glyphs[c]).length;
  $('#glyphProg').textContent = `とうろく ${n} / ${all.length}`;
  $('#optGlyphModel').checked = S().glyphModel;
}
$('#optGlyphModel').addEventListener('change', e => { S().glyphModel = e.target.checked; saveDB(); });
$('#btnGlyphNeed').addEventListener('click', () => { const q = neededGlyphs(); if (q.length) openReg(q[0], q); });
$('#btnGlyphNext').addEventListener('click', () => { const c = glyphAll().find(c => !P().glyphs[c]); if (c) openReg(c); else toast('ぜんぶ とうろくできています！'); });
// queue が あれば その もじだけを じゅんに かく（いまの ぶんしょうで つかう もじ など）
function openReg(ch, queue) {
  const list = queue || glyphAll();
  let strokes = (P().glyphs[ch] || []).map(s => s.slice());
  const N = 300;
  const cv = el('canvas', { class: 'regcv' });
  cv.className = 'bigcv';
  const ctx = cv.getContext('2d');
  const paint = (live) => {
    const sc = cv.width / N;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, N, N);
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = '#c9dcd8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(N / 2, 0); ctx.lineTo(N / 2, N); ctx.moveTo(0, N / 2); ctx.lineTo(N, N / 2); ctx.stroke(); ctx.restore();
    if (S().glyphModel) {
      ctx.fillStyle = '#e3eae9'; ctx.font = `${N * 0.8}px "Klee One",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ch, N / 2, N / 2 + N * 0.03);
    }
    drawStrokes(ctx, strokes, 0, 0, N, N * 0.075, '#1b1b1b');
    if (live) drawStrokes(ctx, [live], 0, 0, N, N * 0.075, '#1b1b1b');
  };
  attachDraw(cv, {
    toLogical: (fx, fy) => [fx, fy],
    penOnly: () => fin.penOnly,
    count: () => strokes.length,
    onDraw: pts => paint(pts),
    onEnd: pts => { strokes.push(simplify(pts, 0.006)); paint(); },
  });
  const idx = list.indexOf(ch);
  const save = () => {
    if (strokes.length) P().glyphs[ch] = strokes; else delete P().glyphs[ch];
    saveDB();
  };
  const go = d => { save(); m.remove(); const n = list[idx + d]; if (n) openReg(n, queue); else { renderGlyphGrid(); toast(queue ? 'いまの ぶんしょうの もじが ぜんぶ かけたね！' : 'おわり！'); } };
  const prevBtn = el('button', { class: 'btn', onclick: () => go(-1) }, '◀ まえ');
  prevBtn.disabled = idx <= 0;
  const note = SMALL.includes(ch) ? 'ちいさく かこう' : PUNCT.includes(ch) ? 'ひだりしたに ちいさく かこう' : '';
  // ③の てがきと おなじ ならび・おなじ ボタン
  const modelCb = el('input', { type: 'checkbox' }); modelCb.checked = S().glyphModel;
  modelCb.addEventListener('change', () => { S().glyphModel = modelCb.checked; saveDB(); paint(); });
  const penCb = el('input', { type: 'checkbox' }); penCb.checked = fin.penOnly;
  penCb.addEventListener('change', () => { fin.penOnly = penCb.checked; });
  const bar = el('div', { class: 'padbar' },
    el('div', { class: 'regtitle' }, el('span', { class: 'ch' }, ch), el('span', { class: 'hint' }, `${idx + 1}もじめ ／ ${list.length}もじ${queue ? '（いまの ぶんしょうの もじ）' : ''}${note ? '　' + note : ''}`)),
    el('div', { class: 'row' },
      prevBtn,
      el('button', { class: 'btn main', onclick: () => go(1) }, 'かけた！ つぎへ ▶'),
      el('button', { class: 'btn', onclick: () => { strokes.pop(); paint(); } }, '↶ もどす'),
      el('button', { class: 'btn', onclick: () => { strokes = []; paint(); } }, 'この もじを けす'),
      el('button', { class: 'btn', onclick: () => speak(ch) }, '🔊'),
      el('label', { class: 'hint tonly' }, modelCb, ' おてほん'),
      el('label', { class: 'hint tonly' }, penCb, ' ゆびでは かかない（ペンで かく）'),
      el('button', { class: 'btn', onclick: () => { save(); m.remove(); renderGlyphGrid(); } }, '✓ おわる')));
  const m = openModal(bar, cv);
  m.onclick = null;
  m.querySelector('.box').classList.add('fullbox');
  const fit = () => { if (!m.isConnected) return window.removeEventListener('resize', fit); fitBigCanvas(cv, bar.offsetHeight); paint(); };
  window.addEventListener('resize', fit);
  fit();
  ensureFont('"Klee One"').then(() => paint());
}

