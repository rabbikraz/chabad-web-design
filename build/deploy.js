/**
 * One-command deploy:  node build/deploy.js "what changed"
 *
 * Builds dist/, commits everything, pushes to GitHub, then purges the
 * jsDelivr cache so the live site picks up dist/site.css + dist/site.js
 * within seconds. (The ChabadOne header/footer boxes only hold <link> and
 * <script> tags pointing at these files — they never need editing again.)
 */
'use strict';

const { execSync } = require('child_process');
const https = require('https');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REF = 'gh/rabbikraz/chabad-web-design@redesign';

function sh(cmd) {
  console.log('$ ' + cmd);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function purge(file) {
  return new Promise((resolve) => {
    https.get('https://purge.jsdelivr.net/' + REF + '/' + file, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        console.log('purge ' + file + ': ' + res.statusCode + ' ' + body.slice(0, 120));
        resolve();
      });
    }).on('error', (e) => { console.log('purge ' + file + ' failed: ' + e.message); resolve(); });
  });
}

(async function () {
  const msg = process.argv.slice(2).join(' ') || 'Site update';
  sh('node build/build.js');
  sh('git add -A');
  try {
    sh('git commit -m "' + msg.replace(/"/g, "'") + '"');
  } catch (e) {
    console.log('(nothing to commit — pushing/purging anyway)');
  }
  sh('git push');
  await purge('dist/site.css');
  await purge('dist/site.js');
  console.log('\nDeployed. Live within seconds; a viewer with a cached copy may need Ctrl+Shift+R.');
})();
