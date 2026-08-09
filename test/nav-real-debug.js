setTimeout(function () {
  var openBtn = document.querySelector('.cs-mobile-menu-open');
  if (openBtn) openBtn.click();
  setTimeout(function () {
    var item = document.querySelector('#tabContentMain .co_menu_item.multi_level');
    var out = [];
    out.push('IsMobileDevice=' + (window.Co && Co.BrowserInfo ? Co.BrowserInfo.IsMobileDevice() : 'Co missing'));
    out.push('has MainNavigation=' + !!(window.Co && Co.MainNavigation));
    try {
      Co.MainNavigation.Show({ preventDefault: function () {}, target: item }, item);
    } catch (e) {
      out.push('Show() threw: ' + e.message);
    }
    setTimeout(function () {
      var sub = item.querySelector('.co_submenu_container');
      out.push('item classes=' + item.className);
      out.push('body classes=' + document.body.className);
      out.push('html classes=' + document.documentElement.className);
      out.push('sub display(computed)=' + (sub ? getComputedStyle(sub).display : 'NO SUBMENU'));
      out.push('sub inline style=' + (sub ? sub.getAttribute('style') : ''));
      var suspects = [];
      document.querySelectorAll('body *').forEach(function (e) {
        var cs = getComputedStyle(e);
        if (cs.position === 'fixed' && cs.display !== 'none' && e.id !== 'sb-dbg') {
          suspects.push(e.tagName + '.' + (e.className || '').toString().slice(0, 40));
        }
      });
      out.push('fixed+visible: ' + (suspects.join(' | ') || 'none'));
      var d = document.createElement('pre');
      d.id = 'sb-dbg';
      d.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:#000;color:#0f0;font:9px monospace;padding:4px;margin:0;white-space:pre-wrap;max-width:100%';
      d.textContent = out.join('\n');
      document.body.appendChild(d);
    }, 900);
  }, 700);
}, 1200);
