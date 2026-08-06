# Chabad in South Beach — ChabadOne redesign overlay

Recodes the Claude Design homepage (`Chabad South Beach Homepage.dc.html`) as a
CSS/JS override layer for www.chabadinsouthbeach.com (ChabadOne CMS). The CMS
stays untouched; the entire redesign ships as two paste blocks:

| File | Paste into | Budget |
|---|---|---|
| `dist/header-code.html` | ChabadOne Admin → **Custom Header Code** (below the existing Google Ads gtag block — keep that) | < 100 KB |
| `dist/footer-code.html` | ChabadOne Admin → **Custom Footer Code** | < 50 KB |

## Layout

- `src/style.css` — the whole override layer, commented, organized by section.
- `src/script.js` — DOM restructuring (hero → Swiper 11, events → card rail,
  candle widget → utility bar + This-Shabbat band, footer rebuild, mobile
  drawer, `PAGE_RULES` router). One IIFE, per-feature try/catch, no hardcoded
  CMS content.
- `build/build.js` — assembles + minifies the two dist blocks (`node build/build.js`),
  prints character counts.
- `test/` — local harness:
  - `test/pages/home.html`, `test/pages/register.html` — saved live-page sources
    (currently Wayback Machine snapshots; replace with fresh browser-saved
    source anytime).
  - `node test/build-preview.js` — injects both dist blocks into the saved pages
    and writes `test/preview-home.html` / `test/preview-register.html`. Open
    those in a browser to review. Root-relative CMS assets are rewritten to the
    Wayback Machine so stock CMS CSS/JS load like production.
- `ref/` — downloaded reference material (Venetian override layer, CMS
  stylesheets, raw page snapshots).

## Workflow

```
# edit src/style.css or src/script.js, then:
node build/build.js
node test/build-preview.js
# open test/preview-home.html in a browser
```

## Decisions flagged for review

1. **Logo** — `USE_MONOGRAM_LOGO` in `src/script.js` (top of file). `true`
   replaces the uploaded logo image with the design's arched menorah monogram
   (inline SVG). Set to `false` to keep the current logo image, restyled.
2. **Facebook like button** — the `#feedback_bar` like box that sat above the
   header is relocated into the footer next to the social icons (never hidden).
3. **Header search** — relocated by JS into the dark utility bar as a compact
   pill; hidden ≤1024px (the mobile drawer's bottom links include Search).
4. **Mission statement text** — the CMS text is typed in ALL CAPS; it is kept
   exactly as written. Retyping it in sentence case in the CMS admin would let
   the Welcome section match the design file's tone.
5. **Live markup source** — selectors were written against an Oct 2025 Wayback
   snapshot of the homepage and a Mar 2025 event-registration snapshot. Before
   pasting into ChabadOne, save the current page source from the browser into
   `test/pages/` and re-run the harness to confirm nothing shifted.
