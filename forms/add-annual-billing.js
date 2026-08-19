/* ============================================================
   MEMBERSHIP FORM — ADD ANNUAL BILLING (console add-on)
   Run AFTER the main injection, on the finished membership form.
   Paste into the DevTools console OF THE FORM BUILDER FRAME
   (open the form in the builder, F12, pick the formbuilder /
   chabadone.org frame in the console context dropdown; Chrome
   makes you type: allow pasting  first).

   What it does:
     - adds a hidden "Billing Frequency" radio (Monthly | Annual)
     - adds annual-priced twins of every tier trio, e.g.
       "(Chai Annual) I am joining as" priced 2160|3600 with
       $1,080/child — 12x the monthly rates
     - rewires conditions so the annual fields participate in the
       price calculation and the child rows respond to them too
   The wizard on the page then shows a Monthly / Annual (pay full
   year) choice: Monthly = recurring monthly charge, Annual = one
   full-year charge now.
   NOTHING IS SAVED until you review and click the admin's own
   Save button.
   ============================================================ */
(function () {
  'use strict';

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown (see the note at the top of the script).');
    return;
  }
  var flat = getAllProperties();
  var fid = flat['form_id'] || (typeof formID !== 'undefined' && formID) || '(this form)';

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

  var TIERQ = findByLabel(/^membership level/i, 'control_radio');
  if (!TIERQ) { alert('No "Membership Level" field here - run this on the finished membership form.'); return; }
  if (findByLabel(/^\(basic annual\) i am joining as/i)) {
    alert('The annual fields already exist on form #' + fid + '. Aborting, nothing changed.');
    return;
  }
  if (!confirm('Add annual billing fields to form #' + fid + '? (Billing Frequency + annual-priced tier fields; nothing is saved until you click Save.)')) return;

  var nextId = (typeof getMaxID === 'function' ? getMaxID(flat) : 0) || 0;
  qids.forEach(function (id) { if (Number(id) > nextId) nextId = Number(id); });

  var out = {};
  var newDefs = [];   /* [afterLabelRegex|null, id, props, type] */
  function planQ(type, props) {
    var id = String(++nextId);
    var o = { type: type, id: id, props: props };
    newDefs.push(o);
    return id;
  }
  var RADIO_DEF = { message: '', labelAlign: 'Auto', required: 'No', special: 'None', allowOther: 'No', otherText: 'Other', calculateOther: 'No', selected: '', spreadCols: '1', description: '' };
  function radio(text, options, extra) {
    return planQ('control_radio', Object.assign({}, RADIO_DEF, { text: text, options: options }, extra || {}));
  }
  function number(text, priceEach) {
    return planQ('control_number', { text: text, message: '', labelAlign: 'Auto', required: 'No', size: '5', maxsize: '', minValue: '', maxValue: '6', defaultValue: '', subLabel: '', hint: '', description: '', readonly: 'No', pricePerItem: priceEach });
  }

  /* ---- plan the new fields (annual = 12x monthly) ---- */
  var BILLING = radio('Billing Frequency', 'Monthly|Annual', { selected: 'Monthly' });
  var ATIERS = [
    { name: 'Basic', hh: '600|960|0', par: '960|600', child: 240 },
    { name: 'Chai', hh: '2160|3600|0', par: '3600|2160', child: 1080 },
    { name: 'Silver', hh: '6000|9600|0', par: '9600|6000', child: 3000 },
    { name: 'Gold', hh: '12000|21600|0', par: '21600|12000', child: 4320 }
  ];
  var ATRIO = {};
  ATIERS.forEach(function (t) {
    ATRIO[t.name] = {
      hh: radio('(' + t.name + ' Annual) I am joining as', 'Single|Couple|Family', { pricing: t.hh }),
      par: radio('(' + t.name + ' Annual) Parents at Home', 'Two parents|Single Parent', { pricing: t.par }),
      kids: number('(' + t.name + ' Annual) Number of Children at Home', t.child)
    };
  });

  /* ---- rebuild key order: copy everything, inserting the new
         fields right after "(Gold) Number of Children at Home" ---- */
  function copyQ(id) {
    Object.keys(flat).forEach(function (k) {
      if (k.indexOf(id + '_') === 0) out[k] = flat[k];
    });
  }
  function writeNew(def) {
    out[def.id + '_type'] = def.type;
    out[def.id + '_qid'] = Number(def.id);
    out[def.id + '_name'] = 'input' + def.id;
    Object.keys(def.props).forEach(function (p) { out[def.id + '_' + p] = def.props[p]; });
  }
  var anchor = findByLabel(/^\(gold\) number of children/i) || qids[qids.length - 1];
  qids.forEach(function (id) {
    copyQ(id);
    if (id === anchor) newDefs.forEach(writeNew);
  });
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  /* ---- conditions: full deterministic rebuild ---- */
  function show(terms, fields) {
    return {
      type: 'field', link: 'Any',
      terms: terms.map(function (t) { return { field: String(t[0]), operator: t[1], value: String(t[2]) }; }),
      actions: fields.map(function (f) { return { field: String(f), visibility: 'Show' }; })
    };
  }
  function need(re, what) {
    var id = findByLabel(re);
    if (!id) { console.warn('missing field for conditions: ' + what); }
    return id;
  }
  var TN = ['Basic', 'Chai', 'Silver', 'Gold'];
  var MTRIO = {};
  TN.forEach(function (t) {
    MTRIO[t] = {
      hh: need(new RegExp('^\\(' + t + '\\) i am joining as', 'i'), t + ' hh'),
      par: need(new RegExp('^\\(' + t + '\\) parents at home', 'i'), t + ' par'),
      kids: need(new RegExp('^\\(' + t + '\\) number of children', 'i'), t + ' kids')
    };
  });
  var conds = [];
  TN.forEach(function (t) {
    conds.push(show([[TIERQ, 'equals', t]], [MTRIO[t].hh]));
    conds.push(show([[MTRIO[t].hh, 'equals', 'Family']], [MTRIO[t].par, MTRIO[t].kids]));
    conds.push(show([[BILLING, 'equals', 'Annual']], [ATRIO[t].hh]));
    conds.push(show([[ATRIO[t].hh, 'equals', 'Family']], [ATRIO[t].par, ATRIO[t].kids]));
  });
  var COUNTS = TN.map(function (t) { return MTRIO[t].kids; })
    .concat(TN.map(function (t) { return ATRIO[t].kids; }))
    .filter(Boolean);
  for (var i = 1; i <= 6; i++) {
    var nameId = need(new RegExp('^child ' + i + ' name$', 'i'), 'child ' + i + ' name');
    var bdayId = need(new RegExp('^child ' + i + ' birthday$', 'i'), 'child ' + i + ' bday');
    if (nameId && bdayId) {
      conds.push(show(COUNTS.map(function (cq) { return [cq, 'greaterThan', i - 1]; }), [nameId, bdayId]));
    }
  }
  var CHILDNOTES = need(/^children - anything else$/i, 'children notes');
  if (CHILDNOTES) conds.push(show(COUNTS.map(function (cq) { return [cq, 'greaterThan', 0]; }), [CHILDNOTES]));
  var JEW = need(/^jewishness$/i, 'jewishness');
  var CONVAUTH = need(/^supervising rabbi/i, 'conv rabbi');
  var CONVDATE = need(/^date of conversion$/i, 'conv date');
  if (JEW && CONVAUTH && CONVDATE) conds.push(show([[JEW, 'equals', 'Convert']], [CONVAUTH, CONVDATE]));
  var SJEW = need(/^spouse jewishness$/i, 'spouse jewishness');
  var SCONVAUTH = need(/^spouse supervising rabbi/i, 'sp conv rabbi');
  var SCONVDATE = need(/^spouse date of conversion$/i, 'sp conv date');
  if (SJEW && SCONVAUTH && SCONVDATE) conds.push(show([[SJEW, 'equals', 'Convert']], [SCONVAUTH, SCONVDATE]));
  var KIDDUSH = need(/^kiddush sponsorship dedication$/i, 'kiddush');
  if (KIDDUSH) conds.push(show([[TIERQ, 'equals', 'Silver'], [TIERQ, 'equals', 'Gold']], [KIDDUSH]));

  /* ---- rebuild the canvas ---- */
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Added annual billing fields');

  console.log('=== ANNUAL BILLING ADDED ON FORM #' + fid + ' - REVIEW, THEN CLICK SAVE ===');
  console.log('New fields: Billing Frequency (' + BILLING + ') + 4 annual tier trios.');
  console.log('Conditions rewired: ' + conds.length + ' rules.');
})();
