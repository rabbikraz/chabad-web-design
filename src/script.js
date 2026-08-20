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
  var SPONSOR_TIERS = window.SB_SPONSOR_TIERS || {};

  /* ------------------------------------------------------------------
     PER-PAGE THEMES — recolor an event/program page to match its flyer.
     Keys are matched anywhere in the URL (event id, article aid, or a
     slug). Colors: accent (buttons/pills/links), accentDark (hover),
     band (dark info band), soft (light fills / table header strip).

       '23338': { accent: '#4E6B54', accentDark: '#3D5643',
                  band: '#2F4436', soft: '#F5EEE3' }

     Anything not set falls back to the site palette.
     ------------------------------------------------------------------ */
  var PAGE_THEMES = window.SB_PAGE_THEMES || {};

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
  // (window.name check is opaque to the minifier's constant folder, so
  // `unsafe` compression can never fold this into a literal entity)
  var AMP = String.fromCharCode(typeof window.name === 'string' ? 38 : 0);
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
    $all('#tabContentMain .co_menu_item.multi_level', drawer).forEach(function (item) {
      if (item.querySelector('.sb-sub-toggle')) return;
      var t = el('button', 'sb-sub-toggle');
      t.type = 'button';
      t.setAttribute('aria-label', 'Toggle submenu');
      t.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        item.classList.toggle('sb-open');
      });
      item.appendChild(t);
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
        drawer.style.setProperty('pointer-events', open ? 'auto' : 'none', 'important');
      }
      if (!open) {
        // sites6.js's own toggle (hidden, but belt-and-suspenders) or the
        // CMS's hover-tracking can leave a submenu flagged open — closing
        // the drawer always starts the next open from a clean slate.
        $all('#tabContentMain .co_menu_item.sb-open, #tabContentMain .co_menu_item.item-open, #tabContentMain .co_menu_item.hover', drawer).forEach(function (it) {
          it.classList.remove('sb-open', 'item-open', 'hover');
        });
      }
    }
    function clearInline() {
      drawer.style.removeProperty('opacity');
      drawer.style.removeProperty('visibility');
      drawer.style.removeProperty('pointer-events');
    }
    // Any click inside a mobile-drawer menu item ALSO bubbles to the CMS's
    // own delegated click handler (bound directly on .co_menu_item), which
    // calls Co.MainNavigation.Show() — harmless on its own (CSS keeps the
    // submenu closed) but an unnecessary side effect that other CMS scripts
    // could react to. Stop it at the item boundary for anything except our
    // own toggle, which manages its own propagation already. Real links
    // (real <a href>) still navigate — stopPropagation never blocks that.
    document.addEventListener('click', function (e) {
      if (!mq.matches) return;
      var item = e.target.closest && e.target.closest('#tabContentMain .co_menu_item');
      if (!item || e.target.closest('.sb-sub-toggle')) return;
      e.stopPropagation();
    }, true);

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
    // tiered "Tourist Information" label: as the desktop nav gets tight the
    // CSS hides .sb-nav-t3 ("Tourist Info"), then .sb-nav-t2 ("Tourist").
    // The mobile drawer (no media match) always shows the full label.
    $all('#tabContentMain span.parent a').forEach(function (a) {
      if (a.children.length) return; // text-only labels; never touch icons
      var m = /^tourist\s+(information|info)$/i.exec(txt(a));
      if (!m) return;
      a.textContent = 'Tourist';
      var t2 = el('span', 'sb-nav-t2');
      t2.textContent = ' Info';
      if (m[1].length > 4) { // full "Information" — add the hideable tail
        var t3 = el('span', 'sb-nav-t3');
        t3.textContent = 'rmation';
        t2.appendChild(t3);
      }
      a.appendChild(t2);
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

  /* event-listing theming + read-more clamp moved to
     src/register-autofill.js (header block) for footer size */

  /* registration-page autofill + credit-card fixes moved to
     src/register-autofill.js (ships in the HEADER block: the footer
     code box refuses to save past ~63KB url-encoded) */

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

  /* ---------------- high holiday seats form (#sb-hh) ----------------
     The pasted form page (forms/hh-seats.html) is static HTML inside the
     CMS's own <form>; this layer adds the UX: name fields matching the
     seat counts, single-select donation pills, a live order summary, an
     auto-calculated (still editable) charge total, and card validation
     only when there is actually something to charge. */

  function initHHSeats() {
    var root = $('#sb-hh');
    if (!root) return;

    // dollar sign assembled at runtime: the literal dollar-before-quote
    // sequence is a String.replace replacement pattern (see esc() note)
    var DLR = String.fromCharCode(36);
    var ADULT_SUGGESTED = 100;
    var CHILD_SUGGESTED = 50;

    function field(name) { return root.querySelector('[name="' + name + '"]'); }
    var adultSel = field('Adult Attendees Amount');
    var childSel = field('Children Attendees Amount');
    var totalIn = field('x_amount');
    var otherIn = field('Other Amount');
    var cardNum = field('x_card_num');
    var cardCode = field('x_card_code');
    var expMonth = field('x_exp_month');
    var expYear = field('x_exp_year');
    var radios = $all('input[name="Donation Amount"]', root);
    var payChoices = $all('input[name="Payment Choice"]', root);
    var summary = $('#sb-hh-summary');
    var payNote = $('#sb-hh-paynote');

    function num(v) {
      var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, ''));
      return isFinite(n) && n > 0 ? n : 0;
    }
    function money(n) {
      var r = Math.round(n * 100) / 100;
      return DLR + r.toLocaleString('en-US');
    }

    // reveal exactly as many name fields as seats chosen (and clear the rest
    // so hidden leftovers never ride along in the submission)
    function syncNames(sel, colId) {
      var col = $('#' + colId, root);
      if (!col) return;
      var n = sel ? parseInt(sel.value, 10) || 0 : 0;
      $all('.sb-hh-name', col).forEach(function (row, i) {
        var show = i < n;
        row.style.display = show ? '' : 'none';
        if (!show) {
          var input = row.querySelector('input');
          if (input) input.value = '';
        }
      });
      var block = $('.sb-hh-names', col);
      if (block) block.style.display = n ? '' : 'none';
    }

    function chosenDonation() {
      var other = num(otherIn && otherIn.value);
      if (other) return other;
      var picked = radios.filter(function (r) { return r.checked; })[0];
      return picked ? num(picked.value) : 0;
    }

    // three payment modes via the "Payment Choice" radios:
    // suggested (auto-calculated total), custom (visitor-typed total),
    // guest (no charge at all — the card block collapses entirely)
    function payMode() {
      var v = '';
      payChoices.forEach(function (r) { if (r.checked) v = r.value; });
      if (v.indexOf('No payment') === 0) return 'guest';
      if (v.indexOf('Custom') === 0) return 'custom';
      return 'suggested';
    }
    function setChoice(prefix) {
      payChoices.forEach(function (r) { r.checked = r.value.indexOf(prefix) === 0; });
    }

    function compute() {
      var adults = adultSel ? parseInt(adultSel.value, 10) || 0 : 0;
      var children = childSel ? parseInt(childSel.value, 10) || 0 : 0;
      var seats = adults * ADULT_SUGGESTED + children * CHILD_SUGGESTED;
      var donation = chosenDonation();
      var total = seats + donation;
      var mode = payMode();

      if (totalIn) {
        if (mode === 'guest') totalIn.value = '0';
        else if (mode === 'suggested') totalIn.value = total ? String(total) : '';
        // locked while auto-calculated; "Choose my own amount" unlocks it
        totalIn.readOnly = mode === 'suggested';
      }
      root.classList.add('sb-hh-js');
      root.classList.toggle('sb-hh-guest', mode === 'guest');
      root.classList.toggle('sb-hh-custom', mode === 'custom');
      var charge = mode === 'guest' ? 0 : (totalIn ? num(totalIn.value) : total);

      if (summary) {
        summary.innerHTML = '';
        var box = el('div', 'sb-hh-sumbox');
        var line = function (label, amt, cls) {
          var row = el('div', 'sb-hh-sumline' + (cls ? ' ' + cls : ''));
          var l = el('span');
          l.textContent = label;
          var a = el('span', 'sb-hh-sumamt');
          a.textContent = amt;
          row.appendChild(l);
          row.appendChild(a);
          box.appendChild(row);
        };
        var seatCount = adults + children;
        if (mode === 'guest') {
          var guest = el('div', 'sb-hh-sumfree');
          guest.textContent = seatCount
            ? seatCount + (seatCount === 1 ? ' seat' : ' seats') + ' reserved, no charge.'
            : 'Choose your seats above. No charge.';
          box.appendChild(guest);
        } else {
          if (adults) line(adults + (adults === 1 ? ' adult seat' : ' adult seats'), money(adults * ADULT_SUGGESTED));
          if (children) line(children + (children === 1 ? ' child seat' : ' child seats'), money(children * CHILD_SUGGESTED));
          if (donation) line('Donation', money(donation));
          if (charge > 0) {
            line('Total charge', money(charge), 'sb-hh-sumtotal');
          } else {
            var free = el('div', 'sb-hh-sumfree');
            free.textContent = (adults || children)
              ? 'No charge. We look forward to celebrating with you.'
              : 'Choose your seats above.';
            box.appendChild(free);
          }
        }
        summary.appendChild(box);
      }

      if (payNote) {
        payNote.textContent = mode === 'custom'
          ? 'Enter any amount that works for you. Every contribution helps.'
          : 'Calculated from your selections. Pick "Choose my own amount" to change it.';
      }

      // card details are only mandatory when there is a charge
      [cardNum, cardCode].forEach(function (f) {
        if (!f) return;
        if (charge > 0) f.setAttribute('required', 'true');
        else f.removeAttribute('required');
      });
    }

    if (adultSel) adultSel.addEventListener('change', function () { syncNames(adultSel, 'sb-hh-adults'); compute(); });
    if (childSel) childSel.addEventListener('change', function () { syncNames(childSel, 'sb-hh-children'); compute(); });

    // donation pills: single-select, click again to deselect, and the
    // Other box clears the pills (and vice versa)
    var lastPicked = radios.filter(function (r) { return r.checked; })[0] || null;
    radios.forEach(function (r) {
      r.addEventListener('click', function () {
        if (r === lastPicked) {
          r.checked = false;
          lastPicked = null;
        } else {
          lastPicked = r;
          if (otherIn) otherIn.value = '';
          // donating means paying — leave guest mode
          if (payMode() === 'guest') setChoice('Suggested');
        }
        compute();
      });
    });
    if (otherIn) {
      otherIn.addEventListener('input', function () {
        if (otherIn.value.trim()) {
          radios.forEach(function (r) { r.checked = false; });
          lastPicked = null;
          if (payMode() === 'guest') setChoice('Suggested');
        }
        compute();
      });
    }

    // typing a total of your own IS choosing your own amount
    if (totalIn) {
      totalIn.addEventListener('input', function () {
        if (payMode() === 'suggested') setChoice('Custom');
        compute();
      });
    }

    payChoices.forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        var mode = payMode();
        if (mode === 'guest') {
          radios.forEach(function (d) { d.checked = false; });
          lastPicked = null;
          if (otherIn) otherIn.value = '';
        }
        compute();
        if (mode === 'custom' && totalIn) {
          totalIn.focus();
          totalIn.select();
        }
      });
    });

    var form = root.closest('form');
    if (form) {
      // the CMS appends its own submit control after the pasted content —
      // adopt it into the design
      // the CMS also appends a Reset button — nobody has ever wanted to
      // wipe a half-filled reservation form on purpose
      $all('input[type="reset"], button[type="reset"]', form).forEach(function (b) {
        if (b.parentNode) b.parentNode.removeChild(b);
      });
      var submit = form.querySelector('input[type="submit"], button[type="submit"], input[type="image"]');
      if (submit) {
        submit.classList.add('sb-hh-submit');
        if (submit.parentNode && submit.parentNode !== form) {
          submit.parentNode.classList.add('sb-hh-submit-row');
        }
      }
      form.addEventListener('submit', function (event) {
        var charge = num(totalIn && totalIn.value);
        if (!charge) return;
        var digits = cardNum ? cardNum.value.replace(/\D/g, '') : '';
        var expOk = expMonth && expYear && /^\d+$/.test(expMonth.value) && /^\d+$/.test(expYear.value);
        if (digits.length < 12 || !expOk) {
          event.preventDefault();
          alert('Please enter your card number and expiration date to process the ' + money(charge) + ' charge, or set the total to 0 to reserve seats without a charge.');
        }
      });
    }

    syncNames(adultSel, 'sb-hh-adults');
    syncNames(childSel, 'sb-hh-children');
    compute();
  }

  /* ---------------- membership form: BUILDER page ----------------
     The membership signup runs on the ChabadOne form builder (payment,
     per-tier pricing, conditional fields), but the visitor experience
     is the original Membership Form.html wizard, rebuilt on top of it:
     Screen 1 - household cards + parents/children + tier cards with
     live prices and benefits; Screen 2 - your info / spouse / children;
     Screen 3 - extras, summary, payment, submit. The custom screen-1
     controls PROXY into the builder's own (hidden) fields, so the
     builder still computes the Total and posts everything.
     Fields are matched by LABEL, never by id. Styling: style.css 21. */

  function initMembershipBuilder() {
    var root = $all('form.userform-form').filter(function (f) {
      return $all('.form-label-left label, .form-label label', f).some(function (l) {
        return /membership level/i.test(l.textContent);
      });
    })[0];
    if (!root) return;
    root.classList.add('sb-mf');
    document.body.classList.add('sb-memform');
    var hebOuts = [];
    var hebCache = {};
    var formAll = $('.form-all', root) || root;
    var ulist = $('ul.form-section', root);
    if (!ulist) return;

    /* ---- the original form's pricing + benefits ---- */
    var PRICING = {
      Basic: { single: 50, couple: 80, child: 20 },
      Chai: { single: 180, couple: 300, child: 90 },
      Silver: { single: 500, couple: 800, child: 250 },
      Gold: { single: 1000, couple: 1800, child: 360 }
    };
    var BENEFITS = window.SB_MW_BENEFITS || {};
    var TIER_NAMES = ['Basic', 'Chai', 'Silver', 'Gold'];

    /* wizard state is the source of truth; it is synced INTO the builder */
    var st = { tier: '', hh: '', parents: 'two', kids: 1, billing: 'monthly', disc: null };
    /* Discount codes (original semantics: free / percent off every
       payment / dollars off every payment; never below zero). Codes are
       maintained here and shipped by deploy - tell the office to route
       new codes through the developer. Keys must be UPPERCASE. */
    var DISCOUNTS = window.SB_MW_CODES || {
      WELCOME10: { kind: 'percent', value: 10 },
      RABBI: { kind: 'free', value: 0 }
    };
    function applyDisc(amount) {
      var v = Number(amount || 0);
      var d = st.disc;
      if (d) {
        if (d.kind === 'percent') v = v * (1 - Number(d.value || 0) / 100);
        if (d.kind === 'amount') v = v - Number(d.value || 0);
        if (d.kind === 'free') v = 0;
      }
      if (v < 0) v = 0;
      return Math.round(v * 100) / 100;
    }

    function money(n) { return String.fromCharCode(36) + Number(n).toLocaleString('en-US'); }
    function monthlyFor(tier) {
      var p = PRICING[tier];
      if (!p) return 0;
      if (st.hh === 'Couple') return p.couple;
      if (st.hh === 'Family') return (st.parents === 'one' ? p.single : p.couple) + p.child * st.kids;
      return p.single;
    }
    function hasSpouse() {
      if (st.hh === 'Couple') return true;
      return st.hh === 'Family' && st.parents !== 'one';
    }
    function hhDesc() {
      if (st.hh !== 'Family') return st.hh || 'Single';
      return (st.parents === 'one' ? 'Single-parent family, ' : 'Family, ') +
        st.kids + (st.kids === 1 ? ' child' : ' children');
    }

    /* ---- label helpers ---- */
    function normLbl(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    function rawLabelOf(li) {
      var l = li.querySelector('.form-label-left label, .form-label label');
      if (!l) return '';
      var c = l.cloneNode(true);
      var star = c.querySelector('.form-required');
      if (star) star.parentNode.removeChild(star);
      return normLbl(c.textContent);
    }
    function labelOf(li) {
      return rawLabelOf(li).replace(/^\((basic|chai|silver|gold)( annual)?\)\s*/, '');
    }
    function allLis() { return $all('li.form-line, li.form-input-wide', root); }
    function lisByLabel(re, raw) {
      return allLis().filter(function (li) { return re.test(raw ? rawLabelOf(li) : labelOf(li)); });
    }
    function liShown(li) { return !!(li && li.offsetParent !== null); }
    function fire(elm, types) {
      types.forEach(function (t) { elm.dispatchEvent(new Event(t, { bubbles: true })); });
    }
    function setRadio(li, value, on) {
      if (!li) return;
      $all('input[type="radio"]', li).forEach(function (r) {
        if (String(r.value).toLowerCase() === String(value).toLowerCase()) {
          if (r.checked !== on) { r.checked = on; fire(r, ['click', 'change']); }
        } else if (on && r.checked) { r.checked = false; }
      });
    }
    function clearGroup(li) {
      if (!li) return;
      var any = false;
      $all('input', li).forEach(function (f) {
        if (f.type === 'radio' || f.type === 'checkbox') { if (f.checked) { f.checked = false; any = true; } }
        else if (f.value) { f.value = ''; any = true; }
      });
      if (any) fire(li.querySelector('input') || li, ['change']);
    }

    /* the builder's field trio for each tier, matched by raw label */
    function trio(tier, annual) {
      var p = '^\\(' + tier.toLowerCase() + (annual ? ' annual' : '') + '\\) ';
      return {
        hh: lisByLabel(new RegExp(p + 'i am joining as'), true)[0] || null,
        par: lisByLabel(new RegExp(p + 'parents at home'), true)[0] || null,
        kids: lisByLabel(new RegExp(p + 'number of children'), true)[0] || null
      };
    }
    var tierLi = lisByLabel(/^membership level/)[0] || null;
    var billLi = lisByLabel(/^billing frequency/)[0] || null;
    // annual-priced field twins exist only once the builder add-on ran
    var hasAnnual = !!trio('Basic', true).hh;
    function recurBox() {
      return $all('input', root).filter(function (f) { return /paymentrecurrence/.test(f.name || ''); })[0] || null;
    }

    /* push the wizard state into the real fields */
    function syncBuilder() {
      if (!st.tier) return;
      var annualMode = st.billing === 'annual' && hasAnnual;
      if (billLi) setRadio(billLi, annualMode ? 'Annual' : 'Monthly', true);
      if (tierLi) setRadio(tierLi, st.tier, true);
      TIER_NAMES.forEach(function (t) {
        [false, true].forEach(function (annual) {
          var g = trio(t, annual);
          if (!g.hh && annual) return;
          if (t !== st.tier || annual !== annualMode) { clearGroup(g.hh); clearGroup(g.par); clearGroup(g.kids); return; }
          setRadio(g.hh, st.hh || 'Single', true);
          if (st.hh === 'Family') {
            setRadio(g.par, st.parents === 'one' ? 'Single Parent' : 'Two parents', true);
            var input = g.kids && g.kids.querySelector('input');
            if (input && input.value !== String(st.kids)) { input.value = String(st.kids); fire(input, ['input', 'change', 'keyup']); }
          } else { clearGroup(g.par); clearGroup(g.kids); }
        });
      });
      // discount rides a hidden number field priced at -$1/unit, so the
      // platform's own total (and the real charge) reflects the code
      var discLi = lisByLabel(/^\(discount\) amount$/, true)[0];
      if (discLi) {
        var per = annualMode ? monthlyFor(st.tier) * 12 : monthlyFor(st.tier);
        var off = Math.round(per - applyDisc(per));
        var di = discLi.querySelector('input');
        if (di && di.value !== String(off)) { di.value = String(off || 0); fire(di, ['input', 'change', 'keyup']); }
      }
      // membership bills monthly; paying the year up front is the one-time path
      var rc = recurBox();
      if (rc) {
        var want = !annualMode;
        if (rc.checked !== want) { rc.checked = want; fire(rc, ['change']); }
      }
    }

    /* ---- sort every question into a wizard slot ---- */
    function classify(li) {
      if (li.querySelector('.form-header-group') || li.querySelector('.form-html')) return 'hide';
      if (li.querySelector('.form-buttons-wrapper')) return 'submit';
      if (li.querySelector('input[name="website"]')) return 'pay';
      if (li.querySelector('[id="total_amount"]')) return 'total';
      var raw = rawLabelOf(li);
      if (/^membership level/.test(raw) || /^\((basic|chai|silver|gold)( annual)?\)/.test(raw) || /^\(discount\)/i.test(raw)) return 'engine';
      var lbl = labelOf(li);
      if (/^(i am joining as|parents at home|number of children|billing frequency)/.test(lbl)) return 'engine';
      if (/^yahrzeit \d+ /.test(lbl)) return 'engine';
      if (/^(spouse |anniversary$)/.test(lbl)) return 'spouse';
      if (/^(child \d+ |children)/.test(lbl)) return 'children';
      if (/^(yahrzeits|memorial board|donor wall|kiddush|anything else)/.test(lbl)) return 'extras';
      if (/^(total|payment)/.test(lbl)) return 'pay';
      if ($all('input', li).some(function (f) { return /paymentrecurrence/.test(f.name || ''); })) return 'pay';
      return 'info';
    }

    /* ---- build the wizard shell ---- */
    function div(cls, html) { return el('div', cls, html == null ? undefined : html); }
    function btn(cls, text) {
      var b = el('button', cls);
      b.type = 'button';
      b.textContent = text;
      return b;
    }
    var wrap = div('sb-mw');
    var engine = div('sb-mw-engine');      // hidden: the priced builder fields
    var s1 = div('sb-mw-screen sb-mw-s1');
    var s2 = div('sb-mw-screen sb-mw-s2');
    var s3 = div('sb-mw-screen sb-mw-s3');
    wrap.appendChild(engine);
    wrap.appendChild(s1);
    wrap.appendChild(s2);
    wrap.appendChild(s3);
    ulist.parentNode.insertBefore(wrap, ulist);
    ulist.classList.add('sb-mw-list');       // becomes a plain container

    function card(parent, title, sub) {
      var c = div('sb-mw-card');
      if (title) {
        var h = div('sb-mw-card-h');
        h.textContent = title;
        c.appendChild(h);
      }
      if (sub) {
        var p = el('p', 'sb-mw-card-sub');
        p.textContent = sub;
        c.appendChild(p);
      }
      parent.appendChild(c);
      return c;
    }

    /* SCREEN 1 — hero, household, tiers (all custom controls) */
    s1.appendChild(div('sb-mw-hero',
      '<h2>Become a partner in our Chabad</h2><p>Select your household to see your pricing.</p>'));
    s1.appendChild(div('sb-mw-seclabel', 'I am joining as'));
    var hhGrid = div('sb-mw-hhgrid');
    [['Single', 'One adult'], ['Couple', 'Two adults'], ['Family', 'Parents + children']].forEach(function (o) {
      var c = div('sb-mw-hhcard');
      c.setAttribute('data-hh', o[0]);
      c.innerHTML = '<div class="sb-mw-hhname">' + o[0] + '</div><div class="sb-mw-hhsub">' + o[1] + '</div>';
      c.addEventListener('click', function () { st.hh = o[0]; paint(); });
      hhGrid.appendChild(c);
    });
    s1.appendChild(hhGrid);

    var famRow = div('sb-mw-famrow');
    var parSeg = div('sb-mw-seg');
    [['two', 'Two parents'], ['one', 'Single parent']].forEach(function (o) {
      var b = btn('sb-mw-segopt', o[1]);
      b.setAttribute('data-par', o[0]);
      b.addEventListener('click', function () { st.parents = o[0]; paint(); });
      parSeg.appendChild(b);
    });
    var parBox = div('sb-mw-fambox');
    parBox.appendChild(div('sb-mw-famlab', 'Parents in the home'));
    parBox.appendChild(parSeg);
    famRow.appendChild(parBox);
    var kidsBox = div('sb-mw-fambox');
    kidsBox.appendChild(div('sb-mw-famlab', 'Children at home'));
    var stepper = div('sb-mw-stepper');
    var minus = btn('sb-mw-step', '-');
    var kidsNum = el('span', 'sb-mw-stepnum');
    kidsNum.textContent = '1';
    var plus = btn('sb-mw-step', '+');
    minus.addEventListener('click', function () { if (st.kids > 1) { st.kids--; paint(); } });
    plus.addEventListener('click', function () { if (st.kids < 6) { st.kids++; paint(); } });
    stepper.appendChild(minus);
    stepper.appendChild(kidsNum);
    stepper.appendChild(plus);
    kidsBox.appendChild(stepper);
    famRow.appendChild(kidsBox);
    s1.appendChild(famRow);

    s1.appendChild(div('sb-mw-seclabel', 'Membership level'));
    var tierGrid = div('sb-mw-tiergrid');
    var tierEls = {};
    TIER_NAMES.forEach(function (t) {
      var c = div('sb-mw-tier' + (t === 'Chai' ? ' sb-mw-popular' : ''));
      c.innerHTML =
        (t === 'Chai' ? '<span class="sb-mw-badge">Most popular</span>' : '') +
        '<div class="sb-mw-tname">' + t + '</div>' +
        '<div class="sb-mw-tprice"><span class="sb-mw-tnum"></span><span class="sb-mw-tper">/mo</span></div>' +
        '<div class="sb-mw-tyear"></div>' +
        '<ul class="sb-mw-tperks">' + (BENEFITS[t] || []).map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>';
      c.addEventListener('click', function () { st.tier = t; paint(); });
      tierGrid.appendChild(c);
      tierEls[t] = c;
    });
    s1.appendChild(tierGrid);
    var cont1 = btn('sb-mw-continue', 'Select a tier to continue');
    cont1.disabled = true;
    s1.appendChild(cont1);
    s1.appendChild(div('sb-mw-away',
      '<b>No one is ever turned away</b><span>If membership is not within reach right now, please reach out to the Rabbi privately. Every Jew has a place at our table.</span>'));

    /* SCREEN 2 — the builder's real fields, in the original's white cards */
    var top2 = div('sb-mw-top');
    var back2 = btn('sb-mw-back', 'Back');
    top2.appendChild(back2);
    top2.appendChild(div('sb-mw-h1', 'Your information'));
    s2.appendChild(top2);
    var err2 = div('sb-mw-err');
    err2.textContent = 'Please complete the highlighted required fields.';
    s2.appendChild(err2);
    var infoCard = card(s2, 'Primary member');
    var spouseCard = card(s2, 'Spouse', 'Shares the household mailing address above.');
    var kidsCard = card(s2, 'Children', 'One row per child, based on the count you chose.');
    var cont2 = btn('sb-mw-continue', 'Continue to preferences and payment');
    s2.appendChild(cont2);

    /* SCREEN 3 — extras, summary, payment, submit */
    var top3 = div('sb-mw-top');
    var back3 = btn('sb-mw-back', 'Back');
    top3.appendChild(back3);
    top3.appendChild(div('sb-mw-h1', 'Preferences & payment'));
    s3.appendChild(top3);
    var extrasCard = card(s3, 'Preferences');
    var payCard = card(s3, 'Payment');
    var sum = div('sb-mw-sum');
    payCard.appendChild(sum);
    var billRow = div('sb-mw-billrow');
    billRow.appendChild(div('sb-mw-billlab', 'How would you like to pay?'));
    var billSeg = div('sb-mw-seg');
    [['monthly', 'Monthly'], ['annual', 'Annual (pay full year)']].forEach(function (o) {
      var b = btn('sb-mw-segopt', o[1]);
      b.setAttribute('data-bill', o[0]);
      b.addEventListener('click', function () { st.billing = o[0]; syncBuilder(); paint(); });
      billSeg.appendChild(b);
    });
    billRow.appendChild(billSeg);
    payCard.insertBefore(billRow, sum);
    if (!hasAnnual) billRow.style.display = 'none';
    var discRow = div('sb-mw-discrow');
    discRow.innerHTML = '<div class="sb-mw-billlab">Discount code</div>';
    var discWrap = div('sb-mw-discwrap');
    var discIn = document.createElement('input');
    discIn.type = 'text';
    discIn.className = 'form-textbox no-validation sb-mw-discin';
    discIn.setAttribute('autocomplete', 'off');
    discIn.placeholder = 'Enter code';
    var discBtn = btn('sb-mw-discapply', 'Apply');
    discWrap.appendChild(discIn);
    discWrap.appendChild(discBtn);
    discRow.appendChild(discWrap);
    var discMsg = div('sb-mw-discmsg');
    discRow.appendChild(discMsg);
    payCard.insertBefore(discRow, sum);
    function discText(d) {
      if (d.kind === 'free') return 'fully covered';
      if (d.kind === 'percent') return d.value + '% off every payment';
      return money(d.value) + ' off every payment';
    }
    function tryCode() {
      var code = String(discIn.value || '').trim().toUpperCase();
      if (!code) {
        st.disc = null;
        discMsg.textContent = '';
        discMsg.className = 'sb-mw-discmsg';
      } else if (DISCOUNTS[code]) {
        st.disc = { code: code, kind: DISCOUNTS[code].kind, value: DISCOUNTS[code].value };
        discMsg.textContent = 'Code applied - ' + discText(st.disc) + '.';
        discMsg.className = 'sb-mw-discmsg sb-ok';
      } else {
        st.disc = null;
        discMsg.textContent = 'That code was not recognized.';
        discMsg.className = 'sb-mw-discmsg sb-bad';
      }
      syncBuilder();
      paint();
    }
    discBtn.addEventListener('click', tryCode);
    discIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); tryCode(); } });
    // the hidden priced field only exists once forms/add-discount-field.js ran
    if (!lisByLabel(/^\(discount\) amount$/, true)[0]) discRow.style.display = 'none';
    var payHolder = div('sb-mw-payfields');
    payCard.appendChild(payHolder);
    var errbar = el('div', 'sb-mf-errbar');
    payCard.appendChild(errbar);
    var submitHolder = div('sb-mw-submit');
    payCard.appendChild(submitHolder);

    /* distribute the builder's lis */
    var totalLi = null;
    $all('ul.form-section > li', root).forEach(function (li) {
      var slot = classify(li);
      if (slot === 'hide') { li.style.display = 'none'; engine.appendChild(li); return; }
      if (slot === 'engine') { engine.appendChild(li); return; }
      if (slot === 'total') { totalLi = li; li.classList.add('sb-mw-totalli'); sum.appendChild(li); return; }
      if (slot === 'spouse') { spouseCard.appendChild(li); return; }
      if (slot === 'children') { kidsCard.appendChild(li); return; }
      if (slot === 'extras') { extrasCard.appendChild(li); return; }
      if (slot === 'pay') {
        if ($all('input', li).some(function (f) { return /paymentrecurrence/.test(f.name || ''); })) li.classList.add('sb-mw-recurli');
        payHolder.appendChild(li);
        return;
      }
      if (slot === 'submit') {
        if (submitHolder.querySelector('li')) li.style.display = 'none'; // duplicate submit
        submitHolder.appendChild(li);
        return;
      }
      infoCard.appendChild(li);
    });

    // first/last name side by side (class beats :has() quirks)
    allLis().forEach(function (li) {
      if (li.querySelector('input[id^="first_"]')) li.classList.add('sb-mf-namerow');
    });

    /* Jewishness rules, same as the original form, for BOTH adults:
       Not Jewish -> tribe / lineage / mother's Hebrew name / Hebrew
       birthday don't apply; Convert -> tribe is Yisroel by definition
       (hidden) and lineage/mother default to Avraham Avinu / Sara
       Imeinu exactly like the original auto-fill. */
    function hideLi(li, hide) {
      if (!li) return;
      li.style.display = hide ? 'none' : '';
      if (hide) $all('input', li).forEach(function (f) {
        if (f.type === 'radio' || f.type === 'checkbox') f.checked = false;
        else if (f.type !== 'hidden') f.value = '';
      });
    }
    function checkedIn(li) {
      if (!li) return '';
      var hit = $all('input[type="radio"]', li).filter(function (f) { return f.checked; })[0];
      return hit ? hit.value : '';
    }
    function jewishnessRules() {
      [{ p: '', owner: 'Member' }, { p: 'spouse ', owner: 'Spouse' }].forEach(function (side) {
        var jli = lisByLabel(new RegExp('^' + side.p + 'jewishness$'))[0];
        if (!jli) return;
        var v = checkedIn(jli);
        var notJew = /not jewish/i.test(v);
        var convert = /convert/i.test(v);
        hideLi(lisByLabel(new RegExp('^' + side.p + 'tribe$'))[0], notJew || convert);
        var linLi = lisByLabel(new RegExp('^' + side.p + 'hebrew lineage'))[0];
        var momLi = lisByLabel(new RegExp('^' + side.p + 'mother.s hebrew name$'))[0];
        hideLi(linLi, notJew);
        hideLi(momLi, notJew);
        // Hebrew birthday box doesn't apply to a non-Jewish member
        hebOuts.forEach(function (h) {
          if (h.owner === side.owner) h.out.style.visibility = notJew ? 'hidden' : '';
        });
        // the original's convert auto-fill (removed again if they switch back)
        var lin = linLi && linLi.querySelector('input');
        var mom = momLi && momLi.querySelector('input');
        var gli = lisByLabel(new RegExp('^' + side.p + 'gender$'))[0];
        var female = /female/i.test(checkedIn(gli));
        if (convert) {
          if (lin && (!lin.value || lin.getAttribute('data-auto'))) {
            lin.value = (female ? 'bas' : 'ben') + ' Avraham Avinu';
            lin.setAttribute('data-auto', '1');
          }
          if (mom && (!mom.value || mom.getAttribute('data-auto'))) {
            mom.value = 'Sara Imeinu';
            mom.setAttribute('data-auto', '1');
          }
        } else {
          [lin, mom].forEach(function (f) {
            if (f && f.getAttribute('data-auto')) { f.value = ''; f.removeAttribute('data-auto'); }
          });
        }
      });
    }

    /* summary rows above the builder's own Total */
    var sumRows = div('sb-mw-sumrows');
    sum.insertBefore(sumRows, sum.firstChild);

    /* ---- painting ---- */
    function paint() {
      $all('.sb-mw-hhcard', s1).forEach(function (c) {
        c.classList.toggle('sb-on', c.getAttribute('data-hh') === (st.hh || 'Single'));
      });
      famRow.style.display = st.hh === 'Family' ? 'flex' : 'none';
      $all('.sb-mw-segopt', parSeg).forEach(function (b) {
        b.classList.toggle('sb-on', b.getAttribute('data-par') === st.parents);
      });
      kidsNum.textContent = st.kids;
      TIER_NAMES.forEach(function (t) {
        var c = tierEls[t];
        var m = monthlyFor(t);
        $('.sb-mw-tnum', c).textContent = money(m);
        $('.sb-mw-tyear', c).textContent = money(m * 12) + ' / year';
        c.classList.toggle('sb-on', st.tier === t);
      });
      if (st.tier) {
        cont1.disabled = false;
        cont1.textContent = 'Continue as ' + hhDesc() + ' - ' + st.tier + ' - ' + money(monthlyFor(st.tier)) + '/mo';
      } else {
        cont1.disabled = true;
        cont1.textContent = 'Select a tier to continue';
      }
      try { jewishnessRules(); } catch (e) { }
      spouseCard.style.display = hasSpouse() ? '' : 'none';
      kidsCard.style.display = st.hh === 'Family' ? '' : 'none';
      if (st.billing === 'annual' && !hasAnnual) st.billing = 'monthly';
      $all('.sb-mw-segopt', billSeg).forEach(function (b) {
        b.classList.toggle('sb-on', b.getAttribute('data-bill') === st.billing);
      });
      var m2 = monthlyFor(st.tier);
      var perPay = st.billing === 'annual' ? m2 * 12 : m2;
      var payNow = applyDisc(perPay);
      var billTxt = !st.tier ? '-' : (st.billing === 'annual'
        ? money(payNow) + ' now, for the full year'
        : money(payNow) + ' / month, recurring');
      var discRowHtml = st.disc && st.tier
        ? '<div class="sb-mw-sumrow"><span>Discount (' + st.disc.code + ')</span><span>-' + money(Math.round(perPay - payNow)) + '</span></div>'
        : '';
      sumRows.innerHTML =
        '<div class="sb-mw-sumrow"><span>Membership</span><span>' + (st.tier || '-') + '</span></div>' +
        '<div class="sb-mw-sumrow"><span>Household</span><span>' + hhDesc() + '</span></div>' +
        '<div class="sb-mw-sumrow"><span>Monthly</span><span>' + (st.tier ? money(m2) + ' / mo' : '-') + '</span></div>' +
        '<div class="sb-mw-sumrow"><span>Annual total</span><span>' + (st.tier ? money(m2 * 12) + ' / yr' : '-') + '</span></div>' +
        discRowHtml +
        '<div class="sb-mw-sumrow"><span>Billing</span><span>' + billTxt + '</span></div>';
    }

    function clearHidden(cardEl) {
      $all('input, select, textarea', cardEl).forEach(function (f) {
        if (f.type === 'radio' || f.type === 'checkbox') f.checked = false;
        else if (f.type !== 'hidden') f.value = '';
      });
    }
    function showScreen(n) {
      s1.style.display = n === 1 ? 'block' : 'none';
      s2.style.display = n === 2 ? 'block' : 'none';
      s3.style.display = n === 3 ? 'block' : 'none';
      window.scrollTo(0, 0);
    }
    cont1.addEventListener('click', function () {
      if (!st.tier) return;
      if (!st.hh) st.hh = 'Single';
      syncBuilder();
      if (!hasSpouse()) clearHidden(spouseCard);
      if (st.hh !== 'Family') clearHidden(kidsCard);
      paint();
      showScreen(2);
    });
    back2.addEventListener('click', function () { showScreen(1); });
    back3.addEventListener('click', function () { showScreen(2); });
    cont2.addEventListener('click', function () {
      var bad = validateScreen2();
      err2.classList.toggle('sb-on', !!bad);
      if (bad) { bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      showScreen(3);
    });

    /* ---- validation ---- */
    function markInvalid(li) { if (li) li.classList.add('sb-mf-invalid'); return li; }
    function clearInvalid(li) { if (li) li.classList.remove('sb-mf-invalid'); }
    function liFilled(li) {
      var ok = true;
      var radios = [];
      $all('input, select, textarea', li).forEach(function (f) {
        if (f.type === 'hidden') return;
        if ((f.className || '').indexOf('no-validation') !== -1) return;
        if (f.type === 'radio' || f.type === 'checkbox') { radios.push(f); return; }
        if (!String(f.value || '').trim()) ok = false;
      });
      if (radios.length && !radios.some(function (r) { return r.checked; })) ok = false;
      return ok;
    }
    root.addEventListener('input', function (e) {
      var li = e.target && e.target.closest ? e.target.closest('li.sb-mf-invalid') : null;
      if (li) clearInvalid(li);
    });
    // builder radios (jewishness, gender...) repaint the dependent fields
    root.addEventListener('change', function (e) {
      if (e.target && e.target.type === 'radio') { try { jewishnessRules(); } catch (err) { } }
    });
    root.addEventListener('change', function (e) {
      var li = e.target && e.target.closest ? e.target.closest('li.sb-mf-invalid') : null;
      if (li) clearInvalid(li);
    });

    // screen 2 gate: builder-required fields + spouse/children when they apply
    function validateScreen2() {
      var firstBad = null;
      function need(li) {
        if (!li || !liShown(li)) return;
        if (!liFilled(li)) { markInvalid(li); if (!firstBad) firstBad = li; }
      }
      $all('li.sb-mf-invalid', s2).forEach(clearInvalid);
      $all('li', infoCard).forEach(function (li) {
        var req = $all('input, select, textarea', li).some(function (f) {
          return (f.className || '').indexOf('required') !== -1;
        });
        if (req) need(li);
      });
      if (hasSpouse()) {
        [/^spouse first name$/, /^spouse last name$/, /^spouse birthday$/,
          /^spouse gender$/, /^spouse jewishness$/].forEach(function (re) {
            need(lisByLabel(re)[0]);
          });
      }
      if (st.hh === 'Family') {
        lisByLabel(/^child \d+ (name|birthday)/).forEach(need);
      }
      return firstBad;
    }

    /* ---- Hebrew date converter (the original's Hebcal feature) ----
       Shows the Hebrew date under every Gregorian date as it is picked,
       honoring the Born After Sunset answer. Hebcal sends
       Access-Control-Allow-Origin: *, so a plain fetch works — exactly
       what the original Membership Form.html and Meal Form do. */
    function g2h(iso, sunset, cb) {
      var key = iso + '|' + (sunset ? 1 : 0);
      if (hebCache[key]) { cb(hebCache[key]); return; }
      var url = 'https://www.hebcal.com/converter?cfg=json&g2h=1&gy=' + iso.slice(0, 4) +
        '&gm=' + Number(iso.slice(5, 7)) + '&gd=' + Number(iso.slice(8, 10)) + (sunset ? '&gs=on' : '');
      fetch(url).then(function (r) { return r.json(); })
        .then(function (d) { hebCache[key] = d; cb(d); })
        .catch(function () { cb(null); });
    }
    function pad2(v) { return ('0' + v).slice(-2); }
    function attachHeb(li, sunsetRe, kind, owner) {
      if (!li || li.querySelector('.sb-mw-heb')) return;
      var out = el('div', 'sb-mw-heb');
      out.style.display = 'none';
      (li.querySelector('.form-input') || li).appendChild(out);
      hebOuts.push({ out: out, owner: owner });
      function calc() {
        var sels = $all('select', li);
        if (sels.length < 3) return;
        var m = sels[0].value, d = sels[1].value, y = sels[2].value;
        if (!m || !d || !y) { out.style.display = 'none'; out.textContent = ''; out.removeAttribute('data-heb'); return; }
        var sunset = false;
        if (sunsetRe) {
          var sli = lisByLabel(sunsetRe)[0];
          if (sli) sunset = /yes/i.test(
            $all('input[type="radio"]', sli).filter(function (r) { return r.checked; })
              .map(function (r) { return r.value; })[0] || '');
        }
        var iso = y + '-' + pad2(m) + '-' + pad2(d);
        out.style.display = '';
        out.textContent = 'Converting...';
        g2h(iso, sunset, function (dta) {
          if (!dta || !dta.hd) { out.style.display = 'none'; out.textContent = ''; out.removeAttribute('data-heb'); return; }
          var s = dta.hd + ' ' + dta.hm + ' ' + dta.hy + (dta.hebrew ? ' (' + dta.hebrew + ')' : '');
          out.textContent = kind + ': ' + s;
          out.setAttribute('data-heb', s);
        });
      }
      li.addEventListener('change', calc);
      if (sunsetRe) {
        root.addEventListener('change', function (e) {
          var sli = e.target && e.target.closest ? e.target.closest('li.form-line') : null;
          if (sli && sunsetRe.test(labelOf(sli))) calc();
        });
      }
      calc();
    }
    try {
      attachHeb(lisByLabel(/^birth date$/)[0], /^born after sunset/, 'Hebrew birthday', 'Member');
      attachHeb(lisByLabel(/^spouse birthday$/)[0], /^spouse born after sunset/, 'Hebrew birthday', 'Spouse');
      attachHeb(lisByLabel(/^anniversary$/)[0], null, 'Hebrew anniversary', 'Anniversary');
      lisByLabel(/^child \d+ birthday$/).forEach(function (li) {
        attachHeb(li, null, 'Hebrew birthday', labelOf(li).replace(/ birthday$/, ''));
      });
    } catch (e) { if (window.console) console.warn('[sb-mw] converter skipped:', e); }
    // the display boxes don't post with the form, so the results ride
    // along in the Anything Else box for the office email
    function stuffHebrewDates() {
      var lines = hebOuts.filter(function (h) { return h.out.getAttribute('data-heb'); })
        .map(function (h) { return h.owner + ': ' + h.out.getAttribute('data-heb'); });
      var ta = (lisByLabel(/^anything else$/)[0] || {}).querySelector
        ? lisByLabel(/^anything else$/)[0].querySelector('textarea') : null;
      if (!ta) return;
      var MARK = '-- Hebrew dates (auto) --';
      var base = ta.value.split(MARK)[0].replace(/\s+$/, '');
      ta.value = lines.length ? (base ? base + '\n\n' : '') + MARK + '\n' + lines.join('\n') : base;
    }

    // final submit: everything again, shown in the payment card's error bar
    document.addEventListener('submit', function (event) {
      if (event.target !== root) return;
      var bad = null;
      try { bad = validateScreen2(); } catch (e) { return; }
      if (!bad) {
        errbar.classList.remove('sb-on');
        try { stuffHebrewDates(); } catch (e) { }
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      errbar.textContent = 'Some required details are missing - tap Back and complete the highlighted fields.';
      errbar.classList.add('sb-on');
    }, true);

    /* native date pickers over the builder's month/day/year dropdowns,
       like the original form; the dropdowns stay filled underneath so
       conditions, validation and the Hebrew converter keep working */
    function upgradeDates() {
      allLis().forEach(function (li) {
        var grp = li.querySelector('.form-input > .dir_ltr, .form-input-wide > .dir_ltr');
        if (!grp || li.querySelector('.sb-mw-dateproxy')) return;
        var sels = $all('select', grp);
        if (sels.length < 3 || !/\[month\]/.test(sels[0].name || '')) return;
        var inp = document.createElement('input');
        inp.type = 'date';
        inp.className = 'form-textbox sb-mw-dateproxy no-validation';
        grp.parentNode.insertBefore(inp, grp);
        li.classList.add('sb-mw-hasdate');
        function toSel(sel, v) {
          var sv = String(v);
          if (!$all('option', sel).some(function (o) { return o.value === sv; })) {
            var o = document.createElement('option');
            o.value = sv; o.textContent = sv;
            sel.appendChild(o);
          }
          if (sel.value !== sv) { sel.value = sv; fire(sel, ['change']); }
        }
        inp.addEventListener('change', function () {
          var v = inp.value;
          if (!v) {
            sels.forEach(function (s) { if (s.value) { s.value = ''; fire(s, ['change']); } });
            return;
          }
          toSel(sels[0], Number(v.slice(5, 7)));
          toSel(sels[1], Number(v.slice(8, 10)));
          toSel(sels[2], Number(v.slice(0, 4)));
        });
        if (sels[0].value && sels[1].value && sels[2].value) {
          inp.value = sels[2].value + '-' + pad2(sels[0].value) + '-' + pad2(sels[1].value);
        }
      });
    }
    try { upgradeDates(); } catch (e) { }

    /* Yahrzeits exactly like the original form: repeatable panels with
       English + Hebrew name, relationship, gender, date-of-passing picker
       with after-sunset, the converted Hebrew date, and a per-yahrzeit
       memorial-plaque checkbox.
       Data model: if the form has structured "Yahrzeit N ..." slot fields
       (injection v3), every panel syncs into its slot - REAL fields with a
       REAL date in the submission. On older forms the panels serialize
       into the legacy Yahrzeits textarea instead. */
    function initYahrzeits() {
      var slots = [];
      for (var n = 1; n <= 9; n++) {
        var nameLi = lisByLabel(new RegExp('^yahrzeit ' + n + ' name'))[0];
        if (!nameLi) break;
        slots.push({
          name: nameLi,
          heb: lisByLabel(new RegExp('^yahrzeit ' + n + ' hebrew name$'))[0],
          rel: lisByLabel(new RegExp('^yahrzeit ' + n + ' relationship$'))[0],
          gender: lisByLabel(new RegExp('^yahrzeit ' + n + ' gender$'))[0],
          date: lisByLabel(new RegExp('^yahrzeit ' + n + ' date of passing$'))[0],
          sunset: lisByLabel(new RegExp('^yahrzeit ' + n + ' after sunset$'))[0],
          hebdate: lisByLabel(new RegExp('^yahrzeit ' + n + ' hebrew date$'))[0],
          memorial: lisByLabel(new RegExp('^yahrzeit ' + n + ' memorial'))[0]
        });
      }
      var taLi = lisByLabel(/^yahrzeits$/)[0] || null;
      var ta = taLi ? taLi.querySelector('textarea') : null;
      if (!slots.length && !ta) return;
      if (root.querySelector('.sb-mw-yz')) return;
      var box = div('sb-mw-yz');
      if (taLi) {
        taLi.classList.add('sb-mw-yzli');
        (taLi.querySelector('.form-input') || taLi).appendChild(box);
      } else {
        var yzCard = div('sb-mw-card');
        extrasCard.parentNode.insertBefore(yzCard, extrasCard);
        var yzh = div('sb-mw-card-h');
        yzh.textContent = 'Yahrzeits';
        yzCard.appendChild(yzh);
        var yzsub = el('p', 'sb-mw-card-sub');
        yzsub.textContent = 'We will include them in our prayers and remind you each year.';
        yzCard.appendChild(yzsub);
        yzCard.appendChild(box);
      }
      var memLi = lisByLabel(/^memorial board$/)[0];
      if (memLi) memLi.style.display = 'none';
      var list = div('sb-mw-yzlist');
      box.appendChild(list);
      var add = btn('sb-mw-yzadd', '+ Add yahrzeit');
      box.appendChild(add);
      function field(cls, labelText, inner) {
        return '<div class="sb-mw-yzfield ' + (cls || '') + '"><span class="sb-mw-yzlab">' + labelText + '</span>' + inner + '</div>';
      }
      function addRow() {
        if (slots.length && $all('.sb-mw-yzrow', list).length >= slots.length) return null;
        var r = div('sb-mw-yzrow');
        r.innerHTML =
          '<div class="sb-mw-yzhead"><span class="sb-mw-yztitle">Yahrzeit</span><button type="button" class="sb-mw-yzdel">Remove</button></div>' +
          field('', 'Name of deceased (English)',
            '<input type="text" class="form-textbox no-validation" data-yz="name" placeholder="Full name">') +
          field('', 'Hebrew name',
            '<input type="text" class="form-textbox no-validation" data-yz="nameheb" placeholder="e.g. Moshe ben Avraham">') +
          field('', 'Relationship',
            '<select class="form-dropdown no-validation" data-yz="rel"><option value="">Please select</option><option>Father</option><option>Mother</option><option>Spouse</option><option>Sibling</option><option>Child</option><option>Other</option></select>') +
          field('', 'Gender of deceased',
            '<div class="sb-mw-seg" data-yz="gseg"><button type="button" class="sb-mw-segopt" data-g="Male">Male</button><button type="button" class="sb-mw-segopt" data-g="Female">Female</button></div>') +
          field('', 'Date of passing',
            '<input type="date" class="form-textbox no-validation" data-yz="date">' +
            '<label class="sb-mw-yzsun"><input type="checkbox" data-yz="sunset"> Passed after sunset (the Hebrew date is the next day)</label>') +
          field('', 'Hebrew date',
            '<div class="sb-mw-heb sb-mw-yzheb">-</div>') +
          '<label class="sb-mw-yzmem"><input type="checkbox" data-yz="memorial"> Add their name to our memorial board - a permanent plaque, lit each year on the yahrzeit ($360, one-time - the office will follow up)</label>';
        list.appendChild(r);
        capAdd();
        return r;
      }
      function capAdd() {
        if (slots.length) {
          add.style.display = $all('.sb-mw-yzrow', list).length >= slots.length ? 'none' : '';
        }
      }
      function rowVal(r, k) {
        var e = r.querySelector('[data-yz="' + k + '"]');
        if (!e) return '';
        if (e.type === 'checkbox') return e.checked;
        return String(e.value || '').trim();
      }
      function rowGender(r) {
        var on = r.querySelector('[data-yz="gseg"] .sb-mw-segopt.sb-on');
        return on ? on.getAttribute('data-g') : '';
      }
      function setSlotText(li, v) {
        if (!li) return;
        var i = li.querySelector('input, textarea');
        if (i && i.value !== String(v)) { i.value = String(v); fire(i, ['input', 'change']); }
      }
      function setSlotDate(li, iso) {
        if (!li) return;
        var sels = $all('select', li);
        if (sels.length < 3) return;
        function toSel(sel, v) {
          var sv = v === '' ? '' : String(Number(v));
          if (sv !== '' && !$all('option', sel).some(function (o) { return o.value === sv; })) {
            var o = document.createElement('option');
            o.value = sv; o.textContent = sv;
            sel.appendChild(o);
          }
          if (sel.value !== sv) { sel.value = sv; fire(sel, ['change']); }
        }
        if (!iso) { toSel(sels[0], ''); toSel(sels[1], ''); toSel(sels[2], ''); return; }
        toSel(sels[0], iso.slice(5, 7));
        toSel(sels[1], iso.slice(8, 10));
        toSel(sels[2], iso.slice(0, 4));
      }
      function syncOut() {
        var rows = $all('.sb-mw-yzrow', list);
        slots.forEach(function (slot, i) {
          var r = rows[i];
          var name = r ? rowVal(r, 'name') : '';
          var d = r ? rowVal(r, 'date') : '';
          var empty = !r || (!name && !d && !rowVal(r, 'nameheb'));
          setSlotText(slot.name, empty ? '' : (name || '(no name given)'));
          setSlotText(slot.heb, empty ? '' : rowVal(r, 'nameheb'));
          setSlotText(slot.rel, empty ? '' : rowVal(r, 'rel'));
          setSlotText(slot.gender, empty ? '' : rowGender(r));
          setSlotDate(slot.date, empty ? '' : d);
          setSlotText(slot.sunset, empty ? '' : (rowVal(r, 'sunset') ? 'Yes' : 'No'));
          setSlotText(slot.hebdate, empty || !r ? '' : (r.querySelector('.sb-mw-yzheb').getAttribute('data-heb') || ''));
          setSlotText(slot.memorial, empty ? '' : (rowVal(r, 'memorial') ? 'Yes - $360 plaque requested' : ''));
        });
        if (ta) {
          ta.value = rows.map(function (r) {
            var name = rowVal(r, 'name');
            var d = rowVal(r, 'date');
            if (!name && !d && !rowVal(r, 'nameheb')) return '';
            var heb = r.querySelector('.sb-mw-yzheb').getAttribute('data-heb') || '';
            return [name || '(no name given)',
              rowVal(r, 'nameheb') ? '(Hebrew: ' + rowVal(r, 'nameheb') + ')' : '',
              rowVal(r, 'rel'), rowGender(r),
              d ? 'passed ' + d : '',
              rowVal(r, 'sunset') ? 'after sunset' : '',
              heb ? 'Hebrew date: ' + heb : '',
              rowVal(r, 'memorial') ? 'MEMORIAL BOARD PLAQUE REQUESTED ($360)' : ''
            ].filter(Boolean).join(' - ');
          }).filter(Boolean).join('\n');
        }
        if (memLi) {
          var want = $all('.sb-mw-yzrow [data-yz="memorial"]', list).some(function (c) { return c.checked; });
          var mc = memLi.querySelector('input[type="checkbox"]');
          if (mc && mc.checked !== want) { mc.checked = want; fire(mc, ['change']); }
        }
      }
      function convertRow(r) {
        var out = r.querySelector('.sb-mw-yzheb');
        var d = rowVal(r, 'date');
        if (!d) {
          out.textContent = '-';
          out.removeAttribute('data-heb');
          syncOut();
          return;
        }
        out.textContent = 'Converting...';
        g2h(d, rowVal(r, 'sunset'), function (dta) {
          if (!dta || !dta.hd) {
            out.textContent = '-';
            out.removeAttribute('data-heb');
            syncOut();
            return;
          }
          var hs = dta.hd + ' ' + dta.hm + ' ' + dta.hy + (dta.hebrew ? ' (' + dta.hebrew + ')' : '');
          out.textContent = hs;
          out.setAttribute('data-heb', hs);
          syncOut();
        });
      }
      add.addEventListener('click', function () { addRow(); });
      box.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.classList.contains('sb-mw-yzdel')) {
          var r = t.closest('.sb-mw-yzrow');
          if (r) r.parentNode.removeChild(r);
          capAdd();
          syncOut();
          return;
        }
        if (t && t.classList.contains('sb-mw-segopt') && t.closest('[data-yz="gseg"]')) {
          $all('.sb-mw-segopt', t.parentNode).forEach(function (b) { b.classList.toggle('sb-on', b === t); });
          syncOut();
        }
      });
      box.addEventListener('change', function (e) {
        var r = e.target && e.target.closest ? e.target.closest('.sb-mw-yzrow') : null;
        if (r) convertRow(r);
      });
      box.addEventListener('input', syncOut);
      // starts collapsed: the panel appears only when Add yahrzeit is tapped
    }
    try { initYahrzeits(); } catch (e) { }

    paint();
    showScreen(1);
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
    safe('hh-seats', initHHSeats);
    safe('membership-builder', initMembershipBuilder);
  }

  // Footer code box loads after the DOM, but guard anyway.
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
