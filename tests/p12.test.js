// おと：でんしおん・よみあげ・なし の 3つから えらぶ。よみあげ では ただしく うてた もじを よむ
const { test, eq, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');
// よみあげ と でんしおん を きろくする（ほんとうの こえ・おとは ださない）
const spy = () => {
  window.__said = []; window.__beeps = [];
  speak = t => __said.push(t);
  window.AudioContext = window.webkitAudioContext = function () {
    return { currentTime: 0, destination: {}, createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: x => x }),
      createOscillator: () => { const o = { frequency: {}, connect: x => x, start() { __beeps.push(o.frequency.value); }, stop() {} }; return o; } };
  };
  audioCtx = null;
};

test('12-1 おと＝よみあげ（かな）：うてた もじを よむ、゛の もじは ゛まで うって できた もじを よむ（か は よまない）、まちがいは ひくい おとだけ', async b => {
  const pg = await openPage(b);
  await pg.evaluate(spy);
  await pg.evaluate(() => { S().input = 'kana'; S().script = 'kata'; S().sound = 'voice'; P().doc = ['がー。']; saveDB(); show('type'); });
  eq(await pg.evaluate(() => $('#optSound').value), 'voice');
  // あ（まちがい）→ か → ゛（が）→ ー → 。
  for (const k of ['あ', 'か', 'MOD', 'ー', '。']) await pg.locator(`#kb .key[data-k="${k}"]`).dispatchEvent('pointerdown');
  eq(await pg.evaluate(() => [__said, __beeps, ty.done, ty.miss]), [['ガ', 'のばす ぼう', 'まる'], [220], true, 1]);
  noErr(pg);
});

test('12-2 おと＝よみあげ（ローマじ）：もじが できた ときに よむ。でんしおん・なし は よまない', async b => {
  const pg = await openPage(b);
  await pg.evaluate(spy);
  await pg.evaluate(() => { S().input = 'roma'; S().script = 'hira'; S().sound = 'voice'; P().doc = ['かき']; saveDB(); show('type'); });
  const typeAll = () => pg.evaluate(() => { startTyping(); __said = []; __beeps = []; ['k', 'a', 'k', 'i'].forEach(k => press(k)); return [__said, __beeps.length, ty.done]; });
  eq(await typeAll(), [['か', 'き'], 0, true], 'よみあげ');
  await pg.evaluate(() => { S().sound = 'beep'; });
  eq(await typeAll(), [[], 5, true], 'でんしおん');
  await pg.evaluate(() => { S().sound = 'off'; });
  eq(await typeAll(), [[], 0, true], 'なし');
  noErr(pg);
});

test('12-3 おとの せっていは こどもごとに のこる。まえの データ（オン/オフ）は でんしおん/なし に なる', async b => {
  const pg = await openPage(b);
  await pg.evaluate(() => { S().input = 'kana'; show('type'); });
  await pg.selectOption('#optSound', 'voice');
  await pg.reload(); await pg.waitForTimeout(300);
  eq(await pg.evaluate(() => S().sound), 'voice');
  eq(await pg.evaluate(() => [cleanSettings({ sound: true }).sound, cleanSettings({ sound: false }).sound, cleanSettings({ sound: 'x' }).sound, cleanSettings({}).sound]), ['beep', 'off', 'beep', 'beep']);
  noErr(pg);
});
