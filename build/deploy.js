/**
 * One-command deploy:  node build/deploy.js "what changed"
 *
 * Flow (version-pinned — see header-code-cdn.html):
 *   1. build dist/
 *   2. commit + push               → commit sha S now carries the new assets
 *   3. write dist/version.txt = S  → commit + push the pin
 *   4. best-effort jsDelivr purge of the @redesign fallback URLs
 *
 * The ChabadOne boxes read version.txt from raw.githubusercontent.com
 * (fresh within ~5 min) and load site.css/site.js pinned to @S — immutable
 * jsDelivr URLs that can never be stale-wrong. jsDelivr's mutable @redesign
 * URLs proved regionally stale despite successful purges; they remain only
 * as the bootstrap's fallback.
 */
'use strict';

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REF = 'gh/rabbikraz/chabad-web-design@redesign';

function sh(cmd, opts) {
  console.log('$ ' + cmd);
  return execSync(cmd, Object.assign({ cwd: ROOT, stdio: 'pipe' }, opts)).toString().trim();
}

function purge(file) {
  return new Promise((resolve) => {
    https.get('https://purge.jsdelivr.net/' + REF + '/' + file, (res) => {
      res.resume();
      res.on('end', () => { console.log('purge ' + file + ': ' + res.statusCode); resolve(); });
    }).on('error', () => resolve());
  });
}

(async function () {
  const msg = (process.argv.slice(2).join(' ') || 'Site update').replace(/"/g, "'");
  sh('node build/build.js');
  sh('git add -A');
  try { sh('git commit -m "' + msg + '"'); } catch (e) { console.log('(nothing new to commit)'); }
  sh('git push');
  const sha = sh('git rev-parse HEAD');
  fs.writeFileSync(path.join(ROOT, 'dist', 'version.txt'), sha + '\n');
  sh('git add dist/version.txt');
  try { sh('git commit -m "Pin assets to ' + sha.slice(0, 10) + '"'); } catch (e) { }
  sh('git push');
  await purge('dist/site.css');
  await purge('dist/site.js');
  await purge('dist/version.txt');
  console.log('\nDeployed and pinned to ' + sha.slice(0, 10) +
    '. Browsers pick it up within ~5-10 minutes; Ctrl+Shift+R for instant.');
})();
