setTimeout(function () {
  var b = document.querySelector('.cs-mobile-menu-open');
  if (b) b.click();
  setTimeout(function () {
    // tap the Events accordion toggle
    var t = document.querySelector('#tabContentMain .co_menu_item.multi_level .sb-sub-toggle');
    if (t) t.click();
  }, 400);
}, 800);
