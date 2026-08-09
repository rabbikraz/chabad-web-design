/**
 * Wrap each Tourist/ fragment in the live redesign shell so the re-skinned
 * pages can be reviewed exactly as they will look inside ChabadOne.
 *
 *   node build/build.js && node test/build-tourist-preview.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const header = fs.readFileSync(path.join(ROOT, 'dist', 'header-code.html'), 'utf8');
const footer = fs.readFileSync(path.join(ROOT, 'dist', 'footer-code.html'), 'utf8');
const DIR = path.join(ROOT, 'Tourist');

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  const fragment = fs.readFileSync(path.join(DIR, file), 'utf8');
  const slug = file
    .replace(/^Tourist Information ?-? ?/, '')
    .replace(/\.html$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'index';

  const page =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    header +
    '</head><body class="lang_en dir_ltr cco_body sites-article">' +
    '<div id="content"><div id="BodyContainer" class="wrapper">' +
    '<div class="body_wrapper no-hero-image clearfix">' +
    '<div class="co_content_container clearfix" id="co_content_container">' +
    fragment +
    '</div></div></div></div>' +
    footer +
    '</body></html>';

  const out = path.join(__dirname, `preview-tourist-${slug}.html`);
  fs.writeFileSync(out, page);
  console.log(`wrote ${path.relative(ROOT, out)} (${(page.length / 1024).toFixed(0)} KB)`);
}
