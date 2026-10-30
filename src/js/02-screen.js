// ===== 画面きりかえ =====
let currentView = 'make';
function show(v) {
  currentView = v;
  $$('section.view').forEach(s => s.hidden = s.id !== 'v-' + v);
  $$('#steps button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (v === 'make') renderMake();
  if (v === 'type') startTyping();
  if (v === 'finish') renderFinish();
  if (v === 'glyph') renderGlyphGrid();
  if (v === 'setting') renderSetting();
  window.scrollTo(0, 0);
}
$$('#steps button').forEach(b => b.addEventListener('click', () => show(b.dataset.v)));

// せんせい／じどうせいと モード：こどもが まちがえて かえないよう、ながおし（1.2びょう）で きりかえ
function applyRole() {
  const st = DB.role === 'student';
  document.body.classList.toggle('student', st);
  $('#roleLb').textContent = st ? '🧒 じどうせいと' : '🧑‍🏫 せんせい';
  $('#whoName').textContent = P().name;
  $('#steps button[data-v=glyph]').hidden = st && !SH().glyph;
  $('#steps button[data-v=type]').hidden = !practiceOn();
  if (st && (currentView === 'setting' || (currentView === 'glyph' && !SH().glyph) || (currentView === 'type' && !practiceOn()))) show('make');
  else if (currentView === 'make' || currentView === 'finish') show(currentView);
}
(() => {
  const b = $('#roleBtn'); let t = null;
  const cancel = () => { clearTimeout(t); t = null; b.classList.remove('press'); };
  let pd = 0;
  const flip = () => { DB.role = DB.role === 'student' ? 'teacher' : 'student'; saveDB(); applyRole();
    toast(DB.role === 'student' ? 'じどうせいと モードに しました' : 'せんせい モードに しました'); };
  // ながおし できない とき（キーボード・VoiceOver・スイッチコントロール）は、かくにん がめんで きりかえる
  b.addEventListener('click', () => {
    if (pd && Date.now() - pd < 3000) return;
    const to = DB.role === 'student' ? 'せんせい' : 'じどうせいと';
    const m = openModal(el('div', { class: 'regtitle' }, to + ' モードに しますか？'),
      el('div', { class: 'row' }, el('button', { class: 'btn main', onclick: () => { m.remove(); flip(); } }, 'はい、' + to + ' モードに する'), el('button', { class: 'btn', onclick: () => m.remove() }, 'やめる')));
  });
  b.addEventListener('pointerdown', e => {
    pd = Date.now();
    e.preventDefault(); b.classList.add('press');
    t = setTimeout(() => {
      cancel(); flip();
    }, 1200);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { if (t) { cancel(); toast('ながおし すると きりかわります'); } }));
  b.addEventListener('contextmenu', e => e.preventDefault());
})();
function renderWho() {
  const s = $('#whoSel'); s.innerHTML = '';
  DB.profiles.forEach(p => s.append(el('option', { value: p.id }, p.name)));
  s.value = DB.current;
  $('#whoName').textContent = P().name;
}
$('#whoSel').addEventListener('change', e => { DB.current = e.target.value; bindProfile(); saveDB(); show(currentView); toast(P().name + ' に かえました'); });

// ===== よみあげ =====
function speak(text, append) {
  try {
    if (!append) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch (e) { toast('よみあげが つかえません'); }
}

