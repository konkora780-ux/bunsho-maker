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
// カタカナ→ひらがな
const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const normText = s => kata2hira(s).replace(/!/g, '！').replace(/\?/g, '？').replace(/,/g, '、').replace(/\./g, '。');

// ===== 保存（localStorage） =====
const STORE_KEY = 'bunshoMaker.v1';
let DB;
const DEF_SET = { romaji: 'kunrei', guide: 2, finger: false, sound: true, keyCase: 'lower', glyphModel: true, input: 'kana', showBig: false, chunk: 'auto', speakPick: true, advance: 'auto09' };
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

