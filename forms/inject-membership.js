/* ============================================================
   MEMBERSHIP FORM — FULL QUESTIONNAIRE INJECTION (any form)
   Paste into the DevTools console OF THE FORM BUILDER FRAME
   (open the form in the form builder, press F12, and in the
   Console tab use the context dropdown — the one that says
   "top" — to pick the frame whose name mentions formbuilder
   or chabadone.org. Chrome makes you type: allow pasting  first).

   Works on ANY form:
     - fields that already exist (matched by label) are KEPT and
       reused in place — on the original membership form this
       upgrades it; on a blank form it builds everything from
       scratch, including the tier pricing, payment, total,
       recurrence, and submit button
     - adds the full questionnaire: a birthday for every child,
       gender, jewishness + conversion details, tribe, lineage,
       mother's Hebrew name, marital status, occupation, extra
       phones, after-sunset, full spouse block, yahrzeits +
       memorial board interest, donor wall name, kiddush
       dedication, and section headings
     - removes redundant per-tier (Chai/Silver/Gold) child copies
     - rewires all show/hide conditions to match
   NOTHING IS SAVED until you review the canvas and click the
   admin's own Save button. If anything looks wrong: close the
   builder WITHOUT saving and send the console output.
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

  if (findByLabel(/^child 1 birthday$/i)) {
    alert('This form already has a "Child 1 Birthday" field - it looks like the injection already ran here. Aborting, nothing changed.');
    return;
  }
  if (!confirm('This will rebuild form #' + fid + ' as the full membership signup (existing fields are kept; missing ones are created). Nothing is saved until you click Save. Continue?')) return;

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
  var TEXT_DEF = { message: '', labelAlign: 'Auto', required: 'No', size: 20, validation: 'None', maxsize: '', inputTextMask: '', defaultValue: '', subLabel: '', hint: ' ', description: '', readonly: 'No' };
  var DATE_DEF = { message: '', labelAlign: 'Auto', required: 'No', format: 'mmddyyyy', yearFrom: '', yearTo: '', months: [[], [], [], [], [], [], [], [], [], [], [], []], description: '', sublabels: { month: 'Month', day: 'Day', year: 'Year' } };
  function radio(text, options, extra) { return addQ('control_radio', Object.assign({}, RADIO_DEF, { text: text, options: options }, extra || {})); }
  function textbox(text, extra) { return addQ('control_textbox', Object.assign({}, TEXT_DEF, { text: text }, extra || {})); }
  function bdate(text, extra) { return addQ('control_birthdate', Object.assign({}, DATE_DEF, { text: text }, extra || {})); }
  function heading(text) { return addQ('control_head', { text: text, subHeader: '', headerType: 'Default' }); }
  function textarea(text, message) { return addQ('control_textarea', { text: text, message: message || '', labelAlign: 'Auto', required: 'No', cols: 40, rows: 4, validation: 'None', entryLimit: 'None-0', maxsize: '', defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', wysiwyg: 'Disable' }); }
  function checkbox(text, options) { return addQ('control_checkbox', Object.assign({}, RADIO_DEF, { text: text, options: options })); }
  function number(text, priceEach) { return addQ('control_number', { text: text, message: '', labelAlign: 'Auto', required: 'No', size: '5', maxsize: '', minValue: '', maxValue: '6', defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', pricePerItem: priceEach }); }

  /* fix the garbled em dash wherever it appears in text blocks */
  var MOJI = new RegExp(String.fromCharCode(226) + String.fromCharCode(8364) +
    '[' + String.fromCharCode(8220) + String.fromCharCode(8221) + String.fromCharCode(65533) + ']?', 'g');
  qids.forEach(function (id) {
    if (typeof flat[id + '_text'] === 'string') flat[id + '_text'] = flat[id + '_text'].replace(MOJI, ' - ').replace(/  +/g, ' ');
  });

  var INTRO_HTML = '<p>Choose the membership that fits your household. Members enjoy reserved High Holiday seating, event discounts, and their family&#39;s special days on our community calendar.</p>' +
    '<p>MONTHLY PRICING</p>' +
    '<p>Basic - Single $50 &middot; Couple $80 &middot; Family $80 + $20 per child</p>' +
    '<p>Chai - Single $180 &middot; Couple $300 &middot; Family $300 + $90 per child</p>' +
    '<p>Silver - Single $500 &middot; Couple $800 &middot; Family $800 + $250 per child</p>' +
    '<p>Gold - Single $1,000 &middot; Couple $1,800 &middot; Family $1,800 + $360 per child</p>' +
    '<p>Example: a family with 2 children on Chai is $300 + $90 + $90 = $480/month. Single-parent families start from the Single rate instead of the Couple rate. Your total is calculated automatically below.</p>' +
    '<p>BENEFITS</p>' +
    '<p>Basic: your special days on the community calendar, 5% off all events and programs, reserved High Holiday seat.</p>' +
    '<p>Chai (most popular): 10% off all events and programs, listed on the Chai donor wall, 20% off Lulav &amp; Esrog set.</p>' +
    '<p>Silver: annual mezuzah checking, 1 co-sponsored Kiddush per year, VIP High Holiday seating, 50% off Lulav &amp; Esrog set, listed on the Silver donor wall.</p>' +
    '<p>Gold: annual mezuzah &amp; tefillin checking, 1 co-sponsored Kiddush per year, Lulav &amp; Esrog set provided, listed on the Gold donor wall.</p>';

  /* ================= membership section ================= */
  reuse(/^become a partner/i, 'control_head', function () { return heading('Become a partner in our Chabad'); });
  (function () { /* intro text block: reuse the one that carries the pricing */
    for (var i = 0; i < qids.length; i++) {
      if (flat[qids[i] + '_type'] === 'control_text' && /MONTHLY PRICING/i.test(String(flat[qids[i] + '_text']))) { copyQ(qids[i]); return; }
    }
    addQ('control_text', { text: INTRO_HTML });
    report.push('  (intro pricing text created)');
  })();
  var TIERQ = reuse(/^membership level/i, 'control_radio', function () {
    return radio('Membership Level', 'Basic|Chai|Silver|Gold', { required: 'Yes' });
  });
  /* per-tier priced trios: joining-as / parents / children count */
  var TIERS = [
    { name: 'Basic', hh: '50|80|0', par: '80|50', child: 20 },
    { name: 'Chai', hh: '180|300|0', par: '300|180', child: 90 },
    { name: 'Silver', hh: '500|800|0', par: '800|500', child: 250 },
    { name: 'Gold', hh: '1000|1800|0', par: '1800|1000', child: 360 }
  ];
  var TRIO = {};
  TIERS.forEach(function (t) {
    var p = '\\(' + t.name + '\\) ';
    TRIO[t.name] = {
      hh: reuse(new RegExp('^' + p + 'i am joining as', 'i'), 'control_radio', function () {
        return radio('(' + t.name + ') I am joining as', 'Single|Couple|Family', { pricing: t.hh });
      }),
      par: reuse(new RegExp('^' + p + 'parents at home', 'i'), 'control_radio', function () {
        return radio('(' + t.name + ') Parents at Home', 'Two parents|Single Parent', { pricing: t.par });
      }),
      kids: reuse(new RegExp('^' + p + 'number of children', 'i'), 'control_number', function () {
        return number('(' + t.name + ') Number of Children at Home', t.child);
      })
    };
  });

  /* ================= your information ================= */
  heading('Your Information');
  reuse(/^(full )?name$/i, 'control_fullname', function () {
    return addQ('control_fullname', { text: 'Full Name', message: '', labelAlign: 'Auto', required: 'Yes', prefix: 'No', suffix: 'No', middle: 'No', description: '', sublabels: { prefix: 'Prefix', first: 'First Name', middle: 'Middle Name', last: 'Last Name', suffix: 'Suffix' }, readonly: 'No' });
  });
  radio('Gender', 'Male|Female', { required: 'Yes' });
  reuse(/^hebrew name$/i, 'control_textbox', function () { return textbox('Hebrew Name'); });
  reuse(/^birth date$/i, 'control_birthdate', function () { return bdate('Birth Date', { required: 'Yes' }); });
  radio('Born After Sunset?', 'Yes|No|Not sure', { description: 'The Hebrew date changes at sunset - this lets us calculate your Hebrew birthday correctly.' });
  radio('Marital Status', 'Single|Married|Divorced|Widowed', { required: 'Yes' });
  textbox('Occupation');
  var JEW = radio('Jewishness', 'Jewish from birth|Convert|Not Jewish', { required: 'Yes' });
  var CONVAUTH = textbox('Supervising Rabbi / Beit Din', { description: 'For converts: we need your conversion documents on file - please email a copy to the Rabbi or bring the originals in person.' });
  var CONVDATE = bdate('Date of Conversion');
  radio('Tribe', 'Kohen|Levi|Yisroel|Not sure');
  textbox('Hebrew Lineage (ben/bas ___)', { description: "Father's Hebrew name. Use 'Avraham' if unsure, or ask the Rabbi." });
  textbox("Mother's Hebrew Name", { description: 'Used for mi shebeirach prayers.' });
  reuse(/^address$/i, 'control_address', function () {
    return addQ('control_address', { text: 'Address', message: '', labelAlign: 'Auto', required: 'Yes', selectedCountry: '', description: '', subfields: 'st1|st2|city|state|zip|country', sublabels: { addr_line1: 'Street Address', addr_line2: 'Street Address Line 2', city: 'City', state: 'State / Province', postal: 'Postal / Zip Code', country: 'Country' } });
  });
  reuse(null, 'control_email', function () {
    return addQ('control_email', { receivesReceipts: 'No', text: 'E-mail', message: '', labelAlign: 'Auto', required: 'Yes', size: 30, validation: 'Email', maxsize: '', defaultValue: '', subLabel: '', hint: 'ex: myname@example.com', description: '', confirmation: 'No', confirmationHint: 'Confirm Email', readonly: 'No' });
  });
  reuse(null, 'control_phone', function () {
    return addQ('control_phone', { text: 'Phone Number', message: '', labelAlign: 'Auto', required: 'Yes', validation: 'None', countryCode: 'No', inputMask: 'enable', inputMaskValue: '(###) ###-####', description: '', sublabels: { country: 'Country Code', area: 'Area Code', phone: 'Phone Number', full: 'Phone Number' }, readonly: 'No' });
  });
  textbox('Work Phone');
  textbox('Home Phone');

  /* ================= spouse ================= */
  heading('Spouse');
  reuse(/^spouse first name$/i, 'control_textbox', function () { return textbox('Spouse First Name'); });
  reuse(/^spouse last name$/i, 'control_textbox', function () { return textbox('Spouse Last Name'); });
  reuse(/^spouse hebrew name$/i, 'control_textbox', function () { return textbox('Spouse Hebrew Name'); });
  radio('Spouse Gender', 'Male|Female');
  var SJEW = radio('Spouse Jewishness', 'Jewish from birth|Convert|Not Jewish');
  var SCONVAUTH = textbox('Spouse Supervising Rabbi / Beit Din');
  var SCONVDATE = bdate('Spouse Date of Conversion');
  radio('Spouse Tribe', 'Kohen|Levi|Yisroel|Not sure');
  textbox('Spouse Hebrew Lineage (ben/bas ___)');
  textbox("Spouse Mother's Hebrew Name");
  reuse(/^spouse email$/i, 'control_textbox', function () { return textbox('Spouse Email'); });
  textbox('Spouse Cell Phone');
  textbox('Spouse Occupation');
  reuse(/^spouse birthday$/i, 'control_birthdate', function () { return bdate('Spouse Birthday'); });
  radio('Spouse Born After Sunset?', 'Yes|No|Not sure');
  reuse(/^anniversary$/i, 'control_birthdate', function () { return bdate('Anniversary'); });

  /* ================= children ================= */
  heading('Children');
  var CHILD_NAMES = [], CHILD_BDAYS = [];
  for (var c = 1; c <= 6; c++) {
    (function (n) {
      CHILD_NAMES.push(reuse(new RegExp('^(\\((basic)\\) )?child ' + n + ' name', 'i'), 'control_textbox', function () {
        return textbox('Child ' + n + ' Name');
      }, 'Child ' + n + ' Name'));
      CHILD_BDAYS.push(bdate('Child ' + n + ' Birthday'));
    })(c);
  }
  var CHILDNOTES = textarea('Children - Anything Else',
    'Hebrew names, school / yeshiva, interest in bar or bat mitzvah lessons - anything about your children we should know.');

  /* ================= yahrzeits / preferences / wrap-up ================= */
  heading('Yahrzeits');
  textarea('Yahrzeits',
    'For each yahrzeit you observe: name (English and Hebrew), your relationship, date of passing, and whether it was after sunset. We will include them in our prayers and remind you each year.');
  checkbox('Memorial Board', "I'm interested in a permanent memorial board plaque, lit each year on the yahrzeit ($360 one-time - the office will follow up)");
  heading('Preferences');
  textbox('Donor Wall Display Name', { description: "How you want your family listed - e.g. 'The Cohen Family'. Enter 'Anonymous' to stay private." });
  var KIDDUSH = textbox('Kiddush Sponsorship Dedication', { description: 'Included with Silver and Gold membership - e.g. In memory of...' });
  reuse(/^anything else$/i, 'control_textarea', function () {
    return textarea('Anything Else', "Hebrew names, yahrzeits, anything you'd like to be listed on the donor wall, questions for the Rabbi, or anything else we should know.");
  });

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
  reuse(null, 'control_paymentrecurrence', function () {
    return addQ('control_paymentrecurrence', { text: 'Payment Recurrence', required: 'No', duplicatable: false });
  });
  reuse(null, 'control_button', function () {
    return addQ('control_button', { text: 'Submit', buttonAlign: 'Auto', clear: 'No', print: 'No' });
  });

  /* form-level keys ride along (new forms get the builder's defaults) */
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  /* per-tier child COPIES are dropped; any other unplanned field is kept */
  qids.forEach(function (id) {
    if (used[id]) return;
    if (/^\((chai|silver|gold)\) child /i.test(lbl(id))) {
      report.push('REMOVED ' + id + ': ' + lbl(id) + ' (redundant per-tier copy)');
      return;
    }
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
  TIERS.forEach(function (t) {
    conds.push(show([[TIERQ, 'equals', t.name]], [TRIO[t.name].hh]));
    conds.push(show([[TRIO[t.name].hh, 'equals', 'Family']], [TRIO[t.name].par, TRIO[t.name].kids]));
  });
  var COUNTS = TIERS.map(function (t) { return TRIO[t.name].kids; });
  CHILD_NAMES.forEach(function (nameId, i) {
    conds.push(show(
      COUNTS.map(function (cq) { return [cq, 'greaterThan', i]; }),
      [nameId, CHILD_BDAYS[i]]
    ));
  });
  conds.push(show(COUNTS.map(function (cq) { return [cq, 'greaterThan', 0]; }), [CHILDNOTES]));
  conds.push(show([[JEW, 'equals', 'Convert']], [CONVAUTH, CONVDATE]));
  conds.push(show([[SJEW, 'equals', 'Convert']], [SCONVAUTH, SCONVDATE]));
  conds.push(show([[TIERQ, 'equals', 'Silver'], [TIERQ, 'equals', 'Gold']], [KIDDUSH]));

  /* ================= rebuild the canvas ================= */
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Injected the full membership questionnaire');

  console.log('=== INJECTION COMPLETE ON FORM #' + fid + ' - REVIEW THE FORM, THEN CLICK SAVE ===');
  console.log(report.join('\n'));
  console.log('Conditions rewired: ' + conds.length + ' rules.');
  console.log('If anything looks wrong: close WITHOUT saving and send this output to your helper.');
})();
