setTimeout(function () {
  var de = document.documentElement;
  var out = [];
  out.push('layout w=' + de.clientWidth + ' scrollW=' + de.scrollWidth + ' scrollH=' + de.scrollHeight + ' innerH=' + window.innerHeight);
  out.push('body scrollH=' + document.body.scrollHeight + ' body overflowY=' + getComputedStyle(document.body).overflowY + ' html overflowY=' + getComputedStyle(de).overflowY);
  window.scrollTo({top:400, left:0, behavior:'instant'});
  out.push('after scrollTo(400): scrollY=' + window.scrollY);
  var overflowers = [];
  document.querySelectorAll('body *').forEach(function (e) {
    var r = e.getBoundingClientRect();
    if (r.right > de.clientWidth + 2 && r.width > 30 && getComputedStyle(e).position !== 'fixed') {
      overflowers.push((e.id || (e.className || '').toString().split(' ')[0] || e.tagName) + ' right=' + Math.round(r.right));
    }
  });
  out.push('overflowing: ' + (overflowers.slice(0, 8).join(' | ') || 'none'));
  var d = document.createElement('pre');
  d.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:#000;color:#0f0;font:10px monospace;padding:4px;margin:0;white-space:pre-wrap;max-width:100%';
  d.textContent = out.join('\n');
  document.body.appendChild(d);
}, 1500);
