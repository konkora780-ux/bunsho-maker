// ぜんぶの テストを うごかす：node tests/run.js（e2e を とばす ときは --quick）
const { run } = require('./helpers');
const { execSync } = require('child_process');
execSync('node ' + require('path').join(__dirname, '..', 'tools', 'build.js') + ' --check', { stdio: 'inherit' });
require('./features.test');
require('./stage1.test');
require('./p1.test');
require('./p0b.test');
if (!process.argv.includes('--quick')) require('./e2e.test');
run().then(fail => { console.log(fail ? `\n${fail}こ しっぱい` : '\nぜんぶ OK'); process.exit(fail ? 1 : 0); });
