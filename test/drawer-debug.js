setTimeout(function () {
  var b = document.querySelector('.cs-mobile-menu-open');
  if (b) b.click();
  setTimeout(function () {
    var out = [];
    var it = document.querySelector('#tabContentMain .co_menu_item.multi_level');
    if (!it) { out.push('no multi_level item'); }
    else {
      var sp = it.querySelector('span.parent');
      var mc = it.querySelector('.co_menu_content');
      out.push('item display=' + getComputedStyle(it).display + ' dir=' + getComputedStyle(it).flexDirection);
      out.push('span.parent order=' + (sp ? getComputedStyle(sp).order : 'MISSING'));
      out.push('menu_content order=' + (mc ? getComputedStyle(mc).order : 'MISSING'));
      out.push('children: ' + Array.prototype.map.call(it.children, function (c) { return c.tagName + '.' + (c.className || '').toString().split(' ')[0]; }).join(', '));
    }
    var d = document.createElement('pre');
    d.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:#000;color:#0f0;font:12px monospace;padding:6px;margin:0;white-space:pre-wrap;max-width:100%';
    d.textContent = out.join('\n');
    document.body.appendChild(d);
  }, 700);
}, 800);
