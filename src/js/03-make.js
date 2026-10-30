// ===== ① ぶんをつくる =====
const SLOTS = {
  itsu: { q: 'いつ？', w: [['きょう', '📅'], ['きのう', '🌙'], ['うんどうかいで', '🏃'], ['がくしゅうはっぴょうかいで', '🎭'], ['しゅうがくりょこうで', '🚌'], ['えんそくで', '🍙'], ['さぎょうがくしゅうで', '🔨'], ['たいいくのじかんに', '🤸'], ['おんがくのじかんに', '🎵'], ['やすみじかんに', '⏰']] },
  // 3つめ＝そのことばに あう うごき（ぶんまつが かわる）。4つめ＝「できるように」の ときの とくべつな いいかた
  nani: { q: 'なにを？', w: [['かけっこ', '🏃', 'suru', ['で', 'はしれる']], ['だんす', '💃', 'odoru'], ['うた', '🎤', 'utau'], ['がっき', '🥁', 'ensou'], ['そうじ', '🧹', 'suru'], ['きゅうしょく', '🍛', 'taberu'], ['けいさん', '🔢', 'suru'], ['ひらがな', '✍️', 'kaku'], ['え', '🎨', 'kaku'], ['ほん', '📖', 'yomu'], ['しごと', '💼', 'suru'], ['おりがみ', '🦢', 'oru'], ['りょうり', '🍳', 'tsukuru']] },
  how: { q: 'どのように？', w: [['いっしょうけんめい', '🔥'], ['さいごまで', '🏁'], ['ともだちときょうりょくして', '🤝'], ['おおきなこえで', '📣'], ['ていねいに', '✨'], ['ひとりで', '☝️'], ['えがおで', '😄']] },
  dare: { q: 'だれと？', w: [['ともだち', '🧒'], ['せんせい', '🧑‍🏫'], ['かぞく', '👪'], ['くらすのみんな', '👫']] },
  feel: { q: 'きもちは？', w: [['とてもたのしかったです。', '😆'], ['うれしかったです。', '😊'], ['またやりたいです。', '🔁'], ['どきどきしました。', '💓'], ['がんばってよかったです。', '👍'], ['むずかしかったです。', '😣'], ['こまりました。', '😥'], ['てつだってほしいです。', '🙋']] },
  how2: { q: 'どのくらい？', w: [['じょうずに', '👏'], ['はやく', '⚡'], ['ひとりで', '☝️'], ['ながく', '⏳'], ['たくさん', '🔢']] },
  // 「がんばったこと」「つぎに」の ぶんまつ：えらんだ「なにを」に あわせて かわる（renderChooser で つくる）
  gend: { q: 'どうした？', w: [] },
  tend: { q: 'どうしたい？', w: [] },
  // だれに つたえる？（よびかけ）
  aite: { q: 'だれに つたえる？', w: [['せんせい', '🧑‍🏫'], ['おうちのひと', '🏠'], ['おかあさん', '👩'], ['おとうさん', '👨'], ['ともだち', '🧒'], ['くらすのみんな', '👫'], ['みなさん', '📣']] },
  // おねがいの ことば（「いっしょに〜」は えらんだ「なにを」で かわる）
  // 「なにを」の うごきに あわせて、つなぎの ことば（を・の）ごと つくる（renderChooser で つくる）
  help: { q: 'どうしてほしい？', w: [] },
  feel2: { q: 'どうおもった？', w: [['たのしい', '😆'], ['うれしい', '😊'], ['もっとがんばりたい', '🔥'], ['すごい', '😲'], ['むずかしい', '😣'], ['こまった', '😥'], ['てつだってほしい', '🙋']] },
};
// うごきの かたち（した・して・できる）
const VERBS = {
  suru: { n: 'する', past: 'しました', te: 'して', pot: 'できる', tai: 'したい', kata: 'しかた' },
  utau: { n: 'うたう', past: 'うたいました', te: 'うたって', pot: 'うたえる', tai: 'うたいたい', kata: 'うたいかた' },
  odoru: { n: 'おどる', past: 'おどりました', te: 'おどって', pot: 'おどれる', tai: 'おどりたい', kata: 'おどりかた' },
  ensou: { n: 'えんそうする', past: 'えんそうしました', te: 'えんそうして', pot: 'えんそうできる', tai: 'えんそうしたい', kata: 'えんそうのしかた' },
  taberu: { n: 'たべる', past: 'たべました', te: 'たべて', pot: 'たべられる', tai: 'たべたい', kata: 'たべかた' },
  kaku: { n: 'かく', past: 'かきました', te: 'かいて', pot: 'かける', tai: 'かきたい', kata: 'かきかた' },
  yomu: { n: 'よむ', past: 'よみました', te: 'よんで', pot: 'よめる', tai: 'よみたい', kata: 'よみかた' },
  tsukuru: { n: 'つくる', past: 'つくりました', te: 'つくって', pot: 'つくれる', tai: 'つくりたい', kata: 'つくりかた' },
  oru: { n: 'おる', past: 'おりました', te: 'おって', pot: 'おれる', tai: 'おりたい', kata: 'おりかた' },
  hashiru: { n: 'はしる', past: 'はしりました', te: 'はしって', pot: 'はしれる', tai: 'はしりたい', kata: 'はしりかた' },
  asobu: { n: 'あそぶ', past: 'あそびました', te: 'あそんで', pot: 'あそべる', tai: 'あそびたい', kata: 'あそびかた' },
  miru: { n: 'みる', past: 'みました', te: 'みて', pot: 'みられる', tai: 'みたい', kata: 'みかた' },
  hiku: { n: 'ひく', past: 'ひきました', te: 'ひいて', pot: 'ひける', tai: 'ひきたい', kata: 'ひきかた' },
  oyogu: { n: 'およぐ', past: 'およぎました', te: 'およいで', pot: 'およげる', tai: 'およぎたい', kata: 'およぎかた' },
};
function wordInfo(w) {
  const d = SLOTS.nani.w.find(x => x[0] === w);
  if (d) return { v: d[2], pot: d[3] };
  return { v: (P().wordVerb || {})[w] || 'suru' };
}
// 「#past」などは、えらんだ「なにを」に あわせて かわる ぶぶん
function verbPart(tok, t) {
  const i = t.parts.indexOf('@nani'), w = mk.vals[i];
  if (!w) return tok === '#potp' ? '' : '…';
  const info = wordInfo(w), V = VERBS[info.v] || VERBS.suru;
  if (tok === '#past') return 'を' + V.past;
  if (tok === '#te') return 'を' + V.te;
  if (tok === '#potp') return info.pot ? info.pot[0] : 'を';
  if (tok === '#potv') return info.pot ? info.pot[1] : V.pot;
  return '';
}
const partText = (p, i, t, blank) => p[0] === '@' ? (mk.vals[i] || blank) : p[0] === '#' ? verbPart(p, t) : p;
const TPLS = [
  { id: 'gamba', em: '💪', name: 'がんばったこと', parts: ['@itsu', '、', '@nani', 'を', '@how', '@gend'] },
  { id: 'tano', em: '😊', name: 'たのしかったこと', parts: ['@itsu', '、', '@dare', 'と', '@nani', '#past', '。', '@feel'] },
  { id: 'deki', em: '⭐', name: 'できるようになったこと', parts: ['@nani', '#potp', '@how2', '#potv', 'ようになりました。'] },
  { id: 'omoi', em: '💭', name: 'おもったこと', parts: ['@nani', '#te', '、', '@feel2', 'とおもいました。'] },
  { id: 'hokoku', em: '📢', name: 'ほうこくする', parts: ['@aite', '、', '@itsu', '、', '@nani', 'を', '@how', '@gend'] },
  { id: 'onegai', em: '🙏', name: 'おねがい', parts: ['@aite', '、', '@nani', '', '@help'] },
  { id: 'tsugi', em: '🚀', name: 'つぎに がんばりたいこと', parts: ['つぎは、', '@nani', 'を', '@how', '@tend'] },
  { id: 'jiyu', em: '✍️', name: 'じゆうに かく', parts: [] },
];
let mk = { tpl: 'gamba', vals: {}, active: null, free: '' };

function sentenceText() {
  const t = TPLS.find(t => t.id === mk.tpl);
  if (t.id === 'jiyu') return normText(mk.free.trim());
  return t.parts.map((p, i) => partText(p, i, t, '')).join('');
}
function sentenceComplete() {
  const t = TPLS.find(t => t.id === mk.tpl);
  if (t.id === 'jiyu') return mk.free.trim().length > 0;
  return t.parts.every((p, i) => p[0] !== '@' || mk.vals[i]);
}
// じどうせいと モードの ときだけ、せんせいが えらんだ ものに しぼる
const isStudent = () => DB.role === 'student';
// null＝ぜんぶ だす、[…]＝えらんだ ものだけ。hide・pin は ひとごとに あたらしく つくる（ひとの あいだで まざらない）
const MODE_IDS = ['glyph', 'font', 'hand'];
// practice：②うってみる を つかうか、stat：じかん・ミスの かずを みせるか（じどうせいと モード）
const showDef = () => ({ tpls: null, modes: null, glyph: true, practice: true, stat: true, hide: {}, pin: {}, max: 0 });
const practiceOn = () => !isStudent() || SH().practice !== false;
function SH() {
  const s = S();
  if (!s.show) s.show = showDef();
  const d = showDef(); Object.keys(d).forEach(k => { if (s.show[k] === undefined) s.show[k] = d[k]; });
  return s.show;
}
function shownTpls() { const l = SH().tpls; return isStudent() && Array.isArray(l) ? TPLS.filter(t => l.includes(t.id)) : TPLS; }
// かつどうの しゃしん：ぶんを つくる ときの てがかり（せんせいが いれる）
const PHOTO_MAX = 6, PHOTO_PX = 480;
function renderPhotos() {
  const ph = P().photos || [], box = $('#photoList'); box.innerHTML = '';
  $('#photoCard').hidden = isStudent() && !ph.length;
  if (!ph.length) box.append(el('div', { class: 'hint' }, 'しゃしんを いれると、なにを したか おもいだす ヒントに なります。'));
  ph.forEach((x, i) => {
    const img = el('img', { src: x.d, alt: (i + 1) + 'まいめの しゃしん' });
    img.addEventListener('click', () => openModal(el('img', { class: 'bigphoto', src: x.d, alt: 'しゃしん' }),
      el('div', { class: 'row', style: 'justify-content:center;margin-top:10px' }, el('button', { class: 'btn main', onclick: e => e.target.closest('.modal').remove() }, 'とじる'))));
    box.append(el('div', { class: 'photo' }, img,
      el('button', { class: 'btn small warn tonly x', 'aria-label': 'しゃしんを けす', onclick: () => { ph.splice(i, 1); saveDB(); renderPhotos(); } }, '✕')));
  });
  $('#btnPhotoAdd').hidden = ph.length >= PHOTO_MAX;
}
// がぞうを ながい へん PHOTO_PX まで ちいさくして JPEG に する（ほぞんの ようりょうを へらす）
function shrinkPhoto(file) {
  return new Promise((ok, ng) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, PHOTO_PX / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.7)); c.width = c.height = 0;
    };
    im.onerror = () => { URL.revokeObjectURL(url); ng(); };
    im.src = url;
  });
}
$('#photoFile').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = '';
  const ph = P().photos = P().photos || [];
  let added = 0;
  for (const f of files) {
    if (ph.length >= PHOTO_MAX) { toast('しゃしんは 6まいまで です'); break; }
    let d; try { d = await shrinkPhoto(f); } catch (err) { toast('この しゃしんは よみこめません'); continue; }
    ph.push({ d, date: new Date().toISOString() });
    // いっぱいで ほぞん できない ときは いれない
    if (!saveDB()) { ph.pop(); saveDB(); toast('ほぞんする ばしょが いっぱいです。いらない しゃしんや さくひんを けしてね'); break; }
    added++;
  }
  renderPhotos(); if (added) toast(`しゃしんを ${added}まい いれました`);
});
function renderMake() {
  renderPhotos();
  const tl = $('#tplList'); tl.innerHTML = '';
  const tpls = shownTpls();
  if (!tpls.some(t => t.id === mk.tpl)) { mk = P().mk = { tpl: tpls[0].id, vals: {}, active: null, free: '' }; }
  tpls.forEach(t => tl.append(el('button', { class: 'tpl' + (t.id === mk.tpl ? ' on' : ''), onclick: () => { mk = P().mk = { tpl: t.id, vals: {}, active: null, free: '' }; saveDB(); renderMake(); } },
    el('span', { class: 'em' }, t.em), t.name)));
  renderFrame(); renderDoc();
}
function renderFrame() {
  const t = TPLS.find(t => t.id === mk.tpl);
  const fr = $('#frame'); fr.innerHTML = '';
  const ch = $('#chooser'); ch.innerHTML = '';
  if (t.id === 'jiyu') {
    const ta = el('textarea', { class: 'edit', id: 'freeText', placeholder: 'ここに ひらがなで かきます', 'aria-label': 'じゆうに かく' });
    ta.value = mk.free;
    ta.addEventListener('input', () => { mk.free = ta.value; renderPreview(); });
    fr.append(ta);
  } else {
    let firstEmpty = null;
    t.parts.forEach((p, i) => {
      if (p[0] === '#') { fr.append(el('span', { class: 'vpart' }, verbPart(p, t))); return; }
      if (p[0] !== '@') { fr.append(el('span', {}, p)); return; }
      const key = p.slice(1), v = mk.vals[i];
      if (!v && firstEmpty === null) firstEmpty = i;
      fr.append(el('button', { class: 'slot' + (v ? ' filled' : '') + (mk.active === i ? ' active' : ''), onclick: () => { mk.active = i; renderFrame(); } }, v || SLOTS[key].q));
    });
    if (mk.active === null && firstEmpty !== null) { mk.active = firstEmpty; return renderFrame(); }
    if (mk.active !== null) renderChooser(t.parts[mk.active].slice(1), mk.active);
  }
  renderPreview();
}
// せんせいが「さきに だす」に した ことば → せんせいが ふやした ことば → もとの ことば の じゅん
function orderItems(key, items) {
  const pin = SH().pin[key] || [];
  return items.filter(x => pin.includes(x.id)).sort((a, z) => pin.indexOf(a.id) - pin.indexOf(z.id)).concat(items.filter(x => !pin.includes(x.id)));
}
// うごきで かわる ぶんまつの なまえ（せっていで つかう）
const DYN = {
  gend: [['#past', '〜ました（れい：うたいました）'], ['#gpast', 'がんばって〜ました'], ['#gamba', 'がんばりました。']],
  tend: [['#tai', '〜たいです（れい：うたいたいです）'], ['#gtai', 'がんばって〜たいです'], ['#gamba', 'がんばりたいです。']],
  help: [['#tetsu', '〜のを てつだってください。'], ['#oshie', '〜の しかたを おしえてください。'], ['#miru', '〜しているところを みてください。'], ['#issho', 'いっしょに〜してください。']],
};
function renderChooser(key, idx) {
  const ch = $('#chooser'); ch.innerHTML = '';
  const slot = SLOTS[key];
  ch.append(el('div', { class: 'hint' }, slot.q + ' を えらんでね'));
  const box = el('div', { class: 'chips' });
  const pick = w => {
    if (S().speakPick) speak(w);
    mk.vals[idx] = w;
    const t = TPLS.find(t => t.id === mk.tpl);
    // 「なにを」を かえたら、それに あわせた ぶんまつを えらびなおす
    if (key === 'nani') t.parts.forEach((p, i) => { if (p === '@gend' || p === '@tend' || p === '@help') delete mk.vals[i]; });
    const next = t.parts.findIndex((p, i) => p[0] === '@' && !mk.vals[i]);
    mk.active = next >= 0 ? next : null;
    renderFrame();
    // ぜんぶ えらべたら ぶんを よみあげて、よみかえしを うながす
    if (next < 0 && S().speakPick) speak(sentenceText(), true);
  };
  // ことばの こうほ：{ id, w: もじ, em, mine }。うごきで かわる ぶんまつは「#〜」の きまった id で せっていする
  let items = slot.w.map(([w, em]) => ({ id: w, w, em }));
  const t0 = TPLS.find(t => t.id === mk.tpl), nw = mk.vals[t0.parts.indexOf('@nani')];
  if (key === 'gend' || key === 'tend') {
    const vk = nw ? wordInfo(nw).v : null, V = VERBS[vk] || null;
    items = [];
    if (V) {
      if (key === 'gend') { items.push({ id: '#past', w: V.past + '。', em: '✅' }); if (vk !== 'suru') items.push({ id: '#gpast', w: 'がんばって' + V.past + '。', em: '💪' }); items.push({ id: '#gamba', w: 'がんばりました。', em: '💪' }); }
      else { items.push({ id: '#tai', w: V.tai + 'です。', em: '✨' }); if (vk !== 'suru') items.push({ id: '#gtai', w: 'がんばって' + V.tai + 'です。', em: '💪' }); items.push({ id: '#gamba', w: 'がんばりたいです。', em: '💪' }); }
    } else {
      ch.append(el('div', { class: 'hint' }, 'さきに「なにを？」を えらぶと、あう ことばが でます。'));
      items = [{ id: '#gamba', w: key === 'gend' ? 'がんばりました。' : 'がんばりたいです。', em: '💪' }];
    }
  }
  if (key === 'help') {
    // れい（がっき）：がっきを えんそうするのを てつだって／がっきの えんそうのしかたを おしえて／がっきを えんそうしているところを みて
    const vk = nw ? wordInfo(nw).v : 'suru', V = VERBS[vk] || VERBS.suru;
    if (!nw) ch.append(el('div', { class: 'hint' }, 'さきに「なにを？」を えらぶと、あう ことばが でます。'));
    items = [
      { id: '#tetsu', w: (vk === 'suru' ? 'を' : 'を' + V.n + 'のを') + 'てつだってください。', em: '🙋' },
      { id: '#oshie', w: 'の' + V.kata + 'をおしえてください。', em: '💡' },
      { id: '#miru', w: 'を' + V.te + 'いるところをみてください。', em: '👀' },
      { id: '#issho', w: 'をいっしょに' + V.te + 'ください。', em: '🤝' },
    ];
    items.forEach(x => { x.label = (nw || '〇〇') + x.w; });
  }
  const mine = (P().words[key] || []);
  items = orderItems(key, mine.map(w => ({ id: w, w, mine: true })).concat(items));
  if (isStudent()) {
    const hide = SH().hide[key] || [];
    items = items.filter(x => !hide.includes(x.id));
    if (SH().max > 0) items = items.slice(0, SH().max);
  }
  items.forEach(x => {
    if (!x.mine) return box.append(el('button', { class: 'chip', onclick: () => pick(x.w) }, el('span', { class: 'em' }, x.em), x.label || x.w));
    box.append(el('button', { class: 'chip mine', onclick: () => pick(x.w) }, x.w));
    box.append(el('button', { class: 'btn small warn tonly', 'aria-label': x.w + ' を けす', onclick: () => { P().words[key] = mine.filter(y => y !== x.w); saveDB(); renderChooser(key, idx); } }, '✕'));
  });
  ch.append(box);
  const inp = el('input', { type: 'text', placeholder: 'あたらしい ことば', 'aria-label': 'あたらしい ことば', style: 'padding:10px;border-radius:10px;border:2px solid var(--line);flex:1;min-width:0' });
  // 「なにを」には、そのことばに あう うごきも えらぶ
  const vsel = el('select', { 'aria-label': 'どうする', style: 'padding:10px;border-radius:10px;border:2px solid var(--line);background:#fff' });
  Object.entries(VERBS).forEach(([k, v]) => vsel.append(el('option', { value: k }, '〜を ' + v.n)));
  ch.append(el('div', { class: 'row tonly', style: 'margin-top:10px' }, inp, key === 'nani' ? vsel : '',
    el('button', { class: 'btn small', onclick: () => {
      const w = normText(inp.value.trim()); if (!w) return;
      (P().words[key] = P().words[key] || []).push(w);
      if (key === 'nani') (P().wordVerb = P().wordVerb || {})[w] = vsel.value;
      saveDB(); pick(w);
    } }, '＋ ことばを ふやす')));
}
function renderPreview() {
  P().mk = mk;
  const t = TPLS.find(t => t.id === mk.tpl);
  $('#rereadHint').hidden = !(sentenceComplete() && t.id !== 'jiyu');
  $('#btnAddSent').textContent = mk.editIdx != null ? '✓ なおした ぶんに する' : '＋ このぶんを いれる';
  const s = t.id === 'jiyu' ? sentenceText() : t.parts.map((p, i) => partText(p, i, t, '〇〇')).join('');
  $('#sentPreview').textContent = s || '（ことばを えらぶと ここに でます）';
  $('#btnAddSent').disabled = !sentenceComplete();
}
// じゅんじょの ことば（1ぎょうめ・あいだ・さいごの ぎょう）
const CONN = ['はじめに、', 'つぎに、', 'さいごに、'];
const stripConn = s => { const c = CONN.find(c => s.startsWith(c)); return c ? s.slice(c.length) : s; };
const isSpCh = c => c === ' ' || c === '　';
const nsLen = s => [...s].filter(c => !isSpCh(c)).length;
// ぶんごとの id（ならべかえ・なおし を しても かわらない なまえ）
const newLineId = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function docIds() {
  const p = P();
  if (!Array.isArray(p.docIds) || p.docIds.length !== p.doc.length) p.docIds = p.doc.map(newLineId);
  return p.docIds;
}
// ぶんしょうを かえる ときの きまり（くぎり・てがき・かいぎょう）
//  ・ならべかえ・けす・ふやす・じゅんじょの ことばの つけはずし → ほかの ぶんの ものは そのまま ひきつぐ
//  ・ぶんの なかみが かわった（なおした） → その ぶんの ものは きえる（まえもって しらせる）
// entries：あたらしい じゅんの [{ i: もとの ばんごう（あたらしい ぶんは -1）, body: じゅんじょの ことばを のぞいた ぶん }]
// how：'keep' そのまま／'conn' つける／'strip' とる。dry：かえずに、きえる てがきの かずだけ かえす
function setDoc(entries, how, dry) {
  const p = P(), old = p.doc, n = entries.length, ids = docIds();
  const cutsOn = p.cutsText === old.join('\n') && (p.cuts || []).length;
  const st = [], nst = []; let o = 0, q = 0;
  old.forEach(s => { st.push(o); nst.push(q); o += s.length + 1; q += nsLen(s); });
  const lines = [], newIds = [], cuts = [], nmap = {};
  let no = 0, nq = 0;
  entries.forEach(({ i, body }, j) => {
    const s = i >= 0 ? old[i] : '', oldPre = i >= 0 ? s.length - stripConn(s).length : 0;
    const pre = how === 'keep' ? s.slice(0, oldPre) : how === 'conn' && n >= 2 ? CONN[j === 0 ? 0 : j === n - 1 ? 2 : 1] : '';
    const ns = pre + body, sh = pre.length - oldPre;
    // なかみが おなじ ときだけ ひきつぐ
    if (i >= 0 && stripConn(s) === body) {
      if (cutsOn) p.cuts.forEach(c => { const l = c - st[i]; if (l >= oldPre && l < s.length) cuts.push(no + l + sh); });
      for (let k = oldPre; k < nsLen(s); k++) nmap[nst[i] + k] = nq + k + sh;
    }
    lines.push(ns); newIds.push(i >= 0 ? ids[i] : newLineId()); no += ns.length + 1; nq += nsLen(ns);
  });
  const h = handChars(), lost = Object.keys(h).filter(k => nmap[k] == null && h[k].s && h[k].s.length).length;
  if (dry) return lost;
  p.doc = lines; p.docIds = newIds;
  if (cutsOn) { p.cuts = cuts.sort((a, z) => a - z); p.cutsText = lines.join('\n'); }
  const nh = {};
  Object.keys(h).forEach(k => { if (nmap[k] != null) nh[nmap[k]] = h[k]; });
  p.hand = nh;
  fin.breaks = (fin.breaks || []).filter(x => nmap[x] != null).map(x => nmap[x]);
  if (mk.editIdx != null) { const j = entries.findIndex(e => e.i === mk.editIdx); if (j >= 0) mk.editIdx = j; else delete mk.editIdx; }
  return lost;
}
const keepAll = () => P().doc.map((s, i) => ({ i, body: stripConn(s) }));
function relayDoc(order, how) { return setDoc(order.map(i => ({ i, body: stripConn(P().doc[i]) })), how); }
// てがきが きえる ときは、まえもって きく
function confirmLoss(lost, go) {
  if (!lost) return go();
  const m = openModal(el('div', { class: 'regtitle' }, '✋ てがきが きえます'),
    el('p', {}, `この ぶんを かえると、③で てがきした もじが ${lost}こ きえます。`),
    el('div', { class: 'row' }, el('button', { class: 'btn warn', onclick: () => { m.remove(); go(); } }, 'かえる（てがきは きえる）'), el('button', { class: 'btn main', onclick: () => m.remove() }, 'やめる')));
}
const mvBtn = (t, lab, off, fn) => { const b = el('button', { class: 'btn small', 'aria-label': lab, onclick: fn }, t); b.disabled = off; return b; };
const ident = () => P().doc.map((_, i) => i);
function moveLine(i, d) {
  const ord = ident(), j = i + d; if (j < 0 || j >= ord.length) return;
  [ord[i], ord[j]] = [ord[j], ord[i]];
  relayDoc(ord, P().conn ? 'conn' : 'keep'); saveDB(); renderDoc();
}
$('#optConn').addEventListener('change', e => { P().conn = e.target.checked; relayDoc(ident(), P().conn ? 'conn' : 'strip'); saveDB(); renderDoc(); });
function renderDoc() {
  const p = P(), dl = $('#docList'); dl.innerHTML = '';
  $('#optConn').checked = !!p.conn;
  if (!p.doc.length) dl.append(el('div', { class: 'hint' }, 'まだ ありません。うえで ぶんを つくって「このぶんを いれる」を おしてね。'));
  const last = p.doc.length - 1;
  p.doc.forEach((s, i) => dl.append(el('div', { class: 'docline' }, el('span', {}, s),
    el('span', { class: 'mv' },
      mvBtn('▲', 'うえへ', i === 0, () => moveLine(i, -1)), mvBtn('▼', 'したへ', i === last, () => moveLine(i, 1))),
    el('button', { class: 'btn small', 'aria-label': 'よむ', onclick: () => speak(s) }, '🔊'),
    (p.docSrc || {})[stripConn(s)] ? el('button', { class: 'btn small', onclick: () => editLine(i) }, '✏️ なおす') : '',
    el('button', { class: 'btn small warn tonly', onclick: () => { const ord = ident().filter(x => x !== i), how = p.conn ? 'conn' : 'keep'; confirmLoss(setDoc(ord.map(k => ({ i: k, body: stripConn(p.doc[k]) })), how, true), () => { relayDoc(ord, how); if (mk.editIdx != null) delete mk.editIdx; saveDB(); renderDoc(); renderPreview(); }); } }, '✕'))));
  $('#docEdit').value = p.doc.join('\n');
  const bad = [...new Set(p.doc.join('').split('').filter(c => !isTypable(c)))];
  $('#docWarn').textContent = bad.length ? '※ うてない もじが あります：' + bad.join(' ') + '（タイピングでは とばします）' : '';
  $('#goType').disabled = !p.doc.length;
  $('#goType').textContent = practiceOn() ? 'つぎへ：うってみる ▶' : 'つぎへ：しあげる ▶';
}
// できた ぶんを よびだして、ことばを えらびなおす
function editLine(i) {
  const s = P().doc[i], src = (P().docSrc || {})[stripConn(s)]; if (!src) return;
  mk = P().mk = { tpl: src.tpl, vals: Object.assign({}, src.vals), active: null, free: '', editIdx: i };
  if (src.tpl === 'onegai' && mk.vals[4] && !/^[をの]/.test(mk.vals[4])) delete mk.vals[4];
  renderMake(); window.scrollTo(0, 0);
  speak(s); toast('なおしたい ことばを タップしてね');
}
$('#btnSpeak').addEventListener('click', () => speak(sentenceText()));
$('#btnAddSent').addEventListener('click', () => {
  if (!sentenceComplete()) return;
  const s = sentenceText(), t = TPLS.find(t => t.id === mk.tpl);
  // あとで ことばを えらびなおせるよう、つくりかたを おぼえておく
  if (t.id !== 'jiyu') (P().docSrc = P().docSrc || {})[s] = { tpl: mk.tpl, vals: Object.assign({}, mk.vals) };
  const how = P().conn ? 'conn' : 'keep', ed = mk.editIdx != null && mk.editIdx < P().doc.length;
  const ents = keepAll(); if (ed) ents[mk.editIdx].body = s; else ents.push({ i: -1, body: s });
  confirmLoss(setDoc(ents, how, true), () => {
    setDoc(ents, how);
    mk.vals = {}; mk.active = null; mk.free = ''; delete mk.editIdx;
    renderFrame(); renderDoc(); if (saveDB()) toast(ed ? 'なおしました！' : 'いれました！');
  });
});
$('#btnClearSlots').addEventListener('click', () => { mk.vals = {}; mk.active = null; mk.free = ''; delete mk.editIdx; renderFrame(); });
$('#btnApplyEdit').addEventListener('click', () => {
  // おなじ ぶんは ひきつぐ（てがき・くぎりも）。かわった ぶんは あたらしい ぶん
  const used = new Set(), old = P().doc;
  const ents = $('#docEdit').value.split('\n').map(s => normText(s.trim())).filter(Boolean).map(t => {
    const i = old.findIndex((o, k) => o === t && !used.has(k)); if (i >= 0) used.add(i);
    return i >= 0 ? { i, body: stripConn(t) } : { i: -1, body: t };
  });
  confirmLoss(setDoc(ents, 'keep', true), () => { setDoc(ents, 'keep'); renderDoc(); if (saveDB()) toast('なおしました'); });
});
$('#btnClearDoc').addEventListener('click', function () {
  if (this.dataset.c !== '1') { this.dataset.c = '1'; const hn = Object.keys(handChars()).length; this.textContent = hn ? `ほんとうに けす？（てがき ${hn}もじも きえます）` : 'ほんとうに けす？'; setTimeout(() => { this.dataset.c = ''; this.textContent = 'ぜんぶ けす'; }, 3000); return; }
  setDoc([], 'keep'); delete mk.editIdx; saveDB(); renderDoc(); this.dataset.c = ''; this.textContent = 'ぜんぶ けす';
});
$('#btnSpeakAll').addEventListener('click', () => speak(P().doc.join('')));
$('#goType').addEventListener('click', () => show(practiceOn() ? 'type' : 'finish'));

