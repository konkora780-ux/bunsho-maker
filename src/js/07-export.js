// ===== パソコンへ おくる（PDF・がぞう） =====
// iPad は プリンタに つながないので、PDF や がぞうに して AirDrop・ファイル・Google ドライブ などで わたす
function fileBase(name) {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${name || P().name}_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
}
function dataURLBytes(u) { const b = atob(u.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
// がぞうを 1まいずつ A4 に はった PDF を つくる（よこながの ものは A4 よこ）
function makePDF(cvs) {
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${cvs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${cvs.length} >>`));
  cvs.forEach((cv, i) => {
    // ようしが きまって いれば その おおきさの ページ、なければ A4 に おさめる
    const land = cv.width > cv.height, PW = cv._pw || (land ? 842 : 595), PH = cv._ph || (land ? 595 : 842), M = cv._pw ? 0 : 28;
    const s = Math.min((PW - 2 * M) / cv.width, (PH - 2 * M) / cv.height);
    const w = cv.width * s, h = cv.height * s, x = (PW - w) / 2, y = (PH - h) / 2;
    const jpg = dataURLBytes(cv.toDataURL('image/jpeg', 0.92));
    obj(3 + 3 * i, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${5 + 3 * i} 0 R >> >> /Contents ${4 + 3 * i} 0 R >>`));
    const c = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(PH - y - h).toFixed(2)} cm /Im0 Do Q`;
    obj(4 + 3 * i, () => push(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`));
    obj(5 + 3 * i, () => { push(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
  });
  const total = 3 + 3 * cvs.length, xref = len;
  push(`xref\n0 ${total}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
function sendFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    // じぶんで やめた ときは なにも しない。それ いがいの しっぱいは しらせて、ほかの ほぞん ほうほうを だす
    navigator.share({ files: [file], title: file.name }).catch(e => {
      if (e && e.name === 'AbortError') return;
      const m = openModal(el('div', { class: 'regtitle' }, '⚠ おくれませんでした'),
        el('p', { class: 'hint' }, 'きょうゆうが うまく いきませんでした。かわりに ファイルとして ほぞんできます（「ファイル」アプリの「ダウンロード」に はいります）。'),
        el('div', { class: 'row' }, el('button', { class: 'btn main', onclick: () => { m.remove(); saveFile(file); } }, '📥 ファイルとして ほぞん'), el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる')));
    });
  } else {
    saveFile(file);
  }
}
// ダウンロードは にほんごの なまえだと なまえが きえる ブラウザが あるので、えいすうじの なまえに する
function saveFile(file) {
  const ext = file.name.split('.').pop(), d = fileBase('x').slice(2);
  const a = el('a', { href: URL.createObjectURL(file), download: `bunsho_${d}.${ext}` });
  document.body.append(a); a.click(); a.remove();
}
function openSendModal(cvs, base) {
  const pdf = new File([makePDF(cvs)], base + '.pdf', { type: 'application/pdf' });
  const btns = el('div', { class: 'row', style: 'justify-content:center' });
  const kids = [el('div', { class: 'regtitle' }, '📤 パソコンへ おくる')];
  if (cvs.length === 1) kids.push(el('img', { class: 'imgout', src: cvs[0].toDataURL('image/png'), alt: 'しあがった ぶんしょう' }));
  else kids.push(el('p', { class: 'hint' }, `${cvs.length}まいの さくひんを 1つの PDF に まとめました。`));
  kids.push(btns);
  kids.push(el('div', { class: 'hint', style: 'max-width:560px;line-height:1.7' },
    '【おくりかた】「おくる」を おすと iPad の きょうゆう がめんが でます。',
    el('br'), '・Mac へ：AirDrop', el('br'), '・Windows パソコンへ：「ファイルに保存」で Google ドライブ や OneDrive を えらぶ／Teams・メールで おくる',
    el('br'), '・USBメモリへ：「ファイルに保存」で USB を えらぶ', el('br'), 'パソコンで PDF を ひらいて いんさつすると、A4 に おさまります。'));
  const m = openModal(...kids);
  if (IN_FRAME) {
    btns.append(el('p', { class: 'hint' }, 'がぞうを ながおし →「“写真”に保存」で ほぞんできます。'), el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる'));
    return;
  }
  btns.append(el('button', { class: 'btn main', onclick: () => sendFile(pdf) }, '📤 PDF で おくる'));
  // iPad は キャンバスの メモリが すくないので、つかいおわったら すぐ かいほう する
  const release = () => cvs.forEach(c => { c.width = c.height = 0; });
  if (cvs.length !== 1) release();
  if (cvs.length === 1) cvs[0].toBlob(blob => {
    release();
    const png = new File([blob], base + '.png', { type: 'image/png' });
    btns.insertBefore(el('button', { class: 'btn', onclick: () => sendFile(png) }, '📤 がぞう（PNG）で おくる'), btns.children[1] || null);
    btns.insertBefore(el('button', { class: 'btn small', onclick: () => saveFile(png) }, '⬇ がぞうを ダウンロード'), btns.lastChild);
  });
  btns.append(el('button', { class: 'btn small', onclick: () => saveFile(pdf) }, '⬇ PDF を ダウンロード'));
  btns.append(el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる'));
}
$('#btnImage').addEventListener('click', async () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  openSendModal(await renderPages(finO(), finText(), handChars()), fileBase());
});
$('#btnPrint').addEventListener('click', async () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  const cvs = await renderPages(finO(), finText(), handChars());
  const pa = $('#printArea'); pa.innerHTML = '';
  cvs.forEach(cv => pa.append(el('img', { src: cv.toDataURL('image/png'), alt: '', style: 'page-break-after:always' })));
  setTimeout(() => window.print(), 300);
});
$('#btnSaveWork').addEventListener('click', () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  // ほぞんした ときの もじ・なまえを さくひんに いれておく（あとで かえても さくひんは かわらない）
  const o = finO(), w = Object.assign({ id: 'w' + Date.now(), date: new Date().toISOString(), text: finText(), conn: !!P().conn }, clone(fin));
  delete w.snap;
  w.nameText = o.nameText || P().name;
  if (fin.mode === 'glyph') {
    const src = o.glyphs || P().glyphs, used = new Set([...w.text, ...(fin.title || ''), ...w.nameText]), g = {};
    used.forEach(c => { if (src[c]) g[c] = src[c]; });
    w.glyphs = clone(g);
  }
  if (fin.mode === 'hand') w.hand = JSON.parse(JSON.stringify(handChars()));
  P().works.unshift(w);
  if (saveDB()) { toast('ほぞんしました'); renderWorks(); } else P().works.shift();
});
const MODE_NAME = { glyph: 'じぶんのもじ', font: 'iPadのもじ', hand: 'てがき' };
const selWorks = new Set();
function updWorksBtn() { const n = P().works.filter(w => selWorks.has(w.id)).length; $('#btnWorksPDF').disabled = !n; $('#btnWorksPDF').textContent = `📤 えらんだ ${n}こを PDF に まとめて おくる`; }
$('#btnWorksPDF').addEventListener('click', async () => {
  const ws = P().works.filter(w => selWorks.has(w.id)); if (!ws.length) return;
  const cvs = [];
  for (const w of ws) cvs.push(...await renderPages(w, w.text, w.hand));
  openSendModal(cvs, fileBase() + '_まとめ');
});
$('#btnWorksAll').addEventListener('click', () => { const all = P().works.every(w => selWorks.has(w.id)); P().works.forEach(w => all ? selWorks.delete(w.id) : selWorks.add(w.id)); renderWorks(); });
function renderWorks() {
  const box = $('#works'); box.innerHTML = '';
  const d = P().draft;
  $('#draftRow').hidden = !d;
  if (d) { const t = new Date(d.date); $('#draftInfo').textContent = `したがき（${t.getMonth() + 1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}）：${(d.doc.join('') || '（てがきだけ）').slice(0, 20)}…`; }
  const ws = P().works;
  updWorksBtn();
  if (!ws.length) { box.append(el('div', { class: 'hint' }, 'まだ ありません。')); return; }
  ws.forEach((w, i) => {
    const cv = document.createElement('canvas');
    renderSheet(cv, w, w.text, { hand: w.hand, exporting: true, scale: PAPERS[w.paper] && PAPERS[w.paper].w ? 0.4 : 0.5 });
    const d = new Date(w.date);
    const del = el('button', { class: 'btn small warn tonly' }, 'けす');
    del.addEventListener('click', () => {
      if (del.dataset.c !== '1') { del.dataset.c = '1'; del.textContent = 'ほんとう？'; setTimeout(() => { del.dataset.c = ''; del.textContent = 'けす'; }, 3000); return; }
      ws.splice(i, 1); saveDB(); renderWorks();
    });
    const pickCb = el('input', { type: 'checkbox', 'aria-label': 'えらぶ' });
    pickCb.checked = selWorks.has(w.id);
    pickCb.addEventListener('change', () => { pickCb.checked ? selWorks.add(w.id) : selWorks.delete(w.id); updWorksBtn(); });
    box.append(el('div', { class: 'work' }, el('label', { class: 'hint tonly' }, pickCb, ' えらぶ'), cv,
      el('div', { class: 'meta' }, `${d.getMonth() + 1}がつ${d.getDate()}にち ・ ${MODE_NAME[w.mode]}`),
      el('div', { class: 'row' },
        el('button', { class: 'btn small', onclick: () => openWork(w) }, 'ひらく'), del)));
  });
}
// いまの さぎょう（ぶんしょう・てがき・しあげ・つくりかた・くぎり・じゅんじょの ことば）を まとめて とる／もどす
const WORK_KEYS = ['docSrc', 'conn', 'cuts', 'cutsText', 'docIds'];
function takeState() {
  const p = P(), st = { date: new Date().toISOString(), doc: p.doc.slice(), hand: clone(handChars()), fin: clone(fin) };
  WORK_KEYS.forEach(k => { if (p[k] !== undefined) st[k] = clone(p[k]); });
  return st;
}
function putState(st) {
  const p = P();
  p.doc = st.doc.slice(); p.hand = clone(st.hand || {});
  WORK_KEYS.forEach(k => { if (st[k] !== undefined) p[k] = clone(st[k]); else delete p[k]; });
  fin = p.fin = Object.assign({}, FIN_DEF, clone(st.fin)); fin.hi = 0; fin.page = 0;
  if (mk.editIdx != null) delete mk.editIdx;
}
function openWork(w) {
  // ひらく まえに、いまの ないようを したがきに のこす（あとで もどせる）
  const before = takeState(), oldDraft = P().draft;
  if (P().doc.length || Object.keys(handChars()).length) P().draft = before;
  P().doc = w.text.split('\n'); P().conn = !!w.conn; delete P().docIds;
  Object.keys(FIN_DEF).forEach(k => { if (w[k] !== undefined && k !== 'hi') fin[k] = clone(w[k]); });
  fin.page = 0; fin.hi = 0;
  // ほぞんした ときの もじ・なまえで ひらく（ぶんしょうを かえるまで）
  fin.snap = { id: w.id, text: w.text, nameText: w.nameText || P().name, glyphs: w.glyphs ? clone(w.glyphs) : null };
  P().hand = w.hand && !Array.isArray(w.hand) ? clone(w.hand) : {};
  if (!saveDB()) { putState(before); if (oldDraft) P().draft = oldDraft; else delete P().draft; renderFinish(); return toast('ほぞんする ばしょが たりず、ひらけませんでした'); }
  renderFinish(); window.scrollTo(0, 0); toast(P().draft === before ? 'ひらきました（まえの ないようは したがきに のこしました）' : 'ひらきました');
}
function restoreDraft() {
  const d = P().draft; if (!d) return;
  // いまの ないようと いれかえる（もういちど おすと もとに もどる）
  const now = takeState();
  putState(d); P().draft = now;
  if (!saveDB()) { putState(now); P().draft = d; renderFinish(); return toast('ほぞんする ばしょが たりず、もどせませんでした'); }
  renderFinish(); toast('したがきに もどしました');
}
$('#btnSnapOff').addEventListener('click', () => { delete fin.snap; saveDB(); renderFinish(); });
$('#btnDraft').addEventListener('click', restoreDraft);

