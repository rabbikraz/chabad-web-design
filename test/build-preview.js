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
 * Saved page sources live in test/pages/. To refresh them, save the live
 * page source from a browser (Ctrl+U → save) into that folder as
 * home.html / register.html — or keep using the Wayback Machine copies.
 *
 * Root-relative asset URLs (/css/..., /scripts/...) are rewritten to the
 * Wayback Machine so the stock CMS styles/scripts load locally exactly the
 * way they do in production, without fighting Cloudflare.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PAGES = path.join(__dirname, 'pages');

// Wayback snapshot timestamps the saved pages came from
const PAGE_SET = [
  { src: 'home.html', out: 'preview-home.html', snapshot: '20251013120914' },
  { src: 'register.html', out: 'preview-register.html', snapshot: '20250317040018' },
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

  // Rewrite root-relative subresource URLs to the archived origin.
  const archived = `https://web.archive.org/web/${page.snapshot}`;
  html = html.replace(
    /(href|src)="(\/[^"/][^"]*)"/g,
    (m, attr, url) => `${attr}="${archived}/https://www.chabadinsouthbeach.com${url}"`
  );

  // Inject the header block right before </head> (after the gtag block,
  // exactly where ChabadOne places Custom Header Code).
  html = html.replace(/<\/head>/i, `\n${headerBlock}\n</head>`);

  // Inject the footer block right before </body> (Custom Footer Code).
  html = html.replace(/<\/body>/i, `\n${footerBlock}\n</body>`);

  const outPath = path.join(__dirname, page.out);
  fs.writeFileSync(outPath, html);
  console.log(`wrote ${path.relative(ROOT, outPath)} (${(html.length / 1024).toFixed(0)} KB)`);
}
