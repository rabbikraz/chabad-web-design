/* Registration-page autofill + credit-card fixes.
   Lives in the HEADER block (the footer code box refuses to save past
   ~63KB url-encoded, and this module is fully self-contained).
   Same rule as script.js: NO literal HTML entities in this file — the
   ChabadOne admin decodes them on save and corrupts the script. */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* The template labels its fields with <div class="label">, not <label for>,
     so a browser or password manager has nothing authoritative to match on and
     has to guess from position — which our two-column layout throws off, so
     every value lands one field out (email into last name, zip into city...).
     Naming each field with a standard autocomplete token removes the guessing.
     Payment fields are marked off so autofill can't silently reset the method
     select, which then fails validation with "select at least one payment
     method". */
  var AUTOCOMPLETE = {
    ReserversTitle: 'honorific-prefix',
    ReserversFirstName: 'given-name',
    ReserversLastName: 'family-name',
    ReserversEmailAddress: 'email',
    ReserversBillingAddress1: 'address-line1',
    ReserversBillingCity: 'address-level2',
    ReserversBillingState: 'address-level1',
    ReserversBillingPostCode: 'postal-code',
    ReserversCountry: 'country-name',
    ReserversPhone: 'tel',
    PaymentMethod: 'off'
  };

  function initFormAutofill() {
    var form = $('#RegisterSinglePage');
    if (!form) return;
    // a form (or field) declaring autocomplete="off" switches the browser's
    // autofill off wholesale — which looks exactly like "it doesn't see a form"
    if (/^off$/i.test(form.getAttribute('autocomplete') || '')) {
      form.setAttribute('autocomplete', 'on');
    }
    $all('#ReserversInformation [autocomplete="off"]', form).forEach(function (el) {
      el.removeAttribute('autocomplete');
    });
    Object.keys(AUTOCOMPLETE).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.getAttribute('autocomplete')) {
        el.setAttribute('autocomplete', AUTOCOMPLETE[id]);
      }
    });
    // attendee-row names belong to other people — never autofill them
    $all('#RegisterSinglePage .reservation input', form).forEach(function (el) {
      if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
    });
    // give the CMS's <div class="label"> a real association with its field, so
    // assistive tech and autofill heuristics agree with what's on screen
    $all('#ReserversInformation .clearfix.small_vertical_padding, #Payment .clearfix.small_vertical_padding', form)
      .forEach(function (row, i) {
        var label = row.querySelector('.label');
        var field = row.querySelector('input, select, textarea');
        if (!label || !field) return;
        if (!label.id) label.id = 'sb-lbl-' + i;
        if (!field.getAttribute('aria-labelledby')) {
          field.setAttribute('aria-labelledby', label.id);
        }
      });
  }

  /* Card brands by number prefix, each with the spellings a card-type dropdown
     might use. The CMS's own detectCardType() compares the number's brand
     against the option values and does `selectedIndex = index` — where index
     is -1 when nothing matches, silently clearing the selection. Its table
     says "American Express" while a form may list "Amex", so Amex ends up
     unset while Visa works. We only step in when it left nothing selected. */
  var CARD_BRANDS = [
    { aliases: ['amex', 'americanexpress'], test: function (n) { return /^3[47]/.test(n); } },
    { aliases: ['visa'], test: function (n) { return /^4/.test(n); } },
    { aliases: ['mastercard', 'mc'], test: function (n) { return /^5[1-5]/.test(n) || /^2(2[2-9]|[3-6][0-9]|7[01]|720)/.test(n); } },
    { aliases: ['discover', 'discovercard'], test: function (n) { return /^6(011|5|4[4-9])/.test(n); } },
    { aliases: ['dinersclub', 'diners', 'dinersclubinternational'], test: function (n) { return /^3(0[0-5]|09|[68])/.test(n); } },
    { aliases: ['jcb'], test: function (n) { return /^35(2[89]|[3-8][0-9])/.test(n); } },
    { aliases: ['unionpay', 'chinaunionpay'], test: function (n) { return /^62/.test(n); } }
  ];
  function normCard(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function syncCardType() {
    var num = document.getElementById('PaymentCreditCardNumber');
    var sel = document.getElementById('PaymentCreditCardType');
    if (!num || !sel || !sel.options || !sel.options.length) return;
    // leave a working selection alone — only rescue an empty one
    if (sel.selectedIndex >= 0 && sel.value) return;
    var digits = String(num.value || '').replace(/\D/g, '');
    if (digits.length < 2) return;
    var brand = CARD_BRANDS.filter(function (b) { return b.test(digits); })[0];
    if (!brand) return;
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      if (!o.value && !o.text) continue;
      if (brand.aliases.indexOf(normCard(o.value)) !== -1 ||
          brand.aliases.indexOf(normCard(o.text)) !== -1) {
        sel.selectedIndex = i;
        ['input', 'change'].forEach(function (t) {
          sel.dispatchEvent(new Event(t, { bubbles: true }));
        });
        return;
      }
    }
  }

  var CC_AUTOCOMPLETE = {
    PaymentCreditCardNumber: 'cc-number',
    PaymentCardExpirationMonth: 'cc-exp-month',
    PaymentCardExpirationYear: 'cc-exp-year',
    PaymentCardCode: 'cc-csc',
    PaymentCreditCardType: 'cc-type',
    PaymentNameOnCard: 'cc-name'
  };
  function applyCardAutocomplete() {
    Object.keys(CC_AUTOCOMPLETE).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getAttribute('autocomplete') !== CC_AUTOCOMPLETE[id]) {
        el.setAttribute('autocomplete', CC_AUTOCOMPLETE[id]);
      }
    });
  }

  function initCreditCard() {
    if (!$('#RegisterSinglePage')) return;
    applyCardAutocomplete();
    // the card block is rendered only once Credit Card is chosen, so watch for it
    var mo = new MutationObserver(function () {
      applyCardAutocomplete();
      syncCardType();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // autofill can populate without firing input, so listen broadly
    ['input', 'change', 'blur'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        if (e.target && e.target.id === 'PaymentCreditCardNumber') {
          // after the CMS's own handler has run
          setTimeout(syncCardType, 0);
        }
      }, true);
    });
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  /* event listing: tint each row with its event's theme (config from
     the sb-config script that precedes this one in the header) */
  function themeEventListing() {
    if (!window.SB_FORCE_LISTING &&
        window.location.pathname.toLowerCase().indexOf('/tools/events') === -1) return;
    var PAGE_THEMES = window.SB_PAGE_THEMES || {};
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

  function initEventDescriptionClamp() {
    if (!window.SB_FORCE_LISTING &&
        window.location.pathname.toLowerCase().indexOf('/tools/events') === -1) return;
    $all('.event .bottom_padding').forEach(function (desc) {
      if (desc.dataset.sbReadmore) return;
      desc.dataset.sbReadmore = '1';
      desc.classList.add('sb-clamp-3');
      // only add the toggle if the text actually overflows 3 lines
      if (desc.scrollHeight <= desc.clientHeight + 2) {
        desc.classList.remove('sb-clamp-3');
        return;
      }
      var btn = el('button', 'sb-readmore-toggle');
      btn.type = 'button';
      btn.textContent = 'Read more';
      btn.addEventListener('click', function () {
        var expanded = desc.classList.toggle('sb-expanded');
        btn.textContent = expanded ? 'Read less' : 'Read more';
      });
      desc.insertAdjacentElement('afterend', btn);
    });
  }

  function boot() {
    try { initFormAutofill(); } catch (e) { }
    try { initCreditCard(); } catch (e) { }
    try { themeEventListing(); } catch (e) { }
    try { initEventDescriptionClamp(); } catch (e) { }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
