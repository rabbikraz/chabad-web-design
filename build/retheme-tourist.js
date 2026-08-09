/**
 * Re-skin the standalone Tourist/ fragments to the SoBe redesign palette.
 *
 *   node build/retheme-tourist.js
 *
 * ONLY touches appearance: color literals, font families, and (for the
 * hero bands) border-radius/shadow so they read as cards on the cream
 * page instead of full-bleed slabs. Markup, ids, classes, copy, links,
 * and every line of JS are left exactly as they were.
 *
 * Colours resolve through CSS vars so these fragments follow the live
 * theme if it is ever retuned; the literal after the comma is the
 * fallback for the CMS editor preview, where our header block is absent.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'Tourist');

/* svg data-URIs can't hold var() — plain hex, and these run first so the
   %23-escaped forms are consumed before the bare "#rrggbb" pass */
const URI_COLORS = [
  ['%231e3a8a', '%2317656B'],
  ['%230f172a', '%23072026'],
  ['%231a365d', '%23072026'],
  ['%23c29d59', '%23C08A2E'],
  ['%23c9a227', '%23C08A2E'],
  ['%23718096', '%238A5F16'],
];

/* navy/slate/blue-gold source palette -> cream/teal/gold */
const COLORS = [
  // brand blues -> teal
  ['#1e3a8a', 'var(--sb-teal, #17656B)'],
  ['#1a365d', 'var(--sb-teal-900, #072026)'],
  ['#0f172a', 'var(--sb-teal-900, #072026)'],
  ['#2c5282', 'var(--sb-teal-600, #12565C)'],
  ['#2b6cb0', 'var(--sb-teal, #17656B)'],
  ['#3182ce', 'var(--sb-teal, #17656B)'],
  ['#4299e1', 'var(--sb-teal-300, #7CAFAF)'],
  ['#ebf8ff', 'var(--sb-teal-100, #DDEAE9)'],
  ['#bee3f8', 'var(--sb-teal-200, #B4D1D0)'],
  // golds -> our accent
  ['#c29d59', 'var(--sb-accent, #C08A2E)'],
  ['#c9a227', 'var(--sb-accent, #C08A2E)'],
  ['#b7791f', 'var(--sb-accent-600, #A97620)'],
  ['#d69e2e', 'var(--sb-accent, #C08A2E)'],
  ['#f6e05e', 'var(--sb-accent-300, #E2C179)'],
  ['#fffaf0', 'var(--sb-accent-100, #F8EDD6)'],
  ['#fefcbf', 'var(--sb-accent-100, #F8EDD6)'],
  // neutrals -> cream surfaces + ink
  ['#f8fafc', 'var(--sb-bg, #FBF5E9)'],
  ['#f7fafc', 'var(--sb-bg, #FBF5E9)'],
  ['#edf2f7', 'var(--sb-surface, #F3E8D3)'],
  ['#f1f5f9', 'var(--sb-surface, #F3E8D3)'],
  ['#e2e8f0', 'var(--sb-divider, rgba(23,35,46,.14))'],
  ['#cbd5e1', 'var(--sb-accent-200, #EFDAAE)'],
  ['#cbd5e0', 'var(--sb-accent-200, #EFDAAE)'],
  ['#1e293b', 'var(--sb-text, #17232E)'],
  ['#2d3748', 'var(--sb-text, #17232E)'],
  ['#334155', 'rgba(23,35,46,.82)'],
  ['#4a5568', 'rgba(23,35,46,.72)'],
  ['#475569', 'rgba(23,35,46,.7)'],
  ['#64748b', 'rgba(23,35,46,.6)'],
  ['#718096', 'rgba(23,35,46,.6)'],
  ['#a0aec0', 'rgba(23,35,46,.45)'],
  ['#94a3b8', 'rgba(23,35,46,.45)'],
];

/* card/panel fills. Bare `#ffffff` is left alone elsewhere because the
   same literal is used for text sitting on the dark hero bands. */
const SURFACES = [
  [/background:\s*#ffffff\b/gi, 'background: var(--sb-surface, #F3E8D3)'],
  [/background:\s*#fff\b/gi, 'background: var(--sb-surface, #F3E8D3)'],
  [/background:\s*white\b/gi, 'background: var(--sb-surface, #F3E8D3)'],
  [/background-color:\s*#ffffff\b/gi, 'background-color: var(--sb-surface, #F3E8D3)'],
  [/background-color:\s*#fff\b/gi, 'background-color: var(--sb-surface, #F3E8D3)'],
  [/background-color:\s*white\b/gi, 'background-color: var(--sb-surface, #F3E8D3)'],
];

const FONTS = [
  [/'Playfair Display',\s*serif/g, "var(--sb-font-heading, 'Marcellus', serif)"],
  [/'Playfair Display'/g, "'Marcellus'"],
  [/'Outfit',\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*Roboto,\s*sans-serif/g,
    "var(--sb-font-body, 'Figtree', sans-serif)"],
  [/'Outfit',\s*sans-serif/g, "var(--sb-font-body, 'Figtree', sans-serif)"],
  [/'Inter',\s*-apple-system,\s*sans-serif/g, "var(--sb-font-body, 'Figtree', sans-serif)"],
  [/'Inter',\s*sans-serif/g, "var(--sb-font-body, 'Figtree', sans-serif)"],
  [/'Outfit'/g, "'Figtree'"],
  [/'Inter'/g, "'Figtree'"],
];

/* google-fonts requests: swap the families we no longer use */
const FONT_URLS = [
  [/family=Outfit:wght@[^&'"]*/g, 'family=Figtree:wght@300;400;500;600;700'],
  [/family=Playfair\+Display:ital,wght@[^&'"]*/g, 'family=Marcellus'],
  [/family=Playfair\+Display:wght@[^&'"]*/g, 'family=Marcellus'],
  [/family=Inter:wght@[^&'"]*/g, 'family=Figtree:wght@300;400;500;600;700'],
];

/* hero bands: rounded + shadowed so they sit as cards on the cream page
   rather than full-bleed colour slabs. Keyed to each fragment's own
   header rule so nothing else is affected. */
const CARD_HEADERS = [
  '.kosher-wrapper .header-section',
  '.attractions-wrapper .header-section',
  '.mikvah-eruv-wrapper .header-section',
  '.minyan-schedule-wrapper .header-section',
  '.tourist-wrapper .header-section',
  '.hotels-wrapper .header-section',
];
const CARD_DECL =
  '\n            border-radius: var(--sb-radius-lg, 18px);' +
  '\n            box-shadow: var(--sb-shadow-md, 0 10px 28px rgba(23,35,46,.12));';

function cardifyHeaders(src) {
  for (const sel of CARD_HEADERS) {
    const i = src.indexOf(sel + ' {');
    if (i === -1) continue;
    const open = src.indexOf('{', i);
    const close = src.indexOf('}', open);
    if (open === -1 || close === -1) continue;
    const block = src.slice(open, close);
    if (block.indexOf('border-radius') !== -1) continue; // already carded
    src = src.slice(0, close) + CARD_DECL + '\n        ' + src.slice(close);
  }
  return src;
}

/* the wrappers set width:100% and full-bleed the hero; give the fragment
   a little breathing room so the rounded band reads as a card */
function padWrappers(src) {
  return src.replace(
    /(\.(?:kosher|attractions|mikvah-eruv|minyan-schedule|tourist|hotels)-wrapper \{)/g,
    '$1\n            padding: 0 clamp(0px, 2vw, 24px);'
  );
}

let changed = 0;
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  const full = path.join(DIR, file);
  const before = fs.readFileSync(full, 'utf8');
  let src = before;

  for (const [from, to] of URI_COLORS) src = src.split(from).join(to);
  for (const [from, to] of FONT_URLS) src = src.replace(from, to);
  for (const [from, to] of FONTS) src = src.replace(from, to);
  for (const [from, to] of SURFACES) src = src.replace(from, to);
  for (const [from, to] of COLORS) {
    src = src.replace(new RegExp(from, 'gi'), to);
  }
  src = cardifyHeaders(src);
  src = padWrappers(src);

  if (src !== before) {
    fs.writeFileSync(full, src);
    changed++;
    console.log(`themed  ${file}  (${before.length} -> ${src.length} chars)`);
  } else {
    console.log(`no change  ${file}`);
  }
}
console.log(`\n${changed} file(s) updated`);
