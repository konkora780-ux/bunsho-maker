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
function loadDB() {
  try { DB = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { DB = null; }
  if (!DB || !Array.isArray(DB.profiles) || !DB.profiles.length) {
    const p = newProfile('ためしのひと');
    DB = { profiles: [p], current: p.id, settings: {} };
  }
  // せっていは ひと（じどうせいと）ごとに もつ。まえの ぜんたい せっていは はじめの あたいに つかう
  DB.profiles.forEach(p => { p.settings = Object.assign({}, DEF_SET, DB.settings || {}, p.settings); });
}
// ほぞんに しっぱい したら、きえない おしらせを だす（つぎに せいこう するまで）
function saveBanner(on) {
  let b = document.getElementById('saveErr');
  if (!on) { if (b) b.remove(); return; }
  if (b) return;
  b = el('div', { id: 'saveErr', class: 'saveerr', role: 'alert' }, '⚠ ほぞんできませんでした。iPad の ようりょうが いっぱいかも しれません。ほぞんした さくひんを PDF に して おくり、いらない さくひんを けしてから、もういちど ためしてください。');
  document.body.append(b);
}
function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); saveBanner(false); return true; }
  catch (e) { saveBanner(true); return false; }
}
const P = () => DB.profiles.find(p => p.id === DB.current) || DB.profiles[0];

