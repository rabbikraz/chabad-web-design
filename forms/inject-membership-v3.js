/* ============================================================
   MEMBERSHIP FORM v3 — COMPLETE REBUILD (one script, every field)
   Paste into the DevTools console OF THE FORM BUILDER FRAME
   (open the form in the builder, F12, pick the frame whose name
   mentions formbuilder / chabadone.org in the console context
   dropdown; Chrome requires typing:  allow pasting  first).

   This is the ONE canonical script - it replaces inject-membership,
   add-annual-billing, add-discount-field and dedup:
     - every existing field is REUSED (matched by label), so nothing
       already collected is lost and CRM mappings survive
     - fields are put in canonical order; missing ones are created
     - includes: tier engine (monthly + annual twins), billing
       frequency, discount amount, full member + spouse blocks,
       6 children, yahrzeits + memorial board, preferences,
       total / payment / recurrence / submit
     - stale per-tier child copies and duplicates are dropped
     - ALL conditions are rebuilt deterministically
   Safe to re-run: running it twice produces the same form.
   NOTHING IS SAVED until you review the canvas and click the
   admin's own Save button.
   ============================================================ */
(function () {
  'use strict';

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown (see the note at the top of the script).');
    return;
  }
  var flat = getAllProperties();
  var fid = flat['form_id'] || (typeof formID !== 'undefined' && formID) || '(new form)';

  var qids = [], seenQ = {};
  Object.keys(flat).forEach(function (k) {
    var m = /^(\d+)_/.exec(k);
    if (m && !seenQ[m[1]]) { seenQ[m[1]] = 1; qids.push(m[1]); }
  });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim(); }
  function findByLabel(re, type) {
    for (var i = 0; i < qids.length; i++) {
      if (re.test(lbl(qids[i])) && (!type || flat[qids[i] + '_type'] === type) && !used[qids[i]]) return qids[i];
    }
    return null;
  }
  function findByType(type) {
    for (var i = 0; i < qids.length; i++) if (flat[qids[i] + '_type'] === type && !used[qids[i]]) return qids[i];
    return null;
  }

  if (!confirm('REBUILD form #' + fid + ' as the complete membership signup?\n\nExisting fields are kept and reordered; missing ones are created; all show/hide rules are rebuilt.\n\nNothing is saved until you click Save.')) return;

  var out = {};
  var nextId = 0;
  qids.forEach(function (id) { if (Number(id) > nextId) nextId = Number(id); });
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
  function reuse(re, type, make, rename) {
    var id = re ? findByLabel(re, type) : findByType(type);
    if (id) return copyQ(id, rename);
    return make();
  }

  var RADIO_DEF = { message: '', labelAlign: 'Auto', required: 'No', special: 'None', allowOther: 'No', otherText: 'Other', calculateOther: 'No', selected: '', spreadCols: '1', description: '' };
  var TEXT_DEF = { message: '', labelAlign: 'Auto', required: 'No', size: 20, validation: 'None', maxsize: '', inputTextMask: '', defaultValue: '', subLabel: '', hint: ' ', description: '', readonly: 'No' };
  var DATE_DEF = { message: '', labelAlign: 'Auto', required: 'No', format: 'mmddyyyy', yearFrom: '', yearTo: '', months: [[], [], [], [], [], [], [], [], [], [], [], []], description: '', sublabels: { month: 'Month', day: 'Day', year: 'Year' } };
  function radio(text, options, extra) { return addQ('control_radio', Object.assign({}, RADIO_DEF, { text: text, options: options }, extra || {})); }
  function textbox(text, extra) { return addQ('control_textbox', Object.assign({}, TEXT_DEF, { text: text }, extra || {})); }
  function bdate(text, extra) { return addQ('control_birthdate', Object.assign({}, DATE_DEF, { text: text }, extra || {})); }
  function heading(text) { return addQ('control_head', { text: text, subHeader: '', headerType: 'Default' }); }
  function textarea(text, message) { return addQ('control_textarea', { text: text, message: message || '', labelAlign: 'Auto', required: 'No', cols: 40, rows: 4, validation: 'None', entryLimit: 'None-0', maxsize: '', defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', wysiwyg: 'Disable' }); }
  function checkbox(text, options) { return addQ('control_checkbox', Object.assign({}, RADIO_DEF, { text: text, options: options })); }
  function number(text, priceEach, maxVal, extra) { return addQ('control_number', Object.assign({ text: text, message: '', labelAlign: 'Auto', required: 'No', size: '5', maxsize: '', minValue: '0', maxValue: maxVal == null ? '6' : maxVal, defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', pricePerItem: priceEach }, extra || {})); }

  /* reuse-or-create shorthand per control family (all idempotent) */
  function rRadio(labelRe, text, options, extra) {
    return reuse(labelRe, 'control_radio', function () { return radio(text, options, extra); });
  }
  function rText(labelRe, text, extra) {
    return reuse(labelRe, 'control_textbox', function () { return textbox(text, extra); });
  }
  function rDate(labelRe, text, extra) {
    return reuse(labelRe, 'control_birthdate', function () { return bdate(text, extra); });
  }
  function rHead(labelRe, text) {
    return reuse(labelRe, 'control_head', function () { return heading(text); });
  }
  function rArea(labelRe, text, message) {
    return reuse(labelRe, 'control_textarea', function () { return textarea(text, message); });
  }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function L(text) { return new RegExp('^' + esc(text) + '$', 'i'); }

  var INTRO_HTML = '<p>Choose the membership that fits your household. Members enjoy reserved High Holiday seating, event discounts, and their family&#39;s special days on our community calendar.</p>' +
    '<p>MONTHLY PRICING</p>' +
    '<p>Basic - Single $50 &middot; Couple $80 &middot; Family $80 + $20 per child</p>' +
    '<p>Chai - Single $180 &middot; Couple $300 &middot; Family $300 + $90 per child</p>' +
    '<p>Silver - Single $500 &middot; Couple $800 &middot; Family $800 + $250 per child</p>' +
    '<p>Gold - Single $1,000 &middot; Couple $1,800 &middot; Family $1,800 + $360 per child</p>' +
    '<p>Example: a family with 2 children on Chai is $300 + $90 + $90 = $480/month. Single-parent families start from the Single rate instead of the Couple rate. Annual billing is 12x the monthly price, paid once. Your total is calculated automatically below.</p>' +
    '<p>BENEFITS</p>' +
    '<p>Basic: your special days on the community calendar, 5% off all events and programs, reserved High Holiday seat.</p>' +
    '<p>Chai (most popular): 10% off all events and programs, listed on the Chai donor wall, 20% off Lulav &amp; Esrog set.</p>' +
    '<p>Silver: annual mezuzah checking, 1 co-sponsored Kiddush per year, VIP High Holiday seating, 50% off Lulav &amp; Esrog set, listed on the Silver donor wall.</p>' +
    '<p>Gold: annual mezuzah &amp; tefillin checking, 1 co-sponsored Kiddush per year, Lulav &amp; Esrog set provided, listed on the Gold donor wall.</p>';

  /* ================= 1. membership engine ================= */
  rHead(/^become a partner/i, 'Become a partner in our Chabad');
  (function () {
    for (var i = 0; i < qids.length; i++) {
      if (!used[qids[i]] && flat[qids[i] + '_type'] === 'control_text' && /MONTHLY PRICING/i.test(String(flat[qids[i] + '_text']))) { copyQ(qids[i]); out[qids[i] + '_text'] = INTRO_HTML; return; }
    }
    addQ('control_text', { text: INTRO_HTML });
  })();
  var TIERQ = rRadio(/^membership level/i, 'Membership Level', 'Basic|Chai|Silver|Gold', { required: 'Yes' });
  var BILLING = rRadio(/^billing frequency$/i, 'Billing Frequency', 'Monthly|Annual', { selected: 'Monthly' });

  var TIERS = [
    { name: 'Basic', hh: '50|80|0', par: '80|50', child: 20 },
    { name: 'Chai', hh: '180|300|0', par: '300|180', child: 90 },
    { name: 'Silver', hh: '500|800|0', par: '800|500', child: 250 },
    { name: 'Gold', hh: '1000|1800|0', par: '1800|1000', child: 360 }
  ];
  var ATIERS = [
    { name: 'Basic', hh: '600|960|0', par: '960|600', child: 240 },
    { name: 'Chai', hh: '2160|3600|0', par: '3600|2160', child: 1080 },
    { name: 'Silver', hh: '6000|9600|0', par: '9600|6000', child: 3000 },
    { name: 'Gold', hh: '12000|21600|0', par: '21600|12000', child: 4320 }
  ];
  function trioFields(prefix, t) {
    var p = esc('(' + prefix + ')') + ' ';
    return {
      hh: reuse(new RegExp('^' + p + 'i am joining as$', 'i'), 'control_radio', function () {
        return radio('(' + prefix + ') I am joining as', 'Single|Couple|Family', { pricing: t.hh });
      }),
      par: reuse(new RegExp('^' + p + 'parents at home$', 'i'), 'control_radio', function () {
        return radio('(' + prefix + ') Parents at Home', 'Two parents|Single Parent', { pricing: t.par });
      }),
      kids: reuse(new RegExp('^' + p + 'number of children at home$', 'i'), 'control_number', function () {
        return number('(' + prefix + ') Number of Children at Home', t.child);
      })
    };
  }
  var TRIO = {}, ATRIO = {};
  TIERS.forEach(function (t) { TRIO[t.name] = trioFields(t.name, t); });
  ATIERS.forEach(function (t) { ATRIO[t.name] = trioFields(t.name + ' Annual', t); });
  /* re-assert pricing on reused fields (idempotent correctness) */
  TIERS.forEach(function (t) {
    out[TRIO[t.name].hh + '_pricing'] = t.hh;
    out[TRIO[t.name].par + '_pricing'] = t.par;
    out[TRIO[t.name].kids + '_pricePerItem'] = t.child;
    out[TRIO[t.name].kids + '_maxValue'] = '6';
  });
  ATIERS.forEach(function (t) {
    out[ATRIO[t.name].hh + '_pricing'] = t.hh;
    out[ATRIO[t.name].par + '_pricing'] = t.par;
    out[ATRIO[t.name].kids + '_pricePerItem'] = t.child;
    out[ATRIO[t.name].kids + '_maxValue'] = '6';
  });
  var DISCQ = reuse(/^\(discount\) amount$/i, 'control_number', function () {
    return number('(Discount) Amount', -1, '', { description: 'Set automatically by the discount code box - do not edit.', defaultValue: '0' });
  });
  out[DISCQ + '_pricePerItem'] = -1;
  out[DISCQ + '_maxValue'] = '';

  /* ================= 2. your information ================= */
  rHead(/^your information$/i, 'Your Information');
  reuse(/^(full )?name$/i, 'control_fullname', function () {
    return addQ('control_fullname', { text: 'Full Name', message: '', labelAlign: 'Auto', required: 'Yes', prefix: 'No', suffix: 'No', middle: 'No', description: '', sublabels: { prefix: 'Prefix', first: 'First Name', middle: 'Middle Name', last: 'Last Name', suffix: 'Suffix' }, readonly: 'No' });
  });
  rRadio(/^gender$/i, 'Gender', 'Male|Female', { required: 'Yes' });
  rText(/^hebrew name$/i, 'Hebrew Name');
  rDate(/^birth date$/i, 'Birth Date', { required: 'Yes' });
  rRadio(/^born after sunset\?$/i, 'Born After Sunset?', 'Yes|No|Not sure', { description: 'The Hebrew date changes at sunset - this lets us calculate your Hebrew birthday correctly.' });
  rRadio(/^marital status$/i, 'Marital Status', 'Single|Married|Divorced|Widowed', { required: 'Yes' });
  rText(/^occupation$/i, 'Occupation');
  var JEW = rRadio(/^jewishness$/i, 'Jewishness', 'Jewish from birth|Convert|Not Jewish', { required: 'Yes' });
  var CONVAUTH = rText(/^supervising rabbi/i, 'Supervising Rabbi / Beit Din', { description: 'For converts: we need your conversion documents on file - please email a copy to the Rabbi or bring the originals in person.' });
  var CONVDATE = rDate(/^date of conversion$/i, 'Date of Conversion');
  rRadio(/^tribe$/i, 'Tribe', 'Kohen|Levi|Yisroel|Not sure');
  rText(/^hebrew lineage/i, 'Hebrew Lineage (ben/bas ___)', { description: "Father's Hebrew name. Use 'Avraham' if unsure, or ask the Rabbi." });
  rText(/^mother's hebrew name$/i, "Mother's Hebrew Name", { description: 'Used for mi shebeirach prayers.' });
  reuse(/^address$/i, 'control_address', function () {
    return addQ('control_address', { text: 'Address', message: '', labelAlign: 'Auto', required: 'Yes', selectedCountry: '', description: '', subfields: 'st1|st2|city|state|zip|country', sublabels: { addr_line1: 'Street Address', addr_line2: 'Street Address Line 2', city: 'City', state: 'State / Province', postal: 'Postal / Zip Code', country: 'Country' } });
  });
  reuse(null, 'control_email', function () {
    return addQ('control_email', { receivesReceipts: 'No', text: 'E-mail', message: '', labelAlign: 'Auto', required: 'Yes', size: 30, validation: 'Email', maxsize: '', defaultValue: '', subLabel: '', hint: 'ex: myname@example.com', description: '', confirmation: 'No', confirmationHint: 'Confirm Email', readonly: 'No' });
  });
  reuse(null, 'control_phone', function () {
    return addQ('control_phone', { text: 'Phone Number', message: '', labelAlign: 'Auto', required: 'Yes', validation: 'None', countryCode: 'No', inputMask: 'enable', inputMaskValue: '(###) ###-####', description: '', sublabels: { country: 'Country Code', area: 'Area Code', phone: 'Phone Number', full: 'Phone Number' }, readonly: 'No' });
  });
  rText(/^work phone$/i, 'Work Phone');
  rText(/^home phone$/i, 'Home Phone');

  /* ================= 3. spouse ================= */
  rHead(/^spouse$/i, 'Spouse');
  rText(/^spouse first name$/i, 'Spouse First Name');
  rText(/^spouse last name$/i, 'Spouse Last Name');
  rText(/^spouse hebrew name$/i, 'Spouse Hebrew Name');
  rRadio(/^spouse gender$/i, 'Spouse Gender', 'Male|Female');
  var SJEW = rRadio(/^spouse jewishness$/i, 'Spouse Jewishness', 'Jewish from birth|Convert|Not Jewish');
  var SCONVAUTH = rText(/^spouse supervising rabbi/i, 'Spouse Supervising Rabbi / Beit Din');
  var SCONVDATE = rDate(/^spouse date of conversion$/i, 'Spouse Date of Conversion');
  rRadio(/^spouse tribe$/i, 'Spouse Tribe', 'Kohen|Levi|Yisroel|Not sure');
  rText(/^spouse hebrew lineage/i, 'Spouse Hebrew Lineage (ben/bas ___)');
  rText(/^spouse mother's hebrew name$/i, "Spouse Mother's Hebrew Name");
  rText(/^spouse email$/i, 'Spouse Email');
  rText(/^spouse cell phone$/i, 'Spouse Cell Phone');
  rText(/^spouse occupation$/i, 'Spouse Occupation');
  rDate(/^spouse birthday$/i, 'Spouse Birthday');
  rRadio(/^spouse born after sunset\?$/i, 'Spouse Born After Sunset?', 'Yes|No|Not sure');
  rDate(/^anniversary$/i, 'Anniversary');

  /* ================= 4. children ================= */
  rHead(/^children$/i, 'Children');
  /* full per-child block, matching the original form: English name,
     Hebrew name, gender, birthday + after-sunset, auto bar/bat mitzvah
     date (page fills it), lessons interest, school/yeshiva */
  var CHILD_ROWS = [];
  for (var c = 1; c <= 6; c++) {
    (function (n) {
      var row = [];
      row.push(reuse(new RegExp('^(\\((basic)\\) )?child ' + n + ' name$', 'i'), 'control_textbox', function () {
        return textbox('Child ' + n + ' Name');
      }, 'Child ' + n + ' Name'));
      row.push(rText(new RegExp('^child ' + n + ' hebrew name$', 'i'), 'Child ' + n + ' Hebrew Name'));
      row.push(rRadio(new RegExp('^child ' + n + ' gender$', 'i'), 'Child ' + n + ' Gender', 'Male|Female'));
      row.push(rDate(new RegExp('^child ' + n + ' birthday$', 'i'), 'Child ' + n + ' Birthday'));
      row.push(rRadio(new RegExp('^child ' + n + ' born after sunset', 'i'), 'Child ' + n + ' Born After Sunset?', 'Yes|No|Not sure'));
      row.push(rText(new RegExp('^child ' + n + ' bar/bat mitzvah$', 'i'), 'Child ' + n + ' Bar/Bat Mitzvah', { description: 'Calculated automatically from the Hebrew birthday.' }));
      row.push(reuse(new RegExp('^child ' + n + ' mitzvah lessons$', 'i'), 'control_checkbox', function () {
        return checkbox('Child ' + n + ' Mitzvah Lessons', "We're interested in bar/bat mitzvah lessons");
      }));
      row.push(rText(new RegExp('^child ' + n + ' school / yeshiva$', 'i'), 'Child ' + n + ' School / Yeshiva'));
      CHILD_ROWS.push(row);
    })(c);
  }
  var CHILDNOTES = rArea(/^children - anything else$/i, 'Children - Anything Else',
    'Anything else about your children we should know.');
  out[CHILDNOTES + '_message'] = 'Anything about your children we should know.';
  var FAMCONV = rRadio(/^any conversions in the family\?$/i, 'Any Conversions in the Family?', 'Yes|No');
  var FAMCONVDET = rArea(/^conversion details$/i, 'Conversion Details',
    'Who converted, when, and with which Beit Din. We need conversion documents on file - please email a copy to the Rabbi.');

  /* ================= 5. yahrzeits + preferences ================= */
  rHead(/^yahrzeits$/i, 'Yahrzeits');
  /* four structured yahrzeit slots: REAL fields (real date fields) in
     the submission; the page overlay renders them as repeatable panels */
  for (var y = 1; y <= 4; y++) {
    rText(new RegExp('^yahrzeit ' + y + ' name \\(english\\)$', 'i'), 'Yahrzeit ' + y + ' Name (English)');
    rText(new RegExp('^yahrzeit ' + y + ' hebrew name$', 'i'), 'Yahrzeit ' + y + ' Hebrew Name');
    rText(new RegExp('^yahrzeit ' + y + ' relationship$', 'i'), 'Yahrzeit ' + y + ' Relationship');
    rText(new RegExp('^yahrzeit ' + y + ' gender$', 'i'), 'Yahrzeit ' + y + ' Gender');
    rDate(new RegExp('^yahrzeit ' + y + ' date of passing$', 'i'), 'Yahrzeit ' + y + ' Date of Passing');
    rText(new RegExp('^yahrzeit ' + y + ' after sunset$', 'i'), 'Yahrzeit ' + y + ' After Sunset');
    rText(new RegExp('^yahrzeit ' + y + ' hebrew date$', 'i'), 'Yahrzeit ' + y + ' Hebrew Date');
    rText(new RegExp('^yahrzeit ' + y + ' memorial plaque$', 'i'), 'Yahrzeit ' + y + ' Memorial Plaque');
  }
  rHead(/^preferences$/i, 'Preferences');
  rText(/^donor wall display name$/i, 'Donor Wall Display Name', { description: "How you want your family listed - e.g. 'The Cohen Family'. Enter 'Anonymous' to stay private." });
  var KIDDUSH = rText(/^kiddush sponsorship dedication$/i, 'Kiddush Sponsorship Dedication', { description: 'Included with Silver and Gold membership - e.g. In memory of...' });
  rArea(/^anything else$/i, 'Anything Else', "Hebrew names, yahrzeits, anything you'd like to be listed on the donor wall, questions for the Rabbi, or anything else we should know.");

  /* ================= 6. payment ================= */
  var MEMSTART = rDate(/^membership start date$/i, 'Membership Start Date', { description: 'Optional - when should your membership begin? Defaults to today.' });
  rHead(/^payment$/i, 'Payment');
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
  reuse(null, 'control_paymentrecurrence', function () {
    return addQ('control_paymentrecurrence', { text: 'Payment Recurrence', required: 'No', duplicatable: false });
  });
  reuse(null, 'control_button', function () {
    return addQ('control_button', { text: 'Submit', buttonAlign: 'Auto', clear: 'No', print: 'No' });
  });

  /* form-level keys ride along */
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  /* leftovers: drop stale per-tier child copies and duplicate submit
     buttons; keep anything else at the end so nothing is silently lost */
  qids.forEach(function (id) {
    if (used[id]) return;
    if (/^\((chai|silver|gold)\) child /i.test(lbl(id))) {
      report.push('REMOVED ' + id + ': ' + lbl(id) + ' (redundant per-tier copy)');
      return;
    }
    if (flat[id + '_type'] === 'control_button') {
      report.push('REMOVED ' + id + ': duplicate submit button');
      return;
    }
    if (/^yahrzeits$/i.test(lbl(id)) && flat[id + '_type'] === 'control_textarea') {
      report.push('REMOVED ' + id + ': legacy Yahrzeits text box (replaced by structured slots)');
      return;
    }
    if (/^memorial board$/i.test(lbl(id)) && flat[id + '_type'] === 'control_checkbox') {
      report.push('REMOVED ' + id + ': standalone Memorial Board (now per-yahrzeit)');
      return;
    }
    console.warn('Field ' + id + ' (' + (lbl(id) || flat[id + '_type']) + ') was not in the plan - KEPT at the end so nothing is lost.');
    copyQ(id);
  });

  /* ================= conditions (full deterministic rebuild) ================= */
  function show(terms, fields) {
    return {
      type: 'field', link: 'Any',
      terms: terms.map(function (t) { return { field: String(t[0]), operator: t[1], value: String(t[2]) }; }),
      actions: fields.map(function (f) { return { field: String(f), visibility: 'Show' }; })
    };
  }
  var conds = [];
  TIERS.forEach(function (t) {
    conds.push(show([[TIERQ, 'equals', t.name]], [TRIO[t.name].hh]));
    conds.push(show([[TRIO[t.name].hh, 'equals', 'Family']], [TRIO[t.name].par, TRIO[t.name].kids]));
    conds.push(show([[BILLING, 'equals', 'Annual']], [ATRIO[t.name].hh]));
    conds.push(show([[ATRIO[t.name].hh, 'equals', 'Family']], [ATRIO[t.name].par, ATRIO[t.name].kids]));
  });
  var COUNTS = TIERS.map(function (t) { return TRIO[t.name].kids; })
    .concat(TIERS.map(function (t) { return ATRIO[t.name].kids; }));
  CHILD_ROWS.forEach(function (row, i) {
    conds.push(show(
      COUNTS.map(function (cq) { return [cq, 'greaterThan', i]; }),
      row
    ));
  });
  conds.push(show([[FAMCONV, 'equals', 'Yes']], [FAMCONVDET]));
  conds.push(show(COUNTS.map(function (cq) { return [cq, 'greaterThan', 0]; }), [CHILDNOTES]));
  conds.push(show([[JEW, 'equals', 'Convert']], [CONVAUTH, CONVDATE]));
  conds.push(show([[SJEW, 'equals', 'Convert']], [SCONVAUTH, SCONVDATE]));
  conds.push(show([[TIERQ, 'equals', 'Silver'], [TIERQ, 'equals', 'Gold']], [KIDDUSH]));

  /* ================= rebuild the canvas ================= */
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Rebuilt the complete membership form (v3)');

  console.log('=== v3 REBUILD COMPLETE ON FORM #' + fid + ' - REVIEW THE FORM, THEN CLICK SAVE ===');
  console.log(report.join('\n') || '(every field already existed - reordered and re-priced only)');
  console.log('Conditions rebuilt: ' + conds.length + ' rules.');
  console.log('If anything looks wrong: close WITHOUT saving and send this output.');
})();
