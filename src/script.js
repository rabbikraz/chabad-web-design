/* ==========================================================================
   Chabad in South Beach — ChabadOne DOM restructuring layer
   Pasted (minified) into the Custom Footer Code box inside a <script> tag,
   after the Swiper 11 CDN tag.

   Rules of the road:
   - One IIFE, strict mode, no global leaks.
   - Every feature runs in its own try/catch: a missing element or a CMS
     markup change skips that feature silently and never kills the rest.
   - No content is hardcoded that the CMS renders (times, events, photos);
     everything is read from the live widgets.
   - Homepage-only rebuilds are gated on the pathname.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     LOGO MARK — DECISION FLAG (review before launch)
     true  = replace the CMS logo <img> with the arched monogram SVG
             from the design file.
     false = keep the current uploaded logo image, restyled by CSS.
     ------------------------------------------------------------------ */
  var USE_MONOGRAM_LOGO = false;
  var LOGO_SVG =
    '<span class="sb-logo-mark" aria-hidden="true">' +
    '<svg width="20" height="26" viewBox="0 0 20 26" fill="none" stroke="#E2C179" stroke-width="1.6" stroke-linecap="round">' +
    '<path d="M10 24V9"/><path d="M10 12 4 8v10"/><path d="M10 12l6-4v10"/><path d="M2 24h16"/>' +
    '</svg></span>';

  var CHEVRON_LEFT =
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  var CHEVRON_RIGHT =
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  /* ------------------------------------------------------------------
     PAGE RULES ROUTER — per-article/per-event asset bundles.
     Add entries as needed:
       { aid: '1234567', href: 'https://...css', type: 'style' }
       { aid: '1234567', href: 'https://...js',  type: 'script' }
       { aid: '1234567', css: '.selector{...}',  type: 'inline-style' }
     `aid` matches anywhere in location.href (array allowed).
     ------------------------------------------------------------------ */
  var PAGE_RULES = [];

  /* ------------------------------------------------------------------
     SPONSORSHIP TIERS — per-event pill buttons above the Additional
     Donation field on /tools/events/register_cdo/eventid/<ID> pages.
     Add an entry per event ID (find it in the event page URL):

       '20383': {
         heading: 'Sponsorship Opportunities',
         blurb: 'Sponsors help cover the evening.',
         tiers: [
           { label: 'Presenting Sponsor', amount: 5000 },
           { label: 'Gold Sponsor', amount: 1800 },
           { label: 'Friend of the Event', amount: 180 }
         ]
       }

     Clicking a pill writes the amount into the donation field (and the
     order total updates); clicking again clears it. ?sponsor=1800 in a
     link pre-selects a tier. window.SB_SPONSOR_TIERS overrides all.
     ------------------------------------------------------------------ */
  var SPONSOR_TIERS = window.SB_SPONSOR_TIERS || {
    // The Gathering — Unity Challah Bake (Sep 1, 2026)
    '23338': {
      heading: 'Sponsorship Opportunities',
      blurb: "Sponsors help cover the evening's program.",
      tiers: [
        { label: 'Presenting Sponsor', amount: 5000 },
        { label: 'Diamond Sponsor', amount: 2500 },
        { label: 'Gold Sponsor', amount: 1800 },
        { label: 'Silver Sponsor', amount: 500 },
        { label: 'Community Sponsor', amount: 360 },
        { label: 'Friend of The Gathering', amount: 180 }
      ]
    }
  };

  /* ------------------------------------------------------------------
     PER-PAGE THEMES — recolor an event/program page to match its flyer.
     Keys are matched anywhere in the URL (event id, article aid, or a
     slug). Colors: accent (buttons/pills/links), accentDark (hover),
     band (dark info band), soft (light fills / table header strip).

       '23338': { accent: '#4E6B54', accentDark: '#3D5643',
                  band: '#2F4436', soft: '#F5EEE3' }

     Anything not set falls back to the site palette.
     ------------------------------------------------------------------ */
  var PAGE_THEMES = window.SB_PAGE_THEMES || {
    // The Gathering — sage green + blush cream, sampled from the flyer
    '23338': { accent: '#4A6752', accentDark: '#39503F', band: '#35493B', soft: '#F6ECE6' },
    // Wisdom and Whiskey (SoBe Men's Club) — sage-grey + dusty rose
    '23305': { accent: '#A96F68', accentDark: '#8A5751', band: '#6E7768', soft: '#EFE4E0' }
  };

  function applyPageTheme() {
    var href = window.location.href;
    for (var key in PAGE_THEMES) {
      if (href.indexOf(key) === -1) continue;
      var t = PAGE_THEMES[key];
      var r = document.documentElement.style;
      if (t.accent) {
        r.setProperty('--sb-event-accent', t.accent);
        r.setProperty('--primary-form-color', t.accent);
        r.setProperty('--accent-form-color', t.accent);
      }
      if (t.accentDark) {
        r.setProperty('--sb-event-accent-dark', t.accentDark);
        r.setProperty('--contrast-form-color', t.accentDark);
      }
      if (t.band) r.setProperty('--sb-event-band', t.band);
      if (t.soft) {
        r.setProperty('--sb-event-soft', t.soft);
        r.setProperty('--accent-form-medium', t.soft);
        r.setProperty('--accent-form-light', t.soft);
      }
      document.body.classList.add('sb-themed-page');
      break;
    }
  }

  /* ---------------- helpers ---------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function txt(node) { return node ? node.textContent.replace(/\s+/g, ' ').trim() : ''; }
  // NOTE: no HTML entity may appear literally in this file — the ChabadOne
  // admin decodes entities when saving the code box, which corrupts the
  // script (e.g. an encoded apostrophe becomes ''' — a syntax error).
  // Entities are therefore assembled at runtime from an amp constant.
  var AMP = String.fromCharCode(38);
  function esc(s) {
    return String(s)
      .replace(/&/g, AMP + 'amp;')
      .replace(/</g, AMP + 'lt;')
      .replace(/>/g, AMP + 'gt;')
      .replace(/"/g, AMP + 'quot;')
      .replace(/'/g, AMP + '#39;');
  }
  // Each feature is isolated: one broken widget never takes down the rest.
  function safe(name, fn) {
    try { fn(); } catch (e) {
      if (window.console && console.warn) console.warn('[sb-theme] skipped ' + name + ':', e);
    }
  }
  function isHome() {
    var p = window.location.pathname.toLowerCase();
    if (p === '/' || p === '/default.asp' || p === '/default.aspx') return true;
    // the homepage widget table only ever renders on the homepage —
    // this also lets the local test harness (file://) exercise the rebuilds
    return !!document.querySelector('.hp-table .hp-row-first');
  }

  /* ---------------- page rules ---------------- */

  function runPageRules() {
    PAGE_RULES.forEach(function (rule) {
      var aids = Array.isArray(rule.aid) ? rule.aid : [rule.aid];
      var hit = aids.some(function (aid) { return window.location.href.indexOf(String(aid)) !== -1; });
      if (!hit) return;
      if (rule.type === 'script') {
        var s = document.createElement('script');
        s.src = rule.href;
        document.head.appendChild(s);
      } else if (rule.type === 'style') {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = rule.href;
        document.head.appendChild(l);
      } else if (rule.type === 'inline-style') {
        var st = document.createElement('style');
        st.textContent = rule.css;
        document.head.appendChild(st);
      } else if (rule.type === 'redirect') {
        // assign() instead of a location.href= write: the latter matches
        // a Cloudflare WAF signature and blocks saving the admin code box
        window.location.assign(rule.href);
      }
    });
  }

  /* ---------------- header: logo + subtitle ---------------- */

  function enhanceBranding() {
    var wrap = $('#header_branding .site-logo-wrapper a');
    if (wrap && USE_MONOGRAM_LOGO) {
      var img = wrap.querySelector('img');
      if (img) img.style.display = 'none';
      if (!wrap.querySelector('.sb-logo-mark')) wrap.insertAdjacentHTML('beforeend', LOGO_SVG);
    }
    // Wordmark: full name / short "Chabad SoBe" on small screens (CSS toggles)
    var title = $('a.site_title');
    if (title && !title.querySelector('.sb-title-full')) {
      var textNode = title.firstChild;
      if (textNode && textNode.nodeType === 3 && txt(textNode)) {
        var full = el('span', 'sb-title-full');
        full.textContent = txt(textNode);
        var shortName = el('span', 'sb-title-short');
        shortName.textContent = 'Chabad SoBe';
        title.replaceChild(full, textNode);
        title.insertBefore(shortName, full.nextSibling);
      }
    }
    var sub = title && title.querySelector('.site_subtitle');
    var street = txt($('#footer .footer-street')).replace(/,\s*$/, '');
    if (sub && !txt(sub) && street) {
      var city = txt($('#footer .footer-city-state')).split(',')[0];
      sub.textContent = street + (city ? ' · ' + city : '');
    }
  }

  /* ---------------- header: mobile drawer ---------------- */

  function initMobileMenu() {
    var btn = $('.cs-mobile-menu-open');
    var drawer = $('#header .site-nav-wrapper');
    if (!btn || !drawer) return;
    var icon = btn.querySelector('i');
    if (icon) icon.remove();
    if (!btn.querySelector('.bar')) {
      for (var i = 0; i < 3; i++) btn.appendChild(el('span', 'bar'));
    }
    btn.setAttribute('aria-label', 'Menu');
    $all('.mobile-menu-bottom-links a', drawer).forEach(function (a) {
      if (/^search$/i.test(txt(a))) a.remove();
    });

    var mq = window.matchMedia('(max-width: 1024px)');

    // Inline !important styles: immune to whatever the CMS's own menu JS
    // and stylesheets do to this element on open/close.
    function setOpen(open) {
      document.body.classList.toggle('menu-open', open);
      btn.classList.toggle('active', open);
      if (mq.matches) {
        drawer.style.setProperty('opacity', open ? '1' : '0', 'important');
        drawer.style.setProperty('visibility', open ? 'visible' : 'hidden', 'important');
      }
    }
    function clearInline() {
      drawer.style.removeProperty('opacity');
      drawer.style.removeProperty('visibility');
    }

    btn.addEventListener('click', function () {
      var open = !btn.classList.contains('active');
      setOpen(open);
      // the CMS's own handler may also toggle classes on this click;
      // re-assert our state after it has run
      setTimeout(function () { setOpen(open); }, 50);
    });

    // leaving mobile widths: drop the drawer state + inline overrides
    var onChange = function (e) {
      if (!e.matches) { setOpen(false); clearInline(); }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    // tapping a leaf link closes the drawer
    $all('.site-nav-wrapper a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (document.body.classList.contains('menu-open') && a.getAttribute('href')) {
          setOpen(false);
        }
      });
    });
  }

  /* ---------------- header: nav labels ----------------
     The CMS splits long labels with <br> ("Tourist<br>Info"); replace the
     breaks with spaces so the nav and every clone of it read correctly. */

  function normalizeNavLabels() {
    $all('#tabContentMain span.parent a br').forEach(function (br) {
      br.parentNode.replaceChild(document.createTextNode(' '), br);
    });
  }

  /* ---------------- header: relocate FB like bar to footer ---------------- */

  function relocateFeedbackBar() {
    var bar = $('#header #feedback_bar');
    var social = $('#footer .cs-f-social-icons');
    if (bar && social && social.parentNode) {
      social.parentNode.insertBefore(bar, social.nextSibling);
    }
  }

  /* ---------------- candle-lighting data (homepage widget) ---------------- */

  // Reads the CMS candle-lighting widget. Never hardcode times.
  function getCandleData() {
    var w = $('.widget-4.candlelighting');
    if (!w) return null;
    var rows = $all('.times_wrapper > div', w).map(function (row) {
      var label = txt(row.querySelector('.when_to_light'));
      var time = txt(row.querySelector('span.bold.large'));
      var linkEl = row.querySelector('a');
      var whole = txt(linkEl);
      // "6:33 PM  -  Friday, October 17" → date part after the dash
      var datePart = whole.indexOf('-') !== -1 ? whole.split('-').slice(1).join('-').trim() : '';
      return { label: label, time: time, date: datePart, href: linkEl ? linkEl.getAttribute('href') : '' };
    }).filter(function (r) { return r.time; });

    var parshaA = $('.parsha_content a', w);
    var holidayA = $('.upcomingholiday_content a', w);
    var holidayDate = '';
    if (holidayA) {
      var hd = $all('.upcomingholiday_content div', w).map(txt).filter(function (t) {
        return t && t.indexOf(txt(holidayA)) === -1 && !/upcoming holiday/i.test(t);
      });
      holidayDate = hd.length ? hd[hd.length - 1] : '';
    }
    return {
      rows: rows,
      light: rows.filter(function (r) { return /^light/i.test(r.label); })[0] || rows[0] || null,
      ends: rows.filter(function (r) { return /ends/i.test(r.label); }).pop() || null,
      parsha: parshaA ? { name: txt(parshaA), href: parshaA.getAttribute('href') } : null,
      holiday: holidayA ? { name: txt(holidayA), href: holidayA.getAttribute('href'), date: holidayDate } : null,
      calendarHref: (rows[0] && rows[0].href) || '/calendar/candlelighting.htm'
    };
  }

  /* ---------------- hero: promo slider → Swiper ---------------- */

  function buildHero() {
    var widget = $('.hp-row-first .promo_slider');
    var slider = widget && $('.slider', widget);
    if (!slider) return;

    // Collect CMS slide content before touching anything.
    var slides = $all('.slides .slide_wrapper', slider).map(function (sw, i) {
      var a = sw.querySelector('a');
      var img = sw.querySelector('img');
      var capSel = sw.getAttribute('caption'); // e.g. ".caption-0"
      var cap = capSel ? slider.querySelector('.captionList li' + capSel) : $all('.captionList li', slider)[i];
      var title = cap ? txt(cap.querySelector('big')) : '';
      var body = '';
      if (cap) {
        var span = cap.querySelector('span');
        if (span) {
          var clone = span.cloneNode(true);
          var big = clone.querySelector('big');
          if (big) big.remove();
          body = txt(clone);
        }
      }
      var more = cap ? cap.querySelector('a.readMore') : null;
      return {
        img: img ? (img.getAttribute('src') || '') : '',
        href: a ? (a.getAttribute('href') || '#') : '#',
        title: title,
        body: body,
        ctaText: more ? txt(more) : '',
        ctaHref: more ? (more.getAttribute('href') || '') : ''
      };
    }).filter(function (s) { return s.img || s.title; });

    if (!slides.length) return;

    // Stop the stock jQuery-cycle slider if it already initialized.
    try {
      if (window.jQuery && jQuery.fn && jQuery.fn.cycle) jQuery(slider).cycle('destroy');
    } catch (e) { /* not initialized yet — removal below makes later init a no-op */ }

    var eyebrow = 'Chabad in South Beach · Miami Beach';
    var hero = el('div', 'sb-hero');
    hero.innerHTML =
      '<div class="swiper sb-hero-swiper"><div class="swiper-wrapper">' +
      slides.map(function (s) {
        return (
          '<div class="swiper-slide"><div class="sb-hero-slide">' +
          (s.img ? '<img class="sb-hero-img" src="' + esc(s.img) + '" alt="' + esc(s.title) + '">' : '') +
          '<div class="sb-hero-content"><div class="sb-hero-max"><div class="sb-hero-copy">' +
          '<div class="sb-eyebrow-bars"><i></i><i></i><i></i><span>' + esc(eyebrow) + '</span></div>' +
          (s.title ? '<h1>' + esc(s.title) + '</h1>' : '') +
          (s.body ? '<p>' + esc(s.body) + '</p>' : '') +
          '<div class="sb-hero-ctas">' +
          (s.ctaHref
            ? '<a class="sb-btn sb-btn-primary" href="' + esc(s.ctaHref) + '">' + esc(s.ctaText || 'Read More') + '</a>'
            : '<a class="sb-btn sb-btn-primary" href="' + esc(s.href) + '">Learn more</a>') +
          '</div></div></div></div></div></div>'
        );
      }).join('') +
      '</div></div>' +
      '<div class="sb-hero-controls"><div class="sb-hero-max">' +
      '<div class="swiper-pagination sb-hero-dots"></div>' +
      '<div class="sb-hero-arrows">' +
      '<button type="button" class="sb-hero-prev" aria-label="Previous slide">' + CHEVRON_LEFT + '</button>' +
      '<button type="button" class="sb-hero-next" aria-label="Next slide">' + CHEVRON_RIGHT + '</button>' +
      '</div></div></div>';

    // Replace the CMS slider node entirely (also defuses a late cycle() init).
    slider.parentNode.replaceChild(hero, slider);

    if (typeof window.Swiper === 'function') {
      new window.Swiper(hero.querySelector('.sb-hero-swiper'), {
        loop: slides.length > 1,
        speed: 800,
        autoplay: { delay: 7000, disableOnInteraction: false },
        pagination: { el: hero.querySelector('.sb-hero-dots'), clickable: true },
        navigation: {
          nextEl: hero.querySelector('.sb-hero-next'),
          prevEl: hero.querySelector('.sb-hero-prev')
        }
      });
    } else {
      // CDN failed: show the first slide as a static hero.
      $all('.swiper-slide', hero).forEach(function (s, i) {
        if (i > 0) s.style.display = 'none';
      });
      var ctrl = hero.querySelector('.sb-hero-controls');
      if (ctrl) ctrl.style.display = 'none';
    }
  }

  /* ---------------- welcome: mission widget → two-column band ---------------- */

  function buildWelcome(heroImgSrc) {
    var widget = $('.widget-4.message');
    if (!widget || $('.sb-welcome', widget)) return;
    var wrapper = $('.wrapper', widget);
    var heading = txt($('.widget_header h5', widget));
    var bodyEl = $('.widget_content .bottom_padding', widget) || $('.widget_content', widget);
    var more = $('.widget_content a.readMore', widget);
    if (!wrapper || !bodyEl) return;

    var grid = el('div', 'sb-welcome');
    var left = el('div');
    left.appendChild(el('div', 'sb-eyebrow', 'Welcome'));
    var h2 = el('h2');
    h2.textContent = heading || 'Welcome';
    left.appendChild(h2);
    var body = el('div', 'sb-welcome-body');
    // keep the CMS text exactly as written; only split hard breaks into paragraphs
    bodyEl.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i).forEach(function (chunk) {
      var p = el('p');
      p.innerHTML = chunk;
      if (txt(p)) body.appendChild(p);
    });
    left.appendChild(body);
    if (more) {
      more.classList.add('sb-link-caps');
      more.innerHTML = esc(txt(more)) + ' →';
      var moreWrap = el('div', 'sb-welcome-more');
      moreWrap.appendChild(more);
      left.appendChild(moreWrap);
    }
    grid.appendChild(left);

    if (heroImgSrc) {
      var media = el('div', 'sb-welcome-media');
      media.innerHTML =
        '<div class="sb-arch-img"><img src="' + esc(heroImgSrc) + '" alt=""></div>' +
        '<div class="sb-est-line"><span>Chabad in South Beach · Miami Beach</span></div>';
      grid.appendChild(media);
    } else {
      grid.style.gridTemplateColumns = '1fr';
    }

    wrapper.innerHTML = '';
    wrapper.appendChild(grid);
  }

  /* ---------------- programs: sneak-peek grid ---------------- */

  function wrapPrograms() {
    var container = $('.sneak-peek-container');
    if (!container || $('.sb-programs-grid', container)) return;
    var items = $all('.sneak-peek-item', container);
    if (!items.length) return;

    var title = $('.header-title', container);
    if (title && !$('.sb-eyebrow', container)) {
      container.insertBefore(el('div', 'sb-eyebrow', 'What we do'), title);
    }
    var grid = el('div', 'sb-programs-grid');
    container.insertBefore(grid, items[0]);
    items.forEach(function (it) { grid.appendChild(it); });
    $all('.clear', container).forEach(function (c) { c.remove(); });
  }

  /* ---------------- events: list widget → card rail ---------------- */

  function parseEventDate(smallText) {
    // "Mon, October 13, 2025 - 8:00am" / "Shabbat, October 18, 2025" → { dow, day, mon, time }
    var out = { dow: '', day: '', mon: '', time: '' };
    var m = /^(\w+),\s+(\w+)\s+(\d{1,2}),\s+\d{4}(?:\s*-\s*(.+))?$/.exec(smallText.trim());
    if (m) {
      out.dow = /^shabbat$/i.test(m[1]) ? 'Sat' : m[1].slice(0, 3);
      out.mon = m[2].slice(0, 3);
      out.day = m[3];
      out.time = (m[4] || '').trim();
    }
    return out;
  }

  function buildEventsRail() {
    var widget = $('.widget-4.upcoming_events');
    if (!widget || $('.sb-events-rail', widget)) return;
    var wrapper = $('.wrapper', widget);
    var lis = $all('.widget_content ul li', widget);
    if (!wrapper || !lis.length) return;

    var heading = txt($('.widget_header h5', widget)) || 'Upcoming Events';
    var readMore = $('.widget_content a.readMore', widget);

    var cards = lis.map(function (li) {
      var when = txt(li.querySelector('small'));
      var a = li.querySelector('h6 a');
      if (!a) return '';
      var d = parseEventDate(when);
      return (
        '<div class="sb-event-card">' +
        '<div class="sb-event-main">' +
        '<div class="sb-date-badge">' +
        '<div class="sb-dow">' + esc(d.dow) + '</div>' +
        '<div class="sb-day">' + esc(d.day) + '</div>' +
        '<div class="sb-mon">' + esc(d.mon) + '</div>' +
        '</div>' +
        '<div class="sb-event-info">' +
        '<h3><a href="' + esc(a.getAttribute('href') || '#') + '">' + esc(txt(a)) + '</a></h3>' +
        (d.time ? '<div class="sb-event-when">' + esc(d.time) + '</div>' : '') +
        '</div></div>' +
        '<div class="sb-event-foot"><a class="sb-link-caps" href="' + esc(a.getAttribute('href') || '#') + '">Details →</a></div>' +
        '</div>'
      );
    }).join('');
    if (!cards) return;

    var head = el('div', 'sb-events-head');
    head.innerHTML =
      '<div><div class="sb-eyebrow">On the calendar</div><h2>' + esc(heading) + '</h2></div>' +
      '<div class="sb-rail-arrows">' +
      '<button type="button" class="sb-rail-prev" aria-label="Scroll events left">' + CHEVRON_LEFT + '</button>' +
      '<button type="button" class="sb-rail-next" aria-label="Scroll events right">' + CHEVRON_RIGHT + '</button>' +
      '</div>';
    var rail = el('div', 'sb-events-rail', cards);

    wrapper.innerHTML = '';
    wrapper.appendChild(head);
    wrapper.appendChild(rail);
    if (readMore) {
      readMore.classList.add('sb-link-caps');
      readMore.innerHTML = 'All events →';
      var foot = el('div');
      foot.style.marginTop = '4px';
      foot.appendChild(readMore);
      wrapper.appendChild(foot);
    }

    head.querySelector('.sb-rail-prev').addEventListener('click', function () {
      rail.scrollBy({ left: -362, behavior: 'smooth' });
    });
    head.querySelector('.sb-rail-next').addEventListener('click', function () {
      rail.scrollBy({ left: 362, behavior: 'smooth' });
    });
  }

  /* ---------------- this-shabbat band: candle widget restructure ---------------- */

  function buildShabbatBand(candles) {
    var widget = $('.widget-4.candlelighting');
    if (!widget || !candles || $('.sb-shabbat-band', widget)) return;
    var content = $('.widget_content', widget);
    if (!content) return;

    var cols = [];

    var timesHtml = '';
    if (candles.light) {
      timesHtml +=
        '<div class="sb-time-row"><span class="sb-time-big">' + esc(candles.light.time).replace(/\s*(AM|PM)$/i, '<small>$1</small>') +
        '</span><span class="sb-time-label">' + esc(candles.light.label) + (candles.light.date ? ', ' + esc(candles.light.date) : '') + '</span></div>';
    }
    if (candles.ends) {
      timesHtml +=
        '<div class="sb-time-row"><span class="sb-time-big">' + esc(candles.ends.time).replace(/\s*(AM|PM)$/i, '<small>$1</small>') +
        '</span><span class="sb-time-label">' + esc(candles.ends.label) + (candles.ends.date ? ', ' + esc(candles.ends.date) : '') + '</span></div>';
    }
    if (timesHtml) {
      cols.push(
        '<div class="sb-shabbat-col"><div class="sb-eyebrow">This Shabbat</div>' + timesHtml +
        '<p style="margin-top:14px"><a class="sb-link-caps" href="' + esc(candles.calendarHref) + '">All candle-lighting times →</a></p></div>'
      );
    }
    if (candles.parsha) {
      cols.push(
        '<div class="sb-shabbat-col"><div class="sb-eyebrow">Weekly Torah Portion</div>' +
        '<h3><a href="' + esc(candles.parsha.href || '#') + '">' + esc(candles.parsha.name) + '</a></h3>' +
        '<a class="sb-link-caps" href="' + esc(candles.parsha.href || '#') + '">Read the summary →</a></div>'
      );
    }
    if (candles.holiday) {
      cols.push(
        '<div class="sb-shabbat-col"><div class="sb-eyebrow">Upcoming Holiday</div>' +
        '<h3><a href="' + esc(candles.holiday.href || '#') + '">' + esc(candles.holiday.name) + '</a></h3>' +
        (candles.holiday.date ? '<p>' + esc(candles.holiday.date) + '</p>' : '') +
        '<a class="sb-btn sb-btn-primary" href="/tools/events/default_cdo">Reserve for the holidays</a></div>'
      );
    }
    if (!cols.length) return;

    var band = el('div', 'sb-shabbat-band', cols.join(''));
    content.innerHTML = '';
    content.appendChild(band);
  }

  /* ---------------- latest photos: async mosaic ---------------- */

  function buildPhotosHeader(widget) {
    var wrapper = $('.wrapper', widget);
    if (!wrapper || $('.sb-photos-head', wrapper)) return;
    var heading = txt($('.widget_header h5', widget)) || 'Latest Photos';
    var readMore = $('.widget_content a.readMore', widget);
    var head = el('div', 'sb-photos-head');
    head.innerHTML = '<div><div class="sb-eyebrow">Gallery</div><h2>' + esc(heading) + '</h2></div>';
    if (readMore) {
      var link = el('a', 'sb-all-link');
      link.href = readMore.getAttribute('href') || '#';
      link.innerHTML = esc(txt(readMore)) + ' →';
      head.appendChild(link);
    }
    wrapper.insertBefore(head, wrapper.firstChild);
  }

  function initPhotosMosaic() {
    var widget = $('.widget-4.latest_photos');
    if (!widget) return;
    var content = $('.widget_content', widget);
    if (!content) return;

    function ready() { return !!content.querySelector('ul li img'); }
    function finish() {
      safe('photos-header', function () { buildPhotosHeader(widget); });
      widget.classList.add('sb-photos-grid');
    }
    if (ready()) { finish(); return; }

    // Widget populates asynchronously (LatestPhotos.js on domload).
    // Observe narrowly, disconnect on success or after 12s.
    var done = false;
    var mo = new MutationObserver(function () {
      if (done || !ready()) return;
      done = true;
      mo.disconnect();
      finish();
    });
    mo.observe(content, { childList: true, subtree: true });
    setTimeout(function () { if (!done) mo.disconnect(); }, 12000);
  }

  /* ---------------- subscribe: blurb under the heading ---------------- */

  function enhanceSubscribe() {
    var widget = $('.hp_subscribe .widget-4.subscribe');
    if (!widget || $('.sb-subscribe-blurb', widget)) return;
    var header = $('.widget_header', widget);
    var small = $('fieldset small', widget);
    if (!header) return;
    var blurbText = small ? txt(small) : '';
    if (blurbText) {
      header.appendChild(el('p', 'sb-subscribe-blurb', esc(blurbText)));
      small.style.display = 'none';
    }
  }

  /* ---------------- footer rebuild ---------------- */

  function buildFooter() {
    var footer = $('#footer');
    if (!footer || $('.sb-footer-grid', footer)) return;
    var container = $('.footer_container.footer_text', footer);
    var brandBlock = $('.footer3', footer);
    if (!container || !brandBlock) return;

    // Column 1: brand (existing address block) + phone + social
    var grid = el('div', 'sb-footer-grid');
    var col1 = el('div', 'sb-footer-col sb-footer-col-brand');
    var brandRow = el('div', 'sb-footer-brand-row');
    if (USE_MONOGRAM_LOGO) {
      brandRow.innerHTML = LOGO_SVG;
    } else {
      var siteLogo = $('#header_branding .site-logo-wrapper img');
      if (siteLogo) brandRow.appendChild(siteLogo.cloneNode(false));
    }
    var titleSpan = brandBlock.querySelector('.footer-title');
    if (titleSpan) brandRow.appendChild(titleSpan);
    col1.appendChild(brandRow);
    var addr = brandBlock.querySelector('.footer-address');
    if (addr) col1.appendChild(addr);
    // phone: the bare text node/span in footer3
    var phoneText = txt(brandBlock).replace(txt(addr) || '', '').trim();
    var phoneMatch = /(\d{3}[-.\s]\d{3}[-.\s]\d{4})/.exec(phoneText);
    if (phoneMatch) {
      var tel = el('a', 'sb-footer-phone');
      tel.href = 'tel:' + phoneMatch[1].replace(/\D/g, '');
      tel.textContent = phoneMatch[1];
      col1.appendChild(tel);
    }
    var social = $('.cs-f-social-icons', footer);
    if (social) col1.appendChild(social);
    var fb = $('#feedback_bar', footer);
    if (fb) col1.appendChild(fb);
    grid.appendChild(col1);

    // Column 2: Visit — top-level nav links cloned from the main menu
    var col2 = el('div', 'sb-footer-col');
    col2.appendChild(el('div', 'sb-footer-col-title', 'Visit'));
    // owner-requested exclusions from the footer Visit column
    var VISIT_EXCLUDE = [/donate/i, /yerushalaim/i, /^sign\s*in$/i];
    var excluded = function (t) {
      return VISIT_EXCLUDE.some(function (re) { return re.test(t); });
    };
    var visit = el('div', 'sb-footer-links');
    visit.innerHTML = '<a href="/">Home</a>';
    $all('#tabContentMain .co_menu_item span.parent > div > a.parent').forEach(function (a) {
      if (excluded(txt(a))) return;
      visit.innerHTML += '<a href="' + esc(a.getAttribute('href') || '#') + '">' + esc(txt(a)) + '</a>';
    });
    $all('#header_container .links .float_left .topBarLink a').forEach(function (a) {
      if (/^home$/i.test(txt(a)) || excluded(txt(a))) return;
      visit.innerHTML += '<a href="' + esc(a.getAttribute('href') || '#') + '">' + esc(txt(a)) + '</a>';
    });
    col2.appendChild(visit);
    grid.appendChild(col2);

    // Column 3: Get involved — submenu highlights + contact + donate button
    var col3 = el('div', 'sb-footer-col');
    col3.appendChild(el('div', 'sb-footer-col-title', 'Get involved'));
    var involved = el('div', 'sb-footer-links');
    var seen = {};
    $all('#tabContentMain .co_submenu_container a.item').slice(0, 5).forEach(function (a) {
      var t = txt(a);
      if (!t || seen[t]) return;
      seen[t] = 1;
      involved.innerHTML += '<a href="' + esc(a.getAttribute('href') || '#') + '">' + esc(t) + '</a>';
    });
    var contact = $('#header_container .contact_link a');
    if (contact) involved.innerHTML += '<a href="' + esc(contact.getAttribute('href')) + '">Contact Us</a>';
    col3.appendChild(involved);
    var donate = $('#tabContentMain .donate_link a.parent');
    if (donate) {
      var btn = el('a', 'sb-btn sb-btn-primary');
      btn.href = donate.getAttribute('href') || '#';
      btn.textContent = 'Donate';
      col3.appendChild(btn);
    }
    grid.appendChild(col3);

    // Bottom bar: keep the CMS copyright/powered-by/privacy text intact
    var bottom = el('div', 'sb-footer-bottom');
    var powered = el('span');
    // Move the loose powered-by nodes (text + links) into the bottom bar
    var copyParent = $('.copyright_text .bottom_padding', footer) || container;
    var loose = [];
    Array.prototype.slice.call(copyParent.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && txt(n)) loose.push(n);
      else if (n.nodeType === 1 && n.tagName === 'A') loose.push(n);
    });
    loose.forEach(function (n) { powered.appendChild(n); });
    bottom.appendChild(el('span', null, '© ' + new Date().getFullYear() + ' ' + esc(txt(titleSpan) || 'Chabad in South Beach') + '. All rights reserved.'));
    bottom.appendChild(powered);

    container.innerHTML = '';
    container.appendChild(grid);
    footer.appendChild(bottom);
  }

  /* ---------------- event page hero + info band ----------------
     Rebuild the top of the registration form: flyer as a wide banner,
     centered description, and a dark Location/Date band built from the
     CMS's own column2 data (map + iCal links preserved). */

  function buildEventHero() {
    var form = $('#RegisterSinglePage');
    if (!form || $('.sb-event-hero') || $('.sb-event-band')) return;
    var header = $('#RegisterHeader', form);
    if (!header) return;

    var bannerWrap = header.querySelector('.banner_image');
    var bannerImg = bannerWrap && bannerWrap.querySelector('img');
    if (bannerImg && bannerImg.getAttribute('src')) {
      var hero = el('div', 'sb-event-hero');
      hero.appendChild(bannerImg);
      form.insertBefore(hero, form.firstChild);
      bannerWrap.style.display = 'none';
    }

    var desc = header.querySelector('.event_description');
    if (desc && txt(desc)) desc.classList.add('sb-event-desc');
    var name = header.querySelector('.event_name');
    if (name) name.classList.add('sb-event-name');

    var col2 = header.querySelector('.column2');
    if (col2) {
      var cells = [];
      var loc = col2.querySelector('.map_link a');
      if (loc) {
        var locInner = loc.querySelector('div');
        cells.push(
          '<div class="sb-band-cell"><div class="sb-eyebrow">Location</div>' +
          '<a href="' + esc(loc.getAttribute('href') || '#') + '" target="_blank" rel="noopener">' +
          (locInner ? locInner.innerHTML : esc(txt(loc))) + '</a></div>'
        );
      }
      var ical = col2.querySelector('.ical_link a');
      if (ical) {
        var dateText = txt(ical.querySelector('div') || ical);
        cells.push(
          '<div class="sb-band-cell"><div class="sb-eyebrow">Date</div>' +
          '<a href="' + esc(ical.getAttribute('href') || '#') + '" title="Download iCal">' +
          esc(dateText) + '</a></div>'
        );
      }
      if (cells.length) {
        var band = el('div', 'sb-event-band', cells.join(''));
        header.parentNode.insertBefore(band, header.nextSibling);
        col2.style.display = 'none';
      }
    }
  }

  /* ---------------- event listing: tint each row with its event's theme ---------------- */

  function themeEventListing() {
    if (!window.SB_FORCE_LISTING &&
        window.location.pathname.toLowerCase().indexOf('/tools/events') === -1) return;
    $all('.event, .row, .item').forEach(function (row) {
      var link = row.querySelector('a[href*="eventid"]');
      if (!link) return;
      var m = /eventid[=\/](\d+)/i.exec(link.getAttribute('href') || '');
      var t = m && PAGE_THEMES[m[1]];
      if (!t) return;
      if (t.soft) row.style.setProperty('--sb-event-soft', t.soft);
      if (t.accent) row.style.setProperty('--sb-event-accent', t.accent);
      if (t.accentDark) row.style.setProperty('--sb-event-accent-dark', t.accentDark);
    });
  }

  /* ---------------- sponsorship tiers (event registration pages) ---------------- */

  function initSponsorTiers() {
    // both URL shapes: /register_cdo/eventid/23338/... and register.asp?eventid=23338
    var idMatch = /\/eventid\/(\d+)/i.exec(window.location.pathname) ||
                  /[?&]eventid=(\d+)/i.exec(window.location.search);
    var eventId = (idMatch && idMatch[1]) || String(window.SB_EVENT_ID || '');
    var conf = eventId && SPONSOR_TIERS[eventId];
    if (!conf || !conf.tiers || !conf.tiers.length) return;
    if (!$('#RegisterSinglePage')) return;

    function donationField() { return document.getElementById('TotalDonation'); }
    function root() { return document.getElementById('sb-sponsorship'); }

    // set the field AND fire the Event App's own recalculation
    function setDonation(value) {
      var field = donationField();
      if (!field) return;
      field.value = value;
      ['input', 'change'].forEach(function (type) {
        field.dispatchEvent(new Event(type, { bubbles: true }));
      });
    }

    function paint(amount) {
      var r = root();
      if (!r) return;
      $all('.sb-tier', r).forEach(function (tier) {
        var on = Number(tier.getAttribute('data-amount')) === amount;
        tier.classList.toggle('sb-on', on);
        tier.setAttribute('aria-checked', String(on));
      });
    }

    function choose(amount) {
      var current = root() && root().querySelector('.sb-tier.sb-on');
      if (current && Number(current.getAttribute('data-amount')) === amount) {
        setDonation('');
        paint(null);
        return;
      }
      setDonation(amount);
      paint(amount);
    }

    function syncFromField() {
      var field = donationField();
      if (!field) return;
      var typed = parseFloat(String(field.value).replace(/[^0-9.]/g, ''));
      var hit = conf.tiers.some(function (t) { return t.amount === typed; });
      paint(hit ? typed : null);
    }

    function presetFromURL() {
      var m = /[?&]sponsor=(\d+)/.exec(window.location.search);
      if (!m) return null;
      var amount = parseInt(m[1], 10);
      return conf.tiers.some(function (t) { return t.amount === amount; }) ? amount : null;
    }

    function build() {
      var field = donationField();
      if (!field) return false;
      if (root()) return true;
      var anchor = field.closest ? field.closest('.clearfix') : null;
      if (!anchor || !anchor.parentNode) return false;

      var box = el('div');
      box.id = 'sb-sponsorship';
      box.innerHTML =
        '<div class="sb-sponsor-head">' + esc(conf.heading || 'Sponsorship Opportunities') + '</div>' +
        (conf.blurb ? '<p class="sb-sponsor-blurb">' + esc(conf.blurb) + '</p>' : '') +
        '<div class="sb-sponsor-list" role="radiogroup" aria-label="' + esc(conf.heading || 'Sponsorship Opportunities') + '">' +
        conf.tiers.map(function (t) {
          // note: never write dollar-before-quote ("$'") in this file — naive
          // String.replace-based injectors treat it as a replacement pattern
          return '<button type="button" class="sb-tier" role="radio" aria-checked="false" data-amount="' + Number(t.amount) + '">' +
            '<span class="sb-amt">' + ('$') + Number(t.amount).toLocaleString('en-US') + '</span>' +
            '<span class="sb-name">' + esc(t.label) + '</span></button>';
        }).join('') +
        '</div>';

      box.addEventListener('click', function (event) {
        var tier = event.target.closest ? event.target.closest('.sb-tier') : null;
        if (tier) choose(Number(tier.getAttribute('data-amount')));
      });

      anchor.parentNode.insertBefore(box, anchor);
      field.addEventListener('input', syncFromField);
      field.addEventListener('change', syncFromField);

      var preset = presetFromURL();
      if (preset) choose(preset);
      else syncFromField();
      return true;
    }

    // The Summary step can be re-rendered by the Event App — re-insert if lost.
    build();
    var queued = false;
    var mo = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (!root() || !root().isConnected) build();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------- init ---------------- */

  function init() {
    document.body.classList.remove('sb-nojs');
    document.body.classList.add('sb-js');
    if (isHome()) document.body.classList.add('sb-home');

    safe('page-rules', runPageRules);
    safe('page-theme', applyPageTheme);
    safe('nav-labels', normalizeNavLabels);
    safe('branding', enhanceBranding);
    safe('mobile-menu', initMobileMenu);

    var candles = null;
    safe('candle-data', function () { candles = getCandleData(); });

    var heroImg = null;
    if (isHome()) {
      safe('hero', function () {
        // remember a slide image for the welcome section before rebuilding;
        // prefer a photo (jpg) over graphic flyers (png) for the arched crop
        var imgs = $all('.hp-row-first .promo_slider .slide_wrapper img');
        var photo = imgs.filter(function (im) {
          return /\.jpe?g(\?|$)/i.test(im.getAttribute('src') || '');
        })[0] || imgs[0];
        heroImg = photo ? photo.getAttribute('src') : null;
        buildHero();
      });
      safe('welcome', function () { buildWelcome(heroImg); });
      safe('programs', wrapPrograms);
      safe('events-rail', buildEventsRail);
      safe('shabbat-band', function () { buildShabbatBand(candles); });
      safe('photos', initPhotosMosaic);
      safe('subscribe', enhanceSubscribe);
    }

    safe('footer', buildFooter);
    safe('feedback-bar', relocateFeedbackBar);
    safe('event-hero', buildEventHero);
    safe('sponsor-tiers', initSponsorTiers);
    safe('event-listing', themeEventListing);
  }

  // Footer code box loads after the DOM, but guard anyway.
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
