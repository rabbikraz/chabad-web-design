/* ============================================================
   MEMBERSHIP FORM — ADD DISCOUNT FIELD (console add-on)
   Run on the finished membership form in the form builder, in the
   formbuilder frame's console (same routine as the other add-ons).

   Adds one hidden number field, "(Discount) Amount", priced at
   -$1 per unit. The page wizard writes the computed dollar discount
   into it when a member applies a valid code, so the platform's own
   total (and the actual charge) reflects the discount.

   AFTER SAVING, VERIFY: on the live form apply code WELCOME10 with
   Chai/Single selected and confirm the Total drops from $180 to $162.
   If the Total does NOT drop, the platform rejected the negative
   price - report back and we will use a different mechanism.
   NOTHING IS SAVED until you click the admin's own Save button.
   ============================================================ */
(function () {
  'use strict';

  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown.');
    return;
  }
  var flat = getAllProperties();
  var fid = flat['form_id'] || '(this form)';

  var qids = [], seen = {};
  Object.keys(flat).forEach(function (k) {
    var m = /^(\d+)_/.exec(k);
    if (m && !seen[m[1]]) { seen[m[1]] = 1; qids.push(m[1]); }
  });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim(); }
  for (var i = 0; i < qids.length; i++) {
    if (/^\(discount\) amount$/i.test(lbl(qids[i]))) {
      alert('The discount field already exists on form #' + fid + '. Aborting.');
      return;
    }
  }
  if (!confirm('Add the hidden "(Discount) Amount" field (priced -$1/unit) to form #' + fid + '? Nothing is saved until you click Save.')) return;

  var nextId = (typeof getMaxID === 'function' ? getMaxID(flat) : 0) || 0;
  qids.forEach(function (id) { if (Number(id) > nextId) nextId = Number(id); });
  var id = String(nextId + 1);

  var out = {};
  qids.forEach(function (q) {
    Object.keys(flat).forEach(function (k) {
      if (k.indexOf(q + '_') === 0) out[k] = flat[k];
    });
  });
  out[id + '_type'] = 'control_number';
  out[id + '_qid'] = Number(id);
  out[id + '_name'] = 'input' + id;
  var props = { text: '(Discount) Amount', message: '', labelAlign: 'Auto', required: 'No', size: '6', maxsize: '', minValue: '0', maxValue: '', defaultValue: '0', subLabel: '', hint: '', description: 'Set automatically by the discount code box - do not edit.', readonly: 'No', pricePerItem: -1 };
  Object.keys(props).forEach(function (p) { out[id + '_' + p] = props[p]; });
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  // conditions come along in the flat dump; re-assert them after the rebuild
  var conds = flat['form_conditions'] || [];
  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Added discount amount field');

  console.log('=== DISCOUNT FIELD ADDED (qid ' + id + ') ON FORM #' + fid + ' - REVIEW, THEN CLICK SAVE ===');
})();
