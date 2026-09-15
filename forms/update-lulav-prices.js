/* ============================================================
   LULAV FORM - UPDATE PRICES IN PLACE (form builder console)
   For a form that was already built by inject-lulav.js. Sets the
   three "price per item" values and sub-labels, rewrites the price
   lines of the intro text, and rebuilds the canvas. Same console
   recipe as the inject script: open the form in the builder, F12,
   pick the formbuilder frame in the console's context dropdown,
   type  allow pasting , paste this, Enter, review, click Save.
   NOTHING IS SAVED until you click the admin's Save button.
   ============================================================ */
(function () {
  'use strict';
  var PRICES = { standard: 75, deluxe: 100, premium: 150, delivery: 18 };

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown.');
    return;
  }
  var flat = getAllProperties();
  var out = {};
  Object.keys(flat).forEach(function (k) { out[k] = flat[k]; });
  var qids = [], seen = {};
  Object.keys(flat).forEach(function (k) { var m = /^(\d+)_/.exec(k); if (m && !seen[m[1]]) { seen[m[1]] = 1; qids.push(m[1]); } });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim(); }
  var report = [];
  function setPrice(re, price) {
    for (var i = 0; i < qids.length; i++) {
      if (re.test(lbl(qids[i])) && flat[qids[i] + '_type'] === 'control_number') {
        out[qids[i] + '_pricePerItem'] = price;
        out[qids[i] + '_subLabel'] = '$' + price + ' per set';
        report.push(lbl(qids[i]) + ' -> $' + price);
        return true;
      }
    }
    report.push('NOT FOUND: ' + re);
    return false;
  }
  setPrice(/^set quantity - standard$/i, PRICES.standard);
  setPrice(/^set quantity - deluxe$/i, PRICES.deluxe);
  setPrice(/^set quantity - premium$/i, PRICES.premium);
  for (var i = 0; i < qids.length; i++) {
    if (flat[qids[i] + '_type'] === 'control_text' && /SET OPTIONS/i.test(String(flat[qids[i] + '_text']))) {
      out[qids[i] + '_text'] = String(flat[qids[i] + '_text'])
        .replace(/Standard - \$\d+/, 'Standard - $' + PRICES.standard)
        .replace(/Deluxe - \$\d+/, 'Deluxe - $' + PRICES.deluxe)
        .replace(/Premium - \$\d+/, 'Premium - $' + PRICES.premium)
        .replace(/delivered in South Beach for \$\d+/, 'delivered in South Beach for $' + PRICES.delivery);
      report.push('intro text prices rewritten');
    }
    if (flat[qids[i] + '_type'] === 'control_radio' && /^delivery$/i.test(lbl(qids[i]))) {
      out[qids[i] + '_options'] = 'Pickup at Chabad (free)|Deliver to my South Beach address ($' + PRICES.delivery + ')';
      out[qids[i] + '_pricing'] = '0|' + PRICES.delivery;
    }
  }
  if (!confirm('Update the Lulav form prices to Standard $' + PRICES.standard + ', Deluxe $' + PRICES.deluxe + ', Premium $' + PRICES.premium + '? Nothing is saved until you click Save.')) return;
  var conds = null;
  try { conds = form.getProperty ? form.getProperty('conditions') : null; } catch (e) { conds = null; }
  if (!conds && flat['form_conditions']) { try { conds = typeof flat['form_conditions'] === 'string' ? JSON.parse(flat['form_conditions']) : flat['form_conditions']; } catch (e) { conds = null; } }
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  if (conds) { try { form.setProperty('conditions', conds); } catch (e) { console.warn('could not restore conditions', e); } }
  onChange('Updated Lulav & Etrog prices');
  console.log('=== PRICES UPDATED - REVIEW, THEN CLICK SAVE ===');
  console.log(report.join('\n'));
  console.log('Check the Delivery Address condition is still listed under Conditions before saving.');
})();
