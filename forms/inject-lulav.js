/* ============================================================
   LULAV & ETROG ORDER FORM - FORM BUILDER INJECTION (any form)
   Paste into the DevTools console OF THE FORM BUILDER FRAME
   (open the form in the form builder, press F12, and in the
   Console tab use the context dropdown - the one that says
   "top" - to pick the frame whose name mentions formbuilder
   or chabadone.org. Chrome makes you type: allow pasting  first).

   Builds the whole Lulav & Etrog order form from scratch on a
   blank form (fields that already exist with the same label are
   kept and reused in place). Same helper shapes as
   forms/inject-membership.js, which built the live membership form.

   PRICES: edit the PRICES object below BEFORE running. The values
   shipped here are placeholders; the intro text is generated
   from the same object so the two never disagree.

   NOTHING IS SAVED until you review the canvas and click the
   admin's own Save button. If anything looks wrong: close the
   builder WITHOUT saving and send the console output.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- EDIT ME: prices in whole dollars ---------- */
  var PRICES = {
    standard: 54,     // "Set quantity - Standard"  (per set)
    deluxe: 85,       // "Set quantity - Deluxe"    (per set)
    premium: 120,     // "Set quantity - Premium"   (per set)
    delivery: 18,     // "Deliver to my South Beach address"
    donations: [18, 36, 54, 100, 180]
  };
  var ORDER_BY = 'Sunday, September 20';
  var SUKKOT_STARTS = 'Friday evening, September 25';

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown (see the note at the top of the script).');
    return;
  }
  var flat = getAllProperties();
  var fid = flat['form_id'] || (typeof formID !== 'undefined' && formID) || '(new form)';

  /* ---- helpers over the current form ---- */
  var qids = [], seenQ = {};
  Object.keys(flat).forEach(function (k) {
    var m = /^(\d+)_/.exec(k);
    if (m && !seenQ[m[1]]) { seenQ[m[1]] = 1; qids.push(m[1]); }
  });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim(); }
  function findByLabel(re, type) {
    for (var i = 0; i < qids.length; i++) {
      if (re.test(lbl(qids[i])) && (!type || flat[qids[i] + '_type'] === type)) return qids[i];
    }
    return null;
  }
  function findByType(type) {
    for (var i = 0; i < qids.length; i++) if (flat[qids[i] + '_type'] === type) return qids[i];
    return null;
  }

  if (findByLabel(/^set quantity - standard$/i)) {
    alert('This form already has a "Set quantity - Standard" field - it looks like the injection already ran here. Aborting, nothing changed.');
    return;
  }
  if (!confirm('This will build form #' + fid + ' as the Lulav & Etrog order form (existing fields with matching labels are kept; everything else is created). Nothing is saved until you click Save. Continue?')) return;

  var out = {};
  var nextId = (typeof getMaxID === 'function' ? getMaxID(flat) : 0) || 0;
  var used = {};
  var report = [];

  function copyQ(id, rename) {
    used[id] = 1;
    Object.keys(flat).forEach(function (k) {
      if (k.indexOf(id + '_') === 0) out[k] = flat[k];
    });
    if (rename) out[id + '_text'] = rename;
    return id;
  }
  function addQ(type, props) {
    var id = String(++nextId);
    out[id + '_type'] = type;
    out[id + '_qid'] = Number(id);
    out[id + '_name'] = 'input' + id;
    Object.keys(props).forEach(function (p) { out[id + '_' + p] = props[p]; });
    report.push('NEW ' + id + ': ' + (props.text || type));
    return id;
  }
  /* reuse a matching existing field, else create it */
  function reuse(re, type, make, rename) {
    var id = re ? findByLabel(re, type) : findByType(type);
    if (id) return copyQ(id, rename);
    return make();
  }

  var RADIO_DEF = { message: '', labelAlign: 'Auto', required: 'No', special: 'None', allowOther: 'No', otherText: 'Other', calculateOther: 'No', selected: '', spreadCols: '1', description: '' };
  var DROP_DEF = { message: '', labelAlign: 'Auto', required: 'No', special: 'None', size: 0, width: 150, selected: '', subLabel: '', description: '' };
  function radio(text, options, extra) { return addQ('control_radio', Object.assign({}, RADIO_DEF, { text: text, options: options }, extra || {})); }
  function dropdown(text, options, extra) { return addQ('control_dropdown', Object.assign({}, DROP_DEF, { text: text, options: options }, extra || {})); }
  function heading(text, sub) { return addQ('control_head', { text: text, subHeader: sub || '', headerType: 'Default' }); }
  function textarea(text, message) { return addQ('control_textarea', { text: text, message: message || '', labelAlign: 'Auto', required: 'No', cols: 40, rows: 4, validation: 'None', entryLimit: 'None-0', maxsize: '', defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', wysiwyg: 'Disable' }); }
  /* control_number carries pricePerItem (quantity x price) - the same control
     the live membership form uses for its priced "Number of Children" fields.
     (control_quantity also has pricePerItem but the builder allows only ONE per form.) */
  function qty(text, priceEach, hint) {
    return addQ('control_number', { text: text, message: '', labelAlign: 'Auto', required: 'No', size: '5', maxsize: '', minValue: '0', maxValue: '10', defaultValue: '', subLabel: hint || '', hint: '0', description: '', readonly: 'No', pricePerItem: priceEach });
  }

  var INTRO_HTML = '<p>Hand-selected, kosher Lulav &amp; Etrog sets for Sukkot 5787. Every set includes a lulav, etrog, three hadassim and two aravot, checked by the Rabbi, with a holder for the lulav.</p>' +
    '<p>SET OPTIONS</p>' +
    '<p>Standard - $' + PRICES.standard + ' &middot; a beautiful kosher set</p>' +
    '<p>Deluxe - $' + PRICES.deluxe + ' &middot; a finer etrog and fuller lulav</p>' +
    '<p>Premium - $' + PRICES.premium + ' &middot; our top selection, chosen first</p>' +
    '<p>Enter how many of each set you would like below; your total is calculated automatically. Sets are picked up at Chabad in South Beach, 320 Meridian Ave, or delivered in South Beach for $' + PRICES.delivery + '.</p>' +
    '<p>Please order by ' + ORDER_BY + '. Sukkot begins ' + SUKKOT_STARTS + '.</p>';

  /* ================= sets ================= */
  reuse(/^lulav .* sets 5787$/i, 'control_head', function () { return heading('Lulav & Etrog Sets 5787', 'Order your set for Sukkot'); });
  (function () { /* intro text block: reuse the one that carries the set options */
    for (var i = 0; i < qids.length; i++) {
      if (flat[qids[i] + '_type'] === 'control_text' && /SET OPTIONS/i.test(String(flat[qids[i] + '_text']))) { copyQ(qids[i]); return; }
    }
    addQ('control_text', { text: INTRO_HTML });
    report.push('  (intro text created)');
  })();
  reuse(/^set quantity - standard$/i, 'control_number', function () { return qty('Set quantity - Standard', PRICES.standard, '$' + PRICES.standard + ' per set'); });
  reuse(/^set quantity - deluxe$/i, 'control_number', function () { return qty('Set quantity - Deluxe', PRICES.deluxe, '$' + PRICES.deluxe + ' per set'); });
  reuse(/^set quantity - premium$/i, 'control_number', function () { return qty('Set quantity - Premium', PRICES.premium, '$' + PRICES.premium + ' per set'); });

  /* ================= pickup / delivery ================= */
  var DELIVER_OPT = 'Deliver to my South Beach address ($' + PRICES.delivery + ')';
  var DELIVERY = reuse(/^delivery$/i, 'control_radio', function () {
    return radio('Delivery', 'Pickup at Chabad (free)|' + DELIVER_OPT, { required: 'Yes', pricing: '0|' + PRICES.delivery, selected: 'Pickup at Chabad (free)' });
  });

  /* ================= your information ================= */
  heading('Your Information');
  reuse(/^(full )?name$/i, 'control_fullname', function () {
    return addQ('control_fullname', { text: 'Full Name', message: '', labelAlign: 'Auto', required: 'Yes', prefix: 'No', suffix: 'No', middle: 'No', description: '', sublabels: { prefix: 'Prefix', first: 'First Name', middle: 'Middle Name', last: 'Last Name', suffix: 'Suffix' }, readonly: 'No' });
  });
  reuse(null, 'control_email', function () {
    return addQ('control_email', { receivesReceipts: 'No', text: 'Email', message: '', labelAlign: 'Auto', required: 'Yes', size: 30, validation: 'Email', maxsize: '', defaultValue: '', subLabel: '', hint: 'ex: myname@example.com', description: '', confirmation: 'No', confirmationHint: 'Confirm Email', readonly: 'No' });
  });
  reuse(null, 'control_phone', function () {
    return addQ('control_phone', { text: 'Phone', message: '', labelAlign: 'Auto', required: 'Yes', validation: 'None', countryCode: 'No', inputMask: 'enable', inputMaskValue: '(###) ###-####', description: 'We text you when your set is ready.', sublabels: { country: 'Country Code', area: 'Area Code', phone: 'Phone Number', full: 'Phone Number' }, readonly: 'No' });
  });
  /* Required stays OFF: the builder cannot make a field required only when
     delivery is chosen, and ticking Required would block pickup orders. The
     condition below shows it only for delivery; the label asks for it. */
  var ADDRESS = reuse(/^delivery address$/i, 'control_address', function () {
    return addQ('control_address', { text: 'Delivery Address', message: 'Required for delivery orders.', labelAlign: 'Auto', required: 'No', selectedCountry: 'United States', description: '', subfields: 'st1|st2|city|state|zip', sublabels: { addr_line1: 'Street Address', addr_line2: 'Apt / Unit', city: 'City', state: 'State', postal: 'Zip Code', country: 'Country' } });
  });

  /* ================= donation / notes ================= */
  var donOpts = PRICES.donations.map(function (d) { return '$' + d; }).join('|');
  var donPricing = PRICES.donations.join('|');
  reuse(/^would you like to add a donation/i, 'control_dropdown', function () {
    /* the engine renders its own blank placeholder as the first option, and
       prices the real options 1:1 (pricing[selectedIndex - 1]) - so the list
       carries only the amounts, and an untouched field is omitted from the receipt */
    return dropdown('Would you like to add a donation?', donOpts, { pricing: donPricing, subLabel: 'Helps us provide sets to families who cannot afford one' });
  });
  reuse(/^notes$/i, 'control_textarea', function () {
    return textarea('Notes', 'Anything we should know: a set for a child, an etrog preference, when you can pick up.');
  });

  /* ================= payment ================= */
  heading('Payment');
  reuse(null, 'control_totalamount', function () {
    return addQ('control_totalamount', { labelAlign: 'Auto', text: 'Total', partialPayEnabled: 'No', partialPayType: 'dollar', partialPayMinimum: 0, required: 'No', offsetGiftEnabled: 'No', offsetGift: 3 });
  });
  reuse(null, 'control_payform', function () {
    var id = addQ('control_payform', {
      text: 'Payment', message: '', labelAlign: 'Auto', required: 'No', duplicatable: false, selectedCountry: '', description: '',
      sublabels: { cc_firstName: 'First Name', cc_lastName: 'Last Name', cc_type: 'Credit Card Type', cc_number: 'Credit Card Number', cc_ccv: 'Security Code', cc_nameOnCard: 'Name on Card', cc_IdNumber: 'Israel Identity Number', cc_exp_month: 'Expiration Month', cc_exp_year: 'Expiration Year', eCheck_bankName: 'Bank Name', eCheck_routingNumber: 'Routing Number', eCheck_accountNumber: 'Account Number', eCheck_accountType: 'Account Type', addr_line1: 'Street Address', addr_line2: 'Street Address Line 2', city: 'City', state: 'State / Province', postal: 'Postal / Zip Code', country: 'Country' },
      options: { currency: 'default', creditCard: { value: 'Credit Card', enabled: true, fields: [{ name: 'ccv', value: 'CCV', enabled: true }, { name: 'nameOnCard', value: 'Name on Card', enabled: true }, { name: 'billingAddress', value: 'Billing Address', enabled: true }, { name: 'israelIdentityNumber', value: 'Israel Identity Number', enabled: true }], processorIndex: 0, type: [{ name: 'Visa', value: 'Visa', enabled: true }, { name: 'Mastercard', value: 'MasterCard', enabled: true }, { name: 'Amex', value: 'American Express', enabled: true }, { name: 'Discover', value: 'Discover', enabled: true }, { name: 'Isracard', value: 'Isracard', enabled: false }], payMe: false }, paypal: { value: 'Paypal', enabled: false, processorIndex: null }, eCheck: { value: 'eCheck', enabled: false }, other: { value: 'Other', enabled: false, altText: '', message: '' } }
    });
    report.push('  (Payment created fresh - OPEN ITS PAYMENT WIZARD AFTER SAVING to confirm the credit card processor)');
    return id;
  });
  reuse(null, 'control_button', function () {
    return addQ('control_button', { text: 'Order My Set', buttonAlign: 'Auto', clear: 'No', print: 'No' });
  }, 'Order My Set');

  /* form-level keys ride along (new forms get the builder's defaults) */
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  /* any unplanned existing field is kept at the end so nothing is lost */
  qids.forEach(function (id) {
    if (used[id]) return;
    console.warn('Field ' + id + ' (' + (lbl(id) || flat[id + '_type']) + ') was not in the plan - KEPT at the end so nothing is lost.');
    copyQ(id);
  });

  /* ================= conditions ================= */
  function show(terms, fields) {
    return {
      type: 'field', link: 'Any',
      terms: terms.map(function (t) { return { field: String(t[0]), operator: t[1], value: String(t[2]) }; }),
      actions: fields.map(function (f) { return { field: String(f), visibility: 'Show' }; })
    };
  }
  var conds = [];
  conds.push(show([[DELIVERY, 'equals', DELIVER_OPT]], [ADDRESS]));

  /* ================= rebuild the canvas ================= */
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Injected the Lulav & Etrog order form');

  console.log('=== INJECTION COMPLETE ON FORM #' + fid + ' - REVIEW THE FORM, THEN CLICK SAVE ===');
  console.log(report.join('\n'));
  console.log('Prices used: Standard $' + PRICES.standard + ', Deluxe $' + PRICES.deluxe + ', Premium $' + PRICES.premium + ', delivery $' + PRICES.delivery + '.');
  console.log('Conditions: ' + conds.length + ' rule (Delivery Address shows only for delivery orders).');
  console.log('If anything looks wrong: close WITHOUT saving and send this output to your helper.');
})();
