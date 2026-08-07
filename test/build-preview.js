/**
 * Local test harness — applies the two dist blocks to saved copies of the
 * live site so the redesign can be reviewed before touching ChabadOne.
 *
 *   node build/build.js          (build dist blocks first)
 *   node test/build-preview.js   (then generate previews)
 *
 * Then open in a browser:
 *   test/preview-home.html       (homepage)
 *   test/preview-register.html   (event registration page)
 *
 * Saved page sources live in test/pages/ (refresh via browser Ctrl+U → save).
 * The CMS's own stylesheets are served from test/livecss/ — the EXACT current
 * files downloaded from the live site (static css is not Cloudflare-blocked):
 *   curl -A "<browser UA>" https://www.chabadinsouthbeach.com/css/<path>
 * Root-relative CSS links are rewritten to those local copies; any other
 * root-relative asset falls back to the Wayback Machine.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PAGES = path.join(__dirname, 'pages');

// live css files present in test/livecss/, keyed by their /css/ path prefix
const LIVE_CSS = {
  'css/fonts/font-awesome/font-awesome-5.css': 'font-awesome-5.css',
  'css/DefaultGrid.css': 'DefaultGrid.css',
  'css/Elements.css': 'Elements.css',
  'css/vendor/ds/tokens/sites.css': 'sites.css',
  'css/new/main.css': 'main.css',
  'css/global.css': 'global.css',
  'css/cco/home/widget-styles.css': 'widget-styles.css',
  'css/sites6/default-theme.css': 'default-theme.css',
  'css/old/global.css': 'old-global.css',
  'css/cco/home/default/prettyPhoto.min.css': 'prettyPhoto.min.css',
  'css/sections/events/events.css': 'events.css',
};

const PAGE_SET = [
  { src: 'home.html', out: 'preview-home.html', snapshot: '20251013120914' },
  { src: 'register.html', out: 'preview-register.html', snapshot: '20250317040018' },
  // open-event form page; demo sponsorship config is harness-only
  {
    src: 'register-open.html',
    out: 'preview-register-open.html',
    snapshot: '20251013120914',
    preFooter: `<script>
// exercise the REAL baked config for event 23338 (file:// URL cannot carry
// the event id, so only the id and the theme URL-match are shimmed)
window.SB_EVENT_ID = '23338';
window.SB_PAGE_THEMES = {
  'register-open': { accent: '#4A6752', accentDark: '#39503F', band: '#35493B', soft: '#F6ECE6' }
};
// show the Summary step (normally revealed after choosing a category)
window.addEventListener('load', function () {
  setTimeout(function () {
    var s = document.getElementById('SecondaryFormItems');
    if (s) s.classList.remove('hidden');
  }, 1200);
});
</scr` + `ipt>`,
  },
];

const headerBlock = fs.readFileSync(path.join(DIST, 'header-code.html'), 'utf8');
const footerBlock = fs.readFileSync(path.join(DIST, 'footer-code.html'), 'utf8');

for (const page of PAGE_SET) {
  const srcPath = path.join(PAGES, page.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`skip: ${page.src} not found in test/pages/`);
    continue;
  }
  let html = fs.readFileSync(srcPath, 'utf8');

  const archived = `https://web.archive.org/web/${page.snapshot}`;
  html = html.replace(/(href|src)="(\/[^"/][^"]*)"/g, (m, attr, url) => {
    const clean = url.replace(/^\//, '').split('?')[0];
    if (LIVE_CSS[clean]) return `${attr}="livecss/${LIVE_CSS[clean]}"`;
    return `${attr}="${archived}/https://www.chabadinsouthbeach.com${url}"`;
  });

  // Inject the blocks with replacement FUNCTIONS: a replacement string would
  // interpret $-patterns ($', $&…) inside the payload and corrupt it.
  html = html.replace(/<\/head>/i, () => `\n${headerBlock}\n</head>`);
  html = html.replace(/<\/body>/i, () => `\n${page.preFooter || ''}\n${footerBlock}\n</body>`);

  const outPath = path.join(__dirname, page.out);
  fs.writeFileSync(outPath, html);
  console.log(`wrote ${path.relative(ROOT, outPath)} (${(html.length / 1024).toFixed(0)} KB)`);
}
