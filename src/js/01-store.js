// ===== 共通 =====
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(c => e.append(c instanceof Node ? c : document.createTextNode(c)));
  return e;
};
const IN_FRAME = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
function toast(msg) {
  const t = el('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}
// ===== かんじは うてない・もじは ひらがなか カタカナの どちらか =====
// なかみは いつも ひらがなで もつ（ことば・ぶん・だい）。せんせいが「カタカナ」に した ひとは、みせる ときと しあげ（さくひん）で カタカナに する
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const hira2kata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
const KATA = () => S().script === 'kata';
// みせる もじ：カタカナの ひとは カタカナ、ひらがなの ひとは ひらがな（どちらか だけ）
const dsp = s => KATA() ? hira2kata(s) : kata2hira(s);
// ぜんかくの すうじ（０〜９）は はんかく（0〜9）に そろえる（もじとうろく・②の キーと おなじ もじ）
const halfNum = s => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
// ばらばらの だくてん（カ＋゛）は 1もじ（ガ）に まとめる（NFC）
const normText = s => halfNum(kata2hira(s.normalize('NFC'))).replace(/!/g, '！').replace(/\?/g, '？').replace(/,/g, '、').replace(/\./g, '。');
// ぶん・ことば・だい・なまえに なる らん（じゆうに かく・ぶんしょうを なおす・せんせいが たす ことば・だい・なまえ）では、
// あたらしく いれた もじの うち つかえない もじ（かんじ・ABC など）を とりのぞいて しらせ、その ひとの もじ（ひらがな／カタカナ）と はんかくの すうじに そろえる。
// にほんごの へんかんの とちゅう（isComposing）は さわらず、きまった あとに なおす。
// まえから ある もじ（ふるい データの かんじ など）は、ほかの ところを なおしても けさない（あたらしく はいった ところ だけ しらべる）
const KANA_ONLY = '#freeText,#docEdit,#optTitle,#profName,[data-kana]';
// つかえる もじ：もじとうろく できる もじ（ひらがな・カタカナ・すうじ・、。ー！？「」）と くとうてんの かわり（，．,.!?）・くうはく・かいぎょう
const NOT_OK = /[^\u3041-\u3094\u30A1-\u30F4ー0-9０-９、。，．,.！？!?「」 　\n]|[ゐゑヰヱ]/gu;
const stripKanji = s => s.replace(NOT_OK, '');
// くとうてんの かわり（, . ! ? ， ．）も もじとうろく できる かたち（、。！？）に そろえる（どれも 1もじ どうし）
const PUNCT_ALT = { ',': '、', '，': '、', '.': '。', '．': '。', '!': '！', '?': '？' };
const fieldConv = s => halfNum(dsp(s)).replace(/[,，.．!?]/g, c => PUNCT_ALT[c]);
// まえから ある もじ（ふるい データの かんじ など）は「アプリが らんに いれた ときの なかみ」から かぞえて おぼえる（t._old）。
// その かずまでは、けして とりけした とき・はなれて もどった あと・なんかい うった あとでも そのまま みとめる。
// それを こえる つかえない もじ（あたらしく うった かんじ など）だけ、あたらしく はいった ところから とる。
// アプリが らんの なかみを かえた（べつの ひと・べつの ぶんしょう）ときは、おぼえなおす
const BAD1 = new RegExp(NOT_OK.source, 'u');
const badCount = s => { const m = new Map(); for (const c of s) if (BAD1.test(c)) m.set(c, (m.get(c) || 0) + 1); return m; };
function rebase(t) { const v = t.value.normalize('NFC'); t._ok = v; t._old = badCount(v); }
// つかえない もじは、まえから ある かず（old）から、そとがわで つかって いる かず（used）を ひいた ぶん だけ のこす
function cleanMid(mid, old, used) { const u = new Map(used); let out = ''; for (const c of mid) { if (BAD1.test(c)) { const n = u.get(c) || 0; if ((old.get(c) || 0) <= n) continue; u.set(c, n + 1); } out += c; } return out; }
let kanjiToastAt = 0;
// かわる まえの なかみ（beforeinput・へんかんの はじまり）。アプリが なかみを かえて いたら おぼえなおす
function markPre(e) {
  const t = e.target; if (!t.matches || !t.matches(KANA_ONLY)) return;
  if (e.type === 'compositionstart') t._comp = true; else if (t._comp || e.isComposing) return;
  if (t._ok == null || t.value.normalize('NFC') !== t._ok) rebase(t);
  t._pre = t.value;
}
function dropKanji(e) {
  const t = e.target;
  if (!t.matches || !t.matches(KANA_ONLY) || (e.type === 'input' && e.isComposing)) return;
  if (e.type === 'compositionend') t._comp = false;
  if (!t._old) t._old = new Map();
  const v0 = t.value, v = v0.normalize('NFC'), prev = (t._pre != null ? t._pre : t._ok != null ? t._ok : '').normalize('NFC');
  t._pre = null;
  // あたらしく はいった ところ（まえと おなじ はじめ・おわりを のぞいた まんなか）
  let pre = 0; while (pre < v.length && pre < prev.length && v[pre] === prev[pre]) pre++;
  // さかいめを 1もじの とちゅう（2つで 1もじの かんじ など）に しない
  const hi = c => c >= 0xD800 && c <= 0xDBFF, lo = c => c >= 0xDC00 && c <= 0xDFFF;
  if (pre > 0 && hi(v.charCodeAt(pre - 1))) pre--;
  let suf = 0; while (suf < v.length - pre && suf < prev.length - pre && v[v.length - 1 - suf] === prev[prev.length - 1 - suf]) suf++;
  if (suf > 0 && lo(v.charCodeAt(v.length - suf))) suf--;
  const mid = v.slice(pre, v.length - suf), used = badCount(v.slice(0, pre) + v.slice(v.length - suf)), cm = cleanMid(mid, t._old, used);
  const nv = fieldConv(v.slice(0, pre) + cm + v.slice(v.length - suf));
  t._ok = nv;
  if (nv === v0) return;
  // カーソル：けした かずだけ もどす（ひらがな⇔カタカナ・はんかくの すうじ・くとうてんは おなじ ながさ）
  let at = nv.length;
  if (t.selectionStart != null) {
    const c = v0.slice(0, t.selectionStart).normalize('NFC').length;
    at = c <= pre ? c : c >= v.length - suf ? c - (mid.length - cm.length) : pre + cleanMid(v.slice(pre, c), t._old, used).length;
  }
  t.value = nv;
  try { t.setSelectionRange(at, at); } catch (_) {}
  if (cm !== mid && Date.now() - kanjiToastAt > 2500) { kanjiToastAt = Date.now(); toast(`かんじや ABC は つかえません。${KATA() ? 'カタカナ' : 'ひらがな'}・すうじで うってね`); }
  // へんかんが おわった ときは、アプリの ほうにも あたらしい なかみを しらせる
  if (e.type === 'compositionend') t.dispatchEvent(new Event('input', { bubbles: true }));
}
// フォーカスした とき：アプリが なかみを かえて いたら おぼえなおす（おなじ さぎょうの なかで はなれて もどった だけなら そのまま）
document.addEventListener('focusin', e => { const t = e.target; if (t.matches && t.matches(KANA_ONLY) && (t._ok == null || t.value.normalize('NFC') !== t._ok)) rebase(t); }, true);
document.addEventListener('beforeinput', markPre, true);
document.addEventListener('compositionstart', markPre, true);
// とらえる だんかい（capture）で さきに なおすので、それぞれの らんの しょりは なおした なかみを うけとる
document.addEventListener('input', dropKanji, true);
document.addEventListener('compositionend', dropKanji, true);

// ===== 保存（localStorage） =====
const STORE_KEY = 'bunshoMaker.v1';
let DB;
const DEF_SET = { romaji: 'kunrei', guide: 2, finger: false, sound: true, keyCase: 'lower', glyphModel: true, input: 'kana', showBig: false, chunk: 'auto', speakPick: true, advance: 'auto09', script: 'hira', scriptKey: true };
const S = () => P().settings || (P().settings = Object.assign({}, DEF_SET));
function newProfile(name) {
  return { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, glyphs: {}, words: {}, doc: [], works: [] };
}
// こわれた データは けさずに「.broken.じこく」に のこす（なんかいぶんでも。まえの ものを うわがき しない）。
// のこせない・よみだせない ときは、もとの データを うわがき しないよう ほぞんを とめる
const BROKEN_PREFIX = STORE_KEY + '.broken';
// HELD_RAW：のこせなかった もとの データ（メモリに だけ ある。せっていから ファイルに とりだせる）
let saveBlocked = false, LOAD_FIXES = [], HELD_RAW = null, READ_FAIL = false;
function brokenKeys() {
  const ks = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(BROKEN_PREFIX)) ks.push(k); } } catch (e) {}
  return ks.sort();
}
function keepBroken(raw) {
  try {
    if (brokenKeys().some(k => localStorage.getItem(k) === raw)) return true;
    let k = BROKEN_PREFIX + '.' + Date.now(); while (localStorage.getItem(k) !== null) k += '_';
    localStorage.setItem(k, raw); return true;
  } catch (e) { saveBlocked = true; return false; }
}
// ひとの データとして つかえない もの（null・かず・はいれつ・id が ない）
const badProfile = p => !p || typeof p !== 'object' || Array.isArray(p) || typeof p.id !== 'string';
function loadDB() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { saveBlocked = READ_FAIL = true; LOAD_FIXES = ['ほぞんした データを よみだせませんでした（うわがき しないよう ほぞんを とめています）']; }
  try { DB = JSON.parse(raw); } catch (e) { DB = null; }
  const ok = DB && typeof DB === 'object' && !Array.isArray(DB) && Array.isArray(DB.profiles);
  const fixes = [];
  if (raw && !ok) fixes.push('ほぞんした データの かたちが こわれていました');
  if (!ok) DB = { profiles: [] };
  const nBad = DB.profiles.filter(badProfile).length;
  if (nBad) fixes.push(`ひとの データ ${nBad}こが こわれていて よみこめませんでした`);
  // ほぞん して あった データも おなじ きまりで しらべる（せっていは ひとごと。まえの ぜんたい せっていは はじめの あたい）
  FIXES = fixes;
  DB.profiles = DB.profiles.filter(p => !badProfile(p)).map(p => cleanProfile(Object.assign({}, p, { settings: Object.assign({}, DB.settings || {}, p.settings) }))).filter(Boolean);
  FIXES = null;
  // なにかを なおした・すてた ときは、もとの データを そのまま のこす
  if (raw && fixes.length && !keepBroken(raw)) HELD_RAW = raw;
  LOAD_FIXES = LOAD_FIXES.concat(fixes);
  if (!DB.profiles.length) { const p = newProfile('ためしのひと'); p.settings = cleanSettings({}); DB.profiles = [p]; }
  if (!DB.profiles.some(p => p.id === DB.current)) DB.current = DB.profiles[0].id;
  DB.role = DB.role === 'student' ? 'student' : 'teacher';
}
// ほぞんに しっぱい したら、きえない おしらせを だす（つぎに せいこう するまで）
function saveBanner(on) {
  let b = document.getElementById('saveErr');
  if (!on) { if (b) b.remove(); return; }
  if (b) return;
  b = el('div', { id: 'saveErr', class: 'saveerr', role: 'alert' }, READ_FAIL
    ? '⚠ ほぞんした データを よみだせないので、うわがき しないよう ほぞんを とめています。ページを とじないで、「せってい」を みてください。'
    : saveBlocked
    ? '⚠ まえの データが こわれていて、まもる ために ほぞんを とめています。「せってい」の「こわれた データを ファイルに とりだす」を してください。'
    : '⚠ ほぞんできませんでした。iPad の ようりょうが いっぱいかも しれません。「せってい → バックアップ」で コードを ファイルに とりだし、いらない さくひんや しゃしんを けしてから、もういちど ためしてください。');
  document.body.append(b);
}
function saveDB() {
  if (saveBlocked) { saveBanner(true); return false; }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); saveBanner(false); return true; }
  catch (e) { saveBanner(true); return false; }
}
const P = () => DB.profiles.find(p => p.id === DB.current) || DB.profiles[0];

