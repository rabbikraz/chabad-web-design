/* repro driver: browse Gold + Family, then settle on Basic Single Annual
   with the RABBI code, and report the engine total plus the price cache.
   The broken build leaves stale prices in selectedElements and the total
   comes out wrong; the fixed build must end at $0.00. */
(function () {
  function q(s) { return document.querySelector(s); }
  function qa(s) { return [].slice.call(document.querySelectorAll(s)); }
  function tier(name) {
    return qa('.sb-mw-tier').filter(function (c) {
      var n = c.querySelector('.sb-mw-tname');
      return n && n.textContent.trim() === name;
    })[0];
  }
  function report(stage) {
    var t = q('[id="total_amount"]');
    var se = window.selectedElements || {};
    var live = {};
    for (var k in se) { if (se[k]) live[k] = se[k]; }
    var d = document.createElement('div');
    d.className = 'sb-probe';
    d.textContent = 'PROBE ' + stage + ' | total: ' + (t ? t.textContent.trim() : '?') +
      ' | nonzero cache: ' + JSON.stringify(live);
    document.body.appendChild(d);
  }
  setTimeout(function () {
    var fam = q('.sb-mw-hhcard[data-hh="Family"]');
    if (!fam) { report('WIZARD MISSING'); return; }
    fam.click();
    tier('Gold').click();
    q('.sb-mw-s1 .sb-mw-continue').click();
    setTimeout(function () {
      report('after-gold-family');
      q('.sb-mw-s2 .sb-mw-back').click();
      q('.sb-mw-hhcard[data-hh="Single"]').click();
      tier('Basic').click();
      q('.sb-mw-s1 .sb-mw-continue').click();
      setTimeout(function () {
        var annual = q('.sb-mw-segopt[data-bill="annual"]');
        if (annual) annual.click();
        var di = q('.sb-mw-discin');
        if (di) { di.value = 'RABBI'; q('.sb-mw-discapply').click(); }
        setTimeout(function () { report('final-basic-single-annual-rabbi'); }, 1500);
      }, 1500);
    }, 1500);
  }, 6000);
})();
