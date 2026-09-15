/* ============================================================
   LULAV FORM - UPDATE THE BUILT FORM IN PLACE (form builder console)
   For the form that inject-lulav.js already built on page 7511371.
   What it does (Leibel's 2026-09-15 changes):
     - prices: Standard $75, Deluxe $100, Premium $150
     - turns the three quantity fields into set CARDS: label becomes
       "Standard set" etc., sub-label carries price + description
       (the page styling puts name, price, description and the
       quantity selector together in one card)
     - removes the Delivery choice and the Delivery Address field
       (pickup only) and clears the condition that pointed at them
     - adds "Fancier set - my budget": the buyer types what they want
       to spend ($150 or more) and is charged exactly that amount
     - shortens the intro text (the set list now lives in the cards)
   Console recipe: open the form in the builder, F12, pick the
   formbuilder frame in the console's context dropdown, type
   allow pasting , paste this, Enter, review the canvas, click the
   admin's Save. NOTHING IS SAVED until you do.
   ============================================================ */
(function () {
  'use strict';
  var PRICES = { standard: 75, deluxe: 100, premium: 150, fancierMin: 150 };
  var SETS = [
    { re: /^(set quantity - )?standard( set)?$/i, label: 'Standard set', price: PRICES.standard, desc: 'a beautiful kosher set' },
    { re: /^(set quantity - )?deluxe( set)?$/i,   label: 'Deluxe set',   price: PRICES.deluxe,   desc: 'a finer etrog and fuller lulav' },
    { re: /^(set quantity - )?premium( set)?$/i,  label: 'Premium set',  price: PRICES.premium,  desc: 'our top selection, chosen first' }
  ];

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown.');
    return;
  }
  var flat = getAllProperties();
  var qids = [], seen = {};
  Object.keys(flat).forEach(function (k) { var m = /^(\d+)_/.exec(k); if (m && !seen[m[1]]) { seen[m[1]] = 1; qids.push(m[1]); } });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim(); }
  function typ(id) { return flat[id + '_type']; }
  var report = [];
  var nextId = (typeof getMaxID === 'function' ? getMaxID(flat) : 0) || 0;
  qids.forEach(function (id) { if (Number(id) > nextId) nextId = Number(id); });

  var hasFancier = qids.some(function (id) { return /^fancier set/i.test(lbl(id)); });
  if (!confirm('Update the Lulav form on this page: prices $' + PRICES.standard + ' / $' + PRICES.deluxe + ' / $' + PRICES.premium + ', set cards, remove Delivery + Delivery Address, ' + (hasFancier ? 'keep' : 'add') + ' the "Fancier set - my budget" box. Nothing is saved until you click Save. Continue?')) return;

  var out = {};
  var dropped = [];
  function copyQ(id) { Object.keys(flat).forEach(function (k) { if (k.indexOf(id + '_') === 0) out[k] = flat[k]; }); }

  var INTRO_HTML = '<p>Hand-selected, kosher Lulav &amp; Etrog sets for Sukkot 5787. Every set includes a lulav, etrog, three hadassim and two aravot, checked by the Rabbi, with a holder for the lulav.</p>' +
    '<p>Choose how many of each set you would like; your total is calculated automatically. All sets are picked up at Chabad in South Beach, 320 Meridian Ave.</p>' +
    '<p>Please order by Sunday, September 20. Sukkot begins Friday evening, September 25.</p>';

  qids.forEach(function (id) {
    var L = lbl(id), T = typ(id);
    if (T === 'control_radio' && /^delivery$/i.test(L)) { dropped.push(id); report.push('REMOVED Delivery choice (' + id + ')'); return; }
    if (T === 'control_address' && /^delivery address$/i.test(L)) { dropped.push(id); report.push('REMOVED Delivery Address (' + id + ')'); return; }
    copyQ(id);
    if (T === 'control_number') {
      SETS.forEach(function (s, idx) {
        if (!s.re.test(L)) return;
        out[id + '_text'] = s.label;
        out[id + '_pricePerItem'] = s.price;
        out[id + '_subLabel'] = '$' + s.price + ' per set - ' + s.desc;
        report.push(L + ' -> ' + s.label + ' $' + s.price);
        if (idx === 2 && !hasFancier) {
          var nid = String(++nextId);
          out[nid + '_type'] = 'control_number'; out[nid + '_qid'] = Number(nid); out[nid + '_name'] = 'input' + nid;
          var props = { text: 'Fancier set - my budget', message: '', labelAlign: 'Auto', required: 'No', size: '6', maxsize: '', minValue: String(PRICES.fancierMin), maxValue: '10000', defaultValue: '', subLabel: 'Type the amount you would like to spend ($' + PRICES.fancierMin + ' or more) and we will hand-pick a set in that range; you are charged exactly this amount', hint: '', description: '', readonly: 'No', pricePerItem: 1 };
          Object.keys(props).forEach(function (p) { out[nid + '_' + p] = props[p]; });
          report.push('NEW ' + nid + ': Fancier set - my budget (charged 1:1, min $' + PRICES.fancierMin + ')');
        }
      });
      if (/^fancier set/i.test(L)) { out[id + '_pricePerItem'] = 1; out[id + '_minValue'] = String(PRICES.fancierMin); report.push('kept fancier box, price per item 1'); }
    }
    if (T === 'control_text' && /Hand-selected, kosher Lulav/i.test(String(flat[id + '_text']))) { out[id + '_text'] = INTRO_HTML; report.push('intro text rewritten'); }
  });
  Object.keys(flat).forEach(function (k) { if (k.indexOf('form_') === 0) out[k] = flat[k]; });

  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  try { form.setProperty('conditions', []); } catch (e) { console.warn('could not clear conditions', e); }
  onChange('Updated the Lulav & Etrog order form');
  console.log('=== FORM UPDATED - REVIEW THE CANVAS, THEN CLICK SAVE ===');
  console.log(report.join('\n'));
  console.log('Removed field ids: ' + (dropped.join(', ') || 'none') + '. Conditions cleared (the only rule pointed at the removed address field).');
})();
