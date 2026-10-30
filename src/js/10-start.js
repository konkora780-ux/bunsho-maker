// ===== はじめる =====
loadDB();
bindProfile();
$('#btnPrint').hidden = IN_FRAME;
renderWho();
applyRole();
show('make');
if (saveBlocked) saveBanner(true);
// ひらいた ときに なおした ことが あれば しらせる（くわしくは「せってい」）
if (LOAD_FIXES.length) toast('⚠ ほぞんした データの いちぶを なおしました。「せってい」で たしかめてください');
