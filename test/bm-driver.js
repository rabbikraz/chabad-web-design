/* replica driver: family -> tier -> continue -> fill child 1 dob+gender -> read BM */
setTimeout(function () {
  function q(x) { return document.querySelector(x); }
  var fam = q('.sb-mw-hhcard[data-hh="Family"]');
  if (fam) fam.click();
  var t = q('.sb-mw-tier');
  if (t) t.click();
  var c = q('.sb-mw-continue');
  if (c) c.click();
  setTimeout(function () {
    var lis = [].slice.call(document.querySelectorAll('form.sb-mf li.form-line'));
    function lbl(li) {
      var l = li.querySelector('.form-label-left label');
      return l ? l.textContent.trim() : '';
    }
    var bday = lis.filter(function (li) { return lbl(li).indexOf('Child 1 Birthday') === 0; })[0];
    var sels = bday ? bday.querySelectorAll('select') : [];
    if (sels.length >= 3) {
      [[0, '8'], [1, '27'], [2, '2013']].forEach(function (p) {
        var sel = sels[p[0]];
        var has = [].slice.call(sel.options).some(function (o) { return o.value === p[1]; });
        if (!has) { var o = document.createElement('option'); o.value = p[1]; o.textContent = p[1]; sel.appendChild(o); }
        sel.value = p[1];
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    var g = lis.filter(function (li) { return lbl(li).indexOf('Child 1 Gender') === 0; })[0];
    var male = g ? g.querySelector('input[value="Male"]') : null;
    if (male) { male.checked = true; male.dispatchEvent(new Event('change', { bubbles: true })); }
    setTimeout(function () {
      var bm = lis.filter(function (li) { return lbl(li).indexOf('Child 1 Bar/Bat Mitzvah') === 0; })[0];
      var bmIn = bm ? bm.querySelector('input') : null;
      var heb = bday ? bday.querySelector('.sb-mw-heb') : null;
      var d = document.createElement('div');
      d.id = 'bm';
      d.textContent = 'heb: ' + (heb ? heb.textContent : '?') + ' ## bm: ' + (bmIn ? JSON.stringify(bmIn.value) : 'FIELD MISSING') + ' ## sels: ' + sels.length + ' ## gender-set: ' + (male ? male.checked : 'no radio');
      document.body.appendChild(d);
    }, 6000);
  }, 1800);
}, 6000);
