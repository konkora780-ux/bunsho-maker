// ===== パソコンへ おくる（PDF・がぞう） =====
// iPad は プリンタに つながないので、PDF や がぞうに して AirDrop・ファイル・Google ドライブ などで わたす
function fileBase(name) {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return `${name || P().name}_${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
}
function dataURLBytes(u) { const b = atob(u.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
// キャンバスを PDF の 1ページぶんの JPEG に する（このあと キャンバスは かいほう できる）
function cvToPage(cv) { return { jpg: dataURLBytes(cv.toDataURL('image/jpeg', 0.92)), w: cv.width, h: cv.height, pw: cv._pw, ph: cv._ph }; }
// がぞうを 1まいずつ はった PDF を つくる（ようしが なければ A4。よこながの ものは A4 よこ）
function makePDF(list) {
  const cvs = list.map(x => x.jpg ? x : cvToPage(x));
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const push = d => { const b = typeof d === 'string' ? enc.encode(d) : d; parts.push(b); len += b.length; };
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body(); push('\nendobj\n'); };
  push('%PDF-1.4\n');
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Kids [${cvs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${cvs.length} >>`));
  cvs.forEach((cv, i) => {
    // ようしが きまって いれば その おおきさの ページ、なければ A4 に おさめる
    const land = cv.w > cv.h, PW = cv.pw || (land ? 842 : 595), PH = cv.ph || (land ? 595 : 842), M = cv.pw ? 0 : 28;
    const s = Math.min((PW - 2 * M) / cv.w, (PH - 2 * M) / cv.h);
    const w = cv.w * s, h = cv.h * s, x = (PW - w) / 2, y = (PH - h) / 2;
    const jpg = cv.jpg;
    obj(3 + 3 * i, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${5 + 3 * i} 0 R >> >> /Contents ${4 + 3 * i} 0 R >>`));
    const c = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(PH - y - h).toFixed(2)} cm /Im0 Do Q`;
    obj(4 + 3 * i, () => push(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`));
    obj(5 + 3 * i, () => { push(`<< /Type /XObject /Subtype /Image /Width ${cv.w} /Height ${cv.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); push(jpg); push('\nendstream'); });
  });
  const total = 3 + 3 * cvs.length, xref = len;
  push(`xref\n0 ${total}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
function sendFile(file, part) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    // じぶんで やめた ときは なにも しない。それ いがいの しっぱいは しらせて、ほかの ほぞん ほうほうを だす
    navigator.share({ files: [file], title: file.name }).catch(e => {
      if (e && e.name === 'AbortError') return;
      const m = openModal(el('div', { class: 'regtitle' }, '⚠ おくれませんでした'),
        el('p', { class: 'hint' }, 'きょうゆうが うまく いきませんでした。かわりに ファイルとして ほぞんできます（ふつうは「ファイル」アプリの「ダウンロード」に はいります）。'),
        el('div', { class: 'row' }, el('button', { class: 'btn main', onclick: () => { m.remove(); saveFile(file, part); } }, '📥 ファイルとして ほぞん'), el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる')));
    });
  } else {
    saveFile(file, part);
  }
}
// ダウンロードは にほんごの なまえだと なまえが きえる ブラウザが あるので、えいすうじの なまえに する
// part：わけた PDF の ばんごう（1・2…）。なまえに のこす。おなじ ふんに なんども ほぞん しても かさならないよう びょうも いれる
function saveFile(file, part) {
  const ext = file.name.split('.').pop();
  const d = fileBase('x').slice(2) + String(new Date().getSeconds()).padStart(2, '0'), url = URL.createObjectURL(file);
  const a = el('a', { href: url, download: `bunsho_${d}${part ? '_' + part : ''}.${ext}` });
  document.body.append(a); a.click(); a.remove();
  // ダウンロードが はじまる じかんを おいてから てばなす（すぐ けすと Safari で ほぞんできない ことが ある）
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// ページが おおい ときは、iPad の メモリと おくる おおきさを かんがえて いくつかの PDF に わける
// 30ページ たまる たびに PDF に して、ページの JPEG は すぐ てばなす
const PDF_MAX = 30;
function pdfBuilder(base) {
  let chunk = [], count = 0;
  const blobs = [], flush = () => { if (chunk.length) { blobs.push(makePDF(chunk)); chunk = []; } };
  return {
    add(cv) { chunk.push(cv.jpg ? cv : cvToPage(cv)); count++; if (chunk.length === PDF_MAX) flush(); },
    done() {
      flush();
      return { count, files: blobs.map((b, i) => new File([b], base + (blobs.length > 1 ? `_${i + 1}` : '') + '.pdf', { type: 'application/pdf' })) };
    }
  };
}
// out = { count: ページの かず, files: PDF, one: 1ページだけの ときの キャンバス（がぞうも だす） }
function openSendModal(out, base) {
  const pdfs = out.files, one = out.one || null;
  const btns = el('div', { class: 'row', style: 'justify-content:center' });
  const kids = [el('div', { class: 'regtitle' }, '📤 パソコンへ おくる')];
  if (one) kids.push(el('img', { class: 'imgout', src: one.toDataURL('image/png'), alt: 'しあがった ぶんしょう' }));
  else kids.push(el('p', { class: 'hint' }, `${out.count}ページを PDF に しました。` + (pdfs.length > 1 ? `ページが おおいので ${pdfs.length}つの PDF に わけました。` : '')));
  kids.push(btns);
  kids.push(el('div', { class: 'hint', style: 'max-width:560px;line-height:1.7' },
    '【おくりかた】「おくる」を おすと iPad の きょうゆう がめんが でます。',
    el('br'), '・Mac へ：AirDrop', el('br'), '・Windows パソコンへ：「ファイルに保存」で Google ドライブ や OneDrive を えらぶ／Teams・メールで おくる',
    el('br'), '・USBメモリへ：「ファイルに保存」で USB を えらぶ', el('br'),
    'ようしを えらんだ ときは、その おおきさの PDF です。パソコンで いんさつ するときに「じっさいの サイズ（100%）」を えらぶと その おおきさで、「ようしに あわせる」を えらぶと A4 などの ようしに あわせて でます。ようしを えらばない ときは A4 に おさまります。'));
  const m = openModal(...kids);
  // iPad は キャンバスの メモリが すくないので、つかいおわったら すぐ かいほう する
  const release = () => { if (one) one.width = one.height = 0; };
  if (IN_FRAME) {
    release();
    btns.append(el('p', { class: 'hint' }, 'がぞうを ながおし →「“写真”に保存」で ほぞんできます。'), el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる'));
    return;
  }
  pdfs.forEach((f, i) => btns.append(el('button', { class: 'btn main', onclick: () => sendFile(f, pdfs.length > 1 ? i + 1 : 0) }, pdfs.length > 1 ? `📤 PDF ${i + 1}/${pdfs.length} を おくる` : '📤 PDF で おくる')));
  if (one) one.toBlob(blob => {
    release();
    // がぞうに できなかった ときは、PDF だけに する（できた ことに しない）
    if (!blob) { btns.insertBefore(el('p', { class: 'hint' }, 'がぞう（PNG）は つくれませんでした。PDF で おくってください。'), btns.firstChild); return; }
    const png = new File([blob], base + '.png', { type: 'image/png' });
    btns.insertBefore(el('button', { class: 'btn', onclick: () => sendFile(png) }, '📤 がぞう（PNG）で おくる'), btns.children[1] || null);
    btns.insertBefore(el('button', { class: 'btn small', onclick: () => saveFile(png) }, '⬇ がぞうを ダウンロード'), btns.lastChild);
  });
  pdfs.forEach((f, i) => btns.append(el('button', { class: 'btn small', onclick: () => saveFile(f, pdfs.length > 1 ? i + 1 : 0) }, pdfs.length > 1 ? `⬇ PDF ${i + 1} を ダウンロード` : '⬇ PDF を ダウンロード')));
  btns.append(el('button', { class: 'btn', onclick: () => m.remove() }, 'とじる'));
}
// しあげを PDF に する。1ページなら がぞうも だすので キャンバスを のこし、2ページ いじょうは 1ページずつ てばなす
async function finishPDF(o, text, hand, base) {
  const pb = pdfBuilder(base);
  if (sheetGeom(o, text).pages === 1) {
    const [cv] = await renderPages(o, text, hand);
    // JPEG・PDF に できなかった ときも キャンバスを てばなす
    try { pb.add(cv); return Object.assign(pb.done(), { one: cv }); } catch (e) { cv.width = cv.height = 0; throw e; }
  }
  await renderPages(o, text, hand, undefined, cv => pb.add(cv));
  return pb.done();
}
// おした ときの しあげ・なまえ・もじ・てがきを ふかく うつして つかう（つくって いる あいだに かえても まざらない）
function fixedFin() {
  const o = clone(finO());
  o.nameText = o.nameText || P().name;
  if (o.mode === 'glyph' && !o.glyphs) o.glyphs = clone(P().glyphs);
  return { o, text: finText(), hand: clone(handChars()) };
}
$('#btnImage').addEventListener('click', async () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  const base = fileBase(), f = fixedFin();
  let out = null;
  try { out = await finishPDF(f.o, f.text, f.hand, base); openSendModal(out, base); }
  catch (e) { if (out && out.one) out.one.width = out.one.height = 0; toast('PDF を つくれませんでした。もういちど ためしてください（ぶんしょうは きえていません）'); }
});
$('#btnPrint').addEventListener('click', async () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  const pa = $('#printArea'), f = fixedFin(); pa.innerHTML = '';
  try { await renderPages(f.o, f.text, f.hand, undefined, cv => { pa.append(el('img', { src: cv.toDataURL('image/png'), alt: '', style: 'page-break-after:always' })); }); }
  catch (e) { pa.innerHTML = ''; return toast('いんさつの じゅんびが できませんでした。もういちど ためしてください'); }
  setTimeout(() => window.print(), 300);
});
$('#btnSaveWork').addEventListener('click', () => {
  if (!finText()) return toast('①で ぶんを つくってね');
  // ほぞんした ときの もじ・なまえを さくひんに いれておく（あとで かえても さくひんは かわらない）
  const o = finO(), w = Object.assign({ id: 'w' + Date.now(), date: new Date().toISOString(), text: finText(), conn: !!P().conn }, clone(fin));
  delete w.snap;
  // さくひんには みえて いる もじ（ひらがな／カタカナ）で のこす
  w.title = o.title; w.nameText = o.nameText || P().name;
  if (fin.mode === 'glyph') {
    const src = o.glyphs || P().glyphs, used = new Set([...w.text, ...w.title, ...w.nameText]), g = {};
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
  // はじめた ときの さくひん・なまえ・もじで つくる（とちゅうで ひとを かえても まざらない）
  const p = P(), base = fileBase() + '_まとめ', pg = clone(p.glyphs);
  const ws = p.works.filter(w => selWorks.has(w.id)).map(w => Object.assign(clone(w), { nameText: w.nameText || p.name, glyphs: w.glyphs ? clone(w.glyphs) : pg }));
  if (!ws.length) return;
  // 1ページずつ JPEG に して すぐ キャンバスを かいほう する。すすみぐあいを だす
  const total = ws.reduce((a, w) => a + sheetGeom(w, w.text).pages, 0), pb = pdfBuilder(base);
  let done = 0;
  const st = el('div', { class: 'toast', role: 'status' }, `PDF を つくっています 0 / ${total}`); document.body.append(st);
  const btn = $('#btnWorksPDF'); btn.disabled = true;
  try {
    for (const w of ws) await renderPages(w, w.text, w.hand, undefined, async cv => {
      pb.add(cv); st.textContent = `PDF を つくっています ${++done} / ${total}`;
      await new Promise(r => setTimeout(r, 0));
    });
    openSendModal(pb.done(), base);
  } catch (e) {
    toast('PDF を つくれませんでした。えらぶ さくひんを へらして、もういちど ためしてください（さくひんは きえていません）');
  } finally { st.remove(); updWorksBtn(); }
});
$('#btnWorksAll').addEventListener('click', () => { const all = P().works.every(w => selWorks.has(w.id)); P().works.forEach(w => all ? selWorks.delete(w.id) : selWorks.add(w.id)); renderWorks(); });
function renderWorks() {
  const box = $('#works'); box.innerHTML = '';
  const d = P().draft;
  $('#draftRow').hidden = !d;
  if (d) { const t = new Date(d.date); $('#draftInfo').textContent = `したがき（${t.getMonth() + 1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}）：${(dsp(d.doc.join('')) || '（てがきだけ）').slice(0, 20)}…`; }
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
const WORK_KEYS = ['docSrc', 'lineSrc', 'conn', 'cuts', 'cutsText', 'docIds'];
function takeState() {
  const p = P(), st = { date: new Date().toISOString(), doc: p.doc.slice(), hand: clone(handChars()), fin: clone(fin), mk: clone(mk) };
  WORK_KEYS.forEach(k => { if (p[k] !== undefined) st[k] = clone(p[k]); });
  return st;
}
function putState(st) {
  const p = P();
  p.doc = st.doc.slice(); p.hand = clone(st.hand || {});
  WORK_KEYS.forEach(k => { if (st[k] !== undefined) p[k] = clone(st[k]); else delete p[k]; });
  fin = p.fin = Object.assign({}, FIN_DEF, clone(st.fin)); fin.hi = 0; fin.page = 0;
  // つくりかけの ぶん（えらんだ ことば・なおしている ぶん）も もどす
  mk = p.mk = Object.assign({ tpl: 'gamba', vals: {}, free: '' }, clone(st.mk || {}), { active: null });
  if (!(mk.editIdx >= 0 && mk.editIdx < p.doc.length)) delete mk.editIdx;
}
function openWork(w) {
  // まえの かたちの てがき（シートに じかに かいた せん）は、いまの てがきに うつせないので ひらかない（いちらん・まとめPDF では みられる）
  if (Array.isArray(w.hand) && w.hand.length) return toast('この さくひんは まえの かたちの てがきなので ひらけません。いちらんと まとめPDF では そのまま みられます（さくひんは きえていません）');
  // ひらく まえに、いまの ないようを したがきに のこす（あとで もどせる）
  const before = takeState(), oldDraft = P().draft;
  // ぶんしょう・てがき・つくりかけの ぶん（えらんだ ことば・かいている とちゅう・なおしている ぶん）の どれかが あれば のこす
  const busy = Object.keys(mk.vals || {}).length || (mk.free || '').trim() || mk.editIdx != null;
  if (P().doc.length || Object.keys(handChars()).length || busy) P().draft = before;
  // ひらいた さくひんには、いまの ぶんの つくりかた・くぎりを もちこまない（したがきの ほうに のこる）
  // なかは ひらがなで もつ（カタカナで ほぞんした さくひんも。みせる ときに その ひとの もじに する）
  P().doc = kata2hira(w.text).split('\n'); P().conn = !!w.conn;
  ['docIds', 'docSrc', 'lineSrc', 'cuts', 'cutsText'].forEach(k => delete P()[k]);
  mk = P().mk = { tpl: mk.tpl, vals: {}, active: null, free: '' };
  Object.keys(FIN_DEF).forEach(k => { if (w[k] !== undefined && k !== 'hi') fin[k] = clone(w[k]); });
  fin.title = kata2hira(fin.title || '');
  fin.page = 0; fin.hi = 0;
  // ほぞんした ときの もじ・なまえで ひらく（ぶんしょうを かえるまで）
  fin.snap = { id: w.id, text: w.text, title: typeof w.title === 'string' ? w.title : '', nameText: w.nameText || P().name, glyphs: w.glyphs ? clone(w.glyphs) : null };
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

