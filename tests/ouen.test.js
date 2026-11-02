// おうえん（えんぴつくん・できた ときの ⭐）：はじめは でない、せんせいが こどもごとに だす、よみこみで のこる、うごきを へらす ときは うごかない
const { test, eq, ok, openPage } = require('./helpers');
const noErr = pg => eq(pg.errs, [], 'がめんの エラー');

test('おうえん：はじめは えんぴつくんも ⭐も でない', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=make]');
  const r = await pg.evaluate(() => {
    $$('.tpl')[0].click();
    const before = [SH().buddy, SH().star, $$('#chooser .buddy').length, $$('#chooser .hint').length > 0];
    starPop(); return before.concat($$('.starpop').length);
  });
  eq(r, [false, false, 0, true, 0]);
  noErr(pg);
});

test('おうえん：だすと ①で ふきだしに いまの ヒント、⭐は 1つだけ でて きえる。ほぞん・よみこみで のこる', async b => {
  const pg = await openPage(b);
  await pg.click('#steps button[data-v=make]');
  const r = await pg.evaluate(async () => {
    SH().buddy = true; SH().star = true; saveDB();
    $$('.tpl')[0].click();
    const bub = $('#chooser .buddy .bubble'), txt = bub ? bub.textContent : '';
    const svg = $$('#chooser .buddy svg').length;
    starPop(); starPop();
    const n = $$('.starpop').length, label = $('.starpop').getAttribute('aria-hidden');
    await new Promise(r => setTimeout(r, 1600));
    const left = $$('.starpop').length;
    return [/を えらんでね$/.test(txt), svg, n, label, left];
  });
  eq(r, [true, 1, 1, 'true', 0]);
  await pg.reload(); await pg.waitForTimeout(300);
  eq(await pg.evaluate(() => [SH().buddy, SH().star]), [true, true], 'よみこみ ご');
  noErr(pg);
});

test('おうえん：うごきを へらす せっていでは ⭐は うごかない（その ばで きえるだけ）', async b => {
  const pg = await openPage(b, { reducedMotion: 'reduce' });
  const r = await pg.evaluate(() => {
    SH().star = true; starPop();
    const s = $('.starpop'), cs = getComputedStyle(s);
    return [cs.animationName, cs.transform];
  });
  eq(r[0], 'starfade');
  noErr(pg);
});
