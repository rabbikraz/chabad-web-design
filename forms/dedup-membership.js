/* ============================================================
   MEMBERSHIP FORM — DUPLICATE FIELD CLEANUP
   Your form ended up with doubled fields (two Address blocks, two
   E-mails, two spouse sets...) after hand-built fields met the
   injected ones. This keeps the FIRST copy of every field and
   removes the extras. Paste into the DevTools console OF THE FORM
   BUILDER FRAME (same drill as before: F12 -> Console -> pick the
   formbuilder/chabadone frame in the dropdown -> type
   "allow pasting" -> paste). Review the form, then click Save.
   Nothing is saved until you do. Close without saving to abort.
   ============================================================ */
(function () {
  'use strict';
  if (typeof getAllProperties !== 'function' || typeof buildQuestions !== 'function' ||
      typeof BuildSource === 'undefined' || typeof form === 'undefined') {
    alert('Wrong console context - pick the form builder FRAME in the console dropdown.');
    return;
  }
  var flat = getAllProperties();
  var qids = [], seen = {};
  Object.keys(flat).forEach(function (k) {
    var m = /^(\d+)_/.exec(k);
    if (m && !seen[m[1]]) { seen[m[1]] = 1; qids.push(m[1]); }
  });
  function lbl(id) { return String(flat[id + '_text'] || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  var out = {};
  var kept = {}, removed = [];
  qids.forEach(function (id) {
    var type = flat[id + '_type'] || '';
    // key = field type + its label; payment/total/submit dedupe by type alone
    var key = (/control_(payform|totalamount|paymentrecurrence|button)/.test(type))
      ? type : type + '|' + lbl(id);
    if (kept[key]) { removed.push(id + ': ' + (lbl(id) || type)); return; }
    kept[key] = 1;
    Object.keys(flat).forEach(function (k) {
      if (k.indexOf(id + '_') === 0) out[k] = flat[k];
    });
  });
  Object.keys(flat).forEach(function (k) {
    if (k.indexOf('form_') === 0) out[k] = flat[k];
  });

  if (!removed.length) { alert('No duplicates found - nothing to change.'); return; }
  if (!confirm('Remove ' + removed.length + ' duplicate field(s)? The first copy of each is kept. Nothing is saved until you click Save.\n\n' + removed.join('\n'))) return;

  /* drop conditions that reference removed fields */
  var removedIds = {};
  removed.forEach(function (r) { removedIds[r.split(':')[0]] = 1; });
  var conds = (form.getProperty('conditions') || []).filter(function (c) {
    var refs = (c.terms || []).map(function (t) { return String(t.field); })
      .concat((c.actions || []).map(function (a) { return String(a.field); }));
    return !refs.some(function (f) { return removedIds[f]; });
  });

  var nested = BuildSource.convertSavedToProp(out);
  document.getElementById('list').innerHTML = '';
  buildQuestions(nested);
  form.setProperty('conditions', conds);
  onChange('Removed duplicate fields');
  console.log('=== DEDUP COMPLETE - REVIEW, THEN CLICK SAVE ===');
  console.log('Removed:\n' + removed.join('\n'));
})();
