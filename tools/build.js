// src/ の ぶひんを つなげて index.html を つくる（node tools/build.js）
// GitHub Pages は index.html だけを くばるので、できあがりは 1まいの ファイルに する
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const js = fs.readdirSync(path.join(src, 'js')).filter(f => f.endsWith('.js')).sort().map(f => read('js/' + f)).join('');
const html = read('head.html') + read('body.html') + '\n<script>\n' + js + '</script>\n' + '</body>\n</html>\n';
const out = path.join(root, 'index.html');
if (process.argv.includes('--check')) {
  // テスト用：index.html が src と おなじか しらべる
  if (fs.readFileSync(out, 'utf8') !== html) { console.error('index.html が src と ちがいます。node tools/build.js を うごかしてください'); process.exit(1); }
  console.log('index.html は src と おなじです');
} else { fs.writeFileSync(out, html); console.log('index.html を つくりました（' + Math.round(html.length / 1024) + 'KB）'); }
