// ===== はじめる =====
loadDB();
bindProfile();
$('#btnPrint').hidden = IN_FRAME;
renderWho();
applyRole();
show('make');
if (saveBlocked) saveBanner(true);
