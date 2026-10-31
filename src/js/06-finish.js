// ===== ③ しあげる =====
const FONTS = [
  ['ヒラギノ まるゴシック', '"Hiragino Maru Gothic ProN","Zen Maru Gothic",sans-serif'],
  ['ヒラギノ かくゴシック', '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif'],
  ['ヒラギノ みんちょう', '"Hiragino Mincho ProN","Hiragino Mincho Pro",serif'],
  ['きょうかしょふう（Klee One）', '"Klee One",serif'],
  ['まるもじ（Zen Maru Gothic）', '"Zen Maru Gothic",sans-serif'],
  ['クレー（iPadに いれたとき）', '"Klee","Klee One",serif'],
];
const SMALL = 'ぁぃぅぇぉゃゅょっゎ';
const PUNCT = '、。';
const FIN_DEF = { hi: 0, mode: 'font', dir: 'yoko', cols: 10, grid: true, name: false, font: 0, weight: 0.075, model: true, penOnly: false,
  use: 'free', paper: 'free', rows: 0, gstyle: 'masu', size: 0.72, title: '', sentBreak: true, breaks: [], page: 0 };
let fin = Object.assign({}, FIN_DEF);
let brMode = false; // かいぎょうを なおす モード
// ひとを かえたら、そのひとの しあげかた（フォント・むき など）に きりかえる
function bindProfile() {
  fin = P().fin = Object.assign({}, FIN_DEF, P().fin); fin.hi = 0; fin.page = 0;
  // つくりかけの ぶんも ひとごとに
  mk = P().mk = Object.assign({ tpl: 'gamba', vals: {}, active: null, free: '' }, P().mk);
  if (P().fin && P().fin.grid === false && !P().fin.gstyle) fin.gstyle = 'none';
}
const CELL = 80, MARGIN = 48;
// ようし（pt：1pt＝1/72インチ）
const PAPERS = {
  free: { n: 'ようし なし（もじに あわせる）' },
  a4t: { n: 'A4 たて', w: 595, h: 842 }, a4y: { n: 'A4 よこ', w: 842, h: 595 },
  b5t: { n: 'B5 たて', w: 516, h: 729 }, b5y: { n: 'B5 よこ', w: 729, h: 516 },
  hagaki: { n: 'はがき', w: 283, h: 420 }, tanzaku: { n: 'たんざく（6×18cm）', w: 170, h: 510 },
};
// つかいみち：えらぶと ようし・むき・もじすう・ぎょうすう・ますめ・もじの おおきさ が きまる
const USES = {
  free: { n: '✏️ じぶんで きめる' },
  genko: { n: '📝 げんこうようし（たてがき 20×10）', paper: 'a4t', dir: 'tate', cols: 20, rows: 10, gstyle: 'genko', size: 0.72 },
  sakubun: { n: '📄 さくぶん（よこがき ます）', paper: 'a4t', dir: 'yoko', cols: 15, rows: 20, gstyle: 'masu', size: 0.72 },
  renraku: { n: '📒 れんらくちょう（けいせん）', paper: 'b5t', dir: 'yoko', cols: 18, rows: 12, gstyle: 'line', size: 0.72 },
  keiji: { n: '📢 けいじぶつ（おおきな もじ）', paper: 'a4y', dir: 'yoko', cols: 8, rows: 4, gstyle: 'none', size: 0.85 },
  card: { n: '💌 カード・はがき', paper: 'hagaki', dir: 'tate', cols: 10, rows: 7, gstyle: 'line', size: 0.72 },
  tanzaku: { n: '🎋 たんざく', paper: 'tanzaku', dir: 'tate', cols: 12, rows: 2, gstyle: 'none', size: 0.85 },
};
const GSTYLES = { masu: 'ます', genko: 'げんこうようし', line: 'けいせん', none: 'なし' };
const pitchOf = o => CELL * (o.gstyle === 'genko' ? 1.3 : o.gstyle === 'line' ? 1.2 : 1);

// もじを ぎょうに ならべる。からだの もじには 0,1,2… の ばんごう（n）、だい・なまえは n=-1
function layoutAll(o, text) {
  const cols = o.cols, lines = [], br = new Set(o.breaks || []);
  const meta = s => [...s].slice(0, cols).map(ch => ({ ch, n: -1 }));
  const nameLine = () => { const n = meta((o.nameText || P().name).trim()); return Array(cols - n.length).fill({ ch: ' ', n: -1 }).concat(n); };
  if (o.title && o.title.trim()) lines.push(meta('  ' + o.title.trim()));
  if (o.name && o.title && o.title.trim()) lines.push(nameLine());
  const paras = o.sentBreak === false ? [text.replace(/\n/g, '')] : text.split('\n');
  let n = 0;
  for (const para of paras) {
    let line = [];
    for (const ch of para) {
      const isSp = ch === ' ' || ch === '　';
      if (!isSp && br.has(n) && line.length && !PUNCT.includes(ch)) { lines.push(line); line = []; }
      if (line.length >= cols) {
        // 行頭に「、。」がこないよう、ぶらさげる
        if (PUNCT.includes(ch) && line.length === cols) { line.push({ ch, n: n++ }); lines.push(line); line = []; continue; }
        lines.push(line); line = [];
      }
      line.push({ ch, n: isSp ? -1 : n++ });
    }
    lines.push(line);
  }
  if (o.name && !(o.title && o.title.trim())) lines.push(nameLine());
  return lines;
}
function sheetGeom(o, text, page = 0) {
  const all = layoutAll(o, text);
  const rows = o.rows > 0 ? o.rows : Math.max(all.length, 3);
  const pages = Math.max(1, Math.ceil(all.length / rows));
  const pg = Math.min(page, pages - 1);
  const lines = all.slice(pg * rows, (pg + 1) * rows);
  const P_ = pitchOf(o), off = (P_ - CELL) / 2, extra = CELL * 0.6;
  let W, H;
  if (o.dir === 'yoko') { W = MARGIN * 2 + o.cols * CELL + extra; H = MARGIN * 2 + rows * P_; }
  else { W = MARGIN * 2 + rows * P_; H = MARGIN * 2 + o.cols * CELL + extra; }
  const cellXY = (r, c) => o.dir === 'yoko' ? [MARGIN + c * CELL, MARGIN + r * P_ + off] : [W - MARGIN - (r + 1) * P_ + off, MARGIN + c * CELL];
  const cells = [];
  lines.forEach((line, r) => line.forEach((x, c) => { if (x.ch !== ' ' && x.ch !== '　') cells.push({ r, c, ch: x.ch, n: x.n }); }));
  // てがき用：ぜんぶの ページの からだの もじ（ページばんごう つき）
  const allCells = [];
  all.forEach((line, r) => line.forEach((x, c) => { if (x.n >= 0) allCells.push({ r: r % rows, c, ch: x.ch, n: x.n, page: Math.floor(r / rows) }); }));
  return { lines, rows, pages, page: pg, W, H, P: P_, cellXY, cells, allCells };
}
// 1もじを ます に かく（たてがきの ときは 句読点・小さい字・ー を なおす）
function drawCharCell(ctx, ch, x, y, o, painter) {
  ctx.save();
  if (o.dir === 'tate') {
    if (PUNCT.includes(ch)) ctx.translate(CELL * 0.55, -CELL * 0.55);
    else if (SMALL.includes(ch)) ctx.translate(CELL * 0.12, -CELL * 0.12);
    else if (ch === 'ー' || ch === '〜') { ctx.translate(x + CELL / 2, y + CELL / 2); ctx.rotate(Math.PI / 2); ctx.translate(-(x + CELL / 2), -(y + CELL / 2)); }
  }
  painter(ctx, ch, x, y);
  ctx.restore();
}
function drawGrid(ctx, g, o) {
  const st = o.gstyle || (o.grid === false ? 'none' : 'masu');
  ctx.strokeStyle = '#9bbcb6'; ctx.lineWidth = 1.5;
  if (st === 'masu' || st === 'genko') {
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < o.cols; c++) { const [x, y] = g.cellXY(r, c); ctx.strokeRect(x, y, CELL, CELL); }
    if (st === 'genko') {
      ctx.lineWidth = 2.5;
      if (o.dir === 'yoko') ctx.strokeRect(MARGIN - 6, MARGIN - 6, o.cols * CELL + 12, g.rows * g.P + 12);
      else ctx.strokeRect(g.W - MARGIN - g.rows * g.P - 6, MARGIN - 6, g.rows * g.P + 12, o.cols * CELL + 12);
    }
  } else if (st === 'line') {
    ctx.beginPath();
    for (let r = 0; r <= g.rows; r++) {
      if (o.dir === 'yoko') { const y = MARGIN + r * g.P; ctx.moveTo(MARGIN, y); ctx.lineTo(MARGIN + o.cols * CELL, y); }
      else { const x = g.W - MARGIN - r * g.P; ctx.moveTo(x, MARGIN); ctx.lineTo(x, MARGIN + o.cols * CELL); }
    }
    ctx.stroke();
  }
  if (o.mode === 'hand' && st !== 'none') {
    ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = '#d3e3e0'; ctx.lineWidth = 1;
    for (let r = 0; r < g.rows; r++) for (let c = 0; c < o.cols; c++) {
      const [x, y] = g.cellXY(r, c);
      ctx.beginPath(); ctx.moveTo(x + CELL / 2, y + 4); ctx.lineTo(x + CELL / 2, y + CELL - 4); ctx.moveTo(x + 4, y + CELL / 2); ctx.lineTo(x + CELL - 4, y + CELL / 2); ctx.stroke();
    }
    ctx.restore();
  }
}
// 1ページを かく。ようしが あれば、その おおきさの がめんの まんなかに おく
function renderSheet(cv, o, text, opt = {}) {
  const g = sheetGeom(o, text, opt.page || 0);
  const pp = PAPERS[o.paper] && PAPERS[o.paper].w ? PAPERS[o.paper] : null;
  const pw = pp ? pp.w : g.W, ph = pp ? pp.h : g.H, pm = pp ? 22 : 0;
  const s = pp ? Math.min((pw - 2 * pm) / g.W, (ph - 2 * pm) / g.H) : 1;
  const ox = (pw - g.W * s) / 2, oy = (ph - g.H * s) / 2;
  const k = opt.scale || (pp ? 3 : 2);
  cv.width = Math.round(pw * k); cv.height = Math.round(ph * k);
  cv._pw = pp ? pw : 0; cv._ph = pp ? ph : 0;
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k * s, 0, 0, k * s, k * ox, k * oy);
  drawGrid(ctx, g, o);
  const missing = new Set();
  // ほぞんした さくひんは、ほぞんした ときの もじを つかう（あとで もじを かきなおしても かわらない）
  const glyphs = opt.glyphs || o.glyphs || P().glyphs;
  const fs = CELL * (o.size || 0.72);
  const fontPaint = (family, color) => (c, ch, x, y) => {
    c.fillStyle = color; c.font = `${fs}px ${family}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ch, x + CELL / 2, y + CELL / 2 + CELL * 0.03);
  };
  const box = CELL * (o.size || 0.72) / 0.72 * 0.88, pad = (CELL - Math.min(box, CELL)) / 2;
  const strokePaint = st => (c, _, x, y) => drawStrokes(c, st, x + pad, y + pad, Math.min(box, CELL), CELL * o.weight, '#1b1b1b');
  const glyphPaint = (c, ch, x, y) => {
    const gl = glyphs[ch];
    if (gl && gl.length) strokePaint(gl)(c, ch, x, y);
    else { missing.add(ch); fontPaint('"Klee One",serif', '#c0c8c8')(c, ch, x, y); }
  };
  const hand = opt.hand && !Array.isArray(opt.hand) ? opt.hand : {};
  const bodyPaint = o.mode === 'glyph' ? glyphPaint : o.mode === 'font' ? fontPaint((FONTS[o.font] || FONTS[0])[1], '#1b1b1b') : null;
  g.cells.forEach(({ r, c, ch, n }) => {
    const [x, y] = g.cellXY(r, c);
    if (opt.cur === n && n >= 0 && o.mode === 'hand' && !opt.exporting) { ctx.fillStyle = 'rgba(255,210,63,.45)'; ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2); }
    if (opt.brMode && n >= 0 && (o.breaks || []).includes(n)) {
      ctx.fillStyle = '#d6534d';
      if (o.dir === 'yoko') ctx.fillRect(x - 4, y, 4, CELL); else ctx.fillRect(x, y - 4, CELL, 4);
    }
    if (n < 0) { drawCharCell(ctx, ch, x, y, o, bodyPaint || fontPaint('"Klee One",serif', '#1b1b1b')); return; }
    if (o.mode !== 'hand') { drawCharCell(ctx, ch, x, y, o, bodyPaint); return; }
    const h = hand[n];
    if (h && h.ch === ch && h.s.length) drawCharCell(ctx, ch, x, y, o, strokePaint(h.s));
    else if (o.model && !opt.exporting) drawCharCell(ctx, ch, x, y, o, fontPaint('"Klee One",serif', '#d9e0e0'));
  });
  // まえの かたち（シートに じかに かいた せん）
  if (o.mode === 'hand' && Array.isArray(opt.hand)) drawStrokes(ctx, opt.hand, 0, 0, 1, 6, '#1b1b1b');
  return { geom: g, missing, xf: { ox, oy, s, pw, ph } };
}
// ぜんぶの ページを がぞうに する
// onPage が あれば 1ページずつ わたして（うけとった がわで すぐ かいほう）、メモリを ためない
async function renderPages(o, text, hand, scale, onPage) {
  if (o.mode === 'font') await ensureFont((FONTS[o.font] || FONTS[0])[1]); else await ensureFont('"Klee One"');
  const n = sheetGeom(o, text).pages, out = [];
  try {
    for (let p = 0; p < n; p++) {
      const cv = document.createElement('canvas');
      try { renderSheet(cv, o, text, { hand, exporting: true, page: p, scale }); if (onPage) await onPage(cv); else out.push(cv); }
      catch (e) { cv.width = cv.height = 0; throw e; }
      finally { if (onPage) cv.width = cv.height = 0; }
    }
  } catch (e) { out.forEach(c => { c.width = c.height = 0; }); throw e; }
  return out;
}
async function ensureFont(fam) { try { await document.fonts.load(`40px ${fam}`, 'あ'); } catch (e) {} }

function finText() { return P().doc.join('\n'); }
// てがき：ますの ばんごう → { ch: もじ, s: せん }
function handChars() { if (!P().hand || Array.isArray(P().hand)) P().hand = {}; return P().hand; }
let sheetGeomNow = null, sheetXf = null;
async function drawFinish() {
  saveDB();
  const cv = $('#sheet');
  if (fin.mode === 'font') await ensureFont((FONTS[fin.font] || FONTS[0])[1]);
  else await ensureFont('"Klee One"');
  const pp = PAPERS[fin.paper] && PAPERS[fin.paper].w;
  const res = renderSheet(cv, finO(), finText(), { hand: handChars(), cur: fin.hi, page: fin.page, brMode, scale: pp ? 2 : 2 });
  sheetGeomNow = res.geom; sheetXf = res.xf;
  fin.page = res.geom.page;
  const wrapW = $('.sheetwrap').clientWidth - 24;
  const cssW = Math.min(res.xf.pw * (pp ? 1.6 : 1), wrapW);
  cv.style.width = cssW + 'px'; cv.style.height = (cssW * res.xf.ph / res.xf.pw) + 'px';
  $('#pgNav').hidden = res.geom.pages < 2;
  $('#pgLabel').textContent = `${res.geom.page + 1} / ${res.geom.pages} ページ`;
  $('#btnPgPrev').disabled = res.geom.page <= 0; $('#btnPgNext').disabled = res.geom.page >= res.geom.pages - 1;
  const mi = $('#missingInfo'), msgs = [];
  if (!finText()) msgs.push('①で ぶんを つくると ここに でます。');
  if (fin.mode === 'glyph' && res.missing.size) msgs.push('まだ とうろくしていない もじ（うすく でています）：' + [...res.missing].join(' ') + '　→「もじとうろく」で かこう');
  if (res.geom.pages > 1) msgs.push(`ぎょうすうに おさまらないので ${res.geom.pages}ページに なります（PDF では ぜんぶの ページが はいります）。`);
  mi.textContent = msgs.join('　');
  $('#snapRow').hidden = !finSnap();
}
// ひらいた さくひんの「ほぞんした ときの もじ・なまえ」。ぶんしょうが かわったら（あたらしい さくひん）つかわない
function finSnap() { const s = fin.snap; if (s && s.text !== finText()) delete fin.snap; return fin.snap || null; }
function finO() {
  const s = finSnap(); if (!s) return fin;
  // ほぞんした ときに なかった もじは、あとで とうろくしても まぜない（いちらん・PDF と おなじ みえかた）
  return Object.assign({}, fin, { nameText: s.nameText, glyphs: s.glyphs || undefined });
}
function renderFinish() {
  const ml = SH().modes, mf = Array.isArray(ml) ? MODE_IDS.filter(m => ml.includes(m)) : MODE_IDS;
  const modesOk = !isStudent() ? MODE_IDS : mf.length ? mf : [SHOW_MIN.mode];
  if (!modesOk.includes(fin.mode)) fin.mode = modesOk[0];
  $$('.mode').forEach(b => { b.hidden = !modesOk.includes(b.dataset.m); b.classList.toggle('on', b.dataset.m === fin.mode); b.setAttribute('aria-pressed', b.dataset.m === fin.mode ? 'true' : 'false'); });
  $('#handTools').hidden = fin.mode !== 'hand';
  $('#lblFont').hidden = fin.mode !== 'font';
  $('#lblWeight').hidden = fin.mode === 'font';
  const fill = (sel, items) => { const s = $(sel); if (!s.options.length) items.forEach(([v, t]) => s.append(el('option', { value: v }, t))); };
  fill('#optUse', Object.entries(USES).map(([k, u]) => [k, u.n]));
  fill('#optPaper', Object.entries(PAPERS).map(([k, p]) => [k, p.n]));
  fill('#optCols', [4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 25].map(n => [n, n + 'もじ']));
  fill('#optRows', [[0, 'じどう']].concat([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => [n, n + 'ぎょう'])));
  fill('#optGstyle', Object.entries(GSTYLES));
  fill('#optFont', FONTS.map((f, i) => [i, f[0]]));
  [['#optUse', 'use'], ['#optPaper', 'paper'], ['#optDir', 'dir'], ['#optCols', 'cols'], ['#optRows', 'rows'], ['#optGstyle', 'gstyle'], ['#optSize', 'size'], ['#optFont', 'font'], ['#optWeight', 'weight']]
    .forEach(([s, k]) => { $(s).value = String(fin[k]); });
  $('#optName').checked = fin.name; $('#optSentBreak').checked = fin.sentBreak !== false;
  $('#optTitle').value = fin.title || '';
  $('#optModel').checked = fin.model; $('#optPenOnly').checked = fin.penOnly;
  $('#btnBrMode').classList.toggle('on', brMode); $('#btnBrMode').setAttribute('aria-pressed', brMode ? 'true' : 'false');
  $('#brHint').hidden = !brMode;
  drawFinish(); renderWorks();
  if (fin.mode === 'hand') renderHandPad();
}
$$('.mode').forEach(b => b.addEventListener('click', () => { fin.mode = b.dataset.m; renderFinish(); }));
const afterOpt = () => { drawFinish(); if (fin.mode === 'hand') renderHandPad(); };
$('#optUse').addEventListener('change', e => {
  fin.use = e.target.value;
  const u = USES[fin.use];
  ['paper', 'dir', 'cols', 'rows', 'gstyle', 'size'].forEach(k => { if (u[k] !== undefined) fin[k] = u[k]; });
  fin.page = 0; renderFinish();
});
[['#optPaper', 'paper', v => v], ['#optDir', 'dir', v => v], ['#optCols', 'cols', v => +v], ['#optRows', 'rows', v => +v], ['#optGstyle', 'gstyle', v => v], ['#optSize', 'size', v => +v], ['#optFont', 'font', v => +v], ['#optWeight', 'weight', v => +v]]
  .forEach(([s, k, f]) => $(s).addEventListener('change', e => { fin[k] = f(e.target.value); fin.page = 0; afterOpt(); }));
[['#optName', 'name'], ['#optSentBreak', 'sentBreak'], ['#optModel', 'model'], ['#optPenOnly', 'penOnly']]
  .forEach(([s, k]) => $(s).addEventListener('change', e => { fin[k] = e.target.checked; afterOpt(); }));
$('#optTitle').addEventListener('input', e => { fin.title = normText(e.target.value); afterOpt(); });
$('#btnBrMode').addEventListener('click', () => { brMode = !brMode; renderFinish(); });
$('#btnBrReset').addEventListener('click', () => { fin.breaks = []; afterOpt(); toast('かいぎょうを もとに もどしました'); });
$('#btnPgPrev').addEventListener('click', () => { fin.page--; drawFinish(); });
$('#btnPgNext').addEventListener('click', () => { fin.page++; drawFinish(); });

// てがき：1もじずつ かく パッド
const PADN = 300;
let padStrokes = [];
const handCells = () => sheetGeom(finO(), finText()).allCells;
// わくを がめんに あわせて できるだけ おおきく する（ねばりを なくすため こまかい がそで）
function fitBigCanvas(cv, reserve) {
  const size = Math.max(200, Math.floor(Math.min(window.innerWidth - 36, window.innerHeight - reserve - 30)));
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = cv.style.height = size + 'px';
  cv.width = cv.height = Math.round(size * dpr);
}
function openHandFull(open) {
  $('#handFull').hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) { renderHandPad(); fitBigCanvas($('#handPad'), $('#handFull .padbar').offsetHeight); paintPad(); }
  else drawFinish();
}
function renderHandPad() {
  const cells = handCells();
  if (!cells.length) { $('#handCh').textContent = ''; $('#handPos').textContent = $('#handPos2').textContent = '①で ぶんを つくってね'; return; }
  fin.hi = Math.min(Math.max(fin.hi || 0, 0), cells.length - 1);
  const cell = cells[fin.hi], h = handChars()[fin.hi];
  padStrokes = h && h.ch === cell.ch ? h.s.map(s => s.slice()) : [];
  $('#handCh').textContent = cell.ch;
  const done = cells.filter(c => { const x = handChars()[c.n]; return x && x.ch === c.ch && x.s.length; }).length;
  $('#handPos').textContent = $('#handPos2').textContent = `${fin.hi + 1}もじめ ／ ${cells.length}もじ（かいた もじ ${done}）`;
  // いま かいている ぎょうを みせる
  const ctx = $('#handCtx'); ctx.innerHTML = '';
  if (fin.page !== cell.page) { fin.page = cell.page; drawFinish(); }
  cells.filter(c => c.page === cell.page && c.r === cell.r).forEach(c => ctx.append(el('span', { class: c.n === fin.hi ? 'cur' : c.n < fin.hi ? 'dn' : '' }, c.ch)));
  $('#btnHandPrev').disabled = fin.hi <= 0;
  paintPad();
}
function paintPad(live) {
  const cv = $('#handPad'), ctx = cv.getContext('2d');
  const sc = cv.width / PADN;
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PADN, PADN);
  ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = '#c9dcd8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PADN / 2, 0); ctx.lineTo(PADN / 2, PADN); ctx.moveTo(0, PADN / 2); ctx.lineTo(PADN, PADN / 2); ctx.stroke(); ctx.restore();
  const ch = $('#handCh').textContent;
  if (fin.model && ch) {
    ctx.fillStyle = '#e3eae9'; ctx.font = `${PADN * 0.8}px "Klee One",serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, PADN / 2, PADN / 2 + PADN * 0.03);
  }
  const lw = PADN * fin.weight;
  drawStrokes(ctx, padStrokes, 0, 0, PADN, lw, '#1b1b1b');
  if (live) drawStrokes(ctx, [live], 0, 0, PADN, lw, '#1b1b1b');
}
function savePad() {
  const cells = handCells(); const cell = cells[fin.hi]; if (!cell) return;
  if (padStrokes.length) handChars()[fin.hi] = { ch: cell.ch, s: padStrokes.map(s => s.slice()) };
  else delete handChars()[fin.hi];
  saveDB(); drawFinish();
}
(() => { const cv = $('#handPad'); cv.width = PADN * 2; cv.height = PADN * 2; })();
attachDraw($('#handPad'), {
  toLogical: (fx, fy) => [fx, fy],
  penOnly: () => fin.penOnly,
  count: () => padStrokes.length,
  onDraw: pts => paintPad(pts),
  onEnd: pts => { padStrokes.push(simplify(pts, 0.006)); paintPad(); savePad(); },
});
function goHand(d) {
  savePad();
  const n = handCells().length;
  if (d > 0 && fin.hi >= n - 1) { toast('ぜんぶ かけたね！'); openHandFull(false); renderHandPad(); return; }
  fin.hi += d; renderHandPad(); drawFinish();
}
$('#btnHandOpen').addEventListener('click', () => openHandFull(true));
$('#btnHandSpeak').addEventListener('click', () => speak($('#handCh').textContent));
$('#btnHandClose').addEventListener('click', () => { savePad(); openHandFull(false); });
window.addEventListener('resize', () => { if (!$('#handFull').hidden) { fitBigCanvas($('#handPad'), $('#handFull .padbar').offsetHeight); paintPad(); } });
$('#btnHandNext').addEventListener('click', () => goHand(1));
$('#btnHandPrev').addEventListener('click', () => goHand(-1));
$('#btnHandUndo').addEventListener('click', () => { padStrokes.pop(); paintPad(); savePad(); });
$('#btnHandErase').addEventListener('click', () => { padStrokes = []; paintPad(); savePad(); });
$('#btnHandClear').addEventListener('click', function () {
  if (this.dataset.c !== '1') { this.dataset.c = '1'; this.textContent = 'ほんとうに けす？'; setTimeout(() => { this.dataset.c = ''; this.textContent = 'ぜんぶ けす'; }, 3000); return; }
  P().hand = {}; fin.hi = 0; saveDB(); this.dataset.c = ''; this.textContent = 'ぜんぶ けす'; renderFinish();
});
// シートの ますを タップすると その もじへ
// かいぎょうモードの ときは、タップした もじの まえで かいぎょう（もういちど タップで もとに もどる）
$('#sheet').addEventListener('click', e => {
  if (!sheetGeomNow || !sheetXf) return;
  if (fin.mode !== 'hand' && !brMode) return;
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * sheetXf.pw, py = (e.clientY - r.top) / r.height * sheetXf.ph;
  const x = (px - sheetXf.ox) / sheetXf.s, y = (py - sheetXf.oy) / sheetXf.s;
  const hit = sheetGeomNow.cells.find(c => { const [cx, cy] = sheetGeomNow.cellXY(c.r, c.c); return c.n >= 0 && x >= cx && x < cx + CELL && y >= cy && y < cy + CELL; });
  if (!hit) return;
  if (brMode) {
    const b = new Set(fin.breaks || []);
    b.has(hit.n) ? b.delete(hit.n) : b.add(hit.n);
    fin.breaks = [...b].sort((a, z) => a - z); drawFinish(); return;
  }
  savePad(); fin.hi = hit.n; openHandFull(true);
});
window.addEventListener('resize', () => { if (currentView === 'finish') drawFinish(); });

// がぞう・いんさつ・ほぞん
// ダイアログ：よみあげ ソフトに ダイアログと つたえ、ひらいたら なかの ボタンへ、とじたら もとの ボタンへ フォーカスを もどす
let modalSeq = 0;
function openModal(...kids) {
  const prev = document.activeElement, box = el('div', { class: 'box' }, ...kids);
  const m = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', onclick: e => { if (e.target === m) m.remove(); } }, box);
  const title = box.querySelector('.regtitle');
  if (title) { title.id = title.id || 'mdl' + (++modalSeq); m.setAttribute('aria-labelledby', title.id); }
  const focusables = () => [...box.querySelectorAll('button,input,select,textarea,[tabindex]')].filter(x => !x.disabled && x.offsetParent !== null);
  m.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); m.remove(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  m.remove = () => { HTMLElement.prototype.remove.call(m); if (prev && prev.isConnected && prev.focus) prev.focus({ preventScroll: true }); };
  document.body.append(m);
  const f = focusables(); (box.querySelector('.btn.main') || f[0] || box).focus({ preventScroll: true });
  return m;
}
