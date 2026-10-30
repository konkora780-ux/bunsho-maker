// ===== ② タイピング（ローマ字エンジン） =====
const K1 = {
  'あ':'a','い':'i yi','う':'u wu','え':'e','お':'o',
  'か':'ka ca','き':'ki','く':'ku cu qu','け':'ke','こ':'ko co',
  'さ':'sa','し':'si shi ci','す':'su','せ':'se ce','そ':'so',
  'た':'ta','ち':'ti chi','つ':'tu tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'hu fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','を':'wo','ゐ':'wyi','ゑ':'wye',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'zi ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu',
  'ぁ':'la xa','ぃ':'li xi','ぅ':'lu xu','ぇ':'le xe','ぉ':'lo xo',
  'ゃ':'lya xya','ゅ':'lyu xyu','ょ':'lyo xyo','ゎ':'lwa xwa',
  '、':',','。':'.','ー':'-','！':'!','？':'?','　':' ',' ':' ','「':'[','」':']',
};
const K2 = {
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'しゃ':'sya sha','しゅ':'syu shu','しょ':'syo sho','しぇ':'sye she',
  'じゃ':'zya ja jya','じゅ':'zyu ju jyu','じょ':'zyo jo jyo','じぇ':'zye je jye',
  'ちゃ':'tya cha cya','ちゅ':'tyu chu cyu','ちょ':'tyo cho cyo','ちぇ':'tye che cye',
  'ぢゃ':'dya','ぢゅ':'dyu','ぢょ':'dyo',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','てぃ':'thi','でぃ':'dhi','うぃ':'wi','うぇ':'we','ゔぁ':'va',
};
// ヘボン式をガイドに出す字
const HEP = { 'し':'shi','ち':'chi','つ':'tsu','ふ':'fu','じ':'ji','しゃ':'sha','しゅ':'shu','しょ':'sho','じゃ':'ja','じゅ':'ju','じょ':'jo','ちゃ':'cha','ちゅ':'chu','ちょ':'cho','しぇ':'she','ちぇ':'che','じぇ':'je' };
const isTypable = c => KANA_MODE() ? (c === '\n' || KANA_KEYS.has(c) || !!kanaBase(c)) : (c === '\n' || c in K1 || c === 'ん' || c === 'っ');
const splitC = s => s.split(' ');
function candsOf(kana) {
  let list = [];
  if (K2[kana]) {
    list = splitC(K2[kana]);
    // 「き」+「ゃ」のように分けて打っても OK
    for (const a of splitC(K1[kana[0]])) for (const b of splitC(K1[kana[1]])) list.push(a + b);
  } else if (K1[kana]) list = splitC(K1[kana]);
  const pref = S().romaji === 'hepburn' && HEP[kana];
  if (pref) list = [pref, ...list.filter(x => x !== pref)];
  return list;
}
function buildUnits(text) {
  const toks = [];
  for (let i = 0; i < text.length;) {
    const two = text.substr(i, 2);
    if (K2[two]) { toks.push(two); i += 2; } else { toks.push(text[i]); i++; }
  }
  const units = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '\n') { units.push({ kana: '\n', cands: [], skip: true, br: true }); continue; }
    if (t === 'っ') {
      const nx = toks[i + 1];
      const nc = nx && nx !== 'っ' && nx !== 'ん' ? candsOf(nx) : [];
      const dbl = nc.filter(c => /^[bcdfghjkmpqrstvwxz]/.test(c));
      if (dbl.length) {
        const cs = [];
        dbl.forEach(c => cs.push(c[0] + c));
        if (nx === 'ち') cs.push('tchi');
        nc.forEach(c => ['ltu', 'xtu', 'ltsu'].forEach(s => cs.push(s + c)));
        units.push({ kana: 'っ' + nx, cands: [...new Set(cs)] }); i++;
      } else units.push({ kana: 'っ', cands: ['ltu', 'xtu', 'ltsu'] });
      continue;
    }
    if (t === 'ん') {
      const cs = ['nn', 'xn'];
      const nx = toks[i + 1];
      if (nx && nx !== 'ん' && nx !== 'っ' && (K1[nx] || K2[nx]) && /^[ぁ-ゖ]/.test(nx)) {
        const nc = candsOf(nx);
        if (nc.length && nc.every(c => !/^[aiueoyn]/.test(c))) cs.push('n');
      }
      units.push({ kana: 'ん', cands: cs });
      continue;
    }
    const c = candsOf(t);
    if (c.length) units.push({ kana: t, cands: c });
    else units.push({ kana: t, cands: [], skip: true });
  }
  return units;
}
let ty = null;
// うつ まとまり：1ぶん（「。！？」まで）。ながい ぶんは「、」で さらに くぎる
const LONG_SENT = 12;
const splitBy = (s, re) => (s.match(re) || []).map(x => x.trim()).filter(Boolean);
function splitSentences(doc) { return doc.flatMap(line => splitBy(line, /[^。！？]+[。！？]*|[。！？]+/g)); }
const splitTen = s => splitBy(s, /[^、。！？]+[、。！？]*|[、。！？]+/g);
// せんせいが きめた くぎり（ぶんしょう ぜんたいの なんもじめの あとで くぎるか）。ぶんしょうが かわったら つかわない
function teacherCuts() { const t = P().doc.join('\n'); return P().cutsText === t ? new Set(P().cuts || []) : new Set(); }
function typingChunks() {
  const doc = P().doc, c = S().chunk, text = doc.join('\n');
  if (c === 'all') return [text];
  const cuts = teacherCuts(), END = '。！？';
  // まず 1ぶんずつ（はじまりの いちも おぼえる）
  const sents = [];
  let cur = '', off = 0;
  const flush = () => { if (cur.trim()) sents.push({ s: cur, off }); cur = ''; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n') { flush(); continue; }
    if (!cur) off = i;
    cur += ch;
    if (END.includes(ch) && !END.includes(text[i + 1] || '')) flush();
  }
  flush();
  const out = [];
  sents.forEach(({ s, off }) => {
    const ten = c === 'ten' || (c === 'auto' && s.length > LONG_SENT);
    let piece = '';
    for (let j = 0; j < s.length; j++) {
      piece += s[j];
      const next = s[j + 1] || '';
      if (cuts.has(off + j) || (ten && s[j] === '、' && next !== '、')) { if (piece.trim()) out.push(piece.trim()); piece = ''; }
    }
    if (piece.trim()) out.push(piece.trim());
  });
  return out;
}
function startTyping() {
  const sents = typingChunks();
  ty = { sents, si: 0, miss: 0, start: null };
  loadSentence();
  $('#optFinger').checked = S().finger;
  $('#optGuide').value = String(S().guide);
  $('#optSound').checked = S().sound;
  $('#optInput').value = S().input;
  $('#optBig').checked = S().showBig;
  $('#optChunk').value = S().chunk;
  $('#optAdvance').value = S().advance;
  $('#lblFinger').hidden = KANA_MODE();
}
function skipAuto() { while (ty.ui < ty.units.length && ty.units[ty.ui].skip) ty.ui++; if (ty.ui >= ty.units.length) finishTyping(); }
function curCands() { const u = ty.units[ty.ui]; return u ? u.cands.filter(c => c.startsWith(ty.buf)) : []; }
function nextKey() { const c = curCands()[0]; return c ? c[ty.buf.length] : null; }
function inputKey(ch) {
  if (!ty || ty.done) return;
  if (!ty.start) ty.start = Date.now();
  const u = ty.units[ty.ui];
  const nb = ty.buf + ch;
  const ext = u.cands.filter(c => c.startsWith(nb));
  if (ext.length) {
    ty.buf = nb;
    if (ext.includes(nb) && ext.length === 1) completeUnit();
    beep(true); return 'ok';
  }
  if (u.cands.includes(ty.buf)) { completeUnit(); return inputKey(ch); }
  ty.miss++; beep(false); return 'ng';
}
function completeUnit() {
  ty.units[ty.ui].typed = ty.buf; ty.buf = ''; ty.ui++;
  skipAuto();
}
function loadSentence() {
  const text = ty.sents[ty.si] || '';
  Object.assign(ty, { units: KANA_MODE() ? buildKanaUnits(text) : buildUnits(text), ui: 0, buf: '', pend: null, done: false, typed: [] });
  skipAuto();
  renderTarget(); renderBig(); renderKB();
}
function nextSentence() { clearTimeout(ty.timer); if (ty.done && ty.si < ty.sents.length - 1) { ty.si++; loadSentence(); } }
const allDone = () => ty.done && ty.si >= ty.sents.length - 1;
function finishTyping() { ty.done = true; ty.ui = ty.units.length; }
let audioCtx = null;
function beep(ok) {
  if (!S().sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = ok ? 880 : 220; o.type = ok ? 'sine' : 'triangle';
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (ok ? 0.08 : 0.2));
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.22);
  } catch (e) {}
}
const kanaLabel = k => k === ' ' || k === '　' ? '␣' : k;
function renderTarget() {
  const tg = $('#target'); tg.innerHTML = '';
  const g = S().guide;
  ty.units.forEach((u, i) => {
    if (u.br) { tg.append(el('div', { style: 'flex-basis:100%;height:0' })); return; }
    const cls = 'unit' + (u.skip ? ' skip' : i < ty.ui ? ' done' : i === ty.ui ? ' now' : '');
    let r = '';
    if (KANA_MODE()) r = !u.skip && g > 0 && u.base !== u.kana ? u.base + '＋' + modMark(u) : '';
    else if (!u.skip && g > 0) r = i < ty.ui ? u.typed : u.cands[0];
    const rEl = el('span', { class: 'r' });
    if (i === ty.ui && g > 0 && !KANA_MODE()) {
      const c = curCands()[0] || '';
      rEl.append(el('b', {}, ty.buf), c.slice(ty.buf.length));
    } else rEl.textContent = r;
    tg.append(el('span', { class: cls }, el('span', { class: 'k' }, kanaLabel(u.kana)), rEl));
  });
  const n = ty.units.filter(u => !u.skip).length, d = ty.units.slice(0, ty.ui).filter(u => !u.skip).length;
  $('#typeStat').textContent = (ty.sents.length > 1 ? `${ty.si + 1}ばんめ／${ty.sents.length}　` : '') + `${d} / ${n} もじ　ミス ${ty.miss}`;
}
function renderBig() {
  const b = $('#bigNow'); b.innerHTML = '';
  // 「1もじ おおきく」は せっていで ひょうじ／ひひょうじ（できた ときは いつも だす）
  $('#nowCard').hidden = !S().showBig && !ty.done;
  if (ty.done && !allDone()) {
    // すこし まって つぎの まとまりへ すすむ（ボタンでも すすめる）
    clearTimeout(ty.timer);
    const si = ty.si;
    const wait = { auto09: 900, auto2: 2000 }[S().advance];
    if (wait) ty.timer = setTimeout(() => { if (ty.si === si) nextSentence(); }, wait);
    b.append(el('div', { class: 'done-box' }, '⭐ できた！',
      el('div', { class: 'row', style: 'justify-content:center;margin-top:10px' },
        el('button', { class: 'btn main', onclick: nextSentence }, 'つぎへ ▶'))));
    return;
  }
  if (ty.done) {
    const sec = ty.start ? Math.round((Date.now() - ty.start) / 1000) : 0;
    b.append(el('div', { class: 'done-box' }, '🎉 できたね！',
      el('div', { class: 'stat' }, `じかん ${Math.floor(sec / 60)}ふん${sec % 60}びょう　ミス ${ty.miss}かい`),
      el('div', { class: 'row', style: 'justify-content:center;margin-top:10px' },
        el('button', { class: 'btn main', onclick: () => show('finish') }, 'つぎへ：しあげる ▶'))));
    return;
  }
  const u = ty.units[ty.ui];
  if (!u) { b.append(el('div', { class: 'hint' }, '①で ぶんを つくってね')); return; }
  if (KANA_MODE()) return renderBigKana(b, u);
  const c = curCands()[0] || '';
  const br = el('span', { class: 'br' });
  if (S().guide > 0) {
    const nk = c.slice(ty.buf.length);
    br.append(el('span', { class: 't' }, ty.buf), el('span', { class: 'n' }, keyLabel(nk[0] || '')), nk.slice(1));
  }
  b.append(el('span', { class: 'bk' }, kanaLabel(u.kana)), br);
}
const KB_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l','-'],
  ['z','x','c','v','b','n','m',',','.'],
  ['!',' ','?'],
];
const FINGER = { q:0,a:0,z:0,w:1,s:1,x:1,e:2,d:2,c:2,r:3,f:3,v:3,t:3,g:3,b:3,y:4,h:4,n:4,u:4,j:4,m:4,i:5,k:5,',':5,o:6,l:6,'.':6,p:7,'-':7,'!':0,'?':7 };
const KEY_SHOW = { '-':'ー', ',':'、', '.':'。', '!':'！', '?':'？', ' ':'くうはく' };
const keyLabel = k => KEY_SHOW[k] || (S().keyCase === 'upper' ? k.toUpperCase() : k);
function renderKB() {
  const kb = $('#kb'); kb.innerHTML = '';
  if (KANA_MODE()) return renderKanaKB(kb);
  const nk = S().guide === 2 && !ty.done ? nextKey() : null;
  KB_ROWS.forEach((row, ri) => {
    const r = el('div', { class: 'kr' });
    if (ri === 2) r.append(el('div', { style: 'flex:.6 1 0' }));
    row.forEach(k => {
      let cls = 'key' + (k === ' ' ? ' space' : '') + (k === nk ? ' next' : '');
      if (S().finger && FINGER[k] !== undefined) cls += ' f' + FINGER[k];
      const b = el('button', { class: cls, 'data-k': k, 'aria-label': KEY_SHOW[k] || k }, keyLabel(k));
      b.addEventListener('pointerdown', e => { e.preventDefault(); b._pd = Date.now(); press(k); });
      // そとづけ キーボード・VoiceOver・スイッチコントロールの「けってい」でも おせる
      b.addEventListener('click', () => { if (b._pd) { b._pd = 0; return; } press(k); });
      r.append(b);
    });
    if (ri === 2) r.append(el('div', { style: 'flex:.6 1 0' }));
    kb.append(r);
  });
}
function press(k) {
  if (!ty || ty.done) return;
  const res = KANA_MODE() ? inputKana(k) : inputKey(k);
  const keyEl = document.querySelector(`.key[data-k="${CSS.escape(k)}"]`);
  renderTarget(); renderBig(); renderKB();
  const k2 = document.querySelector(`.key[data-k="${CSS.escape(k)}"]`);
  if (k2) { k2.classList.add(res === 'ng' ? 'miss' : 'hit'); setTimeout(() => k2.classList.remove('miss', 'hit'), 180); }
  if (res === 'ng') { const n = $('#nowCard'); n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); }
  if (ty.done) beep(true);
}
document.addEventListener('keydown', e => {
  if (currentView !== 'type' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.matches('input,textarea,select')) return;
  if (KANA_MODE()) {
    const kk = e.key === ' ' ? ' ' : e.key;
    if (kk.length === 1 && (KANA_KEYS.has(kk) || kanaBase(kk))) { e.preventDefault(); typeKanaDirect(kk); }
    return;
  }
  let k = e.key.length === 1 ? e.key.toLowerCase() : null;
  const map = { 'ー':'-', '、':',', '。':'.', '！':'!', '？':'?', '　':' ' };
  if (map[k]) k = map[k];
  if (k && (FINGER[k] !== undefined || k === ' ')) { e.preventDefault(); press(k); }
});

// ===== ② ひらがな入力（iPad「日本語かな」配列） =====
const KANA_MODE = () => S().input !== 'roma';
// DOM は左から：左端が わ行・ー・小゛゜、右端が あ行（iPad と同じ向き）。いちばん右に くとうてん
const KANA_COLS = [
  ['わ', 'を', 'ん', 'ー', 'MOD'], ['ら', 'り', 'る', 'れ', 'ろ'], ['や', '', 'ゆ', '', 'よ'], ['ま', 'み', 'む', 'め', 'も'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['な', 'に', 'ぬ', 'ね', 'の'], ['た', 'ち', 'つ', 'て', 'と'], ['さ', 'し', 'す', 'せ', 'そ'],
  ['か', 'き', 'く', 'け', 'こ'], ['あ', 'い', 'う', 'え', 'お'], ['、', '。', '？', '！', ''],
];
const KANA_KEYS = new Set(KANA_COLS.flat().filter(k => k && k !== 'MOD').concat([' ']));
// 「小゛゜」キーを おすたびに かわる じゅんばん（例：は→ば→ぱ→は、つ→っ→づ→つ）
const K_SMALL = { 'あ':'ぁ','い':'ぃ','う':'ぅ','え':'ぇ','お':'ぉ','つ':'っ','や':'ゃ','ゆ':'ゅ','よ':'ょ','わ':'ゎ' };
const K_DAKU = { 'か':'が','き':'ぎ','く':'ぐ','け':'げ','こ':'ご','さ':'ざ','し':'じ','す':'ず','せ':'ぜ','そ':'ぞ','た':'だ','ち':'ぢ','つ':'づ','て':'で','と':'ど','は':'ば','ひ':'び','ふ':'ぶ','へ':'べ','ほ':'ぼ','う':'ゔ' };
const K_HANDAKU = { 'は':'ぱ','ひ':'ぴ','ふ':'ぷ','へ':'ぺ','ほ':'ぽ' };
const CYCLE = {};
[...KANA_KEYS].forEach(b => { const l = [b]; [K_SMALL, K_DAKU, K_HANDAKU].forEach(m => { if (m[b]) l.push(m[b]); }); if (l.length > 1) CYCLE[b] = l; });
const modMark = u => K_SMALL[u.base] === u.kana ? '小' : K_DAKU[u.base] === u.kana ? '゛' : '゜';
const kanaBase = c => { for (const b in CYCLE) if (b !== c && CYCLE[b].includes(c)) return b; return null; };
function buildKanaUnits(text) {
  return [...text].map(c => {
    if (c === '\n') return { kana: c, skip: true, br: true };
    const k = c === '　' ? ' ' : c;
    if (KANA_KEYS.has(k)) return { kana: c, base: k };
    const b = kanaBase(c);
    return b ? { kana: c, base: b } : { kana: c, skip: true };
  });
}
function nextKeyKana() {
  const u = ty.units[ty.ui]; if (!u || ty.done) return null;
  if (u.base === u.kana || u.kana === '　') return u.base;
  return ty.pend ? 'MOD' : u.base;
}
function inputKana(k) {
  if (!ty || ty.done) return;
  if (!ty.start) ty.start = Date.now();
  const u = ty.units[ty.ui];
  const done = () => { ty.pend = null; ty.units[ty.ui].typed = u.kana; ty.ui++; skipAuto(); beep(true); return 'ok'; };
  if (k === 'MOD') {
    if (!ty.pend) return 'none';
    const l = CYCLE[u.base] || [u.base];
    ty.pend = l[(l.indexOf(ty.pend) + 1) % l.length];
    if (ty.pend === u.kana) return done();
    beep(true); return 'ok';
  }
  if (k === u.kana || (k === ' ' && u.kana === '　')) return done();
  if (k === u.base) { ty.pend = k; beep(true); return 'ok'; }
  ty.miss++; beep(false); return 'ng';
}
// ハードウェアキーボードなどで「が」が そのまま きたときも そのまま せいかい
const typeKanaDirect = c => press(c);
function renderBigKana(b, u) {
  const shown = ty.pend || u.kana;
  b.append(el('span', { class: 'bk' }, kanaLabel(shown)));
  if (S().guide === 0) return;
  const seq = el('span', { class: 'br', style: 'font-size:34px;display:flex;gap:10px;align-items:center' });
  const nk = nextKeyKana();
  const key = (lab, on) => el('span', { class: on ? 'n' : '', style: 'border:2px solid var(--line);border-radius:10px;padding:2px 12px;background:' + (on ? 'var(--hl)' : '#fff') }, lab);
  if (u.base === u.kana || u.kana === '　') seq.append(key(u.base === ' ' ? 'くうはく' : u.base, true));
  else seq.append(key(u.base, nk === u.base), '→', key('小゛゜', nk === 'MOD'), el('span', { class: 'stat' }, ty.pend ? '（' + u.kana + ' に なるまで おす）' : ''));
  b.append(seq);
}
function renderKanaKB(kb) {
  const nk = S().guide === 2 ? nextKeyKana() : null;
  const grid = el('div', { class: 'kkb' });
  KANA_COLS.forEach(col => {
    const c = el('div', { class: 'kcol' });
    col.forEach(k => {
      if (!k) { c.append(el('div', { class: 'key ghost' })); return; }
      const lab = k === 'MOD' ? '小゛゜' : k;
      const b = el('button', { class: 'key' + (k === 'MOD' ? ' fn' : '') + (k === nk ? ' next' : ''), 'data-k': k, 'aria-label': lab }, lab);
      b.addEventListener('pointerdown', e => { e.preventDefault(); b._pd = Date.now(); press(k); });
      // そとづけ キーボード・VoiceOver・スイッチコントロールの「けってい」でも おせる
      b.addEventListener('click', () => { if (b._pd) { b._pd = 0; return; } press(k); });
      c.append(b);
    });
    grid.append(c);
  });
  kb.append(grid);
  const sp = el('button', { class: 'key space' + (nk === ' ' ? ' next' : ''), 'data-k': ' ' }, 'くうはく');
  sp.addEventListener('pointerdown', e => { e.preventDefault(); sp._pd = Date.now(); press(' '); });
  sp.addEventListener('click', () => { if (sp._pd) { sp._pd = 0; return; } press(' '); });
  kb.append(el('div', { class: 'kr' }, el('div', { style: 'flex:2 1 0' }), sp, el('div', { style: 'flex:2 1 0' })));
}
$('#optInput').addEventListener('change', e => { S().input = e.target.value; saveDB(); startTyping(); });
$('#btnTypeRestart').addEventListener('click', startTyping);
$('#btnSpeakNow').addEventListener('click', () => speak((ty && ty.sents[ty.si]) || P().doc.join('')));
$('#optFinger').addEventListener('change', e => { S().finger = e.target.checked; saveDB(); renderKB(); });
$('#optGuide').addEventListener('change', e => { S().guide = +e.target.value; saveDB(); renderTarget(); renderBig(); renderKB(); });
$('#optAdvance').addEventListener('change', e => { S().advance = e.target.value; saveDB(); });
// せんせいが くぎりを なおす：もじの あとを タップすると そこで くぎる
$('#btnCuts').addEventListener('click', () => {
  const text = P().doc.join('\n');
  if (!text) return toast('①で ぶんを つくってね');
  if (P().cutsText !== text) { P().cuts = []; P().cutsText = text; }
  const box = el('div', { class: 'cutbox' });
  const draw = () => {
    box.innerHTML = '';
    const cuts = new Set(P().cuts);
    [...text].forEach((ch, i) => {
      if (ch === '\n') { box.append(el('div', { style: 'flex-basis:100%;height:0' })); return; }
      const b = el('button', { class: 'cutch' + (cuts.has(i) ? ' cut' : ''), 'aria-label': ch + ' の あとで くぎる' }, ch);
      b.addEventListener('click', () => { cuts.has(i) ? cuts.delete(i) : cuts.add(i); P().cuts = [...cuts].sort((a, z) => a - z); saveDB(); draw(); });
      box.append(b);
    });
  };
  draw();
  const m = openModal(el('div', { class: 'regtitle' }, '✂ くぎりを なおす'),
    el('p', { class: 'hint' }, 'もじを タップすると、その もじの あとで くぎります（あかい たてせん）。もういちど タップで もとに もどります。'),
    box,
    el('div', { class: 'row' }, el('button', { class: 'btn small', onclick: () => { P().cuts = []; saveDB(); draw(); } }, 'くぎりを ぜんぶ けす'),
      el('button', { class: 'btn main', onclick: () => { m.remove(); startTyping(); } }, '✓ おわる')));
});
$('#optChunk').addEventListener('change', e => { S().chunk = e.target.value; saveDB(); startTyping(); });
$('#optBig').addEventListener('change', e => { S().showBig = e.target.checked; saveDB(); renderBig(); });
$('#optSound').addEventListener('change', e => { S().sound = e.target.checked; saveDB(); });
