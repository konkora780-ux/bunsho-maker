
// ===== 線をえがく共通処理 =====
function drawStrokes(ctx, strokes, ox, oy, size, lw, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of strokes) {
    const pts = s.p || s;
    if (!pts.length) continue;
    if (s.c) { ctx.strokeStyle = s.c; ctx.fillStyle = s.c; }
    if (s.w) ctx.lineWidth = s.w;
    const X = i => ox + pts[i][0] * size, Y = i => oy + pts[i][1] * size;
    if (pts.length === 1) { ctx.beginPath(); ctx.arc(X(0), Y(0), ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
    ctx.lineTo(X(pts.length - 1), Y(pts.length - 1));
    ctx.stroke();
  }
  ctx.restore();
}
// 指・ペンで かく（logical: 画面座標→論理座標）
function attachDraw(cv, o) {
  let cur = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return o.toLogical((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
  cv.addEventListener('pointerdown', e => {
    if (o.penOnly && o.penOnly() && e.pointerType === 'touch') return;
    // かいている とちゅうに べつの ゆび・てのひらが ふれても、いまの せんを つづける。
    // ただし ゆび（てのひら）の あとに ペンが きたら、ゆびの せんを すてて ペンに する
    if (cur && cur.id !== e.pointerId) {
      if (!(e.pointerType === 'pen' && cur.type !== 'pen')) return;
      cur = null; o.onDraw(null);
    }
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    cur = { id: e.pointerId, type: e.pointerType, pts: [pos(e)] };
    o.onStart && o.onStart(cur.pts[0]);
    o.onDraw(cur.pts);
  });
  cv.addEventListener('pointermove', e => {
    if (!cur || e.pointerId !== cur.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => cur.pts.push(pos(ev)));
    o.onDraw(cur.pts);
  });
  const end = e => { if (!cur || e.pointerId !== cur.id) return; o.onEnd(cur.pts); cur = null; };
  cv.addEventListener('pointerup', end);
  // システムに とめられた（てのひら・ジェスチャー・かいてん）せんは のこさない
  cv.addEventListener('pointercancel', e => { if (!cur || e.pointerId !== cur.id) return; cur = null; o.onDraw(null); });
}
const r3 = v => Math.round(v * 1000) / 1000;
function simplify(pts, minD) {
  const out = [pts[0]];
  for (const p of pts) { const q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= minD) out.push(p); }
  if (pts.length > 1) out.push(pts[pts.length - 1]);
  return out.map(p => [r3(p[0]), r3(p[1])]);
}

